"use client";
import React, { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { SkeletonTable } from './SkeletonLoader';

export interface Column<T = any> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

interface AdminTableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  keyField?: string;
  emptyMessage?: string;
  emptyIcon?: string;
  selectable?: boolean;
  selectedKeys?: Set<string>;
  onSelectionChange?: (keys: Set<string>) => void;
  pageSize?: number;
  totalCount?: number;
  page?: number;
  onPageChange?: (page: number) => void;
  onSort?: (key: string, dir: 'asc' | 'desc') => void;
  sortKey?: string;
  sortDir?: 'asc' | 'desc';
  stickyHeader?: boolean;
}

export function AdminTable<T extends Record<string, any>>({
  columns, data, loading = false, keyField = 'id',
  emptyMessage = 'No records found', emptyIcon = '📋',
  selectable = false, selectedKeys = new Set(), onSelectionChange,
  pageSize = 20, totalCount, page = 1, onPageChange,
  onSort, sortKey, sortDir, stickyHeader = true,
}: AdminTableProps<T>) {
  const [internalSort, setInternalSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);

  const effectiveSortKey = sortKey || internalSort?.key;
  const effectiveSortDir = sortDir || internalSort?.dir;

  const displayData = useMemo(() => {
    if (onSort || !internalSort) return data;
    return [...data].sort((a, b) => {
      const va = a[internalSort.key];
      const vb = b[internalSort.key];
      const cmp = String(va ?? '').localeCompare(String(vb ?? ''), undefined, { numeric: true });
      return internalSort.dir === 'asc' ? cmp : -cmp;
    });
  }, [data, internalSort, onSort]);

  const handleSort = (key: string) => {
    const newDir = effectiveSortKey === key && effectiveSortDir === 'asc' ? 'desc' : 'asc';
    if (onSort) { onSort(key, newDir); }
    else { setInternalSort({ key, dir: newDir }); }
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    if (selectedKeys.size === data.length) { onSelectionChange(new Set()); }
    else { onSelectionChange(new Set(data.map(r => r[keyField]))); }
  };

  const handleSelectRow = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedKeys);
    next.has(id) ? next.delete(id) : next.add(id);
    onSelectionChange(next);
  };

  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;
  const allSelected = data.length > 0 && selectedKeys.size === data.length;

  return (
    <div style={{ borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-card)' }}>
      {/* Table */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', width: '100%' }}>
        <table style={{ width: '100%', minWidth: `${Math.max(540, columns.length * 110)}px`, borderCollapse: 'collapse' }}>
          <thead style={{ background: 'var(--bg-secondary)', position: stickyHeader ? 'sticky' : undefined, top: stickyHeader ? 0 : undefined, zIndex: 5 }}>
            <tr>
              {selectable && (
                <th style={{ width: '44px', padding: '12px 16px', textAlign: 'center' }}>
                  <input type="checkbox" checked={allSelected} onChange={handleSelectAll} style={{ cursor: 'pointer', accentColor: 'var(--saffron)' }} />
                </th>
              )}
              {columns.map(col => (
                <th
                  key={col.key}
                  onClick={() => col.sortable && handleSort(col.key)}
                  style={{
                    padding: '12px 16px', textAlign: 'left',
                    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    cursor: col.sortable ? 'pointer' : 'default',
                    width: col.width, whiteSpace: 'nowrap',
                    userSelect: 'none',
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    {col.label}
                    {col.sortable && (
                      <span style={{ color: effectiveSortKey === col.key ? 'var(--saffron)' : 'var(--text-muted)', opacity: 0.7 }}>
                        {effectiveSortKey === col.key
                          ? effectiveSortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />
                          : <ChevronsUpDown size={13} />}
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0)} style={{ padding: 0 }}>
                <SkeletonTable rows={5} cols={columns.length + (selectable ? 1 : 0)} />
              </td></tr>
            ) : displayData.length === 0 ? (
              <tr><td colSpan={columns.length + (selectable ? 1 : 0)} style={{ padding: '60px 20px', textAlign: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '2.5rem' }}>{emptyIcon}</span>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>{emptyMessage}</p>
                </div>
              </td></tr>
            ) : (
              displayData.map((row, idx) => {
                const rowKey = row[keyField];
                const selected = selectedKeys.has(rowKey);
                return (
                  <tr
                    key={rowKey || idx}
                    style={{
                      borderTop: '1px solid var(--border)',
                      background: selected ? 'rgba(217,119,6,0.05)' : idx % 2 === 1 ? 'var(--bg-secondary)' : undefined,
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(217,119,6,0.04)')}
                    onMouseLeave={e => (e.currentTarget.style.background = selected ? 'rgba(217,119,6,0.05)' : idx % 2 === 1 ? 'var(--bg-secondary)' : '')}
                  >
                    {selectable && (
                      <td style={{ padding: '12px 16px', textAlign: 'center', width: '44px' }}>
                        <input type="checkbox" checked={selected} onChange={() => handleSelectRow(rowKey)} style={{ cursor: 'pointer', accentColor: 'var(--saffron)' }} />
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col.key} style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-primary)', verticalAlign: 'middle' }}>
                        {col.render ? col.render(row) : (row[col.key] ?? '—')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', background: 'var(--bg-secondary)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Page {page} of {totalPages}{totalCount ? ` — ${totalCount} total` : ''}
          </span>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              if (p > totalPages) return null;
              return (
                <button key={p} onClick={() => onPageChange(p)} className="btn" style={{ padding: '4px 10px', fontSize: '0.8rem', background: p === page ? 'var(--saffron)' : 'none', color: p === page ? '#fff' : 'var(--text-secondary)' }}>{p}</button>
              );
            })}
            <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn btn-secondary" style={{ padding: '6px 10px', fontSize: '0.8rem' }}>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
