'use client';

import { Reading } from '@/lib/types';

interface ReadingStatsProps {
  readings: Reading[];
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

export function ReadingStats({ readings }: ReadingStatsProps) {
  const weights = readings.map((reading) => reading.weight);
  const avg = average(weights);
  const max = weights.length ? Math.max(...weights) : 0;
  const min = weights.length ? Math.min(...weights) : 0;

  return (
    <section className="stats-grid">
      <article className="stat-card">
        <h3>Registros</h3>
        <strong>{readings.length}</strong>
      </article>
      <article className="stat-card">
        <h3>Promedio</h3>
        <strong>{avg.toFixed(2)} kg</strong>
      </article>
      <article className="stat-card">
        <h3>Maximo</h3>
        <strong>{max.toFixed(2)} kg</strong>
      </article>
      <article className="stat-card">
        <h3>Minimo</h3>
        <strong>{min.toFixed(2)} kg</strong>
      </article>
    </section>
  );
}
