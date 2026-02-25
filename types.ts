
export interface Product {
    Producto: string;
    DUN?: string;
    Venta: number | string;
    Costo: number | string;
    VolVenta: number | string;
    VolStock: number | string;
    StockVal: number | string;
    Bultos: number | string;
    Activo: boolean;
    _sim: boolean;
    _original: any; // Could be more specific if needed
    // Calculated fields
    Resultado?: number;
    MarkUp?: number | null;
    GastosAsignados?: number;
    MargenOper?: number;
    MargenPct?: number;
    ROI?: number | null;
    _gastosDetalle?: { Gasto: string, Importe: number }[];
}

export type NewProductData = Omit<Product, 'Activo' | '_sim' | '_original' | 'Resultado' | 'MarkUp' | 'GastosAsignados' | 'MargenOper' | 'MargenPct' | 'ROI' | '_gastosDetalle'>;

export interface Gasto {
    Gasto: string;
    Importe: number | string;
    Driver: string;
    Tipo?: 'Directo' | 'Indirecto';
    PctVenta?: number | string;
}

export interface Fijo {
    GastoFijo: string;
    Importe: number | string;
}

export interface Scenario {
    ventaPct: number;
    costoPct: number;
    volVentaPct: number;
    volStockPct: number;
    stockValPct: number;
    bultosPct: number;
    precioPromedioPct?: number;
}

export interface DunScenario {
    cmvPct: number;
    gastosOperativosPct: number;
    bultosPct: number;
    precioPromedioPct: number;
}

export interface IndividualGastoScenario {
    operativos: { [name: string]: number };
    fijos: { [name:string]: number };
}

export interface Totals {
    VENTA: number;
    RESULTADO: number;
    VOLVENTA: number;
    VOLSTOCK: number;
    STOCKVAL: number;
    BULTOS: number;
}

export interface Summary {
    totalVenta: number;
    totalResultado: number;
    totalMargenOper: number;
    totalGastosOperativos: number;
    resultadoFinal: number;
    totalFijos: number;
    margenOperPctGlobal: number;
    activos: number;
    tot: number;
    sim: number;
}

export interface CalculationResult {
    allProds: Product[];
    gastos: Gasto[];
    totals: Totals;
    summary: Summary;
}

export interface Sort {
    key: keyof Product | 'MargenOper' | 'MarkUp';
    order: 'asc' | 'desc';
}

export interface Insight {
    type: 'good' | 'warn' | 'bad';
    title: string;
    text: string;
    details: string;
}
