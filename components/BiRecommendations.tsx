
import React, { useMemo, useState } from 'react';
import { CalculationResult, Insight } from '../types';
import InsightDetailModal from './InsightDetailModal';

interface BiRecommendationsProps {
    result: CalculationResult | null;
    selectedDun: string;
}

const BiRecommendations: React.FC<BiRecommendationsProps> = ({ result, selectedDun }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);

    const handleInsightClick = (insight: Insight) => {
        setSelectedInsight(insight);
        setIsModalOpen(true);
    };

    const insights = useMemo(() => {
        if (!result) return [];
        const { allProds, summary } = result;
        const list: Insight[] = [];

        // 1. Análisis de ROI Crítico
        const lowRoiProds = allProds.filter(p => p.Activo && p.ROI !== null && p.ROI < 0.05);
        if (lowRoiProds.length > 0) {
            list.push({
                type: 'bad',
                title: 'Alerta de ROI Crítico',
                text: `${lowRoiProds.length} línea(s) rinden < 5% sobre capital inmovilizado. Considere liquidar stock o subir precios.`,
                details: `Un ROI (Retorno sobre la Inversión) bajo indica que el capital inmovilizado en el stock de estas líneas no está generando una rentabilidad adecuada. Esto puede deberse a un margen operativo bajo o una rotación de inventario lenta.\n\nAcciones recomendadas:\n1) Analizar la posibilidad de aumentar los precios de venta.\n2) Implementar promociones para acelerar la rotación del stock.\n3) Considerar la descontinuación de la línea si las mejoras no son viables.`
            });
        }

        // 2. Análisis de Peso Logístico
        const highLogistics = allProds.filter(p => p.Activo && p.GastosAsignados! > (p.Resultado! * 0.6));
        if (highLogistics.length > 0) {
            list.push({
                type: 'warn',
                title: 'Eficiencia Operativa',
                text: `Líneas como "${highLogistics[0].Producto}" consumen >60% de su CM en gastos operativos. Optimice drivers de Bultos/Volumen.`,
                details: `Cuando los gastos logísticos y operativos (asignados por drivers) consumen una porción muy alta de la Contribución Marginal, la rentabilidad neta de la línea se ve afectada. Esto sugiere que el costo de 'mover' el producto es desproporcionado a la ganancia que genera.\n\nAcciones recomendadas:\n1) Revisar los drivers de asignación para asegurar que sean correctos.\n2) Negociar mejores tarifas de fletes y optimizar rutas.\n3) Optimizar los procesos de picking y packing para reducir el costo por bulto.`
            });
        }

        // 3. Recomendación de Foco
        const stars = [...allProds].filter(p => p.Activo && p.ROI !== null && p.ROI > 0).sort((a, b) => (b.ROI || 0) - (a.ROI || 0)).slice(0, 1);
        if (stars.length > 0) {
            list.push({
                type: 'good',
                title: 'Oportunidad de Crecimiento',
                text: `Incremente inversión en "${stars[0].Producto}". Su ROI de ${(stars[0].ROI! * 100).toFixed(0)}% es el motor del Resultado Neto.`,
                details: `Estas líneas son las 'estrellas' de su cartera. Generan la mayor rentabilidad por cada peso invertido en stock, convirtiéndolas en el motor principal de crecimiento. Potenciar estas líneas puede tener un impacto significativo en el resultado final.\n\nAcciones recomendadas:\n1) Aumentar la inversión en inventario para evitar quiebres de stock.\n2) Priorizar estas líneas en campañas de marketing y ventas.\n3) Analizar la posibilidad de expandir la línea con productos similares.`
            });
        }

        // 4. Análisis de Punto de Equilibrio Fijo (Solo para vista consolidada)
        if (!selectedDun && summary.totalFijos > summary.totalMargenOper) {
            list.push({
                type: 'bad',
                title: 'Déficit de Estructura',
                text: 'El Margen Operativo no cubre los Gastos Fijos. Se requiere un aumento del ' + (((summary.totalFijos / summary.totalMargenOper) - 1) * 100).toFixed(0) + '% en volumen o margen.',
                details: `Esta es una situación crítica. La suma de los márgenes operativos de todas las líneas activas no es suficiente para cubrir los costos fijos. La operación, en su totalidad, está generando pérdidas.\n\nAcciones recomendadas:\n1) Usar el simulador global para proyectar un aumento de ventas o reducción de CMV general.\n2) Realizar una revisión profunda de la estructura de gastos fijos para identificar posibles reducciones.\n3) Potenciar las líneas de mayor margen para que contribuyan más a cubrir los costos fijos.`
            });
        }

        return list;
    }, [result, selectedDun]);

    if (!result) {
        return (
            <div className="card">
                <div className="card-header">
                    <h2>{selectedDun ? `Puntos Destacados: ${selectedDun}` : 'Puntos Destacados'}</h2>
                </div>
                <div className="placeholder-card" style={{minHeight:'220px'}}>
                    Análisis pendiente de datos...
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="card flex flex-col h-full">
                <div className="card-header">
                    <h2>{selectedDun ? `Puntos Destacados: ${selectedDun}` : 'Puntos Destacados'}</h2>
                </div>
                <div className="flex flex-col gap-3 overflow-y-auto pr-1">
                    {insights.length > 0 ? insights.map((insight, i) => (
                        <div key={i} 
                             className={`p-3 rounded-xl border-l-4 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                insight.type === 'bad' ? 'bg-rose-500/5 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.1)]' : 
                                insight.type === 'warn' ? 'bg-amber-500/5 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]' : 
                                'bg-emerald-500/5 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                             }`}
                             onDoubleClick={() => handleInsightClick(insight)}
                        >
                            <div className="flex items-center gap-2 mb-1.5">
                                <span className={`w-2 h-2 rounded-full ${
                                    insight.type === 'bad' ? 'bg-rose-500' : 
                                    insight.type === 'warn' ? 'bg-amber-500' : 
                                    'bg-emerald-500'
                                }`}></span>
                                <h3 className={`text-[11px] font-bold uppercase tracking-wider ${
                                    insight.type === 'bad' ? 'text-rose-400' : 
                                    insight.type === 'warn' ? 'text-amber-400' : 
                                    'text-emerald-400'
                                }`}>{insight.title}</h3>
                            </div>
                            <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                                {insight.text}
                            </p>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center py-12 text-slate-500 italic text-xs">
                            {selectedDun ? 'Rentabilidad equilibrada para este DUN.' : 'Estructura de rentabilidad equilibrada.'}
                        </div>
                    )}
                </div>
                <div className="mt-auto pt-4">
                    <p className="text-[10px] text-slate-500 italic">
                        * Sugerencias automáticas basadas en la salud del margen y drivers {selectedDun ? 'para el DUN seleccionado' : 'consolidados'}.
                    </p>
                </div>
            </div>
            
            <InsightDetailModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                insight={selectedInsight}
            />
        </>
    );
};

export default BiRecommendations;
