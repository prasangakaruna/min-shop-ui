/** Demo fixtures for the system operator console (no backing store). */

export type ActivityEvent = {
  id: string;
  at: string;
  actor: string;
  action: string;
  resource: string;
  severity: 'info' | 'warning' | 'critical';
};

export const MOCK_ACTIVITY: ActivityEvent[] = [
  {
    id: '1',
    at: '2 min ago',
    actor: 'svc-deploy',
    action: 'config.publish',
    resource: 'global/feature-flags',
    severity: 'info',
  },
  {
    id: '2',
    at: '18 min ago',
    actor: 'j.ortiz',
    action: 'session.revoke_bulk',
    resource: 'tenant:eu-west',
    severity: 'warning',
  },
  {
    id: '3',
    at: '42 min ago',
    actor: 'policy-engine',
    action: 'rate_limit.tighten',
    resource: 'edge:/auth/*',
    severity: 'info',
  },
  {
    id: '4',
    at: '1 h ago',
    actor: 'audit-export',
    action: 'export.requested',
    resource: 'compliance/Q2',
    severity: 'info',
  },
];

export type SecuritySignal = {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'flat';
  hint: string;
};

export const MOCK_SECURITY_SIGNALS: SecuritySignal[] = [
  { label: 'Failed admin sign-ins (24h)', value: '12', trend: 'down', hint: 'Below rolling 7d median' },
  { label: 'MFA challenges passed', value: '98.2%', trend: 'up', hint: 'IdP-reported' },
  { label: 'Anomaly flags (SOC)', value: '3', trend: 'flat', hint: 'Queued for review' },
];

export type QueueHealth = {
  name: string;
  depth: number;
  oldestSeconds: number;
  status: 'ok' | 'degraded' | 'stalled';
};

export const MOCK_QUEUES: QueueHealth[] = [
  { name: 'notifications.send', depth: 42, oldestSeconds: 8, status: 'ok' },
  { name: 'search.index', depth: 1204, oldestSeconds: 190, status: 'degraded' },
  { name: 'billing.settlement', depth: 0, oldestSeconds: 0, status: 'ok' },
  { name: 'media.transcode', depth: 18, oldestSeconds: 420, status: 'stalled' },
];

export type FeatureFlagRow = {
  key: string;
  enabled: boolean;
  rollout: string;
  owner: string;
  updated: string;
};

export const MOCK_FLAGS: FeatureFlagRow[] = [
  { key: 'edge.readonly_mode', enabled: false, rollout: '0%', owner: 'platform', updated: 'Never' },
  { key: 'checkout.wallet_beta', enabled: true, rollout: '12%', owner: 'payments', updated: 'Apr 6' },
  { key: 'search.hybrid_rank', enabled: true, rollout: '100%', owner: 'discovery', updated: 'Apr 2' },
];

export type AuditRow = {
  id: string;
  time: string;
  principal: string;
  verb: string;
  object: string;
};

export const MOCK_AUDIT: AuditRow[] = [
  { id: 'a1', time: '2026-04-08 14:02', principal: 'role:sys_ops', verb: 'UPDATE', object: 'limits/api_global' },
  { id: 'a2', time: '2026-04-08 13:41', principal: 'user:super_admin', verb: 'READ', object: 'audit/export' },
  { id: 'a3', time: '2026-04-08 12:15', principal: 'automation', verb: 'ROTATE', object: 'secret/webhook_primary' },
];

export type RoleRow = {
  role: string;
  members: number;
  scopes: string;
};

export const MOCK_ROLES: RoleRow[] = [
  { role: 'super_admin', members: 4, scopes: 'system.*' },
  { role: 'sys_ops', members: 11, scopes: 'ops.read, ops.jobs, flags.read' },
  { role: 'security', members: 6, scopes: 'security.*, audit.read' },
  { role: 'compliance', members: 3, scopes: 'data.export, legal_hold' },
];
