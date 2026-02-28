
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

type Difficulty = { label: string; color: string };

const getDifficulty = (pct: number): Difficulty => {
    if (pct > SLIDER_CAP) return { label: 'Fuera de rango', color: 'var(--muted)' };
    if (pct <= 3)          return { label: 'Alcanzable',    color: 'var(--good)' };
    if (pct <= 10)         return { label: 'Moderado',      color: '#fbbf24' };
    if (pct <= 20)         return { label: 'Exigente',      color: '#f97316' };
    return                        { label: 'Difícil',       color: 'var(--bad)' };
};

type LeverDef = {
    key: string;
    label: string;
    sublabel: string;
    value: number;      // always absolute (positive)
    isCost: boolean;
    onApply?: (v: number) => void;
};

const ObjetivoPanel: React.FC<ObjetivoPanelProps> = ({
    summary, selectedDun, displayMillions,
    onApplyPrecio, onApplyVolumen, onApplyCmv, onApplyGastos,
}) => {
    const [targetPct, setTargetPct] = useState<number>(10);
    const [isOpen, setIsOpen] = useState(false);

    const money = (n?: number | null) => fmtM(n, displayMillions);

    if (!summary) return null;

    const currentMargenPct  = summary.margenOperPctGlobal;
    const currentVenta      = summary.totalVenta;
    const currentCMV        = currentVenta - summary.totalResultado;
    const currentGastosOper = summary.totalGastosOperativos;
    const currentMargenOper = summary.totalMargenOper;

    const targetMargenAbs = currentVenta * (targetPct / 100);
    const gap             = targetMargenAbs - currentMargenOper;
    const targetReached   = gap <= 0;

    // ── Lever calculations (approximations) ───────────────────────────────────
    const rawPrecio  = currentVenta > 0 ? (gap / currentVenta) * 100 : null;
    const rawVolumen = (currentVenta > 0 && currentMargenPct > 0)
        ? (gap / (currentVenta * currentMargenPct)) * 100
        : null;
    const rawCmv     = currentCMV > 0 ? (gap / currentCMV) * 100 : null;
    const rawGastos  = currentGastosOper > 0 ? (gap / currentGastosOper) * 100 : null;

    // Build lever list (only defined values), then sort easiest → hardest
    const leversRaw: LeverDef[] = [
        rawPrecio !== null ? {
            key: 'precio', label: 'Solo precio de venta',
            sublabel: 'Subir precio promedio sin tocar volumen ni costos',
            value: rawPrecio, isCost: false,
            onApply: (v) => onApplyPrecio(parseFloat(v.toFixed(1))),
        } : null,
        rawVolumen !== null ? {
            key: 'volumen', label: 'Solo volumen (bultos)',
            sublabel: 'Vender más unidades manteniendo precio y estructura de costos',
            value: rawVolumen, isCost: false,
            onApply: (v) => onApplyVolumen(parseFloat(v.toFixed(1))),
        } : null,
        rawCmv !== null ? {
            key: 'cmv', label: 'Solo reducción de CMV',
            sublabel: 'Negociar con proveedores o mejorar la eficiencia de compra',
            value: rawCmv, isCost: true,
            onApply: (v) => onApplyCmv(parseFloat(v.toFixed(1))),
        } : null,
        rawGastos !== null ? {
            key: 'gastos', label: 'Solo reducción de gastos operativos',
            sublabel: 'Reducir logística, sueldos indirectos y gastos asignados',
            value: rawGastos, isCost: true,
            onApply: (v: number) => onApplyGastos(parseFloat(v.toFixed(1))),
        } : null,
    ].filter(Boolean) as LeverDef[];

    // Sort by required % change ascending (easiest first)
    const levers = [...leversRaw].sort((a, b) => a.value - b.value);

    // ── Combinations ──────────────────────────────────────────────────────────
    type Combo = { label: string; desc: string; parts: { name: string; sign: string; pct: number; color: string }[]; maxPct: number };

    const combos: Combo[] = [];
    if (rawPrecio !== null && rawCmv !== null) {
        [
            { label: '70% precio + 30% CMV',   pP: 0.7, pC: 0.3 },
            { label: '50% precio + 50% CMV',   pP: 0.5, pC: 0.5 },
            { label: '30% precio + 70% CMV',   pP: 0.3, pC: 0.7 },
        ].forEach(({ label, pP, pC }) => {
            const pp = rawPrecio * pP;
            const pc = rawCmv   * pC;
            combos.push({
                label,
                desc: 'Distribye el esfuerzo entre precio y costo de mercadería',
                parts: [
                    { name: 'Precio', sign: '+', pct: pp, color: 'var(--accent)' },
                    { name: 'CMV',    sign: '-', pct: pc, color: 'var(--good)'   },
                ],
                maxPct: Math.max(pp, pc),
            });
        });
    }
    if (rawPrecio !== null && rawVolumen !== null) {
        const pp = rawPrecio  / 2;
        const pv = rawVolumen / 2;
        combos.push({
            label: '50% precio + 50% volumen',
            desc: 'Combiná incremento de precio con mayor penetración de mercado',
            parts: [
                { name: 'Precio',  sign: '+', pct: pp, color: 'var(--accent)' },
                { name: 'Volumen', sign: '+', pct: pv, color: '#a78bfa'       },
            ],
            maxPct: Math.max(pp, pv),
        });
    }
    // Sort combos easiest → hardest by their hardest lever
    combos.sort((a, b) => a.maxPct - b.maxPct);

    // ── Render lever card ─────────────────────────────────────────────────────
    const renderLever = (def: LeverDef, rank: number) => {
        const outOfRange = def.value > SLIDER_CAP;
        const canApply   = !outOfRange && !selectedDun && !!def.onApply;
        const diff       = getDifficulty(def.value);
        const displayVal = outOfRange
            ? `> ${SLIDER_CAP}%`
            : `${def.isCost ? '-' : '+'}${def.value.toFixed(1)}%`;

        return (
            <div
                key={def.key}
                style={{
                    border: `1px solid ${outOfRange ? 'var(--border)' : diff.color}22`,
                    borderLeft: `3px solid ${diff.color}`,
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    opacity: outOfRange ? 0.45 : 1,
                    background: 'var(--bg)',
                }}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--muted)', minWidth: '18px' }}>
                            #{rank}
                        </span>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{def.label}</span>
                        <span style={{
                            fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                            borderRadius: '4px', background: `${diff.color}22`,
                            color: diff.color, letterSpacing: '0.04em',
                        }}>
                            {diff.label.toUpperCase()}
                        </span>
                    </div>
                    <div className="footnote" style={{ paddingLeft: '26px' }}>{def.sublabel}</div>
                    {outOfRange && (
                        <div className="footnote" style={{ color: 'var(--bad)', paddingLeft: '26px', marginTop: '3px' }}>
                            Requiere más del ±{SLIDER_CAP}% — fuera del rango del simulador
                        </div>
                    )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    <span style={{
                        fontSize: '18px', fontWeight: 700, fontFamily: 'monospace',
                        color: def.isCost ? 'var(--good)' : 'var(--accent)',
                        minWidth: '80px', textAlign: 'right',
                    }}>
                        {displayVal}
                    </span>
                    {canApply && (
                        <button
                            className="btn"
                            style={{ fontSize: '11px', padding: '4px 10px' }}
                            onClick={() => def.onApply!(def.value)}
                            title="Aplica este valor en el simulador global"
                        >
                            Aplicar
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const renderCombo = (combo: Combo, idx: number) => {
        const diff = getDifficulty(combo.maxPct);
        return (
            <div
                key={idx}
                style={{
                    border: `1px solid ${diff.color}22`,
                    borderLeft: `3px solid ${diff.color}`,
                    borderRadius: '8px',
                    padding: '11px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: '12px',
                    background: 'var(--bg)',
                }}
            >
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>{combo.label}</span>
                        <span style={{
                            fontSize: '9px', fontWeight: 700, padding: '2px 6px',
                            borderRadius: '4px', background: `${diff.color}22`,
                            color: diff.color, letterSpacing: '0.04em',
                        }}>
                            {diff.label.toUpperCase()}
                        </span>
                    </div>
                    <div className="footnote">{combo.desc}</div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexShrink: 0, alignItems: 'center' }}>
                    {combo.parts.map(p => (
                        <span key={p.name} style={{ fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: p.color }}>
                            {p.name} {p.sign}{p.pct.toFixed(1)}%
                        </span>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="card">
            {/* ── Header ───────────────────────────────────────── */}
            <div
                className="card-header"
                style={{ cursor: 'pointer', userSelect: 'none' }}
                onClick={() => setIsOpen(o => !o)}
            >
                <h2>Modo Objetivo</h2>
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

                    {/* ── Target input ─────────────────────────────── */}
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
                                Brecha: <b style={{ color: 'var(--bad)' }}>{money(gap)}</b>
                            </span>
                        )}
                    </div>

                    {/* ── Result ───────────────────────────────────── */}
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
                            {/* Section: Single levers ranked */}
                            <div>
                                <div className="footnote" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '9px' }}>
                                    Palancas individuales — ordenadas de más fácil a más difícil
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {levers.map((def, idx) => renderLever(def, idx + 1))}
                                </div>
                            </div>

                            {/* Section: Combinations */}
                            {combos.length > 0 && (
                                <div>
                                    <div className="footnote" style={{ marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '9px' }}>
                                        Combinaciones — de menor a mayor esfuerzo
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {combos.map((c, i) => renderCombo(c, i))}
                                    </div>
                                </div>
                            )}

                            <div className="footnote">
                                * Aproximaciones sobre el escenario vigente. Los valores reales varían con la interacción entre drivers.
                                {selectedDun
                                    ? ' En vista DUN, usá los sliders manualmente en "Escenarios".'
                                    : ' "Aplicar" mueve el slider global correspondiente.'
                                }
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ObjetivoPanel;
