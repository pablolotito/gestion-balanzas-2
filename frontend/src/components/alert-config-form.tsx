'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AlertConfigResponse } from '@/lib/types';

interface AlertConfigFormProps {
  config: AlertConfigResponse | null;
  onSaveBranch: (payload: { minWeight: number; maxWeight: number; staleAfterMinutes: number }) => Promise<void>;
  onSaveScale: (
    scaleId: string,
    payload: { minWeight?: number; maxWeight?: number; staleAfterMinutes?: number },
  ) => Promise<void>;
}

export function AlertConfigForm({ config, onSaveBranch, onSaveScale }: AlertConfigFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedScaleId, setSelectedScaleId] = useState<string>('');
  const [scaleMin, setScaleMin] = useState<string>('');
  const [scaleMax, setScaleMax] = useState<string>('');
  const [scaleStale, setScaleStale] = useState<string>('');

  const branchDefaults = config?.branchConfig;

  const selectedScale = useMemo(
    () => config?.scaleConfigs.find((item) => item.scale.id === selectedScaleId),
    [config, selectedScaleId],
  );

  useEffect(() => {
    setSelectedScaleId('');
    setScaleMin('');
    setScaleMax('');
    setScaleStale('');
  }, [config?.branch.id]);

  if (!config || !branchDefaults) {
    return <p className="empty">No hay configuracion de alertas para mostrar.</p>;
  }

  async function submitBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      minWeight: Number(formData.get('branchMin')),
      maxWeight: Number(formData.get('branchMax')),
      staleAfterMinutes: Number(formData.get('branchStale')),
    };

    setSaving(true);
    setMessage(null);
    try {
      await onSaveBranch(payload);
      setMessage('Configuracion de sucursal guardada.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar configuracion de sucursal.');
    } finally {
      setSaving(false);
    }
  }

  async function submitScale(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedScaleId) return;

    setSaving(true);
    setMessage(null);
    try {
      await onSaveScale(selectedScaleId, {
        minWeight: scaleMin === '' ? undefined : Number(scaleMin),
        maxWeight: scaleMax === '' ? undefined : Number(scaleMax),
        staleAfterMinutes: scaleStale === '' ? undefined : Number(scaleStale),
      });
      setMessage('Override de balanza guardado.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar override.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="alert-config">
      <h2>Configuracion de alertas</h2>
      <p>Default de sucursal y override opcional por balanza.</p>

      <form
        key={`${config.branch.id}-${branchDefaults.minWeight}-${branchDefaults.maxWeight}-${branchDefaults.staleAfterMinutes}`}
        className="config-form"
        onSubmit={submitBranch}
      >
        <h3>Default sucursal</h3>
        <label>
          Minimo (kg)
          <input name="branchMin" type="number" step="0.1" defaultValue={branchDefaults.minWeight} required />
        </label>
        <label>
          Maximo (kg)
          <input name="branchMax" type="number" step="0.1" defaultValue={branchDefaults.maxWeight} required />
        </label>
        <label>
          Sin reporte (min)
          <input name="branchStale" type="number" step="1" defaultValue={branchDefaults.staleAfterMinutes} required />
        </label>
        <button type="submit" disabled={saving}>Guardar sucursal</button>
      </form>

      <form className="config-form" onSubmit={submitScale}>
        <h3>Override por balanza</h3>
        <label>
          Balanza
          <select
            value={selectedScaleId}
            onChange={(event) => {
              const value = event.target.value;
              setSelectedScaleId(value);
              const item = config.scaleConfigs.find((scale) => scale.scale.id === value);
              setScaleMin(item?.config?.minWeight != null ? String(item.config.minWeight) : '');
              setScaleMax(item?.config?.maxWeight != null ? String(item.config.maxWeight) : '');
              setScaleStale(
                item?.config?.staleAfterMinutes != null ? String(item.config.staleAfterMinutes) : '',
              );
            }}
          >
            <option value="">Seleccionar...</option>
            {config.scaleConfigs.map((item) => (
              <option key={item.scale.id} value={item.scale.id}>
                {item.scale.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Minimo (kg)
          <input type="number" step="0.1" value={scaleMin} onChange={(e) => setScaleMin(e.target.value)} />
        </label>
        <label>
          Maximo (kg)
          <input type="number" step="0.1" value={scaleMax} onChange={(e) => setScaleMax(e.target.value)} />
        </label>
        <label>
          Sin reporte (min)
          <input type="number" step="1" value={scaleStale} onChange={(e) => setScaleStale(e.target.value)} />
        </label>

        <button type="submit" disabled={saving || !selectedScaleId}>Guardar override</button>
      </form>

      {selectedScale ? (
        <p>
          Actual:{' '}
          {selectedScale.config
            ? `min ${selectedScale.config.minWeight ?? '-'} / max ${selectedScale.config.maxWeight ?? '-'} / sin reporte ${selectedScale.config.staleAfterMinutes ?? '-'} min`
            : 'sin override'}
        </p>
      ) : null}

      {message ? <p>{message}</p> : null}
    </section>
  );
}
