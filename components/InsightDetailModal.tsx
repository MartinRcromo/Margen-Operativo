
import React from 'react';
import { Insight } from '../types';

interface InsightDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    insight: Insight | null;
}

const InsightDetailModal: React.FC<InsightDetailModalProps> = ({ isOpen, onClose, insight }) => {
    if (!isOpen || !insight) {
        return null;
    }

    const typeClass = `pill ${insight.type}`;
    const borderColorClass = 
        insight.type === 'bad' ? 'var(--bad)' : 
        insight.type === 'warn' ? 'var(--warn)' : 
        'var(--good)';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="insight-modal-header">
                    <span className={typeClass}><span className="dot"></span>{insight.title}</span>
                    <button title="Cerrar" className="close-btn" onClick={onClose} style={{fontSize: '24px'}}>&times;</button>
                </div>

                <p style={{margin: '0 0 16px', color: 'var(--muted)', fontSize: '14px', lineHeight: 1.5}}>
                    {insight.text}
                </p>

                <div className="insight-details-box" style={{ borderColor: borderColorClass }}>
                    <h3>Diagnóstico y Acciones Recomendadas</h3>
                    <p>
                        {insight.details.split('\n').map((line, index) => (
                            <React.Fragment key={index}>
                                {line}
                                <br />
                            </React.Fragment>
                        ))}
                    </p>
                </div>

                <div className="modal-actions">
                    <button type="button" className="btn primary" onClick={onClose}>Entendido</button>
                </div>
            </div>
        </div>
    );
};

export default InsightDetailModal;
