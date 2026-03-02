
import React from 'react';

const Banner: React.FC = () => {
    return (
        <div className="flex items-center gap-3 p-3 bg-slate-800/30 border border-slate-700/50 rounded-xl">
            <span className="text-lg">🚀</span>
            <div className="flex flex-col md:flex-row md:items-center gap-x-4 gap-y-1">
                <strong className="text-xs text-slate-200">Carga de Datos:</strong>
                <p className="text-[11px] text-slate-400 leading-tight">
                    Subí <b className="text-slate-300">PRODUCTOS.csv</b>, <b className="text-slate-300">GASTOS.csv</b> y opcionalmente <b className="text-slate-300">DUN.csv</b> juntos (múltiple selección). Formato compatible: <b className="text-slate-300">1.234,56</b> o <b className="text-slate-300">1234.56</b>. Separador <b className="text-slate-300">,</b> o <b className="text-slate-300">;</b>.
                </p>
            </div>
        </div>
    );
};

export default Banner;