
import React, { useState } from 'react';
import { Scenario, Gasto, Fijo, IndividualGastoScenario, DunScenario, Summary } from '../types';
import ScenarioSlider from './ScenarioSlider';
import { fmtPrice, fmtRaw, getWorkingDaysPreviousMonth } from '../utils/helpers';

interface GlobalScenariosProps {
    gastos: Gasto[];
    fijos: Fijo[];
    scenario: Scenario;
    onScenarioChange: (newScenario: Scenario) => void;
    gastosOperativosPct: number;
    onGastosOperativosPctChange: (value: number) => void;
    gastosFijosPct: number;
    onGastosFijosPctChange: (value: number) => void;
    individualGastosScenarios: IndividualGastoScenario;
    onIndividualGastosScenariosChange: (scenarios: IndividualGastoScenario) => void;
    hasData: boolean;
    selectedDun: string;
    dunScenarios: { [key: string]: DunScenario };
    onDunScenariosChange: (scenarios: { [key: string]: DunScenario }) => void;
    baselineSummary: Summary | null;
}

const mainScenarios = [
    { key: "ventaPct", label: "Precio Promedio %" },
    { key: "bultosPct", label: "Bultos/día %" },
    { key: "costoPct", label: "CMV %" },
];

const dunScenarioDefs = [
    { key: "cmvPct", label: "CMV %" },
    { key: "gastosOperativosPct", label: "Gastos Operativos %", variant: "warn" },
    { key: "bultosPct", label: "Bultos/día %" },
    { key: "precioPromedioPct", label: "Precio Promedio %" },
];


const GlobalScenarios: React.FC<GlobalScenariosProps> = (props) => {
    const [detailView, setDetailView] = useState<'none' | 'operativos' | 'fijos'>('none');

    const handleMainSliderChange = (key: keyof Scenario, value: number) => {
        props.onScenarioChange({ ...props.scenario, [key]: value });
    };
    
    const handleDunSliderChange = (key: keyof DunScenario, value: number) => {
        if (!props.selectedDun) return;
        const currentDunScenario = props.dunScenarios[props.selectedDun] || { cmvPct: 0, gastosOperativosPct: 0, bultosPct: 0, precioPromedioPct: 0 };
        const newScenario = { ...currentDunScenario, [key]: value };
        props.onDunScenariosChange({ ...props.dunScenarios, [props.selectedDun]: newScenario });
    };

    const handleIndividualGastoChange = (type: 'operativos' | 'fijos', name: string, value: number) => {
        props.onIndividualGastosScenariosChange({
            ...props.individualGastosScenarios,
            [type]: {
                ...props.individualGastosScenarios[type],
                [name]: value
            }
        });
    };

    const resetGlobalScenarios = () => {
        props.onScenarioChange({ ventaPct: 0, costoPct: 0, volVentaPct: 0, volStockPct: 0, stockValPct: 0, bultosPct: 0 });
        props.onGastosOperativosPctChange(0);
        props.onGastosFijosPctChange(0);
        props.onIndividualGastosScenariosChange({ operativos: {}, fijos: {} });
        setDetailView('none');
    };
    
    const resetDunScenario = () => {
        if (!props.selectedDun) return;
        props.onDunScenariosChange({
            ...props.dunScenarios,
            [props.selectedDun]: { cmvPct: 0, gastosOperativosPct: 0, bultosPct: 0, precioPromedioPct: 0 }
        });
    };
    
    const renderOverview = () => (
        <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                {mainScenarios.map(def => {
                    let baseValue = undefined;
                    let formatter = undefined;
                    
                    if (def.key === 'ventaPct') {
                        baseValue = props.baselineSummary?.precioPromedio;
                        formatter = fmtPrice;
                    } else if (def.key === 'bultosPct') {
                        const workingDays = getWorkingDaysPreviousMonth();
                        baseValue = (props.baselineSummary?.totalBultos || 0) / workingDays;
                        formatter = fmtRaw;
                    } else if (def.key === 'costoPct') {
                        baseValue = props.baselineSummary?.costoPromedio;
                        formatter = fmtPrice;
                    }

                    return (
                        <ScenarioSlider
                            key={def.key}
                            label={def.label}
                            value={props.scenario[def.key as keyof Scenario]}
                            onChange={(val) => handleMainSliderChange(def.key as keyof Scenario, val)}
                            min={-50}
                            max={50}
                            baseValue={baseValue}
                            formatter={formatter}
                        />
                    );
                })}
                 <div onDoubleClick={() => props.hasData && setDetailView('operativos')} className={props.hasData ? "cursor-pointer group" : ""}>
                    <ScenarioSlider
                        label="Gastos Operativos %"
                        value={props.gastosOperativosPct}
                        onChange={props.onGastosOperativosPctChange}
                        min={-50}
                        max={50}
                        variant="warn"
                    />
                </div>
                 <div onDoubleClick={() => props.hasData && setDetailView('fijos')} className={props.hasData ? "cursor-pointer group" : ""}>
                    <ScenarioSlider
                        label="Gastos Fijos %"
                        value={props.gastosFijosPct}
                        onChange={props.onGastosFijosPctChange}
                        min={-50}
                        max={50}
                        variant="warn"
                    />
                </div>
            </div>
            <div className="mt-auto pt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-800/50 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow animate-pulse"></span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Impacto global en todas las líneas activas
                    </span>
                </div>
                <button onClick={resetGlobalScenarios} disabled={!props.hasData} className="btn-action !px-6 !py-2 !rounded-xl !bg-slate-800/50 hover:!bg-slate-700/50 !text-slate-100 !font-bold">
                    Resetear Global
                </button>
            </div>
        </div>
    );

    const renderDetailView = () => {
        const isOperativos = detailView === 'operativos';
        const items = isOperativos ? props.gastos : props.fijos;
        const scenarios = isOperativos ? props.individualGastosScenarios.operativos : props.individualGastosScenarios.fijos;
        const title = isOperativos ? 'Detalle: Gastos Operativos' : 'Detalle: Gastos Fijos';
        
        return (
            <div className="scenario-detail-view">
                <div className="scenario-detail-header">
                    <h3>{title}</h3>
                    <button className="btn" onClick={() => setDetailView('none')} style={{padding: '6px 10px'}}>
                        ‹ Volver
                    </button>
                </div>
                 <div className="scenario-detail-list">
                    {items.map(item => {
                        const name = isOperativos ? (item as Gasto).Gasto : (item as Fijo).GastoFijo;
                        return (
                             <ScenarioSlider
                                key={name}
                                label={name}
                                value={scenarios[name] || 0}
                                onChange={(val) => handleIndividualGastoChange(isOperativos ? 'operativos' : 'fijos', name, val)}
                                min={-50}
                                max={50}
                                variant="warn"
                            />
                        );
                    })}
                </div>
                 <div className="footnote" style={{marginTop:'auto', paddingTop:'8px'}}>
                    Los ajustes individuales se aplican adicionalmente al ajuste global de la categoría.
                 </div>
            </div>
        )
    }
    
    const renderDunView = () => {
        const currentDunScenario = props.dunScenarios[props.selectedDun] || { cmvPct: 0, gastosOperativosPct: 0, bultosPct: 0, precioPromedioPct: 0 };
        
        return (
             <>
                <div className="grid grid-cols-2 gap-4">
                    {dunScenarioDefs.map(def => {
                        let baseValue = undefined;
                        let formatter = undefined;
                        
                        if (def.key === 'precioPromedioPct') {
                            baseValue = props.baselineSummary?.precioPromedio;
                            formatter = fmtPrice;
                        } else if (def.key === 'bultosPct') {
                            const workingDays = getWorkingDaysPreviousMonth();
                            baseValue = (props.baselineSummary?.totalBultos || 0) / workingDays;
                            formatter = fmtRaw;
                        } else if (def.key === 'cmvPct') {
                            baseValue = props.baselineSummary?.costoPromedio;
                            formatter = fmtPrice;
                        }

                        return (
                            <ScenarioSlider
                                key={def.key}
                                label={def.label}
                                value={currentDunScenario[def.key as keyof DunScenario]}
                                onChange={(val) => handleDunSliderChange(def.key as keyof DunScenario, val)}
                                min={-50}
                                max={50}
                                variant={def.variant as 'warn' | undefined}
                                baseValue={baseValue}
                                formatter={formatter}
                            />
                        );
                    })}
                </div>
                <div className="mt-auto pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/50 border border-slate-800/50 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-yellow animate-pulse"></span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            Impacto solo en líneas del DUN seleccionado
                        </span>
                    </div>
                    <button onClick={resetDunScenario} disabled={!props.hasData} className="btn-action !px-6 !py-2 !rounded-xl !bg-slate-800/50 hover:!bg-slate-700/50 !text-slate-100 !font-bold">
                        Resetear DUN
                    </button>
                </div>
            </>
        )
    };
    
    const getContent = () => {
        if (props.selectedDun) {
            return renderDunView();
        }
        if (detailView === 'none') {
            return renderOverview();
        }
        return renderDetailView();
    }

    return (
        <div className="card" style={{minHeight: '280px'}}>
            <div className="card-header">
                <h2>{props.selectedDun ? `Escenarios - ${props.selectedDun}` : 'Escenarios — Global'}</h2>
            </div>
            {getContent()}
        </div>
    );
};

export default GlobalScenarios;
