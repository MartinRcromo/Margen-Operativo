import { supabase } from '../lib/supabase';
import { Periodo, Product, Gasto, Fijo } from '../types';

// ---------- PERIODOS ----------

export async function getPeriodos(): Promise<Periodo[]> {
    const { data, error } = await supabase
        .from('periodos')
        .select('*')
        .order('periodo_key', { ascending: false });
    if (error) throw new Error(error.message);
    return data as Periodo[];
}

export async function insertPeriodo(periodo: Omit<Periodo, 'id' | 'created_at'>): Promise<Periodo> {
    const { data, error } = await supabase
        .from('periodos')
        .insert(periodo)
        .select()
        .single();
    if (error) throw new Error(error.message);
    return data as Periodo;
}

export async function deletePeriodo(id: string): Promise<void> {
    const { error } = await supabase
        .from('periodos')
        .delete()
        .eq('id', id);
    if (error) throw new Error(error.message);
}

// ---------- PRODUCTOS ----------

export async function getProductosByPeriodo(periodoId: string): Promise<Product[]> {
    const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('periodo_id', periodoId);
    if (error) throw new Error(error.message);
    return (data as any[]).map(r => ({
        Producto: r.Producto,
        DUN: r.DUN ?? undefined,
        Venta: Number(r.Venta),
        Costo: Number(r.Costo),
        VolVenta: Number(r.VolVenta),
        VolStock: Number(r.VolStock),
        StockVal: Number(r.StockVal),
        Bultos: Number(r.Bultos),
        Activo: true,
        _sim: false,
        _original: null,
    }));
}

export async function insertProductos(periodoId: string, productos: Product[]): Promise<void> {
    const rows = productos.map(p => ({
        periodo_id: periodoId,
        Producto: p.Producto,
        DUN: p.DUN ?? null,
        Venta: Number(p.Venta),
        Costo: Number(p.Costo),
        VolVenta: Number(p.VolVenta),
        VolStock: Number(p.VolStock),
        StockVal: Number(p.StockVal),
        Bultos: Number(p.Bultos),
    }));
    const { error } = await supabase.from('productos').insert(rows);
    if (error) throw new Error(error.message);
}

// ---------- GASTOS ----------

export async function getGastosByPeriodo(periodoId: string): Promise<Gasto[]> {
    const { data, error } = await supabase
        .from('gastos')
        .select('*')
        .eq('periodo_id', periodoId);
    if (error) throw new Error(error.message);
    return (data as any[]).map(r => ({
        Gasto: r.Gasto,
        Importe: Number(r.Importe),
        Driver: r.Driver,
        Tipo: r.Tipo as 'Directo' | 'Indirecto',
        PctVenta: Number(r.PctVenta),
    }));
}

export async function insertGastos(periodoId: string, gastos: Gasto[]): Promise<void> {
    const rows = gastos.map(g => ({
        periodo_id: periodoId,
        Gasto: g.Gasto,
        Importe: Number(g.Importe),
        Driver: g.Driver,
        Tipo: g.Tipo ?? 'Indirecto',
        PctVenta: Number(g.PctVenta ?? 0),
    }));
    const { error } = await supabase.from('gastos').insert(rows);
    if (error) throw new Error(error.message);
}

// ---------- FIJOS ----------

export async function getFijosByPeriodo(periodoId: string): Promise<Fijo[]> {
    const { data, error } = await supabase
        .from('fijos')
        .select('*')
        .eq('periodo_id', periodoId);
    if (error) throw new Error(error.message);
    return (data as any[]).map(r => ({
        GastoFijo: r.GastoFijo,
        Importe: Number(r.Importe),
    }));
}

export async function insertFijos(periodoId: string, fijos: Fijo[]): Promise<void> {
    const rows = fijos.map(f => ({
        periodo_id: periodoId,
        GastoFijo: f.GastoFijo,
        Importe: Number(f.Importe),
    }));
    const { error } = await supabase.from('fijos').insert(rows);
    if (error) throw new Error(error.message);
}

// ---------- IMPORTACION COMPLETA ----------

export async function importarPeriodoCompleto(
    periodoData: Omit<Periodo, 'id' | 'created_at'>,
    productos: Product[],
    gastos: Gasto[],
    fijos: Fijo[],
): Promise<Periodo> {
    const periodo = await insertPeriodo(periodoData);
    await Promise.all([
        insertProductos(periodo.id, productos),
        insertGastos(periodo.id, gastos),
        insertFijos(periodo.id, fijos),
    ]);
    return periodo;
}
