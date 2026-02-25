
import React, { useState, useEffect } from 'react';
import { NewProductData } from '../types';

interface AddProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAddProduct: (newProduct: NewProductData) => void;
    existingProductNames: string[];
}

const initialState: NewProductData = {
    Producto: '',
    DUN: '',
    Venta: '',
    Costo: '',
    StockVal: '',
    VolVenta: '',
    VolStock: '',
    Bultos: '',
};

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onAddProduct, existingProductNames }) => {
    const [product, setProduct] = useState<NewProductData>(initialState);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setProduct(initialState);
            setError('');
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
        
        if (name === 'Producto' && error) {
            setError('');
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const productName = product.Producto.trim();
        if (!productName) {
            setError('El nombre del producto es obligatorio.');
            return;
        }
        if (existingProductNames.includes(productName.toLowerCase())) {
            setError('Ya existe un producto con este nombre.');
            return;
        }
        onAddProduct(product);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h2>Agregar Nueva Línea de Producto</h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="Producto">Nombre del Producto</label>
                            <input
                                type="text"
                                id="Producto"
                                name="Producto"
                                value={product.Producto}
                                onChange={handleChange}
                                autoFocus
                            />
                            <div className="error-text">{error}</div>
                        </div>
                        <div className="form-group">
                            <label htmlFor="DUN">DUN (Opcional)</label>
                            <input
                                type="text"
                                id="DUN"
                                name="DUN"
                                value={product.DUN || ''}
                                onChange={handleChange}
                                placeholder="e.g., Juan Perez"
                            />
                        </div>
                    </div>
                    <div className="form-grid">
                        <div className="form-group">
                            <label htmlFor="Venta">Venta</label>
                            <input type="number" id="Venta" name="Venta" value={product.Venta} onChange={handleChange} placeholder="e.g., 100000" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Costo">Costo (CMV)</label>
                            <input type="number" id="Costo" name="Costo" value={product.Costo} onChange={handleChange} placeholder="e.g., 60000" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="StockVal">Stock Valorizado</label>
                            <input type="number" id="StockVal" name="StockVal" value={product.StockVal} onChange={handleChange} placeholder="e.g., 50000" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="Bultos">Bultos</label>
                            <input type="number" id="Bultos" name="Bultos" value={product.Bultos} onChange={handleChange} placeholder="e.g., 100" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="VolVenta">Volumen Venta</label>
                            <input type="number" id="VolVenta" name="VolVenta" value={product.VolVenta} onChange={handleChange} placeholder="e.g., 50" />
                        </div>
                        <div className="form-group">
                            <label htmlFor="VolStock">Volumen Stock</label>
                            <input type="number" id="VolStock" name="VolStock" value={product.VolStock} onChange={handleChange} placeholder="e.g., 150" />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn primary">Agregar Línea</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddProductModal;