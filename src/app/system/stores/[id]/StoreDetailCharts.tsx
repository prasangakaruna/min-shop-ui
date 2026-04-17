'use client';

import { useMemo } from 'react';
import { formatRevenueCompact } from '@/lib/formatSystemRevenue';
import type { SystemRecentOrder, SystemStoreDetail } from '@/lib/api';

const FINANCIAL_COLORS: Record<string, string> = {
  paid: '#0d9488',
  pending: '#d97706',
  refunded: '#7c3aed',
  cancelled: '#9ca3af',
  partially_paid: '#14b8a6',
  partially_refunded: '#a78bfa',
};

function defaultSliceColor(_key: string, i: number): string {
  const palette = ['#0d9488', '#14b8a6', '#5eead4', '#d97706', '#7c3aed', '#64748b', '#0ea5e9'];
  return palette[i % palette.length];
}

function polar(cx: number, cy: number, r: number, angleRad: number): { x: number; y: number } {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function donutArcPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startAngle: number,
  endAngle: number
): string {
  const large = endAngle - startAngle > Math.PI ? 1 : 0;
  const p1 = polar(cx, cy, rOuter, startAngle);
  const p2 = polar(cx, cy, rOuter, endAngle);
  const p3 = polar(cx, cy, rInner, endAngle);
  const p4 = polar(cx, cy, rInner, startAngle);
  return [
    `M ${p1.x} ${p1.y}`,
    `A ${rOuter} ${rOuter} 0 ${large} 1 ${p2.x} ${p2.y}`,
    `L ${p3.x} ${p3.y}`,
    `A ${rInner} ${rInner} 0 ${large} 0 ${p4.x} ${p4.y}`,
    'Z',
  ].join(' ');
}

type Props = {
  detail: SystemStoreDetail;
};

export function StoreDetailCharts({ detail }: Props) {
  const currency = detail.highlights.currency_display;
  const monthly = detail.chart_series_monthly ?? [];
  const breakdown = detail.order_financial_breakdown ?? {};
  const recent = detail.recent_orders ?? [];

  const donut = useMemo(() => {
    const entries = Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, n]) => s + n, 0);
    if (total <= 0) return { slices: [] as { key: string; count: number; start: number; end: number; color: string }[] };
    let angle = -Math.PI / 2;
    const slices = entries.map(([key, count], i) => {
      const sweep = (count / total) * Math.PI * 2;
      const start = angle;
      angle += sweep;
      return {
        key,
        count,
        start: start,
        end: angle,
        color: FINANCIAL_COLORS[key] ?? defaultSliceColor(key, i),
      };
    });
    return { slices };
  }, [breakdown]);

  const revenueMax = useMemo(() => Math.max(1, ...monthly.map((m) => m.revenue)), [monthly]);
  const ordersMax = useMemo(() => Math.max(1, ...monthly.map((m) => m.orders)), [monthly]);
  const recentMax = useMemo(
    () => Math.max(1, ...recent.map((o: SystemRecentOrder) => o.total)),
    [recent]
  );

  const cx = 88;
  const cy = 88;
  const rOut = 62;
  const rIn = 38;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-sm font-bold text-gray-900">Charts</h2>
      <p className="mt-1 text-xs text-gray-500">
        Qualifying orders only (excl. cancelled &amp; refunded). Monthly view is the last six calendar months.
      </p>

      <div className="mt-6 grid gap-8 lg:grid-cols-3">
        {/* Revenue bars */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Revenue by month</h3>
          <div className="mt-3 grid grid-cols-6 gap-1.5 border-b border-gray-100 pb-2">
            {monthly.length === 0 ? (
              <p className="col-span-6 text-sm text-gray-500">No data.</p>
            ) : (
              monthly.map((m) => {
                const pct = (m.revenue / revenueMax) * 100;
                return (
                  <div key={m.month} className="flex min-w-0 flex-col items-center gap-1.5">
                    <div
                      className="flex h-36 w-full items-end justify-center"
                      title={`${m.label}: ${formatRevenueCompact(m.revenue, currency)}`}
                    >
                      <div
                        className="w-full max-w-[2.25rem] rounded-t-md bg-gradient-to-t from-mint-dark/90 to-mint/70 transition-opacity hover:opacity-90"
                        style={{
                          height: `${m.revenue > 0 ? Math.max(pct, 6) : 1}%`,
                          minHeight: m.revenue > 0 ? 4 : 2,
                        }}
                      />
                    </div>
                    <span className="truncate text-[10px] font-medium text-gray-500">{m.label.split(' ')[0]}</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Orders line */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Order volume</h3>
          <div className="mt-3 h-44">
            {monthly.length === 0 ? (
              <p className="text-sm text-gray-500">No data.</p>
            ) : (
              <svg viewBox="0 0 280 140" className="h-full w-full" preserveAspectRatio="none" aria-hidden>
                <defs>
                  <linearGradient id="sysVolFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
                  </linearGradient>
                </defs>
                {(() => {
                  const pad = 8;
                  const w = 280 - pad * 2;
                  const h = 140 - pad * 2;
                  const pts = monthly.map((m, i) => {
                    const x = pad + (i / Math.max(monthly.length - 1, 1)) * w;
                    const y = pad + h - (m.orders / ordersMax) * h;
                    return { x, y, orders: m.orders, label: m.label };
                  });
                  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaD =
                    pts.length > 0
                      ? `${lineD} L ${pts[pts.length - 1].x} ${pad + h} L ${pts[0].x} ${pad + h} Z`
                      : '';
                  return (
                    <>
                      <path d={areaD} fill="url(#sysVolFill)" />
                      <path
                        d={lineD}
                        fill="none"
                        stroke="#0f766e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {pts.map((p, i) => (
                        <circle key={i} cx={p.x} cy={p.y} r="4" fill="white" stroke="#0f766e" strokeWidth="2">
                          <title>{`${p.label}: ${p.orders} orders`}</title>
                        </circle>
                      ))}
                    </>
                  );
                })()}
              </svg>
            )}
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-gray-400">
            {monthly.map((m) => (
              <span key={m.month} className="flex-1 truncate text-center">
                {m.label.split(' ')[0]}
              </span>
            ))}
          </div>
        </div>

        {/* Donut + legend */}
        <div className="flex flex-col items-center sm:flex-row sm:items-start sm:gap-6">
          <div className="relative shrink-0">
            <svg width="176" height="176" viewBox="0 0 176 176" role="img" aria-label="Orders by financial status">
              <title>Order mix by financial status</title>
              {donut.slices.length === 0 ? (
                <text x="88" y="92" textAnchor="middle" fill="#9ca3af" fontSize="12">
                  No orders
                </text>
              ) : (
                donut.slices.map((s) => (
                  <path
                    key={s.key}
                    d={donutArcPath(cx, cy, rOut, rIn, s.start, s.end)}
                    fill={s.color}
                    stroke="white"
                    strokeWidth="1"
                  >
                    <title>{`${s.key}: ${s.count}`}</title>
                  </path>
                ))
              )}
            </svg>
          </div>
          <ul className="mt-4 w-full min-w-0 space-y-2 sm:mt-0">
            {Object.keys(breakdown).length === 0 ? (
              <li className="text-sm text-gray-500">No breakdown.</li>
            ) : (
              Object.entries(breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([key, count], i) => (
                  <li key={key} className="flex items-center justify-between gap-2 text-xs">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-sm"
                        style={{ backgroundColor: FINANCIAL_COLORS[key] ?? defaultSliceColor(key, i) }}
                      />
                      <span className="truncate capitalize text-gray-700">{key}</span>
                    </span>
                    <span className="shrink-0 tabular-nums font-semibold text-gray-900">{count}</span>
                  </li>
                ))
            )}
          </ul>
        </div>
      </div>

      {/* Recent order totals — horizontal bars */}
      {recent.length > 0 ? (
        <div className="mt-10 border-t border-gray-100 pt-6">
          <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400">Recent order totals</h3>
          <p className="mt-1 text-xs text-gray-500">Visual comparison of the latest 12 orders (newest first)</p>
          <div className="mt-4 space-y-2">
            {recent.map((o: SystemRecentOrder) => (
              <div key={o.id} className="flex items-center gap-3 text-xs">
                <span className="w-24 shrink-0 truncate font-mono text-gray-600" title={o.number ?? `#${o.id}`}>
                  {o.number ?? `#${o.id}`}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-mint/80"
                      style={{ width: `${(o.total / recentMax) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="w-20 shrink-0 text-right font-semibold tabular-nums text-gray-800">
                  {formatRevenueCompact(o.total, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
