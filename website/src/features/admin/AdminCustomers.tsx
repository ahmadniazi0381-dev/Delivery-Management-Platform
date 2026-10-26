"use client";
import React, { useState } from 'react';
import { useAdminQuery, useAdminMutation } from './hooks/useAdminApi';
import { AdminTable, Column } from './components/AdminTable';
import { AdminModal } from './components/AdminModal';
import { StatusBadge } from './components/StatusBadge';
import { Search, Send, UserX, UserCheck, ShieldAlert, Award, X, Download } from 'lucide-react';
import { useToast } from '@/components/AdminToast';

export default function AdminCustomers() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '','blocked','active'
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  
  const { addToast } = useToast();

  // Queries
  const { data: customersData, loading, refetch } = useAdminQuery(`/owner/customers?page=${page}&search=${search}&status=${statusFilter}`, [page, search, statusFilter]);
  const { data: customerDetail, loading: detailLoading, refetch: refetchDetail } = useAdminQuery(
    selectedCustomerId ? `/owner/customers/${selectedCustomerId}` : '',
    [selectedCustomerId]
  );

  // Mutations
  const { mutate: blockMutate } = useAdminMutation('', 'PUT');
  const { mutate: unblockMutate } = useAdminMutation('', 'PUT');
  const { mutate: notifyMutate } = useAdminMutation('', 'POST');
  const { mutate: loyaltyMutate } = useAdminMutation('', 'POST');

  // Modals state
  const [notifyModal, setNotifyModal] = useState({ open: false, title: '', body: '' });
  const [loyaltyModal, setLoyaltyModal] = useState({ open: false, points: '', reason: '', type: 'ADD' }); // ADD or REMOVE

  const customers = customersData?.customers || customersData?.data || [];
  const totalCount = customersData?.totalCount || customersData?.total || 0;

  // Overview stats
  const totalCustomers = customersData?.stats?.total || 0;
  const blockedCustomers = customersData?.stats?.blocked || 0;
  const newCustomersThisWeek = customersData?.stats?.newThisWeek || 0;
  const powerUsers = customersData?.stats?.powerUsers || 0;

  const handleBlockToggle = async (customer: any) => {
    try {
      if (customer.blockedAt) {
        await unblockMutate(null, `/owner/customers/${customer.id}/unblock`);
        addToast({ type: 'success', title: 'Customer Unblocked', message: `${customer.name} has been unblocked.` });
      } else {
        await blockMutate(null, `/owner/customers/${customer.id}/block`);
        addToast({ type: 'success', title: 'Customer Blocked', message: `${customer.name} has been blocked.` });
      }
      refetch();
      if (selectedCustomerId === customer.id) refetchDetail();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Action Failed', message: e.message || 'Operation failed' });
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    try {
      await notifyMutate({ title: notifyModal.title, body: notifyModal.body }, `/owner/customers/${selectedCustomerId}/notify`);
      addToast({ type: 'success', title: 'Notification Sent', message: 'Push notification queued.' });
      setNotifyModal({ open: false, title: '', body: '' });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Failed to Send', message: e.message });
    }
  };

  const handleAdjustLoyalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) return;
    try {
      await loyaltyMutate(
        { points: parseInt(loyaltyModal.points), reason: loyaltyModal.reason, type: loyaltyModal.type },
        `/owner/customers/${selectedCustomerId}/loyalty`
      );
      addToast({ type: 'success', title: 'Loyalty Points Updated', message: `Adjusted points successfully.` });
      setLoyaltyModal({ open: false, points: '', reason: '', type: 'ADD' });
      refetchDetail();
      refetch();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Adjustment Failed', message: e.message });
    }
  };

  const handleExportCSV = () => {
    if (customers.length === 0) return;
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Loyalty Points', 'Role', 'Joined Date', 'Blocked Status'];
    const rows = customers.map((c: any) => [
      c.id, c.name, c.email || '', c.phone || '', c.loyaltyPoints, c.role,
      new Date(c.createdAt).toLocaleDateString(), c.blockedAt ? 'Blocked' : 'Active'
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map((r: any) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `customers_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [activeDetailTab, setActiveDetailTab] = useState<'overview' | 'orders' | 'loyalty' | 'addresses'>('overview');

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Customer Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%',
            background: 'var(--grad-saffron)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.8rem'
          }}>
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{row.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {row.id.substring(0, 8)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Contact Info',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>{row.phone || 'No phone'}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.email || 'No email'}</span>
        </div>
      )
    },
    {
      key: 'ordersCount',
      label: 'OrdersPlaced',
      sortable: true,
      render: (row) => row._count?.ordersPlaced ?? row.ordersPlaced?.length ?? 0
    },
    {
      key: 'loyaltyPoints',
      label: 'Loyalty Points',
      sortable: true,
      render: (row) => (
        <span style={{ fontWeight: 700, color: 'var(--saffron)' }}>{row.loyaltyPoints}</span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <StatusBadge status={row.blockedAt ? 'BLOCKED' : row.phoneVerified ? 'VERIFIED' : 'ACTIVE'} dot />
      )
    },
    {
      key: 'createdAt',
      label: 'Joined Date',
      render: (row) => new Date(row.createdAt).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setSelectedCustomerId(row.id)}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
          >
            View Detail
          </button>
          <button
            onClick={() => handleBlockToggle(row)}
            className="btn"
            style={{
              padding: '4px 8px', fontSize: '0.75rem',
              background: row.blockedAt ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: row.blockedAt ? 'var(--success)' : 'var(--error)'
            }}
          >
            {row.blockedAt ? <UserCheck size={14} /> : <UserX size={14} />}
          </button>
        </div>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Customer CRM</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Manage users, loyalty point ledgers, addresses and push notifications.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}
        >
          <Download size={14} /> Export CSV
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Customers</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>{totalCustomers}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--saffron)' }}>
            <Award size={22} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>New This Week</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>{newCustomersThisWeek}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
            <UserCheck size={22} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Blocked Customer Accounts</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--error)' }}>{blockedCustomers}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--error)' }}>
            <ShieldAlert size={22} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{"Power Users (>= 10 orders)"}</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>{powerUsers}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgb(59,130,246)' }}>
            <Award size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search by name, phone or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{
                width: '100%', padding: '10px 12px 10px 40px',
                borderRadius: '8px', border: '1px solid var(--border)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)'
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: '10px 16px', borderRadius: '8px',
              border: '1px solid var(--border)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', cursor: 'pointer'
            }}
          >
            <option value="">All Statuses</option>
            <option value="active">Active/Verified Only</option>
            <option value="blocked">Blocked Accounts</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <AdminTable
        columns={columns}
        data={customers}
        loading={loading}
        pageSize={20}
        totalCount={totalCount}
        page={page}
        onPageChange={setPage}
      />

      {/* Drawer Details Slide-over */}
      {selectedCustomerId && (
        <>
          {/* Backdrop overlay */}
          <div
            onClick={() => setSelectedCustomerId(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
              backdropFilter: 'blur(2px)', zIndex: 99,
            }}
          />
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(480px, 100vw)',
            background: 'var(--bg-card)', borderLeft: '1px solid var(--border)',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.15)', zIndex: 100,
            display: 'flex', flexDirection: 'column', animation: 'slide-in 0.25s ease',
            overflowY: 'auto',
          }}>
            <style>{`@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
          
          {/* Drawer Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Customer Profile</h3>
            <button onClick={() => setSelectedCustomerId(null)} style={{ padding: '4px', color: 'var(--text-secondary)' }}>
              <X size={20} />
            </button>
          </div>

          {detailLoading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading details...</div>
          ) : !customerDetail ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Failed to load profile.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Profile Card Summary */}
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-secondary)' }}>
                <div style={{
                  width: '64px', height: '64px', borderRadius: '50%',
                  background: 'var(--grad-saffron)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1.5rem'
                }}>
                  {customerDetail.name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{customerDetail.name}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '4px 0 0' }}>Joined: {new Date(customerDetail.createdAt).toLocaleDateString()}</p>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                    {customerDetail.blockedAt ? <StatusBadge status="BLOCKED" /> : <StatusBadge status="ACTIVE" />}
                    {customerDetail.googleId && <span style={{ fontSize: '0.7rem', padding: '2px 6px', borderRadius: '10px', background: '#e0f2fe', color: '#0369a1', fontWeight: 600 }}>Google User</span>}
                  </div>
                </div>
              </div>

              {/* CRM Actions */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '8px', background: 'var(--bg-card)' }}>
                <button onClick={() => setNotifyModal({ open: true, title: '', body: '' })} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <Send size={14} /> Notify
                </button>
                <button onClick={() => setLoyaltyModal({ open: true, points: '', reason: '', type: 'ADD' })} className="btn btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem' }}>
                  <Award size={14} /> Loyalty
                </button>
                <button
                  onClick={() => handleBlockToggle(customerDetail)}
                  className="btn"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.8rem',
                    background: customerDetail.blockedAt ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                    color: customerDetail.blockedAt ? 'var(--success)' : 'var(--error)'
                  }}
                >
                  {customerDetail.blockedAt ? 'Unblock' : 'Block'}
                </button>
              </div>

              {/* Mini Tabs */}
              <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {(['overview', 'orders', 'loyalty', 'addresses'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveDetailTab(tab)}
                    style={{
                      flex: 1, padding: '12px 8px', border: 'none', background: 'none',
                      fontSize: '0.8rem', fontWeight: 700, textTransform: 'capitalize',
                      color: activeDetailTab === tab ? 'var(--saffron)' : 'var(--text-secondary)',
                      borderBottom: activeDetailTab === tab ? '3px solid var(--saffron)' : 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                {activeDetailTab === 'overview' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone Number</span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{customerDetail.phone || 'Not verified/associated'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email Address</span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px' }}>{customerDetail.email || 'No email address registered'}</p>
                    </div>
                    <div className="form-grid-2col" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Spend</span>
                        <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--success)', marginTop: '2px' }}>Rs. {customerDetail.stats?.totalSpend.toLocaleString()}</p>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Completed Orders</span>
                        <p style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--text-primary)', marginTop: '2px' }}>{customerDetail.stats?.totalOrders} orders</p>
                      </div>
                    </div>
                  </div>
                )}

                {activeDetailTab === 'orders' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {customerDetail.ordersPlaced?.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' }}>No orders placed by this user yet.</p>
                    ) : (
                      customerDetail.ordersPlaced?.map((order: any) => (
                        <div key={order.id} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>#{order.orderNumber}</span>
                            <StatusBadge status={order.status} size="sm" />
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            <span>{new Date(order.placedAt).toLocaleDateString()}</span>
                            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Rs. {parseFloat(order.total).toLocaleString()}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeDetailTab === 'loyalty' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Points Balance</span>
                      <h4 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--saffron)', margin: '4px 0 0' }}>{customerDetail.loyaltyPoints} pts</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <h5 style={{ fontSize: '0.85rem', fontWeight: 700 }}>Point Transactions Log</h5>
                      {customerDetail.loyaltyPointHistory?.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' }}>No transactions recorded.</p>
                      ) : (
                        customerDetail.loyaltyPointHistory?.map((log: any) => (
                          <div key={log.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', borderBottom: '1px solid var(--border)', paddingBottom: '8px' }}>
                            <div>
                              <p style={{ fontWeight: 600 }}>{log.reason}</p>
                              <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>{new Date(log.createdAt).toLocaleString()}</span>
                            </div>
                            <span style={{ fontWeight: 700, color: log.points > 0 ? 'var(--success)' : 'var(--error)' }}>
                              {log.points > 0 ? `+${log.points}` : log.points}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeDetailTab === 'addresses' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {customerDetail.addresses?.length === 0 ? (
                      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.85rem' }}>No saved addresses found.</p>
                    ) : (
                      customerDetail.addresses?.map((addr: any) => (
                        <div key={addr.id} style={{ padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', background: addr.isDefault ? 'rgba(217,119,6,0.05)' : undefined }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{addr.label}</span>
                            {addr.isDefault && <span style={{ fontSize: '0.7rem', color: 'var(--saffron)', fontWeight: 700 }}>DEFAULT</span>}
                          </div>
                          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{addr.addressLine}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </>
      )}
      <AdminModal
        open={notifyModal.open}
        onClose={() => setNotifyModal(m => ({ ...m, open: false }))}
        title="Send Push Notification"
        footer={
          <>
            <button onClick={() => setNotifyModal(m => ({ ...m, open: false }))} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="notify-form" className="btn" style={{ background: 'var(--saffron)', color: '#fff' }}>Send Notification</button>
          </>
        }
      >
        <form id="notify-form" onSubmit={handleSendNotification} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Message Title</label>
            <input
              type="text"
              required
              value={notifyModal.title}
              onChange={(e) => setNotifyModal(m => ({ ...m, title: e.target.value }))}
              placeholder="e.g. Free Biryani delivery today!"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Message Body</label>
            <textarea
              required
              rows={4}
              value={notifyModal.body}
              onChange={(e) => setNotifyModal(m => ({ ...m, body: e.target.value }))}
              placeholder="e.g. Order now and get free delivery on order values above Rs. 500!"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit', resize: 'vertical' }}
            />
          </div>
        </form>
      </AdminModal>

      {/* Loyalty points adjustment modal */}
      <AdminModal
        open={loyaltyModal.open}
        onClose={() => setLoyaltyModal(m => ({ ...m, open: false }))}
        title="Adjust Loyalty Points"
        footer={
          <>
            <button onClick={() => setLoyaltyModal(m => ({ ...m, open: false }))} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="loyalty-form" className="btn" style={{ background: 'var(--saffron)', color: '#fff' }}>Save Adjustments</button>
          </>
        }
      >
        <form id="loyalty-form" onSubmit={handleAdjustLoyalty} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Adjustment Type</label>
            <select
              value={loyaltyModal.type}
              onChange={(e) => setLoyaltyModal(m => ({ ...m, type: e.target.value }))}
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            >
              <option value="ADD">Add Points (+)</option>
              <option value="REMOVE">Remove/Redeem Points (-)</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Points Amount</label>
            <input
              type="number"
              required
              min="1"
              value={loyaltyModal.points}
              onChange={(e) => setLoyaltyModal(m => ({ ...m, points: e.target.value }))}
              placeholder="e.g. 50"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Reason</label>
            <input
              type="text"
              required
              value={loyaltyModal.reason}
              onChange={(e) => setLoyaltyModal(m => ({ ...m, reason: e.target.value }))}
              placeholder="e.g. Special customer goodwill gesture"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
            />
          </div>
        </form>
      </AdminModal>
    </div>
  );
}
