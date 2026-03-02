import React from 'react';
import { Summary } from '../types';

interface ProductKpiSummaryProps {
    summary: Summary | null;
}

const ProductKpiSummary: React.FC<ProductKpiSummaryProps> = ({ summary }) => {
    if (!summary) return null;

    const formatPct = (val: number) => `${(val * 100).toFixed(1)}%`;

    return (
        <div className="flex items-center gap-6 p-3 mb-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Mark-Up % Promedio</span>
                <span className="text-lg font-black text-slate-100">{formatPct(summary.avgMarkup)}</span>
            </div>
            <div className="w-px h-8 bg-slate-700/50"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Contrib. Marg. % Promedio</span>
                <span className="text-lg font-black text-accent-blue">{formatPct(summary.avgContribMarginalPct)}</span>
            </div>
            <div className="w-px h-8 bg-slate-700/50"></div>
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">ROI Promedio</span>
                <span className="text-lg font-black text-emerald-400">{formatPct(summary.avgROI)}</span>
            </div>
        </div>
    );
};

export default ProductKpiSummary;
