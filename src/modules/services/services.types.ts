// @id 01M4V0HMM2C5JTH5BMNH4HARSY
// @related 01M4V0FH069WB44ZWJCRPYR4FA, 01M4V0FGZN8KJG6YHQM6560EK1
/**
 * src/modules/services/services.types.ts
 * Kiểu dữ liệu và interfaces cho module quản trị và điều khiển dịch vụ hệ thống.
 */

export type ServiceStatus = 'running' | 'stopped' | 'online' | 'offline' | 'error' | 'connected' | 'disconnected' | 'starting';

export type ServiceCategory = 'windows_service' | 'web_api' | 'ai_worker' | 'database' | 'scheduler' | 'background_worker';

export type ServiceAction = 'start' | 'stop' | 'restart' | 'reset' | 'test_connection' | 'trigger';

export interface ServiceParameterOption {
  label: string;
  value: string | number | boolean;
}

export interface ServiceParameterDef {
  key: string;
  label: string;
  type: 'select' | 'number' | 'boolean' | 'string';
  defaultValue: unknown;
  description: string;
  options?: ServiceParameterOption[];
  min?: number;
  max?: number;
  step?: number;
}

export interface ServiceDetail {
  id: string;
  name: string;
  category: ServiceCategory;
  status: ServiceStatus;
  statusText: string;
  description: string;
  port?: number;
  pid?: number | null;
  uptime?: string;
  details?: Record<string, unknown>;
  supportedActions: ServiceAction[];
  parameters?: ServiceParameterDef[];
  lastCheckedAt: string;
}

export interface ServicesOverviewResponse {
  total: number;
  runningCount: number;
  stoppedCount: number;
  services: ServiceDetail[];
  systemTime: string;
}

export interface ServiceControlDto {
  service_id: string;
  action: ServiceAction;
  params?: Record<string, unknown>;
}

export interface ServiceControlResult {
  success: boolean;
  message: string;
  service_id: string;
  action: ServiceAction;
  output?: string;
  timestamp: string;
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

export const SERVICE_PARAMS_MAP: Record<string, ServiceParameterDef[]> = {
  crawler_scheduler: [
    { key: 'mode', label: 'Chế độ quét', type: 'select', defaultValue: 'both', description: 'Chọn tiến trình quét muốn kích hoạt', options: [{ label: 'Cả 2 (Quét Đỉnh & Fill Lỗ Hổng)', value: 'both' }, { label: 'Chỉ Quét Đỉnh TIN Max (6h)', value: 'newest' }, { label: 'Chỉ Fill Lỗ Hổng 500 (12h)', value: 'gap_fill_500' }] },
    { key: 'max_concurrent_provinces', label: 'Số tỉnh quét song song', type: 'number', defaultValue: 3, min: 1, max: 5, step: 1, description: 'Số tỉnh chạy đồng thời trong Rolling Queue' },
    { key: 'gap', label: 'Bước nhảy GAP', type: 'number', defaultValue: 20, min: 1, max: 5000, step: 10, description: 'Số lượng MST kiểm tra liên tiếp' },
    { key: 'num_workers', label: 'Số luồng Worker/tỉnh', type: 'number', defaultValue: 2, min: 1, max: 8, step: 1, description: 'Số luồng worker cho mỗi tỉnh' },
    { key: 'reset_on_existing', label: 'Vét sâu khi gặp mã có trong DB', type: 'boolean', defaultValue: true, description: 'Reset bộ đếm 500 khi gặp MST đã có' }
  ],
  python_worker: [
    { key: 'max_rps', label: 'Giới hạn RPS WAF F5', type: 'number', defaultValue: 32, min: 1, max: 64, step: 1, description: 'Tốc độ trần truy vấn toàn cục' },
    { key: 'timeout_sec', label: 'Timeout truy vấn (giây)', type: 'number', defaultValue: 15, min: 5, max: 60, step: 5, description: 'Thời gian chờ phản hồi tối đa' }
  ],
  postgresql_db: [
    { key: 'query_type', label: 'Loại câu lệnh kiểm tra', type: 'select', defaultValue: 'ping', description: 'Chọn phương thức test kết nối CSDL', options: [{ label: 'Ping kiểm tra cơ bản (SELECT 1)', value: 'ping' }, { label: 'Đếm tổng bản ghi NNT (COUNT)', value: 'count' }, { label: 'Số kết nối đang mở (Activity)', value: 'connections' }] }
  ]
};
