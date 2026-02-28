
import React from 'react';
import { CalculationResult } from '../types';
import { fmtM } from '../utils/helpers';

interface DunDashboardProps {
    result: CalculationResult | null;
    selectedDun: string;
    displayMillions: boolean;
}

type HealthLevel = { color: string; label: string; desc: string };

const getHealth = (pct: number): HealthLevel => {
    if (pct >= 0.10) return { color: 'var(--good)',  label: '● Saludable', desc: '≥ 10% — Margen operativo sólido' };
    if (pct >= 0.05) return { color: '#fbbf24',      label: '● Moderado',  desc: '5–10% — Zona de atención' };
    if (pct >= 0)    return { color: '#f97316',      label: '● En Riesgo', desc: '0–5% — Revisar estructura de costos' };
    return               { color: 'var(--bad)',   label: '● Crítico',   desc: '< 0% — Margen operativo negativo' };
};

const DunDashboard: React.FC<DunDashboardProps> = ({ result, selectedDun, displayMillions }) => {
    if (!result || !selectedDun) return null;

    const money = (n?: number | null) => fmtM(n, displayMillions);

    const dunProds = result.allProds
        .filter(p => p.DUN === selectedDun && p.Activo)
        .sort((a, b) => (b.MargenOper ?? 0) - (a.MargenOper ?? 0));

    const totalVenta    = dunProds.reduce((s, p) => s + (p.Venta as number), 0);
    const totalCMV      = dunProds.reduce((s, p) => s + (p.Costo as number), 0);
    const totalCM       = dunProds.reduce((s, p) => s + (p.Resultado ?? 0), 0);
    const totalGastos   = dunProds.reduce((s, p) => s + (p.GastosAsignados ?? 0), 0);
    const totalMargen   = dunProds.reduce((s, p) => s + (p.MargenOper ?? 0), 0);
    const totalStockVal = dunProds.reduce((s, p) => s + (p.StockVal as number), 0);

    const margenPct = totalVenta > 0 ? totalMargen / totalVenta : 0;
    const cmPct     = totalVenta > 0 ? totalCM / totalVenta : 0;
    const roiProm   = totalStockVal > 0 ? totalMargen / totalStockVal : null;

    const health = getHealth(margenPct);

    const metricRows = [
        { label: 'Venta',             val: money(totalVenta),  sub: false },
        { label: '(-) CMV',           val: money(totalCMV),    sub: false },
        { label: `CM (${(cmPct * 100).toFixed(1)}%)`, val: money(totalCM), sub: true },
        { label: '(-) Gs. Operativos',val: money(totalGastos), sub: false },
        { label: 'Margen Operativo',  val: money(totalMargen), sub: true  },
        ...(roiProm !== null ? [{ label: 'ROI Prom.', val: `${(roiProm * 100).toFixed(0)}%`, sub: false }] : []),
    ];

    return (
        <div className="card">
            <div className="card-header">
                <h2>Panel DUN — {selectedDun}</h2>
                <span style={{ fontWeight: 700, color: health.color, fontSize: '13px' }}>
                    {health.label}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '28px', alignItems: 'start' }}>

                {/* ── Métricas ─────────────────────────────────────── */}
                <div style={{ minWidth: '190px' }}>
                    <div className="footnote" style={{ marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '9px' }}>
                        Métricas del DUN
                    </div>
                    {metricRows.map(row => (
                        <div
                            key={row.label}
                            className={`pnl-item ${row.sub ? 'subtotal' : ''}`}
                            style={row.sub ? { borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '4px' } : {}}
                        >
                            <span className="pnl-label">{row.label}</span>
                            <span
                                className="pnl-value"
                                style={row.label === 'Margen Operativo' ? { color: health.color, fontWeight: 700 } : {}}
                            >
                                {row.val}
                            </span>
                        </div>
                    ))}
                    <div className="footnote" style={{ marginTop: '12px', color: health.color, fontWeight: 600 }}>
                        {(margenPct * 100).toFixed(1)}% — {health.desc}
                    </div>
                </div>

                {/* ── Ranking de productos ──────────────────────────── */}
                <div>
                    <div className="footnote" style={{ marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '9px' }}>
                        Ranking por Margen Operativo
                    </div>

                    {dunProds.length === 0 ? (
                        <div className="placeholder-card">Sin productos activos en este DUN.</div>
                    ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr>
                                    {['Producto', 'Venta', 'C. Marginal', 'Gs. Asig.', 'Margen Op.', '%', 'ROI'].map(h => (
                                        <th key={h} style={{
                                            textAlign: h === 'Producto' ? 'left' : 'right',
                                            fontSize: '10px', color: 'var(--muted)',
                                            padding: '0 4px 6px', fontWeight: 500,
                                        }}>
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {dunProds.map(p => {
                                    const mPct = (p.Venta as number) > 0
                                        ? (p.MargenOper ?? 0) / (p.Venta as number)
                                        : 0;
                                    const h = getHealth(mPct);
                                    const cm = p.Resultado ?? 0;
                                    return (
                                        <tr key={p.Producto} style={{ borderTop: '1px solid var(--border)' }}>
                                            <td style={{ fontSize: '12px', padding: '7px 4px 7px 0', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                <span style={{ color: h.color, marginRight: '5px' }}>●</span>
                                                {p.Producto}
                                            </td>
                                            <td style={{ textAlign: 'right', fontSize: '11px', padding: '7px 4px', fontFamily: 'monospace', color: 'var(--muted)' }}>
                                                {money(p.Venta as number)}
                                            </td>
                                            <td style={{ textAlign: 'right', fontSize: '11px', padding: '7px 4px', fontFamily: 'monospace' }}>
                                                {money(cm)}
                                            </td>
                                            <td style={{ textAlign: 'right', fontSize: '11px', padding: '7px 4px', fontFamily: 'monospace', color: 'var(--muted)' }}>
                                                {money(p.GastosAsignados)}
                                            </td>
                                            <td style={{ textAlign: 'right', fontSize: '11px', padding: '7px 4px', fontFamily: 'monospace', fontWeight: 700, color: (p.MargenOper ?? 0) < 0 ? 'var(--bad)' : 'inherit' }}>
                                                {money(p.MargenOper)}
                                            </td>
                                            <td style={{ textAlign: 'right', fontSize: '11px', padding: '7px 4px', color: h.color, fontWeight: 600 }}>
                                                {(mPct * 100).toFixed(1)}%
                                            </td>
                                            <td style={{ textAlign: 'right', fontSize: '11px', padding: '7px 0', color: 'var(--muted)' }}>
                                                {p.ROI !== null && p.ROI !== undefined
                                                    ? `${(p.ROI * 100).toFixed(0)}%`
                                                    : '—'
                                                }
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DunDashboard;
