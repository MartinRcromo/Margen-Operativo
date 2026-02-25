import React from 'react';

interface ScenarioSliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    variant?: 'default' | 'warn';
}

const ScenarioSlider: React.FC<ScenarioSliderProps> = ({
    label,
    value,
    onChange,
    min = -50,
    max = 50,
    step = 1,
    variant = 'default'
}) => {
    const displayValue = `${value > 0 ? '+' : ''}${value}%`;

    return (
        <div className={`sliderRow ${variant === 'warn' ? 'warn-slider' : ''}`}>
            <div className="sliderTop">
                <div className="name">{label}</div>
                <div className="val">{displayValue}</div>
            </div>
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </div>
    );
};

export default ScenarioSlider;