import React, { RefObject } from 'react';
import { supabaseReady } from '../lib/supabase';
import PeriodoSelector from './PeriodoSelector';

interface HeaderProps {
    displayMillions: boolean;
    onDisplayMillionsChange: (value: boolean) => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onLoadSample: () => void;
    onThemeChange: () => void;
    fileInputRef: RefObject<HTMLInputElement>;
    onImportClick: () => void;
    selectedPeriodoId: string;
    onPeriodoSelect: (id: string) => void;
    periodoRefresh: number;
    onSignOut?: () => void;
    userEmail?: string;
}

const Header: React.FC<HeaderProps> = ({
    displayMillions,
    onDisplayMillionsChange,
    onFileChange,
    onLoadSample,
    onThemeChange,
    fileInputRef,
    onImportClick,
    selectedPeriodoId,
    onPeriodoSelect,
    periodoRefresh,
    onSignOut,
    userEmail,
}) => {
    return (
        <div className="topbar">
            <div className="brand">
                <h1>Margen Operativo por Línea — Motor de Drivers</h1>
                <small>Analítica avanzada para la rentabilidad logística y de producto.</small>
            </div>

            <div className="actions">
                {supabaseReady && (
                    <PeriodoSelector
                        selectedPeriodoId={selectedPeriodoId}
                        onSelect={onPeriodoSelect}
                        onRefresh={periodoRefresh}
                    />
                )}

                <label className="pill" style={{ cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={displayMillions}
                        onChange={(e) => onDisplayMillionsChange(e.target.checked)}
                        style={{ marginRight: '6px' }}
                    />
                    Ver en millones
                </label>

                {supabaseReady && (
                    <button onClick={onImportClick} className="btn primary">
                        + Importar CSV
                    </button>
                )}

                <label className="file-input-label">
                    <span className="pill"><span className="dot"></span>CSV</span>
                    Cargar Archivos
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        multiple
                        onChange={onFileChange}
                        style={{ display: 'none' }}
                    />
                </label>

                <button onClick={onLoadSample} className="btn">Ejemplo</button>
                <button onClick={onThemeChange} className="btn primary">Modo Claro/Oscuro</button>

                {onSignOut && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem', marginLeft: '0.25rem' }}>
                        {userEmail && (
                            <span style={{ fontSize: '0.78rem', color: 'var(--muted)', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {userEmail}
                            </span>
                        )}
                        <button onClick={onSignOut} className="btn" style={{ fontSize: '0.82rem', padding: '0.3rem 0.7rem' }}>
                            Salir
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Header;
