
import React, { useState } from 'react';
import { Summary } from '../types';
import { fmtM } from '../utils/helpers';

interface ObjetivoPanelProps {
    summary: Summary | null;
    selectedDun: string;
    displayMillions: boolean;
    onApplyPrecio: (pct: number) => void;
    onApplyVolumen: (pct: number) => void;
    onApplyCmv: (reductionPct: number) => void;
    onApplyGastos: (reductionPct: number) => void;
}

const SLIDER_CAP = 50;

const ObjetivoPanel: React.FC<ObjetivoPanelProps> = ({
    summary, selectedDun, displayMillions,
    onApplyPrecio, onApplyVolumen, onApplyCmv, onApplyGastos,
}) => {
    const [targetPct, setTargetPct] = useState<number>(10);
    const [isOpen, setIsOpen] = useState(false);

    const money = (n?: number | null) => fmtM(n, displayMillions);

    if (!summary) return null;

    const currentMargenPct   = summary.margenOperPctGlobal;
    const currentVenta       = summary.totalVenta;
    const currentCMV         = currentVenta - summary.totalResultado;
    const currentGastosOper  = summary.totalGastosOperativos;
    const currentMargenOper  = summary.totalMargenOper;

    const targetMargenAbs    = currentVenta * (targetPct / 100);
    const gap                = targetMargenAbs - currentMargenOper;
    const targetReached      = gap <= 0;

    // ── Lever calculations (approximations) ──────────────────────────────────
    // Solo precio: price increase flows directly to margin (fixed costs & volume)
    const levPrecio   = currentVenta > 0 ? (gap / currentVenta) * 100 : null;

    // Solo volumen: net gain per peso = currentMargenPct (proportional scaling)
    const levVolumen  = (currentVenta > 0 && currentMargenPct > 0)
        ? (gap / (currentVenta * currentMargenPct)) * 100
        : null;

    // Solo CMV: each peso less in CMV = one more peso in margin
    const levCmv      = currentCMV > 0 ? (gap / currentCMV) * 100 : null;

    // Solo gastos operativos: direct reduction
    const levGastos   = currentGastosOper > 0 ? (gap / currentGastosOper) * 100 : null;

    // Combinación balanceada: 50% price + 50% CMV
    const levCombPrecio = levPrecio !== null ? levPrecio / 2 : null;
    const levCombCmv    = levCmv    !== null ? levCmv    / 2 : null;

    type LeverDef = {
        key: string;
        label: string;
        sublabel: string;
        value: number | null;
        isCost: boolean;
        onApply?: (v: number) => void;
    };

    const levers: LeverDef[] = [
        {
            key: 'precio',
            label: 'Solo precio de venta',
            sublabel: 'Aumentar precio promedio sin cambiar volumen ni costos',
            value: levPrecio,
            isCost: false,
            onApply: (v) => onApplyPrecio(parseFloat(v.toFixed(1))),
        },
        {
            key: 'volumen',
            label: 'Solo volumen (bultos)',
            sublabel: 'Vender más unidades manteniendo precio y estructura de costos',
            value: levVolumen,
            isCost: false,
            onApply: (v) => onApplyVolumen(parseFloat(v.toFixed(1))),
        },
        {
            key: 'cmv',
            label: 'Solo reducción de CMV',
            sublabel: 'Negociar o reducir el costo de la mercadería vendida',
            value: levCmv,
            isCost: true,
            onApply: (v) => onApplyCmv(parseFloat(v.toFixed(1))),
        },
        ...(levGastos !== null ? [{
            key: 'gastos',
            label: 'Solo reducción de gastos operativos',
            sublabel: 'Reducir logística, sueldos indirectos y gastos asignados',
            value: levGastos,
            isCost: true,
            onApply: (v: number) => onApplyGastos(parseFloat(v.toFixed(1))),
        }] : []),
    ];

    const renderLever = (def: LeverDef) => {
        if (def.value === null) return null;
        const outOfRange = def.value > SLIDER_CAP;
        // Global-only apply (DUN sliders are in GlobalScenarios)
        const canApply = !outOfRange && !selectedDun && !!def.onApply;
        const sign     = def.isCost ? '-' : '+';
        const displayVal = outOfRange
            ? `> ${SLIDER_CAP}%`
            : `${sign}${Math.abs(def.value).toFixed(1)}%`;

        return (
            <div
                key={def.key}
                style={{
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: outOfRange ? 0.5 : 1,
                    background: 'var(--bg)',
                }}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>{def.label}</div>
                    <div className="footnote">{def.sublabel}</div>
                    {outOfRange && (
                        <div className="footnote" style={{ color: 'var(--bad)', marginTop: '3px' }}>
                            Fuera del rango del simulador (±{SLIDER_CAP}%)
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{
                        fontSize: '17px', fontWeight: 700, fontFamily: 'monospace',
                        color: def.isCost ? 'var(--good)' : 'var(--accent)',
                        minWidth: '85px', textAlign: 'right',
                    }}>
                        {displayVal}
                    </span>
                    {canApply && (
                        <button
                            className="btn"
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                            onClick={() => def.onApply!(def.value!)}
                            title="Aplica este valor al simulador global"
                        >
                            Aplicar
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            {/* ── Header ──────────────────────────────────────── */}
            <div
                className="card-header"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setIsOpen(o => !o)}
            >
                <h2>Calculadora de Objetivo</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="footnote">
                        Margen actual:&nbsp;
                        <b style={{ color: currentMargenPct < 0 ? 'var(--bad)' : 'var(--good)' }}>
                            {(currentMargenPct * 100).toFixed(1)}%
                        </b>
                    </span>
                    <span style={{ fontSize: '13px', color: 'var(--muted)' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
            </div>

            {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    {/* ── Target input ────────────────────────────── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px' }}>Quiero llegar a</span>
                        <input
                            type="number"
                            value={targetPct}
                            onChange={e => setTargetPct(Number(e.target.value))}
                            min={0} max={100} step={0.5}
                            style={{
                                width: '72px',
                                background: 'var(--card)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                                borderRadius: '6px',
                                padding: '6px 8px',
                                fontSize: '15px',
                                fontFamily: 'monospace',
                                textAlign: 'right',
                            }}
                        />
                        <span style={{ fontSize: '13px' }}>% de margen operativo</span>
                        <span className="footnote">
                            Objetivo: <b>{money(targetMargenAbs)}</b>
                        </span>
                        {!targetReached && (
                            <span className="footnote">
                                Brecha a cerrar: <b style={{ color: 'var(--bad)' }}>{money(gap)}</b>
                            </span>
                        )}
                    </div>

                    {/* ── Result ──────────────────────────────────── */}
                    {targetReached ? (
                        <div style={{
                            padding: '14px 16px', borderRadius: '8px',
                            background: 'rgba(52,211,153,0.1)', border: '1px solid var(--good)',
                        }}>
                            <span style={{ color: 'var(--good)', fontWeight: 600 }}>
                                ✓ El escenario actual ya supera el objetivo ({(currentMargenPct * 100).toFixed(1)}% ≥ {targetPct}%)
                            </span>
                        </div>
                    ) : (
                        <>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                                gap: '10px',
                            }}>
                                {levers.map(def => renderLever(def))}
                            </div>

                            {/* Combinación balanceada */}
                            {levCombPrecio !== null && levCombCmv !== null && (
                                <div style={{
                                    border: '1px solid var(--accent)',
                                    borderRadius: '8px', padding: '12px 14px',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px',
                                }}>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '3px' }}>
                                            Combinación balanceada
                                        </div>
                                        <div className="footnote">50% vía precio + 50% vía reducción de CMV</div>
                                    </div>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'monospace', flexShrink: 0 }}>
                                        Precio +{levCombPrecio.toFixed(1)}% · CMV -{levCombCmv.toFixed(1)}%
                                    </span>
                                </div>
                            )}

                            <div className="footnote">
                                * Aproximaciones basadas en el escenario vigente. Los valores reales varían según la interacción entre drivers de gastos.
                                {selectedDun
                                    ? ' En vista DUN, ajustá los sliders manualmente en "Escenarios".'
                                    : ' El botón "Aplicar" mueve el slider global correspondiente.'}
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ObjetivoPanel;
