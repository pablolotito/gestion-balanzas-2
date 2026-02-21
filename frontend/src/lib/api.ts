import { AlertConfigResponse, Branch, BranchComparison, LoginResponse, Reading } from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `Request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  return parseJson<LoginResponse>(response);
}

export async function fetchBranches(token: string): Promise<Branch[]> {
  const response = await fetch(`${API_BASE}/branches`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  return parseJson<Branch[]>(response);
}

export async function fetchReadings(
  token: string,
  params: {
    branchId: string;
    from: string;
    to: string;
    limit?: number;
  },
): Promise<Reading[]> {
  const qs = new URLSearchParams({
    branchId: params.branchId,
    from: params.from,
    to: params.to,
  });

  if (params.limit) {
    qs.set('limit', String(params.limit));
  }

  const response = await fetch(`${API_BASE}/readings?${qs.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  return parseJson<Reading[]>(response);
}

export async function fetchBranchComparison(
  token: string,
  params: { from: string; to: string },
): Promise<BranchComparison[]> {
  const qs = new URLSearchParams({
    from: params.from,
    to: params.to,
  });

  const response = await fetch(`${API_BASE}/readings/comparison?${qs.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  return parseJson<BranchComparison[]>(response);
}

export async function fetchAlertConfig(
  token: string,
  branchId: string,
): Promise<AlertConfigResponse> {
  const qs = new URLSearchParams({ branchId });
  const response = await fetch(`${API_BASE}/alerts/config?${qs.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  return parseJson<AlertConfigResponse>(response);
}

export async function updateBranchAlertConfig(
  token: string,
  branchId: string,
  config: { minWeight: number; maxWeight: number; staleAfterMinutes: number },
): Promise<void> {
  const response = await fetch(`${API_BASE}/alerts/config/branch/${branchId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  await parseJson(response);
}

export async function updateScaleAlertConfig(
  token: string,
  scaleId: string,
  config: {
    minWeight?: number;
    maxWeight?: number;
    staleAfterMinutes?: number;
  },
): Promise<void> {
  const response = await fetch(`${API_BASE}/alerts/config/scale/${scaleId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
  });

  await parseJson(response);
}
