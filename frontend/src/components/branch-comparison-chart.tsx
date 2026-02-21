'use client';

import { BranchComparison } from '@/lib/types';

interface BranchComparisonChartProps {
  data: BranchComparison[];
}

export function BranchComparisonChart({ data }: BranchComparisonChartProps) {
  if (!data.length) {
    return <p className="empty">No hay lecturas para comparar sucursales en este rango.</p>;
  }

  const max = Math.max(...data.map((item) => item.averageWeight));

  return (
    <section className="comparison-chart">
      <h2>Comparativa entre sucursales</h2>
      <div className="comparison-list">
        {data.map((item) => {
          const width = max > 0 ? (item.averageWeight / max) * 100 : 0;
          return (
            <article key={item.branchId} className="comparison-item">
              <header>
                <strong>{item.branchName}</strong>
                <span>{item.averageWeight.toFixed(2)} kg</span>
              </header>
              <div className="comparison-bar-bg">
                <div className="comparison-bar" style={{ width: `${width}%` }} />
              </div>
              <p>
                {item.readingsCount} lecturas | Ultima:{' '}
                {item.latestRecordedAt
                  ? new Date(item.latestRecordedAt).toLocaleString('es-AR')
                  : '-'}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
