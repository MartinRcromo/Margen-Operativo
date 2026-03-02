
import React, { useState, useEffect } from 'react';
import { Summary } from '../types';
import { fmtM, fmtPrice } from '../utils/helpers';

interface KpiDashboardProps {
    summary: Summary | undefined | null;
    globalSummary: Summary | undefined | null;
    selectedDun: string;
    displayMillions: boolean;
    title?: string;
    isBaseline?: boolean;
    onVentaChange?: (newVenta: number) => void;
}

const KpiDashboard: React.FC<KpiDashboardProps> = ({ summary, globalSummary, selectedDun, displayMillions, title, isBaseline, onVentaChange }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState("");

    const money = (n?: number | null) => fmtM(n, displayMillions);
    const pct = (n: number) => (n * 100).toFixed(0) + '%';

    useEffect(() => {
        if (isEditing && summary) {
            const val = displayMillions ? summary.totalVenta / 1_000_000 : summary.totalVenta;
            setEditValue(val.toString());
        }
    }, [isEditing, summary, displayMillions]);

    if (!summary) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2>{title || (selectedDun ? `Resultados: ${selectedDun}` : 'Cuadro de Resultados')}</h2>
                </div>
                <div className="flex items-center justify-center h-full bg-gray-700/50 rounded-md">
                    Esperando datos...
                </div>
            </div>
        );
    }
    
    const totalCMV = summary.totalVenta - summary.totalResultado;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
        }
    };

    const handleSave = () => {
        let val = parseFloat(editValue.replace(',', '.'));
        if (!isNaN(val) && onVentaChange) {
            if (displayMillions) val *= 1_000_000;
            onVentaChange(val);
        }
        setIsEditing(false);
    };

    const renderEditableValue = (label: string, value: number) => {
        if (!isBaseline && onVentaChange) {
            if (isEditing) {
                return (
                    <div className="flex justify-between items-center">
                        <span className="text-slate-400">{label}</span>
                        <input
                            autoFocus
                            className="bg-slate-900 border border-accent-blue rounded px-1 text-right font-mono font-bold text-slate-200 w-32 outline-none"
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleSave}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                );
            }
            return (
                <div 
                    className="flex justify-between cursor-pointer group hover:bg-slate-700/30 rounded px-1 -mx-1 transition-colors"
                    onClick={() => setIsEditing(true)}
                    title="Click para editar venta"
                >
                    <span className="text-slate-400">{label}</span>
                    <span className="font-mono font-bold text-slate-200 group-hover:text-accent-blue flex items-center gap-1">
                        {money(value)}
                        <span className="text-[10px] opacity-0 group-hover:opacity-100">✎</span>
                    </span>
                </div>
            );
        }
        return (
            <div className="flex justify-between">
                <span className="text-slate-400">{label}</span>
                <span className="font-mono font-bold text-slate-200">{money(value)}</span>
            </div>
        );
    };
    
    const renderDunPnl = () => (
        <div className="space-y-2 text-xs">
            {renderEditableValue("Venta", summary.totalVenta)}
            <div className="flex justify-between"><span className="text-slate-400">(-) CMV</span><span className="font-mono font-bold text-slate-200">{money(totalCMV)}</span></div>
            <hr className="border-t border-slate-700/50 my-2" />
            <div className="flex justify-between font-semibold"><span className="text-slate-200">(+) Margen Bruto</span><span className="font-mono font-bold text-accent-blue">{money(summary.totalResultado)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">(-) Gastos Operativos (Directos + Indirectos)</span><span className="font-mono font-bold text-slate-200">{money(summary.totalGastosOperativos)}</span></div>
            <hr className="border-t border-slate-700/50 my-2" />
            <div className="flex justify-between font-semibold"><span className="text-slate-200">(=) Contribución Marginal</span><span className="font-mono font-bold text-accent-yellow">{money(summary.totalMargenOper)}</span></div>
            <div className="flex justify-between font-bold text-sm mt-4 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"><span className="text-slate-100">(=) Resultado Neto (Final)</span><span className="font-mono text-accent-green">{money(summary.totalMargenOper)}</span></div>
        </div>
    );

    const renderGlobalPnl = () => (
        <div className="space-y-2 text-xs">
            {renderEditableValue("Venta Consolidada", summary.totalVenta)}
            <div className="flex justify-between"><span className="text-slate-400">(-) CMV</span><span className="font-mono font-bold text-slate-200">{money(totalCMV)}</span></div>
            <hr className="border-t border-slate-700/50 my-2" />
            <div className="flex justify-between font-semibold"><span className="text-slate-200">(+) Margen Bruto</span><span className="font-mono font-bold text-accent-blue">{money(summary.totalResultado)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">(-) Gastos Operativos (Directos + Indirectos)</span><span className="font-mono font-bold text-slate-200">{money(summary.totalGastosOperativos)}</span></div>
            <hr className="border-t border-slate-700/50 my-2" />
            <div className="flex justify-between font-semibold"><span className="text-slate-200">(=) Contribución Marginal</span><span className="font-mono font-bold text-accent-yellow">{money(summary.totalMargenOper)}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">(-) Gastos Fijos</span><span className="font-mono font-bold text-slate-200">{money(summary.totalFijos)}</span></div>
            <hr className="border-t border-slate-700/50 my-2" />
            <div className="flex justify-between font-bold text-sm mt-4 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg"><span className="text-slate-100">(=) Resultado Neto (Final)</span><span className="font-mono text-accent-green">{money(summary.resultadoFinal)}</span></div>
        </div>
    );

    const renderKpiBoxes = () => {
        const targetVenta = globalSummary?.totalVenta || summary.totalVenta;
        const targetFijos = globalSummary?.totalFijos || summary.totalFijos;
        
        const gOpPct = targetVenta === 0 ? 0 : (summary.totalGastosOperativos / targetVenta);
        const gFixPct = targetVenta === 0 ? 0 : (targetFijos / targetVenta);
        const markup = (summary.totalVenta - summary.totalResultado) === 0 ? 0 : (summary.totalResultado / (summary.totalVenta - summary.totalResultado));

        return (
            <div className="grid grid-cols-3 gap-2 mt-6">
                <div className="flex flex-col items-center justify-center p-2 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1 text-center leading-tight">Gastos Operativos %</span>
                    <span className="text-sm font-mono font-bold text-accent-yellow">{pct(gOpPct)}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1 text-center leading-tight">Gastos Fijos %</span>
                    <span className="text-sm font-mono font-bold text-accent-blue">{pct(gFixPct)}</span>
                </div>
                <div className="flex flex-col items-center justify-center p-2 bg-slate-800/40 border border-slate-700/50 rounded-xl">
                    <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1 text-center leading-tight">Mark up %</span>
                    <span className="text-sm font-mono font-bold text-accent-green">{pct(markup)}</span>
                </div>
            </div>
        );
    };
    
    return (
        <div className="card flex flex-col h-full">
            <div className="card-header">
                <h2>{title || (selectedDun ? `Resultados: ${selectedDun}` : 'Cuadro de Resultados')}</h2>
            </div>
            <div className="flex-grow">
                {selectedDun ? renderDunPnl() : renderGlobalPnl()}
                {renderKpiBoxes()}
            </div>
            <div className="mt-4">
                 <p className="text-[10px] text-slate-500 italic">* Todos los valores corresponden a las {summary.activos} de {summary.tot} líneas activas {selectedDun ? `del DUN` : `consolidadas`}.</p>
            </div>
        </div>
    );
};

export default KpiDashboard;
