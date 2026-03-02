
import React, { useState, useMemo, useEffect } from 'react';
import { Product, Gasto, Totals, Sort } from '../types';
import { fmtM } from '../utils/helpers';
import ProductRow from './ProductRow';
import ProductKpiSummary from './ProductKpiSummary';
import { Summary } from '../types';

interface ProductTableProps {
    products: Product[];
    gastos: Gasto[];
    totals: Totals | undefined;
    sort: Sort;
    setSort: (sort: Sort) => void;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    selectedDun: string;
    setSelectedDun: (dun: string) => void;
    status: { text: string; kind: string };
    onUpdateField: (index: number, field: keyof Product, value: any) => void;
    onRevertField: (index: number, field: keyof Product, value: any) => void;
    onSelectProduct: (product: Product) => void;
    onAddProductClick: () => void;
    onDeleteProductClick: () => void;
    onUndoAllChanges: () => void;
    displayMillions: boolean;
    hasData: boolean;
    summary: Summary | null;
}

const ProductTable: React.FC<ProductTableProps> = (props) => {
    const [activeTab, setActiveTab] = useState<'perf' | 'gastos'>('perf');
    const [selectedGasto, setSelectedGasto] = useState<string | null>(null);

    useEffect(() => {
        if (activeTab !== 'gastos') {
            setSelectedGasto(null);
        }
    }, [activeTab]);
    
    useEffect(() => {
        // Reset to perf tab if no data is available
        if (!props.hasData) {
            setActiveTab('perf');
        }
    }, [props.hasData]);

    const handleSort = (key: Sort['key']) => {
        if (props.sort.key === key) {
            props.setSort({ key, order: props.sort.order === 'asc' ? 'desc' : 'asc' });
        } else {
            props.setSort({ key, order: 'desc' });
        }
    };

    const getSortIcon = (key: Sort['key']) => {
        if (props.sort.key !== key) return <span style={{ display: 'inline-block', width: '1em' }}></span>;
        return <span style={{ display: 'inline-block', width: '1em' }}>{props.sort.order === 'asc' ? '▲' : '▼'}</span>;
    };

    const filteredAndSortedProducts = useMemo(() => {
        let items = props.products
            .filter(p => !props.selectedDun || p.DUN === props.selectedDun)
            .filter(p =>
                !props.searchTerm || p.Producto.toLowerCase().includes(props.searchTerm.toLowerCase())
            );

        items.sort((a, b) => {
            const key = props.sort.key;
            let valA = a[key as keyof Product] as any;
            let valB = b[key as keyof Product] as any;
            
            if (key === 'ROI' || key === 'MarkUp') {
                valA = valA === null ? -Infinity : valA;
                valB = valB === null ? -Infinity : valB;
            }
            
            if (valA === undefined || valA === null) valA = '';
            if (valB === undefined || valB === null) valB = '';

            if (typeof valA === 'string' && typeof valB === 'string') {
                return props.sort.order === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            return props.sort.order === 'asc' ? (valA - valB) : (valB - valA);
        });

        return items;
    }, [props.products, props.searchTerm, props.selectedDun, props.sort]);


    const perfPanel = (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
            <thead className="bg-gray-800">
                <tr>
                    <th onClick={() => handleSort('Activo')} className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer">Status {getSortIcon('Activo')}</th>
                    <th onClick={() => handleSort('DUN')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer">DUN {getSortIcon('DUN')}</th>
                    <th onClick={() => handleSort('Producto')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer">Producto {getSortIcon('Producto')}</th>
                    <th onClick={() => handleSort('StockVal')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer">Stock $ {getSortIcon('StockVal')}</th>
                    <th onClick={() => handleSort('Venta')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer">Venta {getSortIcon('Venta')}</th>
                    <th onClick={() => handleSort('Costo')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer">CMV {getSortIcon('Costo')}</th>
                    <th onClick={() => handleSort('MarkUp')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" title="(Venta - CMV) / CMV">Mark-Up % {getSortIcon('MarkUp')}</th>
                    <th onClick={() => handleSort('Resultado')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer">Margen Bruto {getSortIcon('Resultado')}</th>
                    <th onClick={() => handleSort('MargenOper')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer">Contrib. Marg. {getSortIcon('MargenOper')}</th>
                    <th onClick={() => handleSort('MargenPct')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" title="Margen Operativo / Venta">Contrib Marg. % {getSortIcon('MargenPct')}</th>
                    <th onClick={() => handleSort('ROI')} className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer" title="Margen Operativo / Stock Valorizado">ROI {getSortIcon('ROI')}</th>
                    <th className="px-4 py-2 !text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Acción</th>
                </tr>
            </thead>
            <tbody className="bg-gray-800 divide-y divide-gray-700">
                {filteredAndSortedProducts.map((p, i) => {
                    const originalIndex = props.products.findIndex(orig => orig.Producto === p.Producto);
                    return (
                        <ProductRow
                            key={p.Producto}
                            product={p}
                            index={originalIndex}
                            onUpdateField={props.onUpdateField}
                            onRevertField={props.onRevertField}
                            onSelectProduct={props.onSelectProduct}
                            displayMillions={props.displayMillions}
                        />
                    );
                })}
            </tbody>
        </table>
      </div>
    );
    
    const contextualGastos = useMemo(() => {
        if (!props.selectedDun) {
            return props.gastos;
        }

        const driverMap = new Map(props.gastos.map(g => [g.Gasto, g.Driver]));
        const dunGastos: { [key: string]: number } = {};

        props.products.forEach(p => {
            if (p.Activo && p.DUN === props.selectedDun && p._gastosDetalle) {
                p._gastosDetalle.forEach(gastoDetail => {
                    dunGastos[gastoDetail.Gasto] = (dunGastos[gastoDetail.Gasto] || 0) + gastoDetail.Importe;
                });
            }
        });
        
        return Object.entries(dunGastos).map(([gastoName, importe]) => ({
            Gasto: gastoName,
            Importe: importe,
            Driver: driverMap.get(gastoName) || '',
        }));

    }, [props.gastos, props.products, props.selectedDun]);


    const sortedGastos = useMemo(() => {
        return [...contextualGastos].sort((a, b) => (b.Importe as number) - (a.Importe as number));
    }, [contextualGastos]);
    
    const maxImporte = useMemo(() => {
        if (!sortedGastos.length) return 0;
        return sortedGastos[0].Importe as number;
    }, [sortedGastos]);

    const productAllocations = useMemo(() => {
        if (!selectedGasto || !props.products) {
            return { allocations: [], maxAllocation: 0 };
        }
        
        const relevantProducts = props.selectedDun 
            ? props.products.filter(p => p.DUN === props.selectedDun)
            : props.products;

        const allocations = relevantProducts
            .filter(p => p.Activo && p._gastosDetalle)
            .map(p => {
                const gastoDetail = p._gastosDetalle!.find(g => g.Gasto === selectedGasto);
                return gastoDetail ? { name: p.Producto, amount: gastoDetail.Importe } : null;
            })
            .filter((p): p is { name: string; amount: number } => p !== null && p.amount > 0)
            .sort((a, b) => b.amount - a.amount);

        const maxAllocation = allocations.length > 0 ? allocations[0].amount : 0;
        
        return { allocations, maxAllocation };
    }, [selectedGasto, props.products, props.selectedDun]);

    const renderGastoDrilldown = () => {
        const { allocations, maxAllocation } = productAllocations;
        
        return (
            <div className="gastos-chart-container">
                <div className="drilldown-header">
                    <h3>Distribución: {selectedGasto}</h3>
                    <button className="btn" onClick={() => setSelectedGasto(null)} style={{padding: '6px 10px'}}>
                        ‹ Volver
                    </button>
                </div>
                {maxAllocation > 0 ? allocations.map((alloc) => {
                    const barWidth = maxAllocation > 0 ? (alloc.amount / maxAllocation) * 100 : 0;
                    return (
                        <div className="gasto-bar-row" key={alloc.name}>
                            <div className="gasto-bar-info">
                                <span className="gasto-name" title={alloc.name}>{alloc.name}</span>
                                <div className="gasto-details">
                                    <span className="gasto-amount">{fmtM(alloc.amount, props.displayMillions)}</span>
                                </div>
                            </div>
                            <div className="gasto-bar-wrapper">
                                <div className="gasto-bar" style={{ width: `${barWidth}%` }}></div>
                            </div>
                        </div>
                    );
                }) : <div className="placeholder-card" style={{minHeight: '100px', flex: 1}}>Este gasto no se asigna a ninguna línea activa.</div>}
            </div>
        );
    };

    const renderGastoOverview = () => {
        return (
           <div className="gastos-chart-container">
               <div className="footnote" style={{padding: '0 8px 8px', margin: 0}}>Doble clic en un gasto para ver su distribución por producto.</div>
               {maxImporte > 0 ? sortedGastos.map((g) => {
                   const barWidth = maxImporte > 0 ? ((g.Importe as number / maxImporte) * 100) : 0;
                   const totalForDriver = props.totals ? props.totals[g.Driver as keyof Totals] : 0;
                   const isOkDriver = !!g.Driver && totalForDriver !== undefined && totalForDriver !== 0;

                   return (
                       <div 
                           className="gasto-bar-row" 
                           key={g.Gasto} 
                           onDoubleClick={() => setSelectedGasto(g.Gasto)}
                           style={{cursor: 'pointer'}}
                           title={`Doble clic para ver detalle de ${g.Gasto}`}
                       >
                           <div className="gasto-bar-info">
                               <span className="gasto-name" title={g.Gasto}>{g.Gasto ?? "-"}</span>
                               <div className="gasto-details">
                                   <span className="gasto-amount">{fmtM(g.Importe as number, props.displayMillions)}</span>
                                   {isOkDriver ? (
                                       <span className="driverChip">{g.Driver}</span>
                                   ) : (
                                       <span className="pill bad">S/ Driver</span>
                                   )}
                               </div>
                           </div>
                           <div className="gasto-bar-wrapper">
                               <div className="gasto-bar" style={{ width: `${barWidth}%` }}></div>
                           </div>
                       </div>
                   );
               }) : <div className="placeholder-card" style={{minHeight: '100px', flex: 1}}>No hay gastos operativos para mostrar{props.selectedDun ? ` para ${props.selectedDun}` : ''}.</div>}
           </div>
       );
   };

    const gastosPanel = selectedGasto ? renderGastoDrilldown() : renderGastoOverview();

    return (
        <div className="card !p-0 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 gap-4 border-b border-slate-700/50">
                <div className="flex items-center gap-1.5 p-1 bg-slate-900/50 rounded-xl border border-slate-700/50">
                    <button 
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'perf' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`} 
                        onClick={() => setActiveTab('perf')}
                    >
                        Performance de Líneas
                    </button>
                    <button 
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'gastos' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`} 
                        onClick={() => setActiveTab('gastos')} 
                        disabled={!props.hasData}
                    >
                        Desglose de Gastos
                    </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {activeTab === 'perf' && (
                        <div className="relative">
                            <input
                                value={props.searchTerm}
                                onChange={(e) => props.setSearchTerm(e.target.value)}
                                className="bg-slate-900/50 border border-slate-700/50 rounded-lg pl-8 pr-3 py-1.5 text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-accent-blue w-64"
                                placeholder="Buscar por producto..."
                                disabled={!props.hasData}
                            />
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs">🔍</span>
                        </div>
                    )}
                    
                    {activeTab === 'perf' && (
                        <>
                            <button onClick={props.onAddProductClick} className="btn-action !bg-accent-blue/10 !border-accent-blue/30 !text-accent-blue hover:!bg-accent-blue/20" disabled={!props.hasData}>
                                 + Nueva Línea
                            </button>
                            <button onClick={props.onDeleteProductClick} className="btn-action !bg-rose-500/10 !border-rose-500/30 !text-rose-400 hover:!bg-rose-500/20" disabled={!props.hasData}>
                                 Eliminar Línea
                            </button>
                            <button onClick={props.onUndoAllChanges} className="btn-action" disabled={!props.hasData}>
                                Deshacer todos los cambios
                            </button>
                        </>
                    )}
                    <span className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase flex items-center gap-2 border ${
                        props.status.kind === 'good' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                        props.status.kind === 'warn' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 
                        'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                            props.status.kind === 'good' ? 'bg-emerald-500' : 
                            props.status.kind === 'warn' ? 'bg-amber-500' : 
                            'bg-slate-500'
                        }`}></span>
                        {props.status.text}
                    </span>
                </div>
            </div>

            <div className="p-1">
                {activeTab === 'perf' && props.hasData && <ProductKpiSummary summary={props.summary} />}
                {activeTab === 'perf' ? (props.hasData ? perfPanel : <div className="flex items-center justify-center py-24 text-slate-500 italic text-sm">Cargue datos para ver la performance de líneas.</div>) : gastosPanel}
            </div>
        </div>
    );
};

export default ProductTable;
