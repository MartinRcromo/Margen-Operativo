
import React, { useMemo } from 'react';
import { Product } from '../types';
import { fmtM } from '../utils/helpers';

interface DunFilterBarProps {
    selectedDun: string;
    setSelectedDun: (dun: string) => void;
    products: Product[];
    displayMillions: boolean;
    hasData: boolean;
}

const DunFilterBar: React.FC<DunFilterBarProps> = ({ selectedDun, setSelectedDun, products, displayMillions, hasData }) => {
    const uniqueDuns = useMemo(() => {
        const duns = new Set<string>();
        products.forEach(p => {
            if (p.DUN) {
                duns.add(p.DUN);
            }
        });
        return Array.from(duns).sort();
    }, [products]);

    const dunTotalMargin = useMemo(() => {
        if (!selectedDun) {
            return null;
        }
        return products
            .filter(p => p.DUN === selectedDun && p.Activo)
            .reduce((total, p) => total + (p.MargenOper || 0), 0);
    }, [products, selectedDun]);

    return (
        <div className="flex items-center gap-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-xl">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Filtrar Vista:</span>
            <div className="relative">
                <select
                    className="bg-slate-900/50 border border-slate-700/50 rounded-lg px-4 py-1.5 text-xs font-bold text-slate-200 focus:outline-none focus:ring-1 focus:ring-accent-blue appearance-none min-w-[280px] cursor-pointer"
                    value={selectedDun}
                    onChange={(e) => setSelectedDun(e.target.value)}
                    disabled={!hasData || uniqueDuns.length === 0}
                >
                    <option value="">Consolidado de Empresa</option>
                    {uniqueDuns.map(dun => (
                        <option key={dun} value={dun}>{dun}</option>
                    ))}
                </select>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-[10px]">▼</span>
            </div>
            {selectedDun && dunTotalMargin !== null && (
                <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-accent-blue/10 border border-accent-blue/20 rounded-lg text-xs">
                    <span className="text-slate-400">Margen Op. Total del DUN:</span>
                    <strong className="text-accent-blue font-black">{fmtM(dunTotalMargin, displayMillions)}</strong>
                </div>
            )}
        </div>
    );
};

export default DunFilterBar;
