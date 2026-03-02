import React, { RefObject } from 'react';

interface HeaderProps {
    displayMillions: boolean;
    onDisplayMillionsChange: (value: boolean) => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onLoadSample: () => void;
    onThemeChange: () => void;
    fileInputRef: RefObject<HTMLInputElement>;
    scenarioMode: 'REAL' | 'IDEAL';
    onScenarioModeChange: (mode: 'REAL' | 'IDEAL') => void;
}

const Header: React.FC<HeaderProps> = ({
    displayMillions,
    onDisplayMillionsChange,
    onFileChange,
    onLoadSample,
    onThemeChange,
    fileInputRef,
    scenarioMode,
    onScenarioModeChange
}) => {
    return (
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Margen Operativo por Línea — Motor de Drivers</h1>
                <p className="text-xs text-slate-400 font-medium">Analítica avanzada para la rentabilidad logística y de producto.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 p-1 bg-slate-900/50 rounded-xl border border-slate-700/50">
                    <button 
                        onClick={() => onScenarioModeChange('REAL')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            scenarioMode === 'REAL' 
                            ? 'bg-slate-700 text-white shadow-lg' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Real
                    </button>
                    <button 
                        onClick={() => onScenarioModeChange('IDEAL')}
                        className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            scenarioMode === 'IDEAL' 
                            ? 'bg-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        Ideal
                    </button>
                </div>

                <label className="flex items-center gap-2 cursor-pointer px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700 hover:bg-slate-700/50 transition-all text-xs font-medium">
                    <input
                        type="checkbox"
                        checked={displayMillions}
                        onChange={(e) => onDisplayMillionsChange(e.target.checked)}
                        className="form-checkbox h-3.5 w-3.5 text-accent-blue bg-slate-900 border-slate-700 rounded focus:ring-accent-blue"
                    />
                    <span>Ver en millones</span>
                </label>
                <label className="btn-action cursor-pointer">
                    <span className="opacity-60">CSV</span>
                    <span>Cargar Archivos</span>
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        multiple
                        onChange={onFileChange}
                        className="hidden"
                    />
                </label>
                <button onClick={onLoadSample} className="btn-action">Ejemplo</button>
                <button onClick={onThemeChange} className="btn-action">Modo Claro/Oscuro</button>
            </div>
        </header>
    );
};

export default Header;
