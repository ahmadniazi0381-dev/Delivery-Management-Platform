import React from 'react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string; dot?: string }> = {
  // Order statuses
  PENDING:          { color: '#92400E', bg: 'rgba(245,158,11,0.15)', label: 'Pending', dot: '#F59E0B' },
  ACCEPTED:         { color: '#1D4ED8', bg: 'rgba(59,130,246,0.12)', label: 'Accepted', dot: '#3B82F6' },
  PREPARING:        { color: '#7C3AED', bg: 'rgba(139,92,246,0.12)', label: 'Preparing', dot: '#8B5CF6' },
  READY:            { color: '#065F46', bg: 'rgba(16,185,129,0.12)', label: 'Ready', dot: '#10B981' },
  OUT_FOR_DELIVERY: { color: '#D97706', bg: 'rgba(217,119,6,0.12)', label: 'Out for Delivery', dot: '#D97706' },
  DELIVERED:        { color: '#065F46', bg: 'rgba(16,185,129,0.15)', label: 'Delivered', dot: '#10B981' },
  CANCELLED:        { color: '#991B1B', bg: 'rgba(239,68,68,0.12)', label: 'Cancelled', dot: '#EF4444' },
  REJECTED:         { color: '#991B1B', bg: 'rgba(239,68,68,0.12)', label: 'Rejected', dot: '#EF4444' },
  // Rider statuses
  ACTIVE:           { color: '#065F46', bg: 'rgba(16,185,129,0.15)', label: 'Active', dot: '#10B981' },
  INACTIVE:         { color: '#6B7280', bg: 'rgba(107,114,128,0.12)', label: 'Inactive', dot: '#9CA3AF' },
  SUSPENDED:        { color: '#991B1B', bg: 'rgba(239,68,68,0.12)', label: 'Suspended', dot: '#EF4444' },
  ON_BREAK:         { color: '#92400E', bg: 'rgba(245,158,11,0.15)', label: 'On Break', dot: '#F59E0B' },
  // User statuses
  BLOCKED:          { color: '#991B1B', bg: 'rgba(239,68,68,0.12)', label: 'Blocked', dot: '#EF4444' },
  VERIFIED:         { color: '#065F46', bg: 'rgba(16,185,129,0.15)', label: 'Verified', dot: '#10B981' },
  // Payment
  COMPLETED:        { color: '#065F46', bg: 'rgba(16,185,129,0.15)', label: 'Completed', dot: '#10B981' },
  FAILED:           { color: '#991B1B', bg: 'rgba(239,68,68,0.12)', label: 'Failed', dot: '#EF4444' },
  REFUNDED:         { color: '#7C3AED', bg: 'rgba(139,92,246,0.12)', label: 'Refunded', dot: '#8B5CF6' },
};

interface StatusBadgeProps {
  status: string;
  dot?: boolean;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, dot = false, size = 'md' }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] || { color: '#6B7280', bg: 'rgba(107,114,128,0.12)', label: status.replace(/_/g, ' '), dot: '#9CA3AF' };
  const fontSize = size === 'sm' ? '0.7rem' : '0.75rem';
  const padding = size === 'sm' ? '2px 6px' : '3px 8px';

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize, fontWeight: 700, color: cfg.color,
      background: cfg.bg, padding, borderRadius: '20px',
      textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap',
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0, display: 'inline-block' }} />}
      {cfg.label}
    </span>
  );
}
