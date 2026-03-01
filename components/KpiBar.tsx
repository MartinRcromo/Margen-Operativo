import React from 'react';
import { Summary } from '../types';
import { fmtM } from '../utils/helpers';

interface KpiBarProps {
    summary: Summary | null;
    displayMillions: boolean;
}

const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

const KpiBar: React.FC<KpiBarProps> = ({ summary, displayMillions }) => {
    const fmt = (n?: number | null) => fmtM(n, displayMillions);

    if (!summary) {
        const labels = ['Venta', 'C. Marginal', 'Margen Op.', 'Resultado Neto', 'Líneas'];
        return (
            <div className="kpi-bar">
                {labels.map(l => (
                    <div key={l} className="kpi-bar-item">
                        <span className="kpi-bar-label">{l}</span>
                        <span className="kpi-bar-value" style={{ color: 'var(--muted2)' }}>—</span>
                    </div>
                ))}
            </div>
        );
    }

    const mbPct = summary.totalVenta > 0 ? summary.totalResultado / summary.totalVenta : 0;
    const mgOpPct = summary.margenOperPctGlobal;
    const netoPct = summary.totalVenta > 0 ? summary.resultadoFinal / summary.totalVenta : 0;

    return (
        <div className="kpi-bar">
            <div className="kpi-bar-item">
                <span className="kpi-bar-label">Venta</span>
                <span className="kpi-bar-value">{fmt(summary.totalVenta)}</span>
                <span className="kpi-bar-sub">{summary.activos} líneas activas</span>
            </div>
            <div className="kpi-bar-item">
                <span className="kpi-bar-label">C. Marginal</span>
                <span className="kpi-bar-value">{fmt(summary.totalResultado)}</span>
                <span className="kpi-bar-sub">{pct(mbPct)} s/ venta</span>
            </div>
            <div className="kpi-bar-item">
                <span className="kpi-bar-label">Margen Operativo</span>
                <span className={`kpi-bar-value${summary.totalMargenOper < 0 ? ' negative' : ''}`}>
                    {fmt(summary.totalMargenOper)}
                </span>
                <span className="kpi-bar-sub">{pct(mgOpPct)} s/ venta</span>
            </div>
            <div className="kpi-bar-item">
                <span className="kpi-bar-label">Resultado Neto</span>
                <span className={`kpi-bar-value${summary.resultadoFinal < 0 ? ' negative' : ' positive'}`}>
                    {fmt(summary.resultadoFinal)}
                </span>
                <span className="kpi-bar-sub">{pct(netoPct)} s/ venta</span>
            </div>
            <div className="kpi-bar-item">
                <span className="kpi-bar-label">Gastos Fijos</span>
                <span className="kpi-bar-value">{fmt(summary.totalFijos)}</span>
                <span className="kpi-bar-sub">{summary.sim > 0 ? `${summary.sim} simuladas` : 'sin simulaciones'}</span>
            </div>
        </div>
    );
};

export default KpiBar;
