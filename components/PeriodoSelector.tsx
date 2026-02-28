import React, { useEffect, useState } from 'react';
import { getPeriodos, deletePeriodo } from '../services/dataService';
import { Periodo } from '../types';

interface PeriodoSelectorProps {
    selectedPeriodoId: string;
    onSelect: (periodoId: string) => void;
    onRefresh?: number; // bump this value to force a reload
}

const PeriodoSelector: React.FC<PeriodoSelectorProps> = ({ selectedPeriodoId, onSelect, onRefresh }) => {
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        getPeriodos()
            .then(setPeriodos)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [onRefresh]);

    const handleDelete = async (e: React.MouseEvent, id: string, nombre: string) => {
        e.stopPropagation();
        if (!window.confirm(`¿Eliminar el periodo "${nombre}" y todos sus datos?`)) return;
        try {
            await deletePeriodo(id);
            setPeriodos(prev => prev.filter(p => p.id !== id));
            if (selectedPeriodoId === id) onSelect('');
        } catch (err: any) {
            alert(`Error al eliminar: ${err.message}`);
        }
    };

    if (loading) return <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Cargando periodos...</span>;
    if (periodos.length === 0) return null;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <select
                className="pill"
                value={selectedPeriodoId}
                onChange={e => onSelect(e.target.value)}
                style={{ cursor: 'pointer', paddingRight: '8px' }}
            >
                <option value="">— Seleccionar periodo —</option>
                {periodos.map(p => (
                    <option key={p.id} value={p.id}>
                        {p.nombre} ({p.periodo_key})
                    </option>
                ))}
            </select>
            {selectedPeriodoId && (
                <button
                    className="btn"
                    title="Eliminar periodo"
                    onClick={e => {
                        const p = periodos.find(x => x.id === selectedPeriodoId);
                        if (p) handleDelete(e, p.id, p.nombre);
                    }}
                    style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--bad)' }}
                >
                    Eliminar
                </button>
            )}
        </div>
    );
};

export default PeriodoSelector;
