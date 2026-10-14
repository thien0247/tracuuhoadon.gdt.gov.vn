// @id 01M4V0HMP0BNNZ0SW67AWG4GN2
// @related 01M4V0FH0TF34QKKRRBVF9H0XA, 01M4V0FH09ZYMQSQX56X4G0SWZ, 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * frontend/src/types/service.ts
 * Type definitions cho cơ chế điều khiển dịch vụ và WebView2 Native Bridge.
 */

export interface ManagedService {
  id: string;
  name: string;
  description: string;
  port: number;
  status: 'running' | 'stopped' | 'starting' | 'error' | 'online' | 'offline' | 'connected' | 'disconnected';
  statusText?: string;
  pid?: number | null;
  url?: string;
  isOptional?: boolean;
  supportedActions?: string[];
  parameters?: Array<{
    key: string;
    label: string;
    type: 'select' | 'number' | 'boolean' | 'string';
    defaultValue: unknown;
    description: string;
    options?: Array<{ label: string; value: string | number | boolean }>;
    min?: number;
    max?: number;
    step?: number;
  }>;
}

export interface ServiceLogMessage {
  id: string;
  timestamp: string;
  service: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success';
}

export interface BridgeIncomingMessage {
  type: 'STATUS_UPDATE' | 'LOG' | 'LOG_HISTORY' | 'INIT' | 'SERVICE_RELOADED';
  services?: ManagedService[];
  serviceId?: string;
  log?: ServiceLogMessage;
  logs?: ServiceLogMessage[];
}

export interface BridgeOutgoingMessage {
  action: 'INIT' | 'GET_STATUS' | 'GET_LOGS' | 'START_SERVICE' | 'STOP_SERVICE' | 'RESTART_SERVICE' | 'START_ALL' | 'STOP_ALL' | 'CLEAR_LOGS' | 'OPEN_URL' | 'RELOAD_PAGE';
  serviceId?: string;
  url?: string;
}

export interface DiagnosticItem {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  latencyMs?: number;
  details?: Record<string, unknown>;
}

export interface SystemDiagnosticsResponse {
  healthy: boolean;
  systemTime: string;
  uptimeSeconds: number;
  memoryUsageMb: number;
  diagnostics: DiagnosticItem[];
}
