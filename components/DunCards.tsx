import React, { useMemo } from 'react';
import { Product } from '../types';

interface DunCardsProps {
    products: Product[];
    selectedDun: string;
    onSelect: (dun: string) => void;
}

interface DunStat {
    dun: string;
    totalVenta: number;
    totalMargen: number;
    totalStock: number;
    margenPct: number;
    roi: number | null;
}

const healthColor = (pct: number): string => {
    if (pct >= 0.10) return 'var(--good)';
    if (pct >= 0.05) return '#fbbf24';
    if (pct >= 0)    return '#f97316';
    return 'var(--bad)';
};

const DunCards: React.FC<DunCardsProps> = ({ products, selectedDun, onSelect }) => {
    const dunStats = useMemo((): DunStat[] => {
        const map = new Map<string, { venta: number; margen: number; stock: number }>();
        products
            .filter(p => p.Activo && p.DUN)
            .forEach(p => {
                const dun = p.DUN!;
                if (!map.has(dun)) map.set(dun, { venta: 0, margen: 0, stock: 0 });
                const d = map.get(dun)!;
                d.venta  += p.Venta as number;
                d.margen += p.MargenOper ?? 0;
                d.stock  += p.StockVal as number;
            });

        return Array.from(map.entries())
            .map(([dun, d]) => ({
                dun,
                totalVenta:  d.venta,
                totalMargen: d.margen,
                totalStock:  d.stock,
                margenPct:   d.venta  > 0 ? d.margen / d.venta : 0,
                roi:         d.stock  > 0 ? d.margen / d.stock : null,
            }))
            .sort((a, b) => b.margenPct - a.margenPct);
    }, [products]);

    if (dunStats.length === 0) {
        return (
            <div className="placeholder-card" style={{ minHeight: '80px' }}>
                Sin datos de DUN en el periodo cargado.
            </div>
        );
    }

    return (
        <div className="dun-cards">
            {dunStats.map(d => {
                const color   = healthColor(d.margenPct);
                const isActive = selectedDun === d.dun;
                return (
                    <div
                        key={d.dun}
                        className={`dun-card${isActive ? ' active' : ''}`}
                        onClick={() => onSelect(isActive ? '' : d.dun)}
                        role="button"
                        aria-pressed={isActive}
                        title={isActive ? `Deseleccionar ${d.dun}` : `Analizar ${d.dun}`}
                    >
                        <span className="dun-card-name">{d.dun}</span>
                        <span className="dun-card-pct" style={{ color }}>
                            {(d.margenPct * 100).toFixed(1)}%
                        </span>
                        <span className="dun-card-sublabel">Mg. Op.</span>
                        {d.roi !== null && (
                            <span className="dun-card-roi">
                                ROI {(d.roi * 100).toFixed(0)}%
                            </span>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default DunCards;
