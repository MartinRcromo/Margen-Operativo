
import React, { useState } from 'react';
import { Scenario, Gasto, Fijo, IndividualGastoScenario, DunScenario } from '../types';
import ScenarioSlider from './ScenarioSlider';

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
}

const mainScenarios = [
    { key: "ventaPct", label: "Precio Vta %" },
    { key: "bultosPct", label: "Bultos %" },
    { key: "costoPct", label: "CMV %" },
];

const dunScenarioDefs = [
    { key: "cmvPct", label: "CMV %" },
    { key: "gastosOperativosPct", label: "Gastos Operativos %", variant: "warn" },
    { key: "bultosPct", label: "Bultos %" },
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
        <>
            <div className="scenarioGrid">
                {mainScenarios.map(def => (
                    <ScenarioSlider
                        key={def.key}
                        label={def.label}
                        value={props.scenario[def.key as keyof Scenario]}
                        onChange={(val) => handleMainSliderChange(def.key as keyof Scenario, val)}
                        min={-50}
                        max={50}
                    />
                ))}
                <div style={{ position: 'relative' }}>
                    <ScenarioSlider
                        label="Gastos Operativos %"
                        value={props.gastosOperativosPct}
                        onChange={props.onGastosOperativosPctChange}
                        min={-50}
                        max={50}
                        variant="warn"
                    />
                    {props.hasData && (
                        <button
                            className="btn"
                            onClick={() => setDetailView('operativos')}
                            style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 8px', fontSize: '10px' }}
                            title="Ver detalle por gasto"
                        >
                            Detalle ›
                        </button>
                    )}
                </div>
                <div style={{ position: 'relative' }}>
                    <ScenarioSlider
                        label="Gastos Fijos %"
                        value={props.gastosFijosPct}
                        onChange={props.onGastosFijosPctChange}
                        min={-50}
                        max={50}
                        variant="warn"
                    />
                    {props.hasData && (
                        <button
                            className="btn"
                            onClick={() => setDetailView('fijos')}
                            style={{ position: 'absolute', top: '8px', right: '8px', padding: '2px 8px', fontSize: '10px' }}
                            title="Ver detalle por gasto fijo"
                        >
                            Detalle ›
                        </button>
                    )}
                </div>
            </div>
            <div className="row" style={{ marginTop: '16px' }}>
                <div className="left">
                    <span className="pill info"><span className="dot"></span>Impacto global en todas las líneas activas</span>
                </div>
                <div className="left">
                    <button onClick={resetGlobalScenarios} disabled={!props.hasData} className="btn">Resetear</button>
                </div>
            </div>
        </>
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
                <div className="scenarioGrid">
                    {dunScenarioDefs.map(def => (
                        <ScenarioSlider
                            key={def.key}
                            label={def.label}
                            value={currentDunScenario[def.key as keyof DunScenario]}
                            onChange={(val) => handleDunSliderChange(def.key as keyof DunScenario, val)}
                            min={-50}
                            max={50}
                            variant={def.variant as 'warn' | undefined}
                        />
                    ))}
                </div>
                <div className="row" style={{ marginTop: '16px' }}>
                    <div className="left">
                        <span className="pill info"><span className="dot"></span>Impacto solo en líneas de este rubro</span>
                    </div>
                    <div className="left">
                        <button onClick={resetDunScenario} disabled={!props.hasData} className="btn">Resetear</button>
                    </div>
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
