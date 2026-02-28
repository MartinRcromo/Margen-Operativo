
import React, { useState } from 'react';
import { Summary, CalculationResult, Scenario } from '../types';
import { fmtM } from '../utils/helpers';

interface AiPanelProps {
    summary: Summary | null;
    frozenSummary: Summary | null;
    result: CalculationResult | null;
    globalScenario: Scenario;
    gastosOperativosPct: number;
    selectedDun: string;
    displayMillions: boolean;
}

const SYSTEM_PROMPT = `Sos un analista de rentabilidad operativa especializado en distribución y logística en Argentina.
Tu rol: analizar el P&L por línea de producto y dar recomendaciones claras, concretas y accionables.
Reglas:
- Respondé siempre en español rioplatense
- Usá millones de $ como unidad (ej: "$14M" no "$14,000,000")
- Máximo 4 párrafos breves, sin listas si no son necesarias
- Priorizá recomendaciones accionables en el corto plazo (precio, costo, mix de producto)
- Si el margen es negativo, comenzá con urgencia. Si es sólido, enfocate en oportunidades.
- No uses jerga financiera técnica — hablá como gerente de distribución`;

const AiPanel: React.FC<AiPanelProps> = ({
    summary, frozenSummary, result, globalScenario,
    gastosOperativosPct, selectedDun, displayMillions,
}) => {
    const [question, setQuestion] = useState('');
    const [response, setResponse] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
    const hasKey = Boolean(apiKey);
    const money = (n?: number | null) => fmtM(n, displayMillions);

    const buildContext = (): string => {
        if (!summary || !result) return '';

        const totalCMV = summary.totalVenta - summary.totalResultado;
        const cmvPct   = summary.totalVenta > 0 ? (totalCMV / summary.totalVenta) * 100 : 0;
        const cmPct    = summary.totalVenta > 0 ? (summary.totalResultado / summary.totalVenta) * 100 : 0;
        const moPct    = (summary.margenOperPctGlobal * 100).toFixed(1);

        const dunLabel = selectedDun ? ` — DUN: ${selectedDun}` : ' — Vista Global';

        // Top 5 products by MargenOper
        const topProds = [...result.allProds]
            .filter(p => p.Activo)
            .sort((a, b) => (b.MargenOper ?? 0) - (a.MargenOper ?? 0))
            .slice(0, 5);

        const prodLines = topProds.map((p, i) => {
            const pMo = (p.Venta as number) > 0
                ? ((p.MargenOper ?? 0) / (p.Venta as number) * 100).toFixed(1)
                : '0.0';
            const roi = p.ROI !== null && p.ROI !== undefined
                ? `ROI ${(p.ROI * 100).toFixed(0)}%`
                : 'Sin stock val.';
            return `  ${i + 1}. ${p.Producto}: ${money(p.MargenOper)} (${pMo}%) — ${roi}`;
        }).join('\n');

        // Worst products (bottom 3)
        const worstProds = [...result.allProds]
            .filter(p => p.Activo)
            .sort((a, b) => (a.MargenOper ?? 0) - (b.MargenOper ?? 0))
            .slice(0, 3);

        const worstLines = worstProds.map(p => {
            const pMo = (p.Venta as number) > 0
                ? ((p.MargenOper ?? 0) / (p.Venta as number) * 100).toFixed(1)
                : '0.0';
            return `  - ${p.Producto}: ${money(p.MargenOper)} (${pMo}%)`;
        }).join('\n');

        // Active scenario info
        const scenarioLines: string[] = [];
        if (globalScenario.ventaPct !== 0) scenarioLines.push(`  - Precio: ${globalScenario.ventaPct > 0 ? '+' : ''}${globalScenario.ventaPct}%`);
        if (globalScenario.bultosPct !== 0) scenarioLines.push(`  - Volumen/Bultos: ${globalScenario.bultosPct > 0 ? '+' : ''}${globalScenario.bultosPct}%`);
        if (globalScenario.costoPct !== 0) scenarioLines.push(`  - CMV: ${globalScenario.costoPct > 0 ? '+' : ''}${globalScenario.costoPct}%`);
        if (gastosOperativosPct !== 0) scenarioLines.push(`  - Gastos operativos: ${gastosOperativosPct > 0 ? '+' : ''}${gastosOperativosPct}%`);

        const hasScenario = scenarioLines.length > 0;

        // Comparison vs frozen
        let compareSection = '';
        if (frozenSummary) {
            const baseMoPct = (frozenSummary.margenOperPctGlobal * 100).toFixed(1);
            const delta = ((summary.margenOperPctGlobal - frozenSummary.margenOperPctGlobal) * 100).toFixed(1);
            const sign = Number(delta) >= 0 ? '+' : '';
            compareSection = `
## COMPARACIÓN VS BASE CONGELADA
- Margen base: ${money(frozenSummary.totalMargenOper)} (${baseMoPct}%)
- Margen actual: ${money(summary.totalMargenOper)} (${moPct}%)
- Delta: ${sign}${delta}pp`;
        }

        return `## P&L ACTUAL${dunLabel}
- Venta: ${money(summary.totalVenta)}
- CMV: ${money(totalCMV)} (${cmvPct.toFixed(1)}% de venta)
- Contribución Marginal: ${money(summary.totalResultado)} (${cmPct.toFixed(1)}%)
- Gastos Operativos: ${money(summary.totalGastosOperativos)}
- **Margen Operativo: ${money(summary.totalMargenOper)} (${moPct}%)**
${!selectedDun ? `- Gastos Fijos: ${money(summary.totalFijos)}\n- Resultado Final: ${money(summary.resultadoFinal)}` : ''}
- Líneas activas: ${summary.activos} de ${summary.tot}
${compareSection}
${hasScenario ? `## ESCENARIO SIMULADO ACTIVO\n${scenarioLines.join('\n')}` : '## SIN ESCENARIO ACTIVO (datos reales)'}

## TOP 5 PRODUCTOS (mayor margen operativo)
${prodLines}

## BOTTOM 3 PRODUCTOS (menor margen operativo)
${worstLines}

## PREGUNTA
${question.trim() || 'Haceme un análisis ejecutivo del escenario. ¿Qué destacás? ¿Cuáles son las 2 o 3 acciones más importantes que recomendás?'}`;
    };

    const handleAnalyze = async () => {
        if (!apiKey || !summary) return;
        setLoading(true);
        setError('');
        setResponse('');

        try {
            const res = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'x-api-key': apiKey,
                    'anthropic-version': '2023-06-01',
                    'anthropic-dangerous-direct-browser-access': 'true',
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 700,
                    system: SYSTEM_PROMPT,
                    messages: [{ role: 'user', content: buildContext() }],
                }),
            });

            if (!res.ok) {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData?.error?.message || `Error ${res.status}`);
            }

            const data = await res.json();
            setResponse(data.content?.[0]?.text ?? '');
        } catch (e: any) {
            setError(e.message ?? 'Error desconocido al contactar la API');
        } finally {
            setLoading(false);
        }
    };

    const hasScenario = globalScenario.ventaPct !== 0 || globalScenario.bultosPct !== 0
        || globalScenario.costoPct !== 0 || gastosOperativosPct !== 0;

    return (
        <div className="card">
            <div className="card-header">
                <h2>Análisis IA</h2>
                <span className="pill" style={{ fontSize: '10px', gap: '4px' }}>
                    <span style={{ opacity: 0.6 }}>claude-haiku</span>
                </span>
            </div>

            {!hasKey ? (
                <div style={{ padding: '16px', background: 'rgba(251,191,36,0.08)', border: '1px solid var(--warn)', borderRadius: '8px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--warn)', marginBottom: '6px' }}>API key no configurada</div>
                    <div className="footnote">
                        Configurá <code style={{ background: 'var(--bg)', padding: '1px 4px', borderRadius: '4px' }}>VITE_ANTHROPIC_API_KEY</code> en las variables de entorno de Netlify y redesployá.
                    </div>
                </div>
            ) : !summary ? (
                <div className="placeholder-card">Cargá datos para usar el análisis IA.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

                    {/* Optional custom question */}
                    <div>
                        <textarea
                            value={question}
                            onChange={e => setQuestion(e.target.value)}
                            placeholder='Pregunta opcional — ej: "¿Por qué bajó el margen de Ópticas?" o dejalo vacío para análisis general'
                            rows={2}
                            style={{
                                width: '100%',
                                background: 'var(--bg)',
                                color: 'var(--text)',
                                border: '1px solid var(--border)',
                                borderRadius: '8px',
                                padding: '10px 12px',
                                fontSize: '12px',
                                fontFamily: 'inherit',
                                resize: 'vertical',
                                boxSizing: 'border-box',
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                            className="btn primary"
                            onClick={handleAnalyze}
                            disabled={loading}
                            style={{ fontSize: '12px', padding: '7px 14px' }}
                        >
                            {loading ? 'Analizando...' : hasScenario ? 'Analizar escenario simulado' : 'Analizar situación actual'}
                        </button>
                        {hasScenario && (
                            <span className="pill warn" style={{ fontSize: '10px' }}>
                                <span className="dot"></span>Escenario activo incluido
                            </span>
                        )}
                        {frozenSummary && (
                            <span className="pill" style={{ fontSize: '10px' }}>
                                <span className="dot" style={{ background: 'var(--accent)' }}></span>Comparación vs base
                            </span>
                        )}
                    </div>

                    {/* Response */}
                    {loading && (
                        <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '12px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid var(--muted)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            Claude está analizando...
                        </div>
                    )}

                    {error && (
                        <div style={{ color: 'var(--bad)', fontSize: '12px', padding: '10px 12px', background: 'rgba(251,113,133,0.08)', borderRadius: '8px', border: '1px solid var(--bad)' }}>
                            {error}
                        </div>
                    )}

                    {response && !loading && (
                        <div style={{
                            fontSize: '13px', lineHeight: '1.65',
                            padding: '14px 16px',
                            background: 'rgba(110,231,255,0.05)',
                            border: '1px solid rgba(110,231,255,0.15)',
                            borderRadius: '10px',
                            whiteSpace: 'pre-wrap',
                        }}>
                            {response}
                        </div>
                    )}

                    <div className="footnote">
                        El análisis usa los datos del escenario vigente.
                        {selectedDun ? ` Contexto: DUN "${selectedDun}".` : ' Contexto: vista consolidada.'}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiPanel;
