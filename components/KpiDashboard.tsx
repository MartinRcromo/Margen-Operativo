
import React from 'react';
import { Summary } from '../types';
import { fmtM } from '../utils/helpers';

interface KpiDashboardProps {
    summary: Summary | undefined | null;
    selectedDun: string;
    displayMillions: boolean;
    frozenSummary?: Summary | null;
    onFreezeBase?: () => void;
    onClearFreeze?: () => void;
}

const KpiDashboard: React.FC<KpiDashboardProps> = ({
    summary, selectedDun, displayMillions,
    frozenSummary, onFreezeBase, onClearFreeze,
}) => {
    const money = (n?: number | null) => fmtM(n, displayMillions);
    const pctFmt = (n: number) => `${(n * 100).toFixed(1)}%`;
    const isComparing = !!frozenSummary;

    if (!summary) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2>{selectedDun ? `Resultados: ${selectedDun}` : 'Cuadro de Resultados'}</h2>
                </div>
                <div className="placeholder-card" style={{ minHeight: '220px' }}>
                    Esperando datos...
                </div>
            </div>
        );
    }

    const totalCMV = summary.totalVenta - summary.totalResultado;
    const frozenCMV = frozenSummary ? frozenSummary.totalVenta - frozenSummary.totalResultado : 0;

    const renderDunPnl = () => (
        <>
            <div className="pnl-item">
                <span className="pnl-label">Venta</span>
                <span className="pnl-value">{money(summary.totalVenta)}</span>
            </div>
            <div className="pnl-item">
                <span className="pnl-label">(-) CMV</span>
                <span className="pnl-value">{money(totalCMV)}</span>
            </div>
            <hr className="pnl-separator" />
            <div className="pnl-item subtotal">
                <span className="pnl-label">(=) Contribución Marginal</span>
                <span className="pnl-value">{money(summary.totalResultado)}</span>
            </div>
            <div className="pnl-item">
                <span className="pnl-label">(-) Gastos Operativos (Directos + Indirectos)</span>
                <span className="pnl-value">{money(summary.totalGastosOperativos)}</span>
            </div>
            <hr className="pnl-separator" />
            <div className="pnl-item total">
                <span className="pnl-label">(=) Margen Operativo</span>
                <span className={`pnl-value ${summary.totalMargenOper < 0 ? 'negative' : ''}`}>
                    {money(summary.totalMargenOper)}
                </span>
            </div>
        </>
    );

    const renderGlobalPnl = () => (
        <>
            <div className="pnl-item">
                <span className="pnl-label">Venta Consolidada</span>
                <span className="pnl-value">{money(summary.totalVenta)}</span>
            </div>
            <div className="pnl-item">
                <span className="pnl-label">(-) CMV</span>
                <span className="pnl-value">{money(totalCMV)}</span>
            </div>
            <hr className="pnl-separator" />
            <div className="pnl-item subtotal">
                <span className="pnl-label">(=) Contribución Marginal</span>
                <span className="pnl-value">{money(summary.totalResultado)}</span>
            </div>
            <div className="pnl-item">
                <span className="pnl-label">(-) Gastos Operativos (Directos + Indirectos)</span>
                <span className="pnl-value">{money(summary.totalGastosOperativos)}</span>
            </div>
            <hr className="pnl-separator" />
            <div className="pnl-item subtotal">
                <span className="pnl-label">(=) Margen Operativo</span>
                <span className="pnl-value">{money(summary.totalMargenOper)}</span>
            </div>
            <div className="pnl-item">
                <span className="pnl-label">(-) Gastos Fijos</span>
                <span className="pnl-value">{money(summary.totalFijos)}</span>
            </div>
            <hr className="pnl-separator" />
            <div className="pnl-item total">
                <span className="pnl-label">(=) Resultado Neto (Final)</span>
                <span className={`pnl-value ${summary.resultadoFinal < 0 ? 'negative' : ''}`}>
                    {money(summary.resultadoFinal)}
                </span>
            </div>
        </>
    );

    // ── Comparison table ──────────────────────────────────────────────────────

    const thStyle: React.CSSProperties = {
        fontSize: '9px', color: 'var(--muted)', textAlign: 'right',
        paddingBottom: '6px', fontWeight: 500, letterSpacing: '0.05em',
    };
    const labelStyle: React.CSSProperties = {
        fontSize: '11px', color: 'var(--muted)', padding: '5px 4px 5px 0',
        maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    };
    const numStyle: React.CSSProperties = {
        textAlign: 'right', fontSize: '11px', padding: '5px 4px', fontFamily: 'monospace',
    };

    const renderDeltaCell = (base: number, cur: number, isPct = false, invertGood = false) => {
        if (base === 0) {
            return <td style={{ ...numStyle, color: 'var(--muted)' }}>—</td>;
        }
        let pct: number;
        let label: string;
        if (isPct) {
            pct = (cur - base) * 100;
            label = `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(1)}pp`;
        } else {
            pct = ((cur - base) / Math.abs(base)) * 100;
            label = `${pct >= 0 ? '▲' : '▼'} ${Math.abs(pct).toFixed(0)}%`;
        }
        const isPositive = invertGood ? pct < 0 : pct > 0;
        const isNeutral = Math.abs(pct) < 0.05;
        const color = isNeutral ? 'var(--muted)' : isPositive ? 'var(--good)' : 'var(--bad)';
        return (
            <td style={{ ...numStyle, color, fontWeight: 600 }}>
                {isNeutral ? '→ 0%' : label}
            </td>
        );
    };

    const renderCompareView = () => {
        if (!frozenSummary) return null;

        type Row = { label: string; base: number; cur: number; isPct?: boolean; invertGood?: boolean; bold?: boolean };

        const rows: Row[] = selectedDun ? [
            { label: 'Venta', base: frozenSummary.totalVenta, cur: summary.totalVenta },
            { label: '(-) CMV', base: frozenCMV, cur: totalCMV, invertGood: true },
            { label: 'C. Marginal', base: frozenSummary.totalResultado, cur: summary.totalResultado },
            { label: '(-) Gs. Oper.', base: frozenSummary.totalGastosOperativos, cur: summary.totalGastosOperativos, invertGood: true },
            { label: 'Margen Op.', base: frozenSummary.totalMargenOper, cur: summary.totalMargenOper, bold: true },
            { label: 'Margen %', base: frozenSummary.margenOperPctGlobal, cur: summary.margenOperPctGlobal, isPct: true, bold: true },
        ] : [
            { label: 'Venta', base: frozenSummary.totalVenta, cur: summary.totalVenta },
            { label: '(-) CMV', base: frozenCMV, cur: totalCMV, invertGood: true },
            { label: 'C. Marginal', base: frozenSummary.totalResultado, cur: summary.totalResultado },
            { label: '(-) Gs. Oper.', base: frozenSummary.totalGastosOperativos, cur: summary.totalGastosOperativos, invertGood: true },
            { label: 'Margen Op.', base: frozenSummary.totalMargenOper, cur: summary.totalMargenOper },
            { label: 'Margen %', base: frozenSummary.margenOperPctGlobal, cur: summary.margenOperPctGlobal, isPct: true },
            { label: '(-) Gs. Fijos', base: frozenSummary.totalFijos, cur: summary.totalFijos, invertGood: true },
            { label: 'Resultado', base: frozenSummary.resultadoFinal, cur: summary.resultadoFinal, bold: true },
        ];

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ ...thStyle, textAlign: 'left' }}></th>
                        <th style={thStyle}>BASE</th>
                        <th style={thStyle}>ACTUAL</th>
                        <th style={thStyle}>DELTA</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((r, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                            <td style={{ ...labelStyle, fontWeight: r.bold ? 700 : 400 }}>{r.label}</td>
                            <td style={{ ...numStyle, color: 'var(--muted)' }}>
                                {r.isPct ? pctFmt(r.base) : money(r.base)}
                            </td>
                            <td style={{ ...numStyle, fontWeight: r.bold ? 700 : 400 }}>
                                {r.isPct ? pctFmt(r.cur) : money(r.cur)}
                            </td>
                            {renderDeltaCell(r.base, r.cur, r.isPct, r.invertGood)}
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ flex: 1, margin: 0 }}>
                    {selectedDun ? `Resultados: ${selectedDun}` : 'Cuadro de Resultados'}
                </h2>
                {!isComparing ? (
                    <button
                        className="btn"
                        onClick={onFreezeBase}
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        title="Guarda el resultado actual como base para comparar con futuros escenarios"
                    >
                        Congelar Base
                    </button>
                ) : (
                    <button
                        className="btn"
                        onClick={onClearFreeze}
                        style={{ fontSize: '11px', padding: '4px 10px', color: 'var(--warn)', borderColor: 'var(--warn)' }}
                        title="Volver a la vista normal"
                    >
                        Limpiar
                    </button>
                )}
            </div>
            <div className="pnl-container">
                {isComparing
                    ? renderCompareView()
                    : (selectedDun ? renderDunPnl() : renderGlobalPnl())
                }
            </div>
            <div className="footnote" style={{ marginTop: 'auto', paddingTop: '10px' }}>
                {isComparing
                    ? '* BASE = resultado congelado · ACTUAL = escenario vigente'
                    : `* Todos los valores corresponden a las ${summary.activos} de ${summary.tot} líneas activas ${selectedDun ? 'del DUN' : 'consolidadas'}.`
                }
            </div>
        </div>
    );
};

export default KpiDashboard;
