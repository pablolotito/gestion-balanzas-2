'use client';

import { Reading } from '@/lib/types';
import { AlertConfigResponse } from '@/lib/types';

interface AlertsPanelProps {
  readings: Reading[];
  alertConfig: AlertConfigResponse | null;
}

function minutesSince(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
}

export function AlertsPanel({ readings, alertConfig }: AlertsPanelProps) {
  const defaultConfig = alertConfig?.branchConfig ?? {
    minWeight: 0.2,
    maxWeight: 25,
    staleAfterMinutes: 30,
  };

  const byScale = new Map(
    (alertConfig?.scaleConfigs ?? []).map((item) => [item.scale.id, item.config]),
  );

  if (!readings.length) {
    return (
      <section className="alerts-panel empty-alerts">
        <h2>Alertas</h2>
        <p>Sin datos en el rango seleccionado.</p>
      </section>
    );
  }

  const ordered = [...readings].sort(
    (a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime(),
  );

  const latest = ordered[0];
  const staleMinutes = minutesSince(latest.recordedAt);
  const latestScaleConfig = byScale.get(latest.scale.id);
  const staleLimit = latestScaleConfig?.staleAfterMinutes ?? defaultConfig.staleAfterMinutes;
  const staleAlert = staleMinutes > staleLimit;

  const outOfRange = ordered.filter((reading) => {
    const scaleConfig = byScale.get(reading.scale.id);
    const minWeight = scaleConfig?.minWeight ?? defaultConfig.minWeight;
    const maxWeight = scaleConfig?.maxWeight ?? defaultConfig.maxWeight;
    return reading.weight < minWeight || reading.weight > maxWeight;
  });

  return (
    <section className="alerts-panel">
      <h2>Alertas</h2>
      <div className="alerts-list">
        <article className={`alert-item ${staleAlert ? 'alert-critical' : 'alert-ok'}`}>
          <h3>Estado de reporte</h3>
          <p>
            {staleAlert
              ? `Sin reporte reciente. Ultima lectura hace ${staleMinutes} min (limite ${staleLimit} min).`
              : `OK. Ultima lectura hace ${staleMinutes} min (limite ${staleLimit} min).`}
          </p>
        </article>

        <article className={`alert-item ${outOfRange.length ? 'alert-warning' : 'alert-ok'}`}>
          <h3>Pesos fuera de rango</h3>
          <p>
            {outOfRange.length
              ? `${outOfRange.length} lectura(s) fuera de rango configurado.`
              : 'Sin lecturas fuera de rango configurado.'}
          </p>
        </article>
      </div>
    </section>
  );
}
