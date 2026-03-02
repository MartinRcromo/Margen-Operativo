import React from 'react';

interface ScenarioSliderProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    variant?: 'default' | 'warn';
    baseValue?: number;
    formatter?: (val: number) => string;
}

const ScenarioSlider: React.FC<ScenarioSliderProps> = ({
    label,
    value,
    onChange,
    min = -50,
    max = 50,
    step = 1,
    variant = 'default',
    baseValue,
    formatter
}) => {
    const displayValue = `${value > 0 ? '+' : ''}${Math.round(value)}%`;
    const percentage = ((value - min) / (max - min)) * 100;
    const accentColor = variant === 'warn' ? '#fbbf24' : '#22d3ee';

    const calculatedValue = baseValue !== undefined ? baseValue * (1 + value / 100) : null;

    return (
        <div className="bg-slate-900/60 border border-slate-800/50 rounded-2xl p-4 flex flex-col gap-3 shadow-inner transition-all hover:border-slate-700/50">
            <div className="flex justify-between items-center">
                <span className="text-[11px] font-black uppercase tracking-widest text-slate-100">{label}</span>
                <div className="flex flex-col items-end">
                    <span className={`text-[11px] font-black ${variant === 'warn' ? 'text-accent-yellow' : 'text-cyan-400'}`}>
                        {displayValue}
                    </span>
                    {calculatedValue !== null && formatter && (
                        <span className="text-[10px] font-bold text-slate-400 mt-0.5">
                            {formatter(calculatedValue)}
                        </span>
                    )}
                </div>
            </div>
            <div className="relative h-4 flex items-center">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="slider-custom w-full cursor-pointer"
                    style={{
                        '--progress': `${percentage}%`,
                        '--accent': accentColor
                    } as React.CSSProperties}
                />
            </div>
        </div>
    );
};

export default ScenarioSlider;