'use client';

import { Reading } from '@/lib/types';

interface ReadingsTableProps {
  readings: Reading[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-AR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export function ReadingsTable({ readings }: ReadingsTableProps) {
  if (!readings.length) {
    return <p className="empty">No hay lecturas en el rango seleccionado.</p>;
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Fecha y hora</th>
            <th>Balanza</th>
            <th>Peso (kg)</th>
            <th>Bateria</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {readings.map((reading) => (
            <tr key={reading.id}>
              <td>{formatDate(reading.recordedAt)}</td>
              <td>{reading.scale.label}</td>
              <td>{reading.weight.toFixed(2)}</td>
              <td>{reading.battery != null ? `${reading.battery.toFixed(1)}%` : '-'}</td>
              <td>{reading.status ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
