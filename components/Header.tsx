import React, { RefObject } from 'react';

interface HeaderProps {
    displayMillions: boolean;
    onDisplayMillionsChange: (value: boolean) => void;
    onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onLoadSample: () => void;
    onThemeChange: () => void;
    fileInputRef: RefObject<HTMLInputElement>;
}

const Header: React.FC<HeaderProps> = ({
    displayMillions,
    onDisplayMillionsChange,
    onFileChange,
    onLoadSample,
    onThemeChange,
    fileInputRef
}) => {
    return (
        <div className="topbar">
            <div className="brand">
                <h1>Margen Operativo por Línea — Motor de Drivers</h1>
                <small>Analítica avanzada para la rentabilidad logística y de producto.</small>
            </div>

            <div className="actions">
                <label className="pill" style={{ cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={displayMillions}
                        onChange={(e) => onDisplayMillionsChange(e.target.checked)}
                        style={{ marginRight: '6px' }}
                    />
                    Ver en millones
                </label>
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
            </div>
        </div>
    );
};

export default Header;
