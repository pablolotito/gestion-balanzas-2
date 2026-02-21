'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  fetchAlertConfig,
  fetchBranchComparison,
  fetchBranches,
  fetchReadings,
  updateBranchAlertConfig,
  updateScaleAlertConfig,
} from '@/lib/api';
import { clearSession, getStoredUser, getToken } from '@/lib/session';
import { AlertConfigResponse, Branch, BranchComparison, Reading, SessionUser } from '@/lib/types';
import { ReadingStats } from '@/components/reading-stats';
import { ReadingsTable } from '@/components/readings-table';
import { TrendChart } from '@/components/trend-chart';
import { AlertsPanel } from '@/components/alerts-panel';
import { AlertConfigForm } from '@/components/alert-config-form';
import { BranchComparisonChart } from '@/components/branch-comparison-chart';

function getDefaultRange() {
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [readings, setReadings] = useState<Reading[]>([]);
  const [alertConfig, setAlertConfig] = useState<AlertConfigResponse | null>(null);
  const [comparison, setComparison] = useState<BranchComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState(getDefaultRange());
  const [trendMode, setTrendMode] = useState<'hour' | 'day'>('hour');

  useEffect(() => {
    const storedToken = getToken();
    const storedUser = getStoredUser() as SessionUser | null;

    if (!storedToken || !storedUser) {
      router.replace('/login');
      return;
    }

    setToken(storedToken);
    setUser(storedUser);
  }, [router]);

  useEffect(() => {
    async function loadBranches() {
      if (!token || !user) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchBranches(token);
        setBranches(data);

        if (!data.length) {
          setSelectedBranchId('');
          setReadings([]);
          return;
        }

        const initialBranchId =
          user.role === 'BRANCH_MANAGER'
            ? data.find((branch) => user.branchIds.includes(branch.id))?.id || data[0].id
            : data[0].id;

        setSelectedBranchId(initialBranchId);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar sucursales');
      } finally {
        setLoading(false);
      }
    }

    loadBranches();
  }, [token, user]);

  useEffect(() => {
    async function loadReadings() {
      if (!token || !selectedBranchId) {
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const data = await fetchReadings(token, {
          branchId: selectedBranchId,
          from: range.from,
          to: range.to,
          limit: 200,
        });
        setReadings(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudieron cargar lecturas');
      } finally {
        setLoading(false);
      }
    }

    loadReadings();
  }, [token, selectedBranchId, range.from, range.to]);

  useEffect(() => {
    async function loadAlertConfig() {
      if (!token || !selectedBranchId) {
        return;
      }

      try {
        const data = await fetchAlertConfig(token, selectedBranchId);
        setAlertConfig(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar la configuracion de alertas');
      }
    }

    loadAlertConfig();
  }, [token, selectedBranchId]);

  useEffect(() => {
    async function loadComparison() {
      if (!token || !user || user.role !== 'GLOBAL_MANAGER') {
        return;
      }

      try {
        const data = await fetchBranchComparison(token, {
          from: range.from,
          to: range.to,
        });
        setComparison(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'No se pudo cargar comparativa');
      }
    }

    loadComparison();
  }, [token, user, range.from, range.to]);

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedBranchId),
    [branches, selectedBranchId],
  );

  async function handleSaveBranchConfig(payload: {
    minWeight: number;
    maxWeight: number;
    staleAfterMinutes: number;
  }) {
    if (!token || !selectedBranchId) return;
    await updateBranchAlertConfig(token, selectedBranchId, payload);
    const fresh = await fetchAlertConfig(token, selectedBranchId);
    setAlertConfig(fresh);
  }

  async function handleSaveScaleConfig(
    scaleId: string,
    payload: { minWeight?: number; maxWeight?: number; staleAfterMinutes?: number },
  ) {
    if (!token || !selectedBranchId) return;
    await updateScaleAlertConfig(token, scaleId, payload);
    const fresh = await fetchAlertConfig(token, selectedBranchId);
    setAlertConfig(fresh);
  }

  function logout() {
    clearSession();
    router.replace('/login');
  }

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Scale Management</h1>
          <p>
            {user?.name} ({user?.role})
          </p>
        </div>
        <button onClick={logout}>Cerrar sesion</button>
      </header>

      <section className="panel controls">
        <div>
          <label htmlFor="branch">Sucursal</label>
          <select
            id="branch"
            value={selectedBranchId}
            onChange={(event) => setSelectedBranchId(event.target.value)}
            disabled={user?.role === 'BRANCH_MANAGER'}
          >
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="from">Desde</label>
          <input
            id="from"
            type="datetime-local"
            value={range.from.slice(0, 16)}
            onChange={(event) =>
              setRange((prev) => ({
                ...prev,
                from: new Date(event.target.value).toISOString(),
              }))
            }
          />
        </div>

        <div>
          <label htmlFor="to">Hasta</label>
          <input
            id="to"
            type="datetime-local"
            value={range.to.slice(0, 16)}
            onChange={(event) =>
              setRange((prev) => ({
                ...prev,
                to: new Date(event.target.value).toISOString(),
              }))
            }
          />
        </div>
      </section>

      {selectedBranch ? (
        <section className="panel">
          <h2>{selectedBranch.name}</h2>
          <p>Codigo: {selectedBranch.code}</p>
        </section>
      ) : null}

      {error ? <p className="error panel">{error}</p> : null}
      {loading ? <p className="panel">Cargando...</p> : null}

      {user?.role === 'GLOBAL_MANAGER' ? (
        <section className="panel">
          <BranchComparisonChart data={comparison} />
        </section>
      ) : null}

      <section className="panel">
        <ReadingStats readings={readings} />
      </section>

      <section className="panel controls">
        <div>
          <label htmlFor="trend-mode">Agrupacion</label>
          <select
            id="trend-mode"
            value={trendMode}
            onChange={(event) => setTrendMode(event.target.value as 'hour' | 'day')}
          >
            <option value="hour">Por hora</option>
            <option value="day">Por dia</option>
          </select>
        </div>
      </section>

      <section className="panel">
        <TrendChart readings={readings} mode={trendMode} />
      </section>

      <section className="panel">
        <AlertsPanel readings={readings} alertConfig={alertConfig} />
      </section>

      <section className="panel">
        <AlertConfigForm
          config={alertConfig}
          onSaveBranch={handleSaveBranchConfig}
          onSaveScale={handleSaveScaleConfig}
        />
      </section>

      <section className="panel">
        <h2>Lecturas recientes</h2>
        <ReadingsTable readings={readings} />
      </section>
    </main>
  );
}
