
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
        <div className="dun-filter-bar">
            <span className="filter-label">Filtrar Vista:</span>
            <select
                className="search"
                value={selectedDun}
                onChange={(e) => setSelectedDun(e.target.value)}
                disabled={!hasData || uniqueDuns.length === 0}
                style={{ width: '250px' }}
            >
                <option value="">Consolidado de Empresa</option>
                {uniqueDuns.map(dun => (
                    <option key={dun} value={dun}>{dun}</option>
                ))}
            </select>
            {selectedDun && dunTotalMargin !== null && (
                <div className="pill" style={{ background: 'rgba(110,231,255,.1)', borderColor: 'rgba(110,231,255,.25)', color: 'var(--accent)', padding: '10px 12px', fontSize: '12px', marginLeft: 'auto' }}>
                    Margen Op. Total del DUN: <strong style={{fontWeight: 900, marginLeft: '6px'}}>{fmtM(dunTotalMargin, displayMillions)}</strong>
                </div>
            )}
        </div>
    );
};

export default DunFilterBar;
