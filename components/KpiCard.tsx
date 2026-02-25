import React from 'react';

interface KpiCardProps {
    label: string;
    value: string;
    sub?: string;
    isMain?: boolean;
    accentColor?: boolean;
    goodColor?: boolean;
}

const KpiCard: React.FC<KpiCardProps> = ({ label, value, sub, isMain = false, accentColor = false, goodColor = false }) => {
    const valueStyle = {
        color: accentColor ? 'var(--accent)' : goodColor ? 'var(--good)' : undefined,
    };
    return (
        <div className={`kpi ${isMain ? 'kpi-main' : ''}`}>
            <div className="label">{label}</div>
            <div className="value" style={valueStyle}>{value}</div>
            {sub && <div className="sub">{sub}</div>}
        </div>
    );
};

export default KpiCard;
