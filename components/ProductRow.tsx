
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
        <tr className={product.Activo ? "" : "off"}>
            <td>
                <label className="toggle">
                    <input
                        type="checkbox"
                        checked={product.Activo}
                        onChange={(e) => onUpdateField(index, 'Activo', e.target.checked)}
                    />
                    <span className={`pill ${product.Activo ? "good" : "bad"}`}>
                        <span className="dot"></span>{product.Activo ? "ACT" : "OFF"}
                    </span>
                </label>
            </td>
            <td style={{ color: 'var(--muted)', textAlign: 'center' }}>{product.DUN || '-'}</td>
            <td style={{ textAlign: 'center', fontWeight: 900 }}>
                {product.Producto}
                {product._sim && <span className="pill warn" style={{marginLeft:'4px', fontSize:'9px', padding: '2px 6px'}}>SIM</span>}
            </td>
            
            <td style={{ textAlign: 'center' }}>{money(product.StockVal as number)}</td>
            <td style={{ textAlign: 'center' }}>{money(product.Venta as number)}</td>
            <td style={{ textAlign: 'center' }}>{money(product.Costo as number)}</td>
            <td style={{ fontWeight: 700, textAlign: 'center' }}>{product.MarkUp === null ? "-" : pct2((product.MarkUp || 0) * 100)}</td>
            <td style={{ fontWeight: 700, color: 'var(--warn)', textAlign: 'center' }}>{money(product.Resultado)}</td>

            <td style={{ fontWeight: 900, color: 'var(--accent)', textAlign: 'center' }}>{money(product.MargenOper)}</td>
            <td style={{ fontWeight: 900, textAlign: 'center' }}>{pct2((product.MargenPct || 0) * 100)}</td>
            <td style={{ textAlign: 'center' }}>{product.ROI === null ? "-" : pct2(product.ROI * 100)}</td>
            <td style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
                    <button className="btn" onClick={() => onSelectProduct(product)} style={{ padding: '6px 8px' }}>Cfg</button>
                </div>
            </td>
        </tr>
    );
};

export default ProductRow;
