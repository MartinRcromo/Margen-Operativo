
import React from 'react';
import { Product } from '../types';
import { fmtM, pct2 } from '../utils/helpers';

interface ProductRowProps {
    product: Product;
    index: number;
    onUpdateField: (index: number, field: keyof Product, value: any) => void;
    onRevertField: (index: number, field: keyof Product, value: any) => void;
    onSelectProduct: (product: Product) => void;
    displayMillions: boolean;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, index, onUpdateField, onRevertField, onSelectProduct, displayMillions }) => {
    const money = (n?: number | null) => fmtM(n, displayMillions);
    
    return (
        <tr className={`hover:bg-slate-700/30 transition-colors border-b border-slate-700/30 ${!product.Activo ? 'opacity-40 grayscale' : ''}`}>
            <td className="px-4 py-3 whitespace-nowrap">
                <label className="flex items-center cursor-pointer gap-2">
                    <input
                        type="checkbox"
                        checked={product.Activo}
                        onChange={(e) => onUpdateField(index, 'Activo', e.target.checked)}
                        className="form-checkbox h-3.5 w-3.5 text-accent-blue bg-slate-900 border-slate-700 rounded focus:ring-accent-blue"
                    />
                    <span className={`badge ${product.Activo ? 'badge-act' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
                        {product.Activo ? "ACT" : "OFF"}
                    </span>
                </label>
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] text-slate-400 font-medium !text-center">{product.DUN || '-'}</td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] font-bold text-slate-100 !text-center">
                {product.Producto}
                {product._sim && <span className="ml-2 badge badge-sim">SIM</span>}
            </td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] !text-center font-mono text-slate-300">{money(product.StockVal as number)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] !text-center font-mono text-slate-300">{money(product.Venta as number)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] !text-center font-mono text-slate-300">{money(product.Costo as number)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] !text-center font-mono font-bold text-slate-100">{product.MarkUp === null ? "-" : pct2((product.MarkUp || 0) * 100)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] !text-center font-mono font-bold text-accent-yellow">{money(product.Resultado)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] !text-center font-mono font-bold text-accent-blue">{money(product.MargenOper)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] !text-center font-mono font-bold text-slate-100">{pct2((product.MargenPct || 0) * 100)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-[11px] !text-center font-mono text-slate-400">{product.ROI === null ? "-" : pct2(product.ROI * 100)}</td>
            <td className="px-4 py-3 whitespace-nowrap text-center">
                <button className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all text-[10px] font-bold text-slate-300" onClick={() => onSelectProduct(product)}>Cfg</button>
            </td>
        </tr>
    );
};

export default ProductRow;
