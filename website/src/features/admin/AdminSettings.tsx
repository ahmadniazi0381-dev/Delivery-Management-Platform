"use client";
import React, { useEffect, useState } from 'react';
import { useAdminQuery, useAdminMutation, adminFetch } from './hooks/useAdminApi';
import { useToast } from '@/components/AdminToast';
import {
  Volume2, VolumeX, Play, AlertTriangle, CheckCircle2, Info, Zap,
  Store, Truck, DollarSign, Bell
} from 'lucide-react';
import {
  DEFAULT_SOUND_SETTINGS,
  loadSoundSettings,
  saveSoundSettings,
  useSoundSystem,
  type SoundSettings
} from './hooks/useSoundSystem';

type SoundRowProps = {
  label: string;
  description: string;
  priority: 'critical' | 'success' | 'warning' | 'info';
  enabled: boolean;
  onToggle: () => void;
  onTest: () => void;
};

const PRIORITY_STYLES = {
  critical: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'CRITICAL · Loop', icon: <Zap size={14} /> },
  success:  { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: 'SUCCESS · Once',  icon: <CheckCircle2 size={14} /> },
  warning:  { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: 'WARNING · Once',  icon: <AlertTriangle size={14} /> },
  info:     { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', label: 'SILENT',         icon: <Info size={14} /> },
};

function SoundRow({ label, description, priority, enabled, onToggle, onTest }: SoundRowProps) {
  const style = PRIORITY_STYLES[priority];
  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px', borderRadius: '10px',
        border: `1px solid ${enabled ? style.color + '33' : 'var(--border)'}`,
        background: enabled ? style.bg : 'transparent',
        transition: 'all 0.2s ease', gap: '16px', flexWrap: 'wrap',
      }}
    >
      <div style={{ flex: '1 1 240px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{label}</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '0.7rem', fontWeight: 700, color: style.color,
            background: style.bg, padding: '2px 8px', borderRadius: '20px',
            flexShrink: 0
          }}>
            {style.icon} {style.label}
          </span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
        <button
          onClick={onTest}
          disabled={!enabled}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '0.8rem', opacity: enabled ? 1 : 0.5 }}
        >
          <Play size={12} /> Test
        </button>
        <button
          onClick={onToggle}
          className="btn"
          style={{
            background: enabled ? 'var(--saffron)' : 'rgba(107,114,128,0.1)',
            color: enabled ? '#fff' : 'var(--text-secondary)',
            fontSize: '0.8rem', padding: '6px 12px', borderRadius: '6px'
          }}
        >
          {enabled ? 'Enabled' : 'Disabled'}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<'restaurant' | 'delivery' | 'payments' | 'sound' | 'owner'>('restaurant');
  const { addToast } = useToast();

  // Queries
  const { data: shopData, refetch: refetchShop } = useAdminQuery('/owner/settings');
  const { data: deliveryData, refetch: refetchDelivery } = useAdminQuery('/owner/delivery-settings');
  const { data: paymentsData, refetch: refetchPayments } = useAdminQuery('/owner/payment-settings');

  // Mutations
  const { mutate: saveShop, loading: shopSaving } = useAdminMutation('/owner/settings', 'PUT');
  const { mutate: saveDelivery, loading: deliverySaving } = useAdminMutation('/owner/delivery-settings', 'PUT');
  const { mutate: savePayment } = useAdminMutation('/owner/payment-settings', 'PUT');

  // Sound System Hooks
  const { testSound } = useSoundSystem();
  const [soundSettings, setSoundSettings] = useState<SoundSettings>(DEFAULT_SOUND_SETTINGS);

  useEffect(() => {
    setSoundSettings(loadSoundSettings());
  }, []);

  const updateSound = (key: keyof SoundSettings['sounds']) => {
    const next = {
      ...soundSettings,
      sounds: {
        ...soundSettings.sounds,
        [key]: !soundSettings.sounds[key]
      }
    };
    setSoundSettings(next);
    saveSoundSettings(next);
    addToast({ type: 'success', title: 'Settings Saved', message: 'Sound preferences updated immediately.' });
  };

  const handleTestSound = (key: 'newOrder' | 'paymentSuccess' | 'paymentFailed') => {
    testSound(key);
  };

  // Forms state
  const [shopForm, setShopForm] = useState({
    shopName: '', contactNumber: '', openingTime: '', closingTime: '',
    address: '', taxRate: '', estimatedDeliveryMinutes: '', logoUrl: '',
    facebookUrl: '', instagramUrl: '', whatsappNumber: '', isAcceptingOrders: true
  });

  const [deliveryForm, setDeliveryForm] = useState({
    shopLatitude: 31.4469, shopLongitude: 74.2682, maxDeliveryKm: 2.2,
    baseDeliveryCharge: 50.00, perKmCharge: 20.00, minOrderAmount: 200.00,
    standardEnabled: true, standardFee: 50.00, standardEta: '20-40 min',
    priorityEnabled: true, priorityFee: 125.00, priorityEta: '10-20 min', maxPriorityOrders: 10
  });

  // Sync state on load
  useEffect(() => {
    if (shopData) {
      setShopForm({
        shopName: shopData.shopName || 'Delivery Platform',
        contactNumber: shopData.contactNumber || '+923054311118',
        openingTime: shopData.openingTime || '11:00',
        closingTime: shopData.closingTime || '23:00',
        address: shopData.address || 'UCP Road, Block C, Johar Town, Lahore',
        taxRate: shopData.taxRate ? String(shopData.taxRate) : '0.00',
        estimatedDeliveryMinutes: shopData.estimatedDeliveryMinutes ? String(shopData.estimatedDeliveryMinutes) : '30',
        logoUrl: shopData.logoUrl || '',
        facebookUrl: shopData.facebookUrl || '',
        instagramUrl: shopData.instagramUrl || '',
        whatsappNumber: shopData.whatsappNumber || '+923054311118',
        isAcceptingOrders: shopData.isAcceptingOrders ?? true
      });
    }
  }, [shopData]);

  useEffect(() => {
    if (deliveryData) {
      setDeliveryForm({
        shopLatitude: deliveryData.shopLatitude || 31.4469,
        shopLongitude: deliveryData.shopLongitude || 74.2682,
        maxDeliveryKm: parseFloat(deliveryData.maxDeliveryKm || '2.2'),
        baseDeliveryCharge: parseFloat(deliveryData.baseDeliveryCharge || '50.00'),
        perKmCharge: parseFloat(deliveryData.perKmCharge || '20.00'),
        minOrderAmount: parseFloat(deliveryData.minOrderAmount || '200.00'),
        standardEnabled: deliveryData.standardEnabled ?? true,
        standardFee: parseFloat(deliveryData.standardFee || '50.00'),
        standardEta: deliveryData.standardEta || '20-40 min',
        priorityEnabled: deliveryData.priorityEnabled ?? true,
        priorityFee: parseFloat(deliveryData.priorityFee || '125.00'),
        priorityEta: deliveryData.priorityEta || '10-20 min',
        maxPriorityOrders: parseInt(deliveryData.maxPriorityOrders || '10')
      });
    }
  }, [deliveryData]);

  const handleSaveShop = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...shopForm,
        taxRate: parseFloat(shopForm.taxRate || '0'),
        estimatedDeliveryMinutes: parseInt(shopForm.estimatedDeliveryMinutes || '30')
      };
      await saveShop(payload);
      addToast({ type: 'success', title: 'Settings Saved', message: 'Restaurant settings updated successfully.' });
      refetchShop();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleSaveDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveDelivery(deliveryForm);
      addToast({ type: 'success', title: 'Delivery Saved', message: 'Delivery matrices updated.' });
      refetchDelivery();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleTogglePayment = async (method: string, enabled: boolean) => {
    try {
      await savePayment({ method, enabled });
      addToast({ type: 'success', title: 'Gateway Updated', message: `${method} channel is now ${enabled ? 'enabled' : 'disabled'}.` });
      refetchPayments();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Failed to Toggle', message: err.message });
    }
  };

  const paymentList = paymentsData?.data || paymentsData || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Configure branch hours, tax rates, delivery calculations, and alert modules.</p>
      </div>

      {/* Tabs */}
      <div className="admin-settings-tabs">
        <button onClick={() => setActiveTab('restaurant')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 8px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'restaurant' ? 'var(--saffron)' : 'var(--text-secondary)', borderBottom: activeTab === 'restaurant' ? '3px solid var(--saffron)' : 'none', cursor: 'pointer' }}>
          <Store size={16} /> Restaurant info
        </button>
        <button onClick={() => setActiveTab('owner')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 8px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'owner' ? 'var(--saffron)' : 'var(--text-secondary)', borderBottom: activeTab === 'owner' ? '3px solid var(--saffron)' : 'none', cursor: 'pointer' }}>
          <Zap size={16} /> Owner Profile & Credentials
        </button>
        <button onClick={() => setActiveTab('delivery')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 8px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'delivery' ? 'var(--saffron)' : 'var(--text-secondary)', borderBottom: activeTab === 'delivery' ? '3px solid var(--saffron)' : 'none', cursor: 'pointer' }}>
          <Truck size={16} /> Delivery Setup
        </button>
        <button onClick={() => setActiveTab('payments')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 8px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'payments' ? 'var(--saffron)' : 'var(--text-secondary)', borderBottom: activeTab === 'payments' ? '3px solid var(--saffron)' : 'none', cursor: 'pointer' }}>
          <DollarSign size={16} /> Payment Gateways
        </button>
        <button onClick={() => setActiveTab('sound')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 8px', border: 'none', background: 'none', fontWeight: 700, fontSize: '0.9rem', color: activeTab === 'sound' ? 'var(--saffron)' : 'var(--text-secondary)', borderBottom: activeTab === 'sound' ? '3px solid var(--saffron)' : 'none', cursor: 'pointer' }}>
          <Bell size={16} /> Sound Alerts
        </button>
      </div>

      {/* Tab bodies */}
      <div className="card admin-settings-card">
        {activeTab === 'owner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Owner Account & Business Identity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="form-label">Owner Full Name</label>
                <input className="form-input" defaultValue="Muhammad Abdullah" />
              </div>
              <div>
                <label className="form-label">Owner Direct Phone</label>
                <input className="form-input" defaultValue="+92 305 4311118" />
              </div>
              <div>
                <label className="form-label">Business Email</label>
                <input className="form-input" type="email" defaultValue="owner@deliveryplatform.com" />
              </div>
              <div>
                <label className="form-label">WhatsApp Hotline</label>
                <input className="form-input" defaultValue="+92 305 4311118" />
              </div>
              <div>
                <label className="form-label">Assigned Branch</label>
                <input className="form-input" value="UCP Main Branch, Johar Town Lahore" disabled />
              </div>
              <div>
                <label className="form-label">Thermal Kitchen Printer</label>
                <input className="form-input" defaultValue="POS-80 Series (USB / Network 192.168.1.200)" />
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => addToast({ type: 'success', title: 'Profile Updated', message: 'Owner profile settings saved.' })}>Save Owner Profile</button>
            </div>
          </div>
        )}
        {activeTab === 'restaurant' && (
          <form onSubmit={handleSaveShop} className="form-grid-2col">
            <div className="col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Restaurant Name</label>
              <input
                type="text" required
                value={shopForm.shopName}
                onChange={(e) => setShopForm(prev => ({ ...prev, shopName: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Contact Number</label>
              <input
                type="text" required
                value={shopForm.contactNumber}
                onChange={(e) => setShopForm(prev => ({ ...prev, contactNumber: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Logo Image URL</label>
              <input
                type="text"
                value={shopForm.logoUrl}
                onChange={(e) => setShopForm(prev => ({ ...prev, logoUrl: e.target.value }))}
                placeholder="https://example.com/logo.png"
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Opening Time (HH:MM)</label>
              <input
                type="text" required placeholder="11:00"
                value={shopForm.openingTime}
                onChange={(e) => setShopForm(prev => ({ ...prev, openingTime: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Closing Time (HH:MM)</label>
              <input
                type="text" required placeholder="23:30"
                value={shopForm.closingTime}
                onChange={(e) => setShopForm(prev => ({ ...prev, closingTime: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>GST Tax Rate (%)</label>
              <input
                type="number" step="0.01" required
                value={shopForm.taxRate}
                onChange={(e) => setShopForm(prev => ({ ...prev, taxRate: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Estimated Delivery Time (minutes)</label>
              <input
                type="number" required
                value={shopForm.estimatedDeliveryMinutes}
                onChange={(e) => setShopForm(prev => ({ ...prev, estimatedDeliveryMinutes: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="col-span-2" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Shop Location Address</label>
              <textarea
                rows={3} required
                value={shopForm.address}
                onChange={(e) => setShopForm(prev => ({ ...prev, address: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
            </div>

            <div className="col-span-2" style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'var(--bg-secondary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border)', marginTop: '8px' }}>
              <input
                type="checkbox" id="accept-orders-chk"
                checked={shopForm.isAcceptingOrders}
                onChange={(e) => setShopForm(prev => ({ ...prev, isAcceptingOrders: e.target.checked }))}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--saffron)' }}
              />
              <label htmlFor="accept-orders-chk" style={{ fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer' }}>
                Open Store (Accepting online mobile app & website customer orders now)
              </label>
            </div>

            <div className="admin-save-btn-container">
              <button type="submit" disabled={shopSaving} className="admin-save-btn">
                {shopSaving ? 'Saving...' : 'Save Restaurant Settings'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'delivery' && (
          <form onSubmit={handleSaveDelivery} className="form-grid-2col">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Branch Latitude</label>
              <input
                type="number" step="0.000001" required
                value={deliveryForm.shopLatitude}
                onChange={(e) => setDeliveryForm(prev => ({ ...prev, shopLatitude: parseFloat(e.target.value) }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Branch Longitude</label>
              <input
                type="number" step="0.000001" required
                value={deliveryForm.shopLongitude}
                onChange={(e) => setDeliveryForm(prev => ({ ...prev, shopLongitude: parseFloat(e.target.value) }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Max Delivery Radius (Km)</label>
              <input
                type="number" step="0.1" required
                value={deliveryForm.maxDeliveryKm}
                onChange={(e) => setDeliveryForm(prev => ({ ...prev, maxDeliveryKm: parseFloat(e.target.value) }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Minimum Order Value (Rs.)</label>
              <input
                type="number" required
                value={deliveryForm.minOrderAmount}
                onChange={(e) => setDeliveryForm(prev => ({ ...prev, minOrderAmount: parseFloat(e.target.value) }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
              />
            </div>

            <div className="col-span-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Standard Delivery Tier</h4>
              <div className="delivery-tier-grid">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox" id="std-del-chk"
                    checked={deliveryForm.standardEnabled}
                    onChange={(e) => setDeliveryForm(prev => ({ ...prev, standardEnabled: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--saffron)' }}
                  />
                  <label htmlFor="std-del-chk" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enable Standard Tier</label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Delivery Charge (Rs.)</label>
                  <input
                    type="number"
                    value={deliveryForm.standardFee}
                    onChange={(e) => setDeliveryForm(prev => ({ ...prev, standardFee: parseFloat(e.target.value) }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Standard ETA Text</label>
                  <input
                    type="text"
                    value={deliveryForm.standardEta}
                    onChange={(e) => setDeliveryForm(prev => ({ ...prev, standardEta: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>

            <div className="col-span-2" style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', marginTop: '8px' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>Priority Delivery Tier (Fast Track)</h4>
              <div className="delivery-tier-grid">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox" id="prio-del-chk"
                    checked={deliveryForm.priorityEnabled}
                    onChange={(e) => setDeliveryForm(prev => ({ ...prev, priorityEnabled: e.target.checked }))}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--saffron)' }}
                  />
                  <label htmlFor="prio-del-chk" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Enable Priority Tier</label>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Priority Charge (Rs.)</label>
                  <input
                    type="number"
                    value={deliveryForm.priorityFee}
                    onChange={(e) => setDeliveryForm(prev => ({ ...prev, priorityFee: parseFloat(e.target.value) }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Priority ETA Text</label>
                  <input
                    type="text"
                    value={deliveryForm.priorityEta}
                    onChange={(e) => setDeliveryForm(prev => ({ ...prev, priorityEta: e.target.value }))}
                    style={{ width: '100%', boxSizing: 'border-box', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>
            </div>

            <div className="admin-save-btn-container">
              <button type="submit" disabled={deliverySaving} className="admin-save-btn">
                {deliverySaving ? 'Saving...' : 'Save Delivery Matrices'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'payments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Enable Online & Offline Payment Gateways</h4>
            {paymentList.map((gateway: any) => (
              <div
                key={gateway.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px', border: '1px solid var(--border)', borderRadius: '10px',
                  background: gateway.enabled ? 'rgba(217,119,6,0.04)' : 'transparent',
                  flexWrap: 'wrap', gap: '16px'
                }}
              >
                <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                  <h5 style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {gateway.method === 'COD' ? 'Cash On Delivery (COD)' : gateway.method}
                  </h5>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {gateway.method === 'COD' ? 'Accept physical cash payment upon rider handoff.' : `Integrate ${gateway.method} instant digital checkout.`}
                  </p>
                </div>
                <button
                  onClick={() => handleTogglePayment(gateway.method, !gateway.enabled)}
                  className="btn"
                  style={{
                    background: gateway.enabled ? 'var(--saffron)' : 'rgba(107,114,128,0.1)',
                    color: gateway.enabled ? '#fff' : 'var(--text-secondary)',
                    padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  {gateway.enabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'sound' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div>
                <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>Sound Alerts preferences</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Specify notifications sound looping preferences for real-time customer orders.</p>
              </div>
              <div style={{ fontSize: '1.25rem' }}>
                {soundSettings.sounds.newOrder || soundSettings.sounds.paymentSuccess || soundSettings.sounds.paymentFailed ? <Volume2 size={24} color="var(--saffron)" /> : <VolumeX size={24} color="var(--text-muted)" />}
              </div>
            </div>

            <SoundRow
              label="New Incoming Orders Alert"
              description="Looped audio play when customer submits an order. Loop repeats until dispatcher accepts or rejects."
              priority="critical"
              enabled={soundSettings.sounds.newOrder}
              onToggle={() => updateSound('newOrder')}
              onTest={() => handleTestSound('newOrder')}
            />
            <SoundRow
              label="Payment Checkout Success"
              description="Play sound notification once when a customer payment finishes successfully."
              priority="success"
              enabled={soundSettings.sounds.paymentSuccess}
              onToggle={() => updateSound('paymentSuccess')}
              onTest={() => handleTestSound('paymentSuccess')}
            />
            <SoundRow
              label="Payment Transaction Failed"
              description="Notification play once when a customer checkout payment fails or gets declined."
              priority="warning"
              enabled={soundSettings.sounds.paymentFailed}
              onToggle={() => updateSound('paymentFailed')}
              onTest={() => handleTestSound('paymentFailed')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
