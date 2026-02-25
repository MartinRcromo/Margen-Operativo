
import React, { useState, useEffect } from 'react';
import { Product } from '../types';

interface DeleteProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDeleteProduct: (productName: string) => void;
    products: Product[];
}

const DeleteProductModal: React.FC<DeleteProductModalProps> = ({ isOpen, onClose, onDeleteProduct, products }) => {
    const [selectedProduct, setSelectedProduct] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setSelectedProduct('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (selectedProduct) {
            onDeleteProduct(selectedProduct);
        }
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <form onSubmit={handleSubmit}>
                    <h2>Eliminar Línea de Producto</h2>
                    <div className="form-group full-width">
                        <label htmlFor="product-to-delete">Seleccione la línea a eliminar</label>
                        <select
                            id="product-to-delete"
                            value={selectedProduct}
                            onChange={(e) => setSelectedProduct(e.target.value)}
                        >
                            <option value="" disabled>Seleccione una línea...</option>
                            {products.map(p => (
                                <option key={p.Producto} value={p.Producto}>{p.Producto}</option>
                            ))}
                        </select>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="btn" onClick={onClose}>Cancelar</button>
                        <button type="submit" className="btn danger" disabled={!selectedProduct}>
                            Eliminar Línea Seleccionada
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DeleteProductModal;
