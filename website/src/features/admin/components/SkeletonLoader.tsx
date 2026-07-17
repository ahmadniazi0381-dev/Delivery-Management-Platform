import React from 'react';

const shimmer = `
@keyframes shimmer {
  0% { background-position: -1000px 0; }
  100% { background-position: 1000px 0; }
}
.skeleton {
  background: linear-gradient(90deg, var(--bg-secondary) 25%, var(--border) 50%, var(--bg-secondary) 75%);
  background-size: 1000px 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6px;
}
`;

function SkeletonBlock({ w = '100%', h = '16px', radius = '6px', style = {} }: { w?: string; h?: string; radius?: string; style?: React.CSSProperties }) {
  return (
    <>
      <style>{shimmer}</style>
      <div className="skeleton" style={{ width: w, height: h, borderRadius: radius, flexShrink: 0, ...style }} />
    </>
  );
}

export function SkeletonStat() {
  return (
    <div className="card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <SkeletonBlock w="100px" h="12px" />
        <SkeletonBlock w="60px" h="28px" />
      </div>
      <SkeletonBlock w="48px" h="48px" radius="12px" />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: '12px', padding: '14px 16px', alignItems: 'center' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <SkeletonBlock key={i} h="14px" w={i === 0 ? '70%' : '60%'} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          <SkeletonRow cols={cols} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ h = '200px' }: { h?: string }) {
  return <SkeletonBlock h={h} radius="12px" />;
}
