import React, { useState } from 'react';
import { parseCSV } from '../utils/csvParser';
import { toNum, normalizeDriver, cloneDeep } from '../utils/helpers';
import { importarPeriodoCompleto, getPeriodoByKey, eliminarDatosDePeriodo } from '../services/dataService';
import { Periodo, Product, Gasto, Fijo } from '../types';

interface ImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (periodo: Periodo, productos: Product[], gastos: Gasto[], fijos: Fijo[]) => void;
}

interface Preview {
    productos: number;
    gastos: number;
    fijos: number;
}

const pick = (obj: any, key: string) => {
    const k = Object.keys(obj).find(x => x.trim().toLowerCase() === key.toLowerCase());
    return k ? obj[k] : '';
};

const STEP_PERIODO = 1;
const STEP_CONFIRMAR = 2;
const STEP_ARCHIVOS = 3;

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const [step, setStep] = useState(STEP_PERIODO);
    const [nombre, setNombre] = useState('');
    const [fechaInicio, setFechaInicio] = useState('');
    const [fechaFin, setFechaFin] = useState('');
    const [prodFile, setProdFile] = useState<File | null>(null);
    const [gasFile, setGasFile] = useState<File | null>(null);
    const [fixFile, setFixFile] = useState<File | null>(null);
    const [dunFile, setDunFile] = useState<File | null>(null);
    const [existingPeriodo, setExistingPeriodo] = useState<Periodo | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const periodoKey = fechaInicio ? fechaInicio.slice(0, 7) : '';

    const handleClose = () => {
        setStep(STEP_PERIODO);
        setNombre('');
        setFechaInicio('');
        setFechaFin('');
        setProdFile(null);
        setGasFile(null);
        setFixFile(null);
        setDunFile(null);
        setExistingPeriodo(null);
        setPreview(null);
        setError('');
        onClose();
    };

    const handleNextStep = async () => {
        if (!nombre.trim()) { setError('Ingresá el nombre del periodo.'); return; }
        if (!fechaInicio) { setError('Ingresá la fecha de inicio.'); return; }
        if (!fechaFin) { setError('Ingresá la fecha de fin.'); return; }
        if (fechaFin < fechaInicio) { setError('La fecha de fin debe ser posterior al inicio.'); return; }
        setError('');
        setLoading(true);
        try {
            const existing = await getPeriodoByKey(periodoKey);
            setExistingPeriodo(existing);
            setStep(existing ? STEP_CONFIRMAR : STEP_ARCHIVOS);
        } catch (err: any) {
            setError(`Error al verificar el periodo: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        let pf: File | null = null, gf: File | null = null, ff: File | null = null, df: File | null = null;
        files.forEach(f => {
            const n = f.name.toUpperCase();
            if (n.includes('PRODUCTO') && n.endsWith('.CSV')) pf = f;
            else if (n.includes('GASTO') && n.endsWith('.CSV')) gf = f;
            else if (n.includes('FIJO') && n.endsWith('.CSV')) ff = f;
            else if (n.includes('DUN') && n.endsWith('.CSV')) df = f;
        });
        setProdFile(pf);
        setGasFile(gf);
        setFixFile(ff);
        setDunFile(df);
        setError('');

        if (pf && gf) {
            const prods = parseCSV(await pf.text()).filter(r => pick(r, 'Producto'));
            const gas = parseCSV(await gf.text()).filter(r => pick(r, 'Gasto'));
            const fij = ff ? parseCSV(await ff.text()).filter(r => pick(r, 'GastoFijo')) : [];
            setPreview({ productos: prods.length, gastos: gas.length, fijos: fij.length });
        } else {
            setPreview(null);
        }
    };

    const handleImport = async () => {
        if (!prodFile || !gasFile) { setError('PRODUCTOS.csv y GASTOS.csv son obligatorios.'); return; }
        setLoading(true);
        setError('');
        try {
            const dunMap: { [key: string]: string } = {};
            if (dunFile) {
                parseCSV(await dunFile.text()).forEach(d => {
                    const p = pick(d, 'Producto');
                    const du = pick(d, 'DUN');
                    if (p && du) dunMap[p.trim()] = du.trim();
                });
            }

            const parsedProdsRaw = parseCSV(await prodFile.text());
            const initialTotalVenta = parsedProdsRaw.reduce((s, r) => s + toNum(pick(r, 'Venta')), 0);

            const productos: Product[] = parsedProdsRaw.map(r => {
                const prodName = pick(r, 'Producto');
                const p: Product = {
                    Producto: prodName,
                    DUN: pick(r, 'DUN') || dunMap[prodName.trim()] || undefined,
                    Venta: toNum(pick(r, 'Venta')),
                    Costo: toNum(pick(r, 'Costo')),
                    VolVenta: toNum(pick(r, 'VolVenta')),
                    VolStock: toNum(pick(r, 'VolStock')),
                    StockVal: toNum(pick(r, 'StockVal')),
                    Bultos: toNum(pick(r, 'Bultos')),
                    Activo: true, _sim: false, _original: null,
                };
                p._original = cloneDeep(p);
                return p;
            }).filter(p => p.Producto);

            const gastos: Gasto[] = parseCSV(await gasFile.text()).map(r => {
                const tipoStr = pick(r, 'Directo/Indirecto').trim().toLowerCase();
                const esDirecto = tipoStr === 'directo';
                const importe = toNum(pick(r, 'Importe'));
                const pctVenta = esDirecto && initialTotalVenta > 0
                    ? (importe / initialTotalVenta) * 100
                    : 0;
                return {
                    Gasto: pick(r, 'Gasto'),
                    Importe: importe,
                    Driver: normalizeDriver(pick(r, 'Driver')),
                    Tipo: esDirecto ? 'Directo' : 'Indirecto',
                    PctVenta: pctVenta,
                } as Gasto;
            }).filter(g => g.Gasto);

            const fijos: Fijo[] = fixFile
                ? parseCSV(await fixFile.text()).map(r => ({
                    GastoFijo: pick(r, 'GastoFijo'),
                    Importe: toNum(pick(r, 'Importe')),
                })).filter(f => f.GastoFijo)
                : [];

                if (existingPeriodo) {
                await eliminarDatosDePeriodo(existingPeriodo.id);
            }

            const periodoData = { nombre: nombre.trim(), periodo_key: periodoKey, fecha_inicio: fechaInicio, fecha_fin: fechaFin };
            const periodo = await importarPeriodoCompleto(periodoData, productos, gastos, fijos);

            onSuccess(periodo, productos, gastos, fijos);
            handleClose();
        } catch (err: any) {
            setError(`Error al importar: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                <h2>Importar CSV a la base de datos</h2>

                {step === STEP_PERIODO && (
                    <>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                            Paso 1 de 2 — Definí el periodo al que corresponden los datos.
                        </p>
                        <div className="form-grid">
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label>Nombre del periodo</label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    placeholder="ej: ene-26"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label>Fecha inicio</label>
                                <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Fecha fin</label>
                                <input type="date" value={fechaFin} onChange={e => setFechaFin(e.target.value)} />
                            </div>
                        </div>
                        {periodoKey && (
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                                Clave interna: <strong>{periodoKey}</strong>
                            </p>
                        )}
                        {error && <div className="error-text" style={{ marginTop: '8px' }}>{error}</div>}
                        <div className="modal-actions">
                            <button className="btn" onClick={handleClose}>Cancelar</button>
                            <button className="btn primary" onClick={handleNextStep} disabled={loading}>
                                {loading ? 'Verificando...' : 'Siguiente →'}
                            </button>
                        </div>
                    </>
                )}

                {step === STEP_CONFIRMAR && existingPeriodo && (
                    <>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                            Paso 2 de 3 — Confirmación de reemplazo
                        </p>
                        <div style={{
                            background: 'rgba(234,179,8,0.1)',
                            border: '1px solid rgba(234,179,8,0.4)',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginBottom: '16px',
                        }}>
                            <p style={{ margin: '0 0 0.5rem', fontWeight: 700, color: '#ca8a04', fontSize: '14px' }}>
                                ⚠ El periodo ya existe en la base de datos
                            </p>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '13px', color: 'var(--text)' }}>
                                Periodo: <strong>{existingPeriodo.nombre}</strong> ({existingPeriodo.periodo_key})
                            </p>
                            <p style={{ margin: '0 0 0.75rem', fontSize: '13px', color: 'var(--text)' }}>
                                Fechas: {existingPeriodo.fecha_inicio} → {existingPeriodo.fecha_fin}
                            </p>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)' }}>
                                Si confirmás, se <strong>borrarán todos los datos del periodo</strong> (productos, gastos y fijos) y se cargarán los nuevos archivos.
                            </p>
                        </div>
                        <div className="modal-actions">
                            <button className="btn" onClick={handleClose}>Cancelar</button>
                            <button className="btn primary" onClick={() => setStep(STEP_ARCHIVOS)}>
                                Sí, reemplazar →
                            </button>
                        </div>
                    </>
                )}

                {step === STEP_ARCHIVOS && (
                    <>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '16px', fontSize: '13px' }}>
                            {existingPeriodo ? 'Paso 3 de 3' : 'Paso 2 de 2'} — Periodo: <strong>{nombre}</strong> ({periodoKey}). Seleccioná los archivos CSV.
                        </p>
                        <div className="form-group" style={{ marginBottom: '16px' }}>
                            <label className="file-input-label" style={{ display: 'inline-flex', cursor: 'pointer' }}>
                                <span className="pill"><span className="dot"></span>CSV</span>
                                Seleccionar archivos
                                <input
                                    type="file"
                                    accept=".csv"
                                    multiple
                                    onChange={handleFilesChange}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>

                        <div style={{ fontSize: '13px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <FileStatus label="PRODUCTOS.csv" file={prodFile} required />
                            <FileStatus label="GASTOS.csv" file={gasFile} required />
                            <FileStatus label="FIJOS.csv" file={fixFile} />
                            <FileStatus label="DUN.csv" file={dunFile} />
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '0 0 16px' }}>
                            Los archivos deben contener <strong>PRODUCTO</strong>, <strong>GASTO</strong>, <strong>FIJO</strong> o <strong>DUN</strong> en el nombre del archivo.
                        </p>

                        {preview && (
                            <div style={{ background: 'var(--bg-card)', borderRadius: '8px', padding: '12px', fontSize: '13px', marginBottom: '16px' }}>
                                <strong>Preview:</strong> {preview.productos} productos · {preview.gastos} gastos · {preview.fijos} fijos
                            </div>
                        )}

                        {error && <div className="error-text" style={{ marginTop: '8px' }}>{error}</div>}

                        <div className="modal-actions">
                            <button className="btn" onClick={() => { setStep(existingPeriodo ? STEP_CONFIRMAR : STEP_PERIODO); setError(''); }}>← Volver</button>
                            <button
                                className="btn primary"
                                onClick={handleImport}
                                disabled={loading || !prodFile || !gasFile}
                            >
                                {loading ? 'Importando...' : 'Confirmar importación'}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const FileStatus: React.FC<{ label: string; file: File | null; required?: boolean }> = ({ label, file, required }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: file ? 'var(--good)' : required ? 'var(--bad)' : 'var(--text-muted)' }}>
            {file ? '✓' : required ? '✗' : '–'}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>{label}</span>
        {file && <span style={{ color: 'var(--text-dim)', fontSize: '11px' }}>{file.name}</span>}
    </div>
);

export default ImportModal;
