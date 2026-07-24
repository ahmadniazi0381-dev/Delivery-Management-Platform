const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestMenuItem(name, price) {
  let cat = await prisma.category.findFirst();
  if (!cat) {
    cat = await prisma.category.create({
      data: { name: 'Biryani', description: 'Biryani dishes', isActive: true, sortOrder: 1 }
    });
  }
  return prisma.menuItem.create({
    data: {
      name,
      description: `Test ${name}`,
      price,
      isAvailable: true,
      inStock: true,
      isFeatured: true,
      categoryId: cat.id,
      imageUrl: 'https://images.unsplash.com/photo-1631515242808-497c3fbd3972?auto=format&fit=crop&w=1200&q=80',
    }
  });
}

async function createTestCustomer() {
  return prisma.user.create({
    data: {
      name: 'Test Customer',
      phone: '+923001111111',
      email: 'testcustomer@test.com',
      passwordHash: '$2b$10$testhash',
      role: 'CUSTOMER',
      phoneVerified: true,
    }
  });
}

async function createTestOrder(customerId, menuItemId) {
  return prisma.order.create({
    data: {
      customerId,
      status: 'PENDING',
      total: 350,
      paymentMethod: 'COD',
      paymentStatus: 'PENDING',
      address: {
        create: {
          label: 'Home',
          addressLine: 'Test Address, Lahore',
          latitude: 31.4475531,
          longitude: 74.2690347,
          isDeliverable: true,
          distanceKm: 1.0,
        }
      },
      orderItems: {
        create: {
          menuItemId,
          itemName: 'Test Chicken Biryani',
          quantity: 1,
          unitPrice: 350,
          lineTotal: 350,
        }
      }
    },
    include: {
      orderItems: true,
      address: true,
      customer: true,
    }
  });
}

async function run() {
  try {
    console.log('=== STARTING E2E TEST ===\n');
    
    // Get admin user
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
      console.log('No admin found - seeding required');
      return;
    }
    console.log('Admin user:', admin.name, admin.phone);
    
    // Get or create menu item
    let menuItem = await prisma.menuItem.findFirst();
    if (!menuItem) {
      console.log('\nCreating test menu item...');
      menuItem = await createTestMenuItem('Test Chicken Biryani', 350);
      console.log('Created menu item:', menuItem.name, menuItem.id);
    } else {
      console.log('\nExisting menu item:', menuItem.name, menuItem.id);
    }
    
    // Get or create customer
    let customer = await prisma.user.findFirst({ where: { role: 'CUSTOMER' } });
    if (!customer) {
      console.log('\nCreating test customer...');
      customer = await createTestCustomer();
      console.log('Created customer:', customer.name, customer.phone, customer.id);
    } else {
      console.log('\nExisting customer:', customer.name, customer.phone, customer.id);
    }
    
    // Create order
    console.log('\nCreating test order...');
    const order = await createTestOrder(customer.id, menuItem.id);
    console.log('Created order:', order.orderNumber, order.id, 'status:', order.status);
    
    // Simulate manager accepting order
    console.log('\nSimulating manager accepting order...');
    const acceptedOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      },
      include: { orderItems: true, address: true, customer: true }
    });
    console.log('Order status:', acceptedOrder.status);
    
    // Create audit trail entry
    console.log('\nCreating audit trail entry...');
    const auditEntry = await prisma.orderAuditTrail.create({
      data: {
        orderId: order.id,
        userId: admin.id,
        userName: admin.name,
        userRole: 'OWNER',
        action: 'ACCEPT_ORDER',
        previousStatus: 'PENDING',
        newStatus: 'ACCEPTED',
        isOverride: false,
      }
    });
    console.log('Audit entry created:', auditEntry.id, 'action:', auditEntry.action);
    
    // Create owner notification
    console.log('\nCreating owner notification...');
    const notification = await prisma.notification.create({
      data: {
        userId: admin.id,
        title: 'Order Accepted',
        body: `Order #${order.orderNumber || order.id.slice(-6)} was accepted.`,
        type: 'ORDER_UPDATE',
      }
    });
    console.log('Notification created:', notification.id);
    
    // Simulate moving to preparing
    console.log('\nMoving to PREPARING...');
    const preparingOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'PREPARING' }
    });
    
    const auditPrep = await prisma.orderAuditTrail.create({
      data: {
        orderId: order.id,
        userId: admin.id,
        userName: admin.name,
        userRole: 'OWNER',
        action: 'KDS_PREPARING',
        previousStatus: 'ACCEPTED',
        newStatus: 'PREPARING',
        isOverride: false,
      }
    });
    console.log('Preparing audit:', auditPrep.id);
    
    // Simulate moving to ready
    console.log('\nMoving to READY...');
    const readyOrder = await prisma.order.update({
      where: { id: order.id },
      data: { status: 'READY', readyAt: new Date() }
    });
    
    const auditReady = await prisma.orderAuditTrail.create({
      data: {
        orderId: order.id,
        userId: admin.id,
        userName: admin.name,
        userRole: 'OWNER',
        action: 'KDS_READY',
        previousStatus: 'PREPARING',
        newStatus: 'READY',
        isOverride: false,
      }
    });
    console.log('Ready audit:', auditReady.id);
    
    // Simulate delivery
    console.log('\nSimulating DELIVERED...');
    const deliveredOrder = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: 'DELIVERED',
        deliveredAt: new Date(),
        outForDeliveryAt: new Date(),
      }
    });
    
    const auditDelivered = await prisma.orderAuditTrail.create({
      data: {
        orderId: order.id,
        userId: admin.id,
        userName: admin.name,
        userRole: 'OWNER',
        action: 'DELIVERED',
        previousStatus: 'READY',
        newStatus: 'DELIVERED',
        isOverride: false,
      }
    });
    console.log('Delivered audit:', auditDelivered.id);
    
    // Check analytics data
    console.log('\n=== CHECKING ANALYTICS DATA ===');
    const deliveredOrders = await prisma.order.count({ where: { status: 'DELIVERED' } });
    const totalRevenue = await prisma.order.aggregate({
      where: { status: 'DELIVERED' },
      _sum: { total: true }
    });
    console.log('Delivered orders:', deliveredOrders);
    console.log('Total revenue:', parseFloat(totalRevenue._sum.total?.toString() || '0'));
    
    // Check activity logs
    console.log('\n=== CHECKING ACTIVITY LOGS ===');
    const activities = await prisma.activityLog.findMany({ take: 5 });
    console.log('Activity logs count:', activities.length);
    
    // Check notifications
    console.log('\n=== CHECKING NOTIFICATIONS ===');
    const notifs = await prisma.notification.findMany({ take: 5 });
    console.log('Notifications count:', notifs.length);
    console.log('Sample notification:', notifs[0] ? { title: notifs[0].title, body: notifs[0].body } : 'none');
    
    // Check audit trail for order
    console.log('\n=== CHECKING AUDIT TRAIL FOR ORDER ===');
    const audits = await prisma.orderAuditTrail.findMany({
      where: { orderId: order.id },
      orderBy: { createdAt: 'asc' }
    });
    console.log('Audit entries:', audits.length);
    audits.forEach(a => {
      console.log(`  ${a.action}: ${a.previousStatus} -> ${a.newStatus} by ${a.userName} (${a.userRole})`);
    });
    
    console.log('\n=== E2E TEST COMPLETE ===');
    
  } catch (e) {
    console.error('TEST ERROR:', e.message);
    console.error(e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

run();
