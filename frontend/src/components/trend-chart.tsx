'use client';

import { Reading } from '@/lib/types';

type GroupMode = 'hour' | 'day';

interface TrendChartProps {
  readings: Reading[];
  mode: GroupMode;
}

interface Point {
  label: string;
  value: number;
}

function keyFromDate(date: Date, mode: GroupMode): string {
  if (mode === 'day') {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
}

function labelFromDate(date: Date, mode: GroupMode): string {
  if (mode === 'day') {
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
  }

  return date.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', hour: '2-digit' });
}

function aggregate(readings: Reading[], mode: GroupMode): Point[] {
  const buckets = new Map<string, { sum: number; count: number; ts: number; label: string }>();

  for (const reading of readings) {
    const date = new Date(reading.recordedAt);
    const key = keyFromDate(date, mode);
    const current = buckets.get(key);

    if (!current) {
      buckets.set(key, {
        sum: reading.weight,
        count: 1,
        ts: date.getTime(),
        label: labelFromDate(date, mode),
      });
      continue;
    }

    current.sum += reading.weight;
    current.count += 1;
    if (date.getTime() > current.ts) {
      current.ts = date.getTime();
      current.label = labelFromDate(date, mode);
    }
  }

  return [...buckets.values()]
    .sort((a, b) => a.ts - b.ts)
    .map((bucket) => ({ label: bucket.label, value: bucket.sum / bucket.count }));
}

function buildPath(values: number[], width: number, height: number): string {
  if (values.length === 1) {
    return `M 0 ${height / 2} L ${width} ${height / 2}`;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(0.0001, max - min);

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function TrendChart({ readings, mode }: TrendChartProps) {
  const points = aggregate(readings, mode);

  if (!points.length) {
    return <p className="empty">Sin datos para graficar.</p>;
  }

  const values = points.map((point) => point.value);
  const path = buildPath(values, 720, 220);
  const latest = points[points.length - 1];

  return (
    <section className="trend-chart">
      <div className="chart-header">
        <h2>Tendencia de peso ({mode === 'hour' ? 'por hora' : 'por dia'})</h2>
        <p>
          Ultimo promedio: {latest.value.toFixed(2)} kg ({latest.label})
        </p>
      </div>

      <svg viewBox="0 0 720 220" role="img" aria-label="Grafico de tendencia de peso">
        <path d={path} className="trend-line" />
      </svg>

      <div className="chart-scale">
        <span>{points[0].label}</span>
        <span>{latest.label}</span>
      </div>
    </section>
  );
}
