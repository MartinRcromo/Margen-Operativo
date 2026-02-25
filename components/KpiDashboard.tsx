
import React from 'react';
import { Summary } from '../types';
import { fmtM } from '../utils/helpers';

interface KpiDashboardProps {
    summary: Summary | undefined | null;
    selectedDun: string;
    displayMillions: boolean;
}

const KpiDashboard: React.FC<KpiDashboardProps> = ({ summary, selectedDun, displayMillions }) => {
    const money = (n?: number | null) => fmtM(n, displayMillions);

    if (!summary) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2>{selectedDun ? `Resultados: ${selectedDun}` : 'Cuadro de Resultados'}</h2>
                </div>
                <div className="placeholder-card" style={{minHeight:'220px'}}>
                    Esperando datos...
                </div>
            </div>
        );
    }
    
    const totalCMV = summary.totalVenta - summary.totalResultado;
    
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
            <div className={`pnl-item total`}>
                <span className="pnl-label">(=) Margen Operativo</span>
                <span className={`pnl-value ${summary.totalMargenOper < 0 ? 'negative' : ''}`}>{money(summary.totalMargenOper)}</span>
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
            <div className={`pnl-item total`}>
                <span className="pnl-label">(=) Resultado Neto (Final)</span>
                <span className={`pnl-value ${summary.resultadoFinal < 0 ? 'negative' : ''}`}>{money(summary.resultadoFinal)}</span>
            </div>
        </>
    );
    
    return (
        <div className="card">
            <div className="card-header">
                <h2>{selectedDun ? `Resultados: ${selectedDun}` : 'Cuadro de Resultados'}</h2>
            </div>
            <div className="pnl-container">
                {selectedDun ? renderDunPnl() : renderGlobalPnl()}
            </div>
            <div className="footnote" style={{marginTop: 'auto', paddingTop: '10px'}}>
                 * Todos los valores corresponden a las <b>{summary.activos} de {summary.tot}</b> líneas activas {selectedDun ? `del DUN` : `consolidadas`}.
            </div>
        </div>
    );
};

export default KpiDashboard;
