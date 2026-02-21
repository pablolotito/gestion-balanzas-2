export type UserRole = 'GLOBAL_MANAGER' | 'BRANCH_MANAGER';

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
  name: string;
  branchIds: string[];
}

export interface LoginResponse {
  accessToken: string;
  user: SessionUser;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
}

export interface Reading {
  id: string;
  branchId: string;
  recordedAt: string;
  weight: number;
  battery?: number | null;
  status?: string | null;
  scale: {
    id: string;
    deviceId: string;
    label: string;
  };
}

export interface BranchAlertConfig {
  branchId: string;
  minWeight: number;
  maxWeight: number;
  staleAfterMinutes: number;
}

export interface ScaleConfigItem {
  scale: {
    id: string;
    deviceId: string;
    label: string;
  };
  config: {
    scaleId: string;
    minWeight?: number | null;
    maxWeight?: number | null;
    staleAfterMinutes?: number | null;
  } | null;
}

export interface AlertConfigResponse {
  branch: {
    id: string;
    code: string;
    name: string;
  };
  branchConfig: BranchAlertConfig;
  scaleConfigs: ScaleConfigItem[];
}

export interface BranchComparison {
  branchId: string;
  branchCode: string;
  branchName: string;
  averageWeight: number;
  readingsCount: number;
  latestRecordedAt: string | null;
}
