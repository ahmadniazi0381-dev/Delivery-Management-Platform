const BASE = 'http://localhost:5000/api';

async function request(method, path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data };
}

async function delay(ms) {
  await new Promise(r => setTimeout(r, ms));
}

function logResponse(label, res) {
  console.log(`   ${label} status: ${res.status}`);
  console.log(`   ${label} data: ${JSON.stringify(res.data).slice(0, 500)}`);
}

async function main() {
  console.log('=== E2E RUNTIME VERIFICATION ===\n');
  await delay(1000);

  let adminToken, adminUser, categoryId, menuItemId, custToken, custUser, orderId, orderNumber, mgrToken, mgrUserId;

  // 1. Admin login
  console.log('1. Admin login');
  const adminLogin = await request('POST', '/auth/login', { email: 'admin@test.com', password: 'Admin123@' });
  logResponse('Admin login', adminLogin);
  if (adminLogin.status === 200) {
    adminToken = adminLogin.data.token;
    adminUser = adminLogin.data.user;
    console.log('   Admin:', adminUser.name, adminUser.role);
  }
  await delay(1500);

  // 2. Get existing category
  console.log('\n2. Get existing category');
  const catsRes = await request('GET', '/menu/categories', null, adminToken);
  logResponse('Get categories', catsRes);
  if (catsRes.status === 200) {
    const cats = catsRes.data.data || catsRes.data || [];
    if (cats.length > 0) {
      categoryId = cats[0].id;
      console.log('   Using existing category:', cats[0].name, categoryId);
    }
  }

  // 3. Create menu item
  console.log('\n3. Create menu item');
  const menuRes = await request('POST', '/menu/items', {
    categoryId,
    name: 'Test Chicken Biryani',
    description: 'Test biryani for E2E',
    price: 350,
    isAvailable: true,
    inStock: true,
    isFeatured: true,
    preparationTime: 20,
    sortOrder: 1,
  }, adminToken);
  logResponse('Menu item create', menuRes);
  if (menuRes.status === 201 || menuRes.status === 200) {
    menuItemId = menuRes.data.id || menuRes.data.data?.id;
    console.log('   Menu item ID:', menuItemId);
  }

  // 4. Customer login
  console.log('\n4. Customer login');
  const custLogin = await request('POST', '/auth/login', { email: 'customer@test.com', password: 'Customer123@' });
  logResponse('Customer login', custLogin);
  if (custLogin.status === 200) {
    custToken = custLogin.data.token;
    custUser = custLogin.data.user;
    console.log('   Customer:', custUser.name, custUser.role);
  }

  // 5. Create order via place order API (COD)
  console.log('\n5. Create COD order');
  const orderRes = await request('POST', '/orders', {
    paymentMethod: 'COD',
    deliveryType: 'STANDARD',
    addressLine: 'Test Address, Lahore',
    latitude: 31.4475531,
    longitude: 74.2690347,
    items: [{ menuItemId, quantity: 1 }],
  }, custToken);
  logResponse('Order create', orderRes);
  if (orderRes.status === 201 || orderRes.status === 200) {
    orderId = orderRes.data.data?.id || orderRes.data.id;
    orderNumber = orderRes.data.data?.orderNumber || orderRes.data.orderNumber;
    console.log('   Order ID:', orderId, 'Number:', orderNumber);
  }

  // 6. Verify order via API
  if (orderId) {
    console.log('\n6. Verify order via API');
    const getOrder = await request('GET', `/orders/${orderId}`, null, custToken);
    logResponse('Get order', getOrder);
    if (getOrder.status === 200) {
      const order = getOrder.data.data || getOrder.data;
      console.log('   Order status:', order.status);
      console.log('   Order total:', order.total);
      console.log('   Order items count:', order.orderItems?.length || 0);
    }
  }

  // 7. Manager login (use phone since manager has no email)
  console.log('\n7. Manager login');
  const mgrLogin = await request('POST', '/auth/login', { phone: '+923000000003', password: 'Manager123@' });
  logResponse('Manager login', mgrLogin);
  if (mgrLogin.status === 200) {
    mgrToken = mgrLogin.data.token;
    mgrUserId = mgrLogin.data.user.id;
    console.log('   Manager:', mgrLogin.data.user.name, 'User ID:', mgrUserId);
    
    // Change password to clear mustChangePassword flag
    console.log('\n7b. Manager change password');
    const changePwdRes = await request('PUT', '/auth/change-password', {
      currentPassword: 'Manager123@',
      newPassword: 'Manager123@'
    }, mgrToken);
    logResponse('Manager change password', changePwdRes);
    if (changePwdRes.status === 200) {
      // Re-login to get fresh token
      const mgrLogin2 = await request('POST', '/auth/login', { phone: '+923000000003', password: 'Manager123@' });
      if (mgrLogin2.status === 200) {
        mgrToken = mgrLogin2.data.token;
        console.log('   Manager re-login successful');
      }
    }
  }

  // 8. Manager accepts order
  if (mgrToken && orderId) {
    console.log('\n8. Manager accepts order');
    const acceptRes = await request('PUT', `/owner/orders/${orderId}/accept`, {}, mgrToken);
    logResponse('Manager accept', acceptRes);
  }

  // 9. Manager rejects another order (create another first)
  console.log('\n9. Create second order for rejection test');
  const order2Res = await request('POST', '/orders', {
    paymentMethod: 'COD',
    deliveryType: 'STANDARD',
    addressLine: 'Test Address 2, Lahore',
    latitude: 31.4475531,
    longitude: 74.2690347,
    items: [{ menuItemId, quantity: 2 }],
  }, custToken);
  logResponse('Second order create', order2Res);
  if (order2Res.status === 201 || order2Res.status === 200) {
    const order2Id = order2Res.data.data?.id || order2Res.data.id;
    if (mgrToken && order2Id) {
      const rejectRes = await request('PUT', `/owner/orders/${order2Id}/reject`, { reason: 'Out of stock' }, mgrToken);
      logResponse('Manager reject', rejectRes);
    }
  }

  // 10. Check audit trail
  if (orderId && adminToken) {
    console.log('\n10. Check audit trail');
    const auditRes = await request('GET', `/orders/${orderId}/audit-trail`, null, adminToken);
    logResponse('Audit trail', auditRes);
  }

  // 11. Check notifications
  if (adminToken) {
    console.log('\n11. Check notifications');
    const notifRes = await request('GET', '/notifications', null, adminToken);
    logResponse('Notifications', notifRes);
  }

  // 12. Check activity center
  if (adminToken) {
    console.log('\n12. Check activity center');
    const activityRes = await request('GET', '/owner/activity', null, adminToken);
    logResponse('Activity center', activityRes);
  }

  // 13. Check KDS orders
  if (adminToken) {
    console.log('\n13. Check KDS orders');
    const kdsRes = await request('GET', '/kds/orders', null, adminToken);
    logResponse('KDS orders', kdsRes);
    
    // Test KDS status update - move first order to PREPARING then READY
    if (kdsRes.status === 200 && orderId) {
      console.log('\n13b. KDS update to PREPARING');
      const kdsPrepRes = await request('PUT', `/kds/orders/${orderId}/status`, { status: 'PREPARING' }, adminToken);
      logResponse('KDS PREPARING', kdsPrepRes);
      
      if (kdsPrepRes.status === 200) {
        console.log('\n13c. KDS update to READY');
        const kdsReadyRes = await request('PUT', `/kds/orders/${orderId}/status`, { status: 'READY' }, adminToken);
        logResponse('KDS READY', kdsReadyRes);
      }
    }
  }

  // 14. Check analytics
  if (adminToken) {
    console.log('\n14. Check analytics');
    const analyticsRes = await request('GET', '/owner/analytics/advanced', null, adminToken);
    logResponse('Analytics', analyticsRes);
  }

  // 15. Check reports
  if (adminToken) {
    console.log('\n15. Check reports');
    const reportsRes = await request('GET', '/owner/analytics', null, adminToken);
    logResponse('Reports', reportsRes);
  }

  // 16. Check inventory
  if (adminToken) {
    console.log('\n16. Check inventory');
    const invRes = await request('GET', '/owner/inventory', null, adminToken);
    logResponse('Inventory', invRes);
  }

  // 17. RBAC test - manager trying admin endpoint
  if (mgrToken) {
    console.log('\n17. RBAC test - manager accessing inventory');
    const rbacRes = await request('GET', '/owner/inventory', null, mgrToken);
    logResponse('Manager RBAC', rbacRes);
  }

  // 18. Update stock
  if (adminToken && menuItemId) {
    console.log('\n18. Update stock');
    const stockRes = await request('PUT', `/owner/menu/${menuItemId}/stock`, { stock: 50, lowStockThreshold: 5 }, adminToken);
    logResponse('Stock update', stockRes);
  }

  // 19. Internal notes
  if (adminToken && orderId) {
    console.log('\n19. Internal notes');
    const notesRes = await request('PUT', `/orders/${orderId}/internal-notes`, { internalNotes: 'Test internal note - VIP customer' }, adminToken);
    logResponse('Notes update', notesRes);
  }

  // 20. Verify internal notes privacy
  if (custToken && orderId) {
    console.log('\n20. Verify internal notes privacy');
    const customerOrderView = await request('GET', `/orders/${orderId}`, null, custToken);
    logResponse('Customer order view', customerOrderView);
    if (customerOrderView.status === 200) {
      const custOrder = customerOrderView.data.data || customerOrderView.data;
      const hasInternalNotes = custOrder.internalNotes !== undefined && custOrder.internalNotes !== null;
      console.log('   Customer view has internalNotes:', hasInternalNotes);
    }
  }

  // 21. Rider assignment and delivery
  if (adminToken && orderId) {
    console.log('\n21. Rider assignment');
    const riderId = '6b39ab21-2344-424b-ade3-e88889e98d2f'; // Test Rider
    const assignRes = await request('PUT', `/owner/orders/${orderId}/assign-rider`, { riderId }, adminToken);
    logResponse('Assign rider', assignRes);
    
    if (assignRes.status === 200) {
      console.log('\n22. Rider login');
      const riderLogin = await request('POST', '/auth/login', { phone: '+923000000001', password: 'Rider123@' });
      logResponse('Rider login', riderLogin);
      if (riderLogin.status === 200) {
        const riderToken = riderLogin.data.token;
        
        console.log('\n23. Rider view orders');
        const riderOrders = await request('GET', '/orders', null, riderToken);
        logResponse('Rider orders', riderOrders);
        
        // Update order to OUT_FOR_DELIVERY then DELIVERED
        console.log('\n24. Admin mark out for delivery');
        const outForDeliveryRes = await request('PUT', `/owner/orders/${orderId}/status`, { status: 'OUT_FOR_DELIVERY' }, adminToken);
        logResponse('Out for delivery', outForDeliveryRes);
        
        console.log('\n25. Admin mark delivered');
        const deliveredRes = await request('PUT', `/owner/orders/${orderId}/status`, { status: 'DELIVERED' }, adminToken);
        logResponse('Delivered', deliveredRes);
      }
    }
  }

  // 26. Owner override test
  if (adminToken && orderId) {
    console.log('\n26. Owner override');
    const overrideRes = await request('POST', `/orders/${orderId}/override`, { action: 'REOPEN', newStatus: 'PENDING', note: 'Reopen for testing' }, adminToken);
    logResponse('Owner override', overrideRes);
  }

  console.log('\n=== E2E TEST COMPLETE ===');
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
