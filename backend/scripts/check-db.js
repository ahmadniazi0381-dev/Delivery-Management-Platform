const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const orders = await prisma.order.count();
    const users = await prisma.user.count({ where: { role: 'CUSTOMER' } });
    const staff = await prisma.staffProfile.count();
    const menuItems = await prisma.menuItem.count();
    const activityLogs = await prisma.activityLog.count();
    const auditTrail = await prisma.orderAuditTrail.count();
    const notifications = await prisma.notification.count();
    const orderItems = await prisma.orderItem.count();
    const payments = await prisma.payment.count();
    
    console.log('=== DATABASE STATE ===');
    console.log(JSON.stringify({
      orders,
      users,
      staff,
      menuItems,
      activityLogs,
      auditTrail,
      notifications,
      orderItems,
      payments
    }, null, 2));
    
    // Check for existing orders with details
    const recentOrders = await prisma.order.findMany({
      take: 5,
      orderBy: { placedAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        total: true,
        placedAt: true,
        customer: { select: { name: true, phone: true } },
      }
    });
    console.log('\n=== RECENT ORDERS ===');
    console.log(JSON.stringify(recentOrders, null, 2));
    
    // Check menu items
    const menu = await prisma.menuItem.findMany({
      take: 5,
      select: { id: true, name: true, price: true, isAvailable: true, stockQuantity: true }
    });
    console.log('\n=== MENU ITEMS ===');
    console.log(JSON.stringify(menu, null, 2));
    
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
})();
