
import React, { useState } from 'react';
import { Product, Scenario } from '../types';
import { fmtM } from '../utils/helpers';
import ScenarioSlider from './ScenarioSlider';

interface ProductScenarioPanelProps {
    product: Product | null;
    scenario: Scenario | undefined;
    onScenarioChange: (productName: string, newScenario: Scenario) => void;
    onClose: () => void;
    displayMillions: boolean;
    selectedDun: string;
}

const globalScenarioDefs = [
    { key: "ventaPct", label: "Venta (Precio) %" },
    { key: "costoPct", label: "CMV %" },
    { key: "volVentaPct", label: "VolVenta %" },
    { key: "volStockPct", label: "VolStock %" },
    { key: "stockValPct", label: "StockVal %" },
    { key: "bultosPct", label: "Bultos %" },
];

const dunProductScenarioDefs = [
    { key: "precioPromedioPct", label: "Precio Promedio %" },
    { key: "bultosPct", label: "Bultos %" },
    { key: "costoPct", label: "CMV %" },
    { key: "stockValPct", label: "StockVal %" },
];


const ProductScenarioPanel: React.FC<ProductScenarioPanelProps> = ({ product, scenario, onScenarioChange, onClose, displayMillions, selectedDun }) => {
    const [activeTab, setActiveTab] = useState<'scenario' | 'detail'>('scenario');
    const [isDirectCostExpanded, setDirectCostExpanded] = useState(false);
    const [isAssignedExpensesExpanded, setAssignedExpensesExpanded] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    
    const isInDunContext = selectedDun && product?.DUN === selectedDun;
    const scenarioDefs = isInDunContext ? dunProductScenarioDefs : globalScenarioDefs;

    const handleSliderChange = (key: keyof Scenario, value: number) => {
        if (!product) return;
        const baseScenario = {
            ventaPct: 0, costoPct: 0, volVentaPct: 0, volStockPct: 0, stockValPct: 0, bultosPct: 0, precioPromedioPct: 0,
            ...(scenario || {})
        };
        const newScenario = { ...baseScenario, [key]: value };
        onScenarioChange(product.Producto, newScenario);
    };
    
    const handleReset = () => {
        if (!product) return;
        onScenarioChange(product.Producto, { ventaPct: 0, costoPct: 0, volVentaPct: 0, volStockPct: 0, stockValPct: 0, bultosPct: 0, precioPromedioPct: 0 });
    };

    // Reset states when product changes
    React.useEffect(() => {
        setActiveTab('scenario');
        setDirectCostExpanded(false);
        setAssignedExpensesExpanded(false);
    }, [product?.Producto]);


    const money = (n?: number | null) => fmtM(n, displayMillions);
    
    const CostDetailView = () => {
        if (!product) return null;
        const totalCost = (product.Costo as number || 0) + (product.GastosAsignados || 0);
        const originalCost = product._original ? (product._original.Costo as number || 0) : 0;
        const scenarioCostVariation = (product.Costo as number || 0) - originalCost;

        return (
            <div className="cost-detail-view">
                <div>
                    <div 
                        className="cost-item expandable"
                        onDoubleClick={() => setDirectCostExpanded(!isDirectCostExpanded)}
                    >
                        <span>
                            <span className={`expand-indicator ${isDirectCostExpanded ? 'expanded' : ''}`}>▶</span>
                            CMV (Post-Escenario)
                        </span>
                        <span className="cost-value">{money(product.Costo as number)}</span>
                    </div>
                    {isDirectCostExpanded && (
                        <div className="cost-detail-breakdown">
                            <div className="breakdown-item">
                                <span>CMV Original</span>
                                <span className="value">{money(originalCost)}</span>
                            </div>
                             <div className="breakdown-item">
                                <span>Variación por Escenario</span>
                                <span className="value" style={{color: scenarioCostVariation > 0 ? 'var(--bad)' : 'var(--good)'}}>{money(scenarioCostVariation)}</span>
                            </div>
                        </div>
                    )}
                </div>
                
                <div>
                     <div
                        className="cost-item expandable"
                        onDoubleClick={() => setAssignedExpensesExpanded(!isAssignedExpensesExpanded)}
                     >
                        <span>
                            <span className={`expand-indicator ${isAssignedExpensesExpanded ? 'expanded' : ''}`}>▶</span>
                            Gastos Asignados
                        </span>
                        <span className="cost-value">{money(product.GastosAsignados)}</span>
                    </div>
                    {isAssignedExpensesExpanded && product._gastosDetalle && (
                         <div className="cost-detail-breakdown" style={{ background: 'transparent', borderTop: 'none', margin: '8px 0 0 0', padding: '0 4px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                             {(() => {
                                const sortedGastos = [...product._gastosDetalle].sort((a, b) => b.Importe - a.Importe);
                                if (sortedGastos.length === 0) {
                                    return <div className="breakdown-item" style={{ justifyContent: 'center', color: 'var(--muted2)' }}><span>Sin gastos asignados.</span></div>;
                                }
                
                                const maxImporte = sortedGastos[0].Importe;
                
                                return sortedGastos.map(g => {
                                    const barWidth = maxImporte > 0 ? (g.Importe / maxImporte) * 100 : 0;
                                    return (
                                        <div className="gasto-bar-row" key={g.Gasto} style={{ gap: '8px', padding: '0 4px' }}>
                                            <div className="gasto-bar-info" style={{ fontSize: '11px' }}>
                                                <span className="gasto-name" title={g.Gasto} style={{ fontWeight: 600, color: 'var(--muted)' }}>{g.Gasto}</span>
                                                <div className="gasto-details">
                                                    <span className="gasto-amount" style={{ minWidth: 'auto', fontWeight: 700, color: 'var(--text)' }}>{money(g.Importe)}</span>
                                                </div>
                                            </div>
                                            <div className="gasto-bar-wrapper" style={{ height: '6px' }}>
                                                <div className="gasto-bar" style={{ width: `${barWidth}%` }}></div>
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    )}
                </div>

                <div className="cost-item total" style={{marginTop:'auto'}}>
                    <span>Costo Total Asignado</span>
                    <span className="cost-value">{money(totalCost)}</span>
                </div>
            </div>
        );
    }

    return (
        <div style={{marginTop: '14px'}}>
            <div className={`card ${isCollapsed ? 'is-collapsed' : ''}`}>
                <div className="card-header">
                    <h2>{product ? `Escenario: ${product.Producto}` : 'Escenario por Producto'}</h2>
                    <div className="header-buttons">
                        <button title={isCollapsed ? "Expandir" : "Contraer"} className="collapse-btn" onClick={() => setIsCollapsed(!isCollapsed)}>
                            {isCollapsed ? '✚' : '−'}
                        </button>
                        {product && <button title="Cerrar Panel" className="close-btn" onClick={onClose}>&times;</button>}
                    </div>
                </div>
                
                <div className={`collapsible-content ${isCollapsed ? 'collapsed' : ''}`}>
                    {product && scenario ? (
                        <>
                            <div className="tabs" style={{ marginBottom: '14px', alignSelf: 'flex-start' }}>
                                <button className={`tab ${activeTab === 'scenario' ? 'active' : ''}`} onClick={() => setActiveTab('scenario')}>
                                    Escenario
                                </button>
                                <button className={`tab ${activeTab === 'detail' ? 'active' : ''}`} onClick={() => setActiveTab('detail')}>
                                    Detalle de Costos
                                </button>
                            </div>

                            {activeTab === 'scenario' && (
                                <>
                                    <div className="scenarioGrid" style={{gridTemplateColumns: scenarioDefs.length === 4 ? '1fr 1fr' : '1fr 1fr 1fr'}}>
                                       {scenarioDefs.map(def => (
                                            <ScenarioSlider
                                                key={def.key}
                                                label={def.label}
                                                value={scenario[def.key as keyof Scenario] as number || 0}
                                                onChange={(val) => handleSliderChange(def.key as keyof Scenario, val)}
                                                min={-50}
                                                max={50}
                                            />
                                        ))}
                                    </div>
                                    <div className="row" style={{ marginTop: 'auto', paddingTop: '16px' }}>
                                        <div className="left">
                                            <button onClick={handleReset} className="btn">Resetear Producto</button>
                                        </div>
                                    </div>
                                </>
                            )}
                            {activeTab === 'detail' && <CostDetailView />}
                        </>
                    ) : (
                         <div className="placeholder-card">
                            <p>Haga clic en "Cfg" en una fila de la tabla para configurar un escenario específico del producto.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductScenarioPanel;
