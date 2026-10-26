"use client";
import React, { useState } from 'react';
import { useAdminQuery, useAdminMutation } from './hooks/useAdminApi';
import { AdminTable, Column } from './components/AdminTable';
import { AdminModal, ConfirmDialog } from './components/AdminModal';
import { Search, Plus, Bike, FileText, TrendingUp, Key, Trash2, X, Star, Users } from 'lucide-react';
import { useToast } from '@/components/AdminToast';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "#10B981", // green
  ON_DELIVERY: "#EA580C", // orange
  INACTIVE: "#6B7280", // gray
  SUSPENDED: "#EF4444" // red
};

const RiderStatusBadge = ({ status, dot }: { status: string, dot?: boolean }) => {
  const color = STATUS_COLORS[status] || STATUS_COLORS.INACTIVE;
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "6px",
      background: `${color}15`,
      color: color,
      padding: "4px 10px",
      borderRadius: "16px",
      fontSize: "0.75rem",
      fontWeight: 700,
      border: `1px solid ${color}30`
    }}>
      {dot && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: color }} />}
      {status.replace(/_/g, ' ')}
    </span>
  );
};

export default function AdminRiders() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // ACTIVE, INACTIVE, SUSPENDED
  const [selectedRiderId, setSelectedRiderId] = useState<string | null>(null);
  
  const { addToast } = useToast();

  // Queries
  const { data: ridersResponse, loading, refetch } = useAdminQuery(`/owner/riders`, []);
  const riders = ridersResponse?.data || ridersResponse || [];

  // Filter riders locally or via API search if supported
  const filteredRiders = riders.filter((r: any) => {
    const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                          r.phone.includes(search) || 
                          (r.email && r.email.toLowerCase().includes(search.toLowerCase()));
    
    // Status resides in riderProfile
    const status = r.riderProfile?.status || 'INACTIVE';
    const matchesStatus = !statusFilter || status === statusFilter;
    
    return matchesSearch && matchesStatus && !r.riderProfile?.deletedAt;
  });

  const activeRidersCount = riders.filter((r: any) => r.riderProfile?.status === 'ACTIVE').length;
  const onDeliveryRidersCount = riders.filter((r: any) => r.riderProfile?.status === 'ON_DELIVERY').length;
  const inactiveRidersCount = riders.filter((r: any) => r.riderProfile?.status === 'INACTIVE').length;

  // Selected rider profile
  const selectedRider = riders.find((r: any) => r.id === selectedRiderId);

  // Mutations
  const { mutate: createMutate, loading: createLoading } = useAdminMutation('/owner/riders', 'POST');
  const { mutate: updateMutate } = useAdminMutation('', 'PUT');
  const { mutate: statusMutate } = useAdminMutation('', 'PUT');
  const { mutate: resetPwdMutate } = useAdminMutation('', 'PUT');
  const { mutate: deleteMutate } = useAdminMutation('', 'DELETE');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  const [newRider, setNewRider] = useState({
    name: '', email: '', phone: '', password: '',
    cnicNumber: '', dateOfBirth: '', gender: 'MALE',
    houseNumber: '', street: '', area: '', city: 'Karachi', province: 'Sindh', postalCode: '',
    emergencyContactName: '', emergencyContactPhone: '',
    vehicleType: 'BIKE', vehicleNumber: '', drivingLicenseNumber: ''
  });

  const [newPassword, setNewPassword] = useState('');
  const [deleteReason, setDeleteReason] = useState('');

  const [activeTab, setActiveTab] = useState<'info' | 'documents' | 'performance'>('info');

  const handleCreateRider = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutate(newRider);
      addToast({ type: 'success', title: 'Rider Registered', message: `${newRider.name} is now registered.` });
      setCreateModalOpen(false);
      refetch();
      // Reset form
      setNewRider({
        name: '', email: '', phone: '', password: '',
        cnicNumber: '', dateOfBirth: '', gender: 'MALE',
        houseNumber: '', street: '', area: '', city: 'Karachi', province: 'Sindh', postalCode: '',
        emergencyContactName: '', emergencyContactPhone: '',
        vehicleType: 'BIKE', vehicleNumber: '', drivingLicenseNumber: ''
      });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Registration Failed', message: e.message });
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!selectedRiderId) return;
    try {
      await statusMutate({ status }, `/owner/riders/${selectedRiderId}/status`);
      addToast({ type: 'success', title: 'Status Updated', message: `Rider is now ${status}.` });
      refetch();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Status Update Failed', message: e.message });
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRiderId) return;
    try {
      await resetPwdMutate({ password: newPassword }, `/owner/riders/${selectedRiderId}/reset-password`);
      addToast({ type: 'success', title: 'Password Reset', message: 'Password changed successfully.' });
      setResetPwdModalOpen(false);
      setNewPassword('');
    } catch (e: any) {
      addToast({ type: 'error', title: 'Reset Failed', message: e.message });
    }
  };

  const handleDeleteRider = async () => {
    if (!selectedRiderId) return;
    try {
      await deleteMutate({ reason: deleteReason }, `/owner/riders/${selectedRiderId}`);
      addToast({ type: 'success', title: 'Rider Deleted', message: 'Rider account has been deactivated.' });
      setDeleteDialogOpen(false);
      setDeleteReason('');
      setSelectedRiderId(null);
      refetch();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Delete Failed', message: e.message });
    }
  };

  const handleUpdateDocs = async (key: string, url: string) => {
    if (!selectedRiderId) return;
    try {
      await updateMutate({ [key]: url }, `/owner/riders/${selectedRiderId}`);
      addToast({ type: 'success', title: 'Document Saved', message: 'Document URL updated successfully.' });
      refetch();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Update Failed', message: e.message });
    }
  };

  const columns: Column[] = [
    {
      key: 'name',
      label: 'Rider Name',
      sortable: true,
      render: (row) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #EA580C, #9A3412)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: '0.85rem',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {row.name.substring(0, 2).toUpperCase()}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{row.name}</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {row.id.substring(0, 8)}</span>
          </div>
        </div>
      )
    },
    {
      key: 'phone',
      label: 'Contact No',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 500 }}>{row.phone}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.email || 'No Email'}</span>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (row) => {
        const s = row.riderProfile?.status || 'INACTIVE';
        return <RiderStatusBadge status={s} dot />;
      }
    },
    {
      key: 'vehicle',
      label: 'Vehicle Details',
      render: (row) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontWeight: 600 }}>{row.riderProfile?.vehicleType || 'BIKE'}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{row.riderProfile?.vehicleNumber || 'No plate'}</span>
        </div>
      )
    },
    {
      key: 'cnic',
      label: 'CNIC Number',
      render: (row) => row.riderProfile?.cnicNumber || '—'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button
          onClick={() => setSelectedRiderId(row.id)}
          className="btn-warm-outline"
          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
        >
          Manage Profile
        </button>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <style>{`
        .warm-input:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(234, 88, 12, 0.3);
          border-color: #EA580C !important;
        }
        .btn-warm-outline {
          background: transparent;
          border: 1px solid #EA580C;
          color: #EA580C;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: all var(--transition-fast) cubic-bezier(0.22, 1, 0.36, 1);
        }
        .btn-warm-outline:hover {
          background: rgba(234, 88, 12, 0.1);
        }
        .btn-warm-solid {
          background: linear-gradient(135deg, #EA580C, #9A3412);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          cursor: pointer;
          transition: transform var(--transition-fast) cubic-bezier(0.22, 1, 0.36, 1);
          box-shadow: var(--shadow-sm);
        }
        .btn-warm-solid:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .btn-warm-solid:active {
          transform: translateY(0);
        }
        .rider-profile-card {
          border: 1px solid var(--border-color);
          border-radius: var(--radius-xl);
          background: var(--bg-card);
          box-shadow: var(--shadow-md);
        }
      `}</style>
      
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>Rider ERP</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Deploy and manage delivery partners, salary/commissions, credentials, and performance.</p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          className="btn-warm-solid"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', padding: '10px 16px' }}
        >
          <Plus size={16} /> Create Rider
        </button>
      </div>

      {/* KPI Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Fleet</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: 'var(--text-primary)' }}>{riders.length}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C' }}>
            <Bike size={22} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Fleet</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: '#10B981' }}>{activeRidersCount}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
            <Bike size={22} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Inactive/Offline</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: '#6B7280' }}>{inactiveRidersCount}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(107,114,128,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
            <Bike size={22} />
          </div>
        </div>
        <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>On Delivery</span>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '6px 0 0', color: '#EA580C' }}>{onDeliveryRidersCount}</h3>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EA580C' }}>
            <Bike size={22} />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '280px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search rider fleet..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="warm-input"
              style={{
                width: '100%', padding: '10px 12px 10px 40px',
                borderRadius: '8px', border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)', color: 'var(--text-primary)',
                transition: 'all var(--transition-fast)'
              }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="warm-input"
            style={{
              padding: '10px 16px', borderRadius: '8px',
              border: '1px solid var(--border-color)', background: 'var(--bg-secondary)',
              color: 'var(--text-primary)', cursor: 'pointer',
              transition: 'all var(--transition-fast)'
            }}
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Fleet</option>
            <option value="ON_DELIVERY">On Delivery</option>
            <option value="INACTIVE">Inactive / Offline</option>
          </select>
        </div>
      </div>

      {/* Main Table or Loading/Empty State */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: '64px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
      ) : filteredRiders.length === 0 ? (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", textAlign: "center", background: "var(--bg-secondary)", borderRadius: "var(--radius-xl)", border: "1px dashed var(--border-color)" }}>
          <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "rgba(234, 88, 12, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#EA580C", marginBottom: "16px" }}>
            <Users size={32} />
          </div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>No riders found</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "250px" }}>
            Adjust your search or filters to see more results, or add a new rider.
          </p>
        </div>
      ) : (
        <AdminTable
          columns={columns}
          data={filteredRiders}
          loading={loading}
        />
      )}

      {/* Slide-over Profile Drawer */}
      {selectedRider && (
        <>
          {/* Backdrop overlay */}
          <div
            onClick={() => setSelectedRiderId(null)}
            style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)', zIndex: 99,
            }}
          />
          <div style={{
            position: 'fixed', right: 0, top: 0, bottom: 0, width: 'min(480px, 100vw)',
            background: 'var(--bg-primary)', borderLeft: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-xl)', zIndex: 100,
            display: 'flex', flexDirection: 'column', animation: 'slide-in 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
            overflowY: 'auto',
          }}>
            <style>{`@keyframes slide-in { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
          
          {/* Drawer Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Rider Control Panel</h3>
            <button onClick={() => setSelectedRiderId(null)} style={{ padding: '6px', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', borderRadius: '50%', border: 'none', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            {/* Summary */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-secondary)' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #EA580C, #9A3412)', color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, fontSize: '1.5rem',
                boxShadow: 'var(--shadow-md)'
              }}>
                {selectedRider.name.substring(0, 2).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{selectedRider.name}</h4>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                  <RiderStatusBadge status={selectedRider.riderProfile?.status || 'INACTIVE'} dot />
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: 700, color: '#EA580C', background: 'rgba(234, 88, 12, 0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                    <Star size={13} fill="#EA580C" /> {selectedRider.riderProfile?.rating ?? '4.8'}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', gap: '8px', background: 'var(--bg-card)', flexWrap: 'wrap' }}>
              <button onClick={() => handleStatusChange('ACTIVE')} className="btn-warm-outline" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>Activate</button>
              <button onClick={() => handleStatusChange('ON_DELIVERY')} className="btn-warm-solid" style={{ flex: 1, padding: '8px', fontSize: '0.8rem' }}>On Delivery</button>
              <button onClick={() => handleStatusChange('INACTIVE')} className="btn-warm-outline" style={{ flex: 1, padding: '8px', fontSize: '0.8rem', borderColor: '#6B7280', color: '#6B7280' }}>Deactivate</button>
              <button onClick={() => setResetPwdModalOpen(true)} className="btn-warm-outline" style={{ padding: '8px 12px' }} title="Reset Password"><Key size={14} /></button>
              <button onClick={() => setDeleteDialogOpen(true)} className="btn-warm-outline" style={{ padding: '8px 12px', borderColor: '#EF4444', color: '#EF4444' }} title="Delete Rider"><Trash2 size={14} /></button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
              {(['info', 'documents', 'performance'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1, padding: '14px 8px', border: 'none', background: 'none',
                    fontSize: '0.85rem', fontWeight: 700, textTransform: 'capitalize',
                    color: activeTab === tab ? '#EA580C' : 'var(--text-secondary)',
                    borderBottom: activeTab === tab ? '3px solid #EA580C' : '3px solid transparent',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {activeTab === 'info' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
                  <div className="rider-profile-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Phone Contact</span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRider.phone}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Email</span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRider.email || 'No email associated'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Vehicle Plate / Type</span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRider.riderProfile?.vehicleNumber || 'No plate number'} ({selectedRider.riderProfile?.vehicleType})</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Residential Address</span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px', fontSize: '0.85rem', lineHeight: 1.5 }}>{selectedRider.riderProfile?.fullAddress || 'Address not registered'}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documents' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
                  <div className="rider-profile-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>CNIC Number</span>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>{selectedRider.riderProfile?.cnicNumber || 'Not specified'}</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>CNIC Front Image URL</label>
                      <input
                        type="text"
                        defaultValue={selectedRider.riderProfile?.cnicFrontUrl || ''}
                        onBlur={(e) => handleUpdateDocs('cnicFrontUrl', e.target.value)}
                        placeholder="Paste image link..."
                        className="warm-input"
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem', transition: 'all var(--transition-fast)' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>CNIC Back Image URL</label>
                      <input
                        type="text"
                        defaultValue={selectedRider.riderProfile?.cnicBackUrl || ''}
                        onBlur={(e) => handleUpdateDocs('cnicBackUrl', e.target.value)}
                        placeholder="Paste image link..."
                        className="warm-input"
                        style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.85rem', transition: 'all var(--transition-fast)' }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'performance' && (
                <div className="form-grid-2col fade-in">
                  <div className="rider-profile-card" style={{ padding: '20px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Deliveries Today</span>
                    <h5 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0', color: 'var(--text-primary)' }}>{selectedRider.riderProfile?.deliveriesToday || 0}</h5>
                  </div>
                  <div className="rider-profile-card" style={{ padding: '20px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Active Deliveries</span>
                    <h5 style={{ fontSize: '2rem', fontWeight: 800, margin: '8px 0 0', color: '#EA580C' }}>
                      {selectedRider.riderProfile?.activeDeliveries || 0}
                    </h5>
                  </div>
                  <div className="rider-profile-card col-span-2" style={{ padding: '20px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.05), transparent)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Overall Rating</span>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px' }}>
                      <Star size={24} fill="#EA580C" color="#EA580C" />
                      <h5 style={{ fontSize: '2rem', fontWeight: 800, margin: 0, color: '#EA580C' }}>
                        {selectedRider.riderProfile?.rating ?? '4.8'}
                      </h5>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      {/* Create Rider Modal */}
      <AdminModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New Rider Profile"
        footer={
          <>
            <button onClick={() => setCreateModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="create-rider-form" disabled={createLoading} className="btn-warm-solid" style={{ padding: '10px 20px' }}>
              {createLoading ? 'Creating...' : 'Register Rider'}
            </button>
          </>
        }
      >
        <form id="create-rider-form" onSubmit={handleCreateRider} className="form-grid-2col">
          <div className="col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Rider Name *</label>
            <input
              type="text" required
              value={newRider.name}
              onChange={(e) => setNewRider(n => ({ ...n, name: e.target.value }))}
              placeholder="Full name"
              className="warm-input"
              style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Phone Number *</label>
            <input
              type="text" required
              value={newRider.phone}
              onChange={(e) => setNewRider(n => ({ ...n, phone: e.target.value }))}
              placeholder="e.g. +923000000000"
              className="warm-input"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Email Address</label>
            <input
              type="email"
              value={newRider.email}
              onChange={(e) => setNewRider(n => ({ ...n, email: e.target.value }))}
              placeholder="rider@example.com"
              className="warm-input"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Password *</label>
            <input
              type="password" required
              value={newRider.password}
              onChange={(e) => setNewRider(n => ({ ...n, password: e.target.value }))}
              placeholder="At least 6 chars"
              className="warm-input"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>CNIC Number *</label>
            <input
              type="text" required
              value={newRider.cnicNumber}
              onChange={(e) => setNewRider(n => ({ ...n, cnicNumber: e.target.value }))}
              placeholder="e.g. 4210112345678"
              className="warm-input"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Date of Birth</label>
            <input
              type="date"
              value={newRider.dateOfBirth}
              onChange={(e) => setNewRider(n => ({ ...n, dateOfBirth: e.target.value }))}
              className="warm-input"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Gender</label>
            <select
              value={newRider.gender}
              onChange={(e) => setNewRider(n => ({ ...n, gender: e.target.value }))}
              className="warm-input"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
            >
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vehicle Type</label>
            <select
              value={newRider.vehicleType}
              onChange={(e) => setNewRider(n => ({ ...n, vehicleType: e.target.value }))}
              className="warm-input"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
            >
              <option value="BIKE">Motorcycle</option>
              <option value="CAR">Car</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8rem', fontWeight: 600 }}>Vehicle Plate Number</label>
            <input
              type="text"
              value={newRider.vehicleNumber}
              onChange={(e) => setNewRider(n => ({ ...n, vehicleNumber: e.target.value }))}
              placeholder="e.g. KHI-1234"
              className="warm-input"
              style={{ padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
            />
          </div>
        </form>
      </AdminModal>

      {/* Reset Password Modal */}
      <AdminModal
        open={resetPwdModalOpen}
        onClose={() => setResetPwdModalOpen(false)}
        title="Reset Rider Password"
        footer={
          <>
            <button onClick={() => setResetPwdModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" form="pwd-form" className="btn-warm-solid" style={{ padding: '10px 20px' }}>Change Password</button>
          </>
        }
      >
        <form id="pwd-form" onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>New Password</label>
          <input
            type="password" required minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Min 6 characters"
            className="warm-input"
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', transition: 'all var(--transition-fast)' }}
          />
        </form>
      </AdminModal>

      {/* Delete Rider Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteRider}
        title="Deactivate Rider"
        message="Are you sure you want to deactivate and soft-delete this rider? This action is reversible."
        confirmLabel="Deactivate Rider"
        danger
      />
    </div>
  );
}
