
import React from 'react';

const Banner: React.FC = () => {
    return (
        <div className="banner">
            <strong>📌 Carga de Datos:</strong>
            <div style={{ color: 'var(--muted)', fontSize: '12px' }}>
                Subí <b>PRODUCTOS.csv</b>, <b>GASTOS.csv</b> y opcionalmente <b>DUN.csv</b> juntos (múltiple selección). Formato compatible: <b>1.234,56</b> o <b>1234.56</b>. Separador <b>,</b> o <b>;</b>.
            </div>
        </div>
    );
};

export default Banner;