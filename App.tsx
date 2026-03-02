

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Product, Gasto, Fijo, Scenario, Totals, CalculationResult, Sort, IndividualGastoScenario, NewProductData, Insight, Summary, DunScenario } from './types';
import { parseCSV } from './utils/csvParser';
import { cloneDeep } from './utils/helpers';
import Header from './components/Header';
import KpiDashboard from './components/KpiDashboard';
import GlobalScenarios from './components/GlobalScenarios';
import ProductTable from './components/ProductTable';
import ProductScenarioPanel from './components/ProductScenarioPanel';
import Banner from './components/Banner';
import AddProductModal from './components/AddProductModal';
import DeleteProductModal from './components/DeleteProductModal';
import DunFilterBar from './components/DunFilterBar';

const DRIVER_KEYS = new Set(["VENTA", "RESULTADO", "VOLVENTA", "VOLSTOCK", "STOCKVAL", "BULTOS"]);

const toNum = (v: any): number => {
  if (v === null || v === undefined) return 0;
  if (typeof v === "number") return v;
  let s = String(v).trim();
  if (!s) return 0;
  s = s.replace(/\s/g, "");
  const hasComma = s.includes(",");
  const hasDot = s.includes(".");
  if (hasComma && hasDot) s = s.replace(/\./g, "").replace(",", ".");
  else if (hasComma && !hasDot) s = s.replace(",", ".");
  else s = s.replace(/,/g, "");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
};

const normalizeDriver = (d: string) => {
  const k = String(d || "").trim().toUpperCase();
  if (!k) return "";
  if (k === "VOL VENTA" || k === "VOLUMEN VENTA") return "VOLVENTA";
  if (k === "VOL STOCK" || k === "VOLUMEN STOCK") return "VOLSTOCK";
  if (k === "STOCK VAL" || k === "STOCKVALORIZADO" || k === "STOCK VALORIZADO") return "STOCKVAL";
  if (k === "VENTAS") return "VENTA";
  if (k === "GANANCIA" || k === "IIGG" || k === "RESULT") return "RESULTADO";
  if (k === "BULTO" || k === "BULTOS") return "BULTOS";
  return k;
};

const runCalculation = (
    products: Product[],
    gastos: Gasto[],
    fijos: Fijo[],
    globalScenario: Scenario,
    scenarioByProduct: { [key: string]: Scenario },
    gastosOperativosPct: number,
    gastosFijosPct: number,
    individualGastosScenarios: IndividualGastoScenario,
    selectedDun: string,
    dunScenarios: { [key: string]: DunScenario },
    scenarioMode: 'REAL' | 'IDEAL'
): CalculationResult | null => {
    if (products.length === 0) return null;
    
    const multFromPct = (pct: number) => 1 + (Number(pct || 0) / 100);

    const baseProds = products.map(p => ({
        ...p,
        Venta: toNum(p.Venta), Costo: toNum(p.Costo),
        VolVenta: toNum(p.VolVenta), VolStock: toNum(p.VolStock),
        StockVal: toNum(p.StockVal), Bultos: toNum(p.Bultos),
        Resultado: toNum(p.Venta) - toNum(p.Costo),
    }));

    let allProds = baseProds.map(p => {
        if (!p.Activo) return p;
        const g = globalScenario;
        const ps = scenarioByProduct[p.Producto] || null;
        const isSim = ps && Object.values(ps).some(v => v != null && v !== 0);
        const original = p._original || p;
        const newP = { ...p, _sim: isSim };


        const useDunProductScenario = selectedDun && p.DUN === selectedDun && isSim && ps.precioPromedioPct != null;
        const mC = multFromPct(g.costoPct) * multFromPct(isSim ? ps.costoPct : 0);
        const mVV = multFromPct(g.volVentaPct) * multFromPct(isSim ? ps.volVentaPct : 0);
        const mVS = multFromPct(g.volStockPct) * multFromPct(isSim ? ps.volStockPct : 0);
        const mB = multFromPct(g.bultosPct) * multFromPct(isSim ? ps.bultosPct : 0);
        newP.Costo = toNum(original.Costo) * mC;
        newP.VolVenta = toNum(original.VolVenta) * mVV;
        newP.VolStock = toNum(original.VolStock) * mVS;
        newP.Bultos = toNum(original.Bultos) * mB;
        if (useDunProductScenario) {
            const mSV = multFromPct(g.stockValPct) * multFromPct(isSim ? ps.stockValPct : 0);
            newP.StockVal = toNum(original.StockVal) * mSV;
            const originalBultos = toNum(original.Bultos);
            const originalVenta = toNum(original.Venta);
            const originalPrecio = originalBultos > 0 ? originalVenta / originalBultos : 0;
            const priceMultiplier = multFromPct(g.ventaPct) * multFromPct(ps.precioPromedioPct || 0);
            const newPrecio = originalPrecio * priceMultiplier;
            newP.Venta = newP.Bultos * newPrecio;
        } else {
            const mSV = multFromPct(g.stockValPct) * multFromPct(isSim ? ps.stockValPct : 0);
            newP.StockVal = toNum(original.StockVal) * mSV;

            const originalBultos = toNum(original.Bultos);
            const originalVenta = toNum(original.Venta);
            const originalPrecio = originalBultos > 0 ? originalVenta / originalBultos : 0;

            const priceMultiplier = multFromPct(g.ventaPct) * multFromPct(isSim ? (ps.precioPromedioPct || ps.ventaPct || 0) : 0);
            const bultosMultiplier = multFromPct(g.bultosPct) * multFromPct(isSim ? (ps.bultosPct || 0) : 0);
            newP.Bultos = toNum(original.Bultos) * bultosMultiplier;

            const newPrecio = originalPrecio * priceMultiplier;
            newP.Venta = newP.Bultos * newPrecio;
        }
        const dunScenario = selectedDun && p.DUN === selectedDun ? dunScenarios[selectedDun] : null;
        if (dunScenario) {
            const originalBultos = toNum(original.Bultos);
            const originalVenta = toNum(original.Venta);
            const originalPrecio = originalBultos > 0 ? originalVenta / originalBultos : 0;
            newP.Bultos *= multFromPct(dunScenario.bultosPct);
            const newPrecio = originalPrecio * multFromPct(dunScenario.precioPromedioPct);
            newP.Venta = newP.Bultos * newPrecio;
            newP.Costo *= multFromPct(dunScenario.cmvPct);
        }
        if (scenarioMode === 'IDEAL' && p._original && toNum(p._original.StockIdealVal) > 0) {
            const originalData = p._original;
            const stockIdealVal = toNum(originalData.StockIdealVal);

            newP.StockVal = stockIdealVal;

            const stockReal = toNum(originalData.VolStock);
            const stockValReal = toNum(originalData.StockVal);
            
            let unitValue = 0;
            if (stockReal > 0 && stockValReal > 0) {
                unitValue = stockValReal / stockReal;
            } else {
                const volVenta = toNum(originalData.VolVenta);
                const costo = toNum(originalData.Costo);
                if (volVenta > 0) {
                    unitValue = costo / volVenta;
                }
            }

            if (unitValue > 0) {
                newP.VolStock = stockIdealVal / unitValue;
            } else {
                newP.VolStock = 0;
            }
        }
        return newP;
    });

    allProds.forEach(p => {
        p.Resultado = p.Venta - p.Costo;
        p.MarkUp = p.Costo > 0 ? p.Resultado / p.Costo : null;
        p.GastosAsignados = 0;
        p._gastosDetalle = [];
    });
    
    const activeProds = allProds.filter(p => p.Activo);
    const totals: Totals = {
        VENTA: activeProds.reduce((a, p) => a + p.Venta, 0),
        RESULTADO: activeProds.reduce((a, p) => a + p.Resultado!, 0),
        COSTO: activeProds.reduce((a, p) => a + (p.Costo as number), 0),
        VOLVENTA: activeProds.reduce((a, p) => a + p.VolVenta, 0),
        VOLSTOCK: activeProds.reduce((a, p) => a + p.VolStock, 0),
        STOCKVAL: activeProds.reduce((a, p) => a + p.StockVal, 0),
        BULTOS: activeProds.reduce((a, p) => a + p.Bultos, 0),
    };

    const gastosOperativosMultiplier = multFromPct(gastosOperativosPct);
    const currentGastos = gastos.map(g => {
        const individualPct = individualGastosScenarios.operativos[g.Gasto] || 0;
        let importeFinal;

        if (g.Tipo === 'Directo') {
            const pctVenta = toNum(g.PctVenta) / 100;
            const importeCalculado = totals.VENTA * pctVenta;
            importeFinal = importeCalculado * multFromPct(individualPct) * gastosOperativosMultiplier;
        } else {
            const importeBase = toNum(g.Importe);
            importeFinal = importeBase * multFromPct(individualPct) * gastosOperativosMultiplier;
        }
        
        return { ...g, Importe: importeFinal, Driver: normalizeDriver(g.Driver) };
    });

    for (const g of currentGastos) {
        if (!g.Driver || g.Importe === 0 || !DRIVER_KEYS.has(g.Driver)) continue;
        const driverKey = g.Driver as keyof Totals;
        const pool = totals[driverKey] || 0;
        if (pool === 0) continue;
        for (const p of activeProds) {
            let base = 0;
            if (g.Driver === "VENTA") base = p.Venta;
            else if (g.Driver === "RESULTADO") base = p.Resultado!;
            else if (g.Driver === "VOLVENTA") base = p.VolVenta;
            else if (g.Driver === "VOLSTOCK") base = p.VolStock;
            else if (g.Driver === "STOCKVAL") base = p.StockVal;
            else if (g.Driver === "BULTOS") base = p.Bultos;
            const assignedAmount = (g.Importe as number) * (base / pool);
            p.GastosAsignados! += assignedAmount;
            if (assignedAmount !== 0) {
                p._gastosDetalle!.push({ Gasto: g.Gasto, Importe: assignedAmount });
            }
        }
    }

    const dunScenarioForGastos = selectedDun ? dunScenarios[selectedDun] : null;
    if (dunScenarioForGastos) {
        const dunGastosMultiplier = multFromPct(dunScenarioForGastos.gastosOperativosPct);
        activeProds.forEach(p => {
            if (p.DUN === selectedDun) {
                p.GastosAsignados! *= dunGastosMultiplier;
            }
        });
    }

    allProds.forEach(p => {
        p.MargenOper = p.Resultado! - (p.Activo ? p.GastosAsignados! : 0);
        p.MargenPct = (p.Venta === 0) ? 0 : (p.MargenOper / p.Venta);
        p.ROI = (p.StockVal === 0) ? null : (p.MargenOper / p.StockVal);
    });
    
    const gastosFijosMultiplier = multFromPct(gastosFijosPct);
    const totalFijos = fijos.reduce((a, x) => {
        const individualPct = individualGastosScenarios.fijos[x.GastoFijo] || 0;
        const importeBase = toNum(x.Importe);
        const importeFinal = importeBase * multFromPct(individualPct) * gastosFijosMultiplier;
        return a + importeFinal;
    }, 0);

    const totalMargenOper = activeProds.reduce((a, p) => a + p.MargenOper!, 0);
    const totalGastosOperativos = totals.RESULTADO - totalMargenOper;
    const totalBultos = activeProds.reduce((a, p) => a + toNum(p.Bultos), 0);

    const summary = {
        totalVenta: totals.VENTA,
        totalResultado: totals.RESULTADO,
        totalMargenOper,
        totalGastosOperativos,
        resultadoFinal: totalMargenOper - totalFijos,
        totalFijos,
        margenOperPctGlobal: (totals.VENTA === 0) ? 0 : (totalMargenOper / totals.VENTA),
        activos: activeProds.length, tot: allProds.length,
        sim: allProds.filter(x => x._sim).length,
        precioPromedio: totalBultos === 0 ? 0 : totals.VENTA / totalBultos,
        totalBultos,
        costoPromedio: totalBultos === 0 ? 0 : totals.COSTO / totalBultos,
        gastosOperativosPct: (totals.VENTA === 0) ? 0 : (totalGastosOperativos / totals.VENTA),
        gastosFijosPct: (totals.VENTA === 0) ? 0 : (totalFijos / totals.VENTA),
        markupPct: (totals.COSTO === 0) ? 0 : (totals.RESULTADO / totals.COSTO),
        avgMarkUp: 0,
        avgMarkup: 0,
        avgContribMarginalPct: 0,
        avgROI: 0
    };
    
    return { allProds, gastos: currentGastos, totals, summary };
};


const App: React.FC = () => {
  // FIX: Corrected a typo in the useState hook declaration.
  const [products, setProducts] = useState<Product[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [fijos, setFijos] = useState<Fijo[]>([]);
  
  const [initialProducts, setInitialProducts] = useState<Product[]>([]);
  const [initialGastos, setInitialGastos] = useState<Gasto[]>([]);
  const [initialFijos, setInitialFijos] = useState<Fijo[]>([]);
  
  const [displayMillions, setDisplayMillions] = useState<boolean>(true);
  const [globalScenario, setGlobalScenario] = useState<Scenario>({ ventaPct: 0, costoPct: 0, volVentaPct: 0, volStockPct: 0, stockValPct: 0, bultosPct: 0 });
  const [dunScenarios, setDunScenarios] = useState<{ [key: string]: DunScenario }>({});
  const [gastosOperativosPct, setGastosOperativosPct] = useState(0);
  const [gastosFijosPct, setGastosFijosPct] = useState(0);
  const [individualGastosScenarios, setIndividualGastosScenarios] = useState<IndividualGastoScenario>({ operativos: {}, fijos: {} });
  const [scenarioByProduct, setScenarioByProduct] = useState<{ [key: string]: Scenario }>({});
  const [sort, setSort] = useState<Sort>({ key: 'MargenOper', order: 'desc' });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDun, setSelectedDun] = useState('');
  const [status, setStatus] = useState({ text: 'Esperando datos', kind: 'neutral' });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scenarioMode, setScenarioMode] = useState<'REAL' | 'IDEAL'>('REAL');

  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Theme Toggle
  useEffect(() => {
    const theme = localStorage.getItem('theme') || 'dark';
    document.body.dataset.theme = theme;
  }, []);
  
  const toggleTheme = () => {
    const newTheme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    document.body.dataset.theme = newTheme;
    localStorage.setItem('theme', newTheme);
  };
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    try {
      const files = Array.from(fileList);
      const byName: { [key: string]: File } = {};
      files.forEach((f: File) => byName[f.name.toUpperCase()] = f);

      const fileValues = Object.values(byName);
      const prodFile = fileValues.find(f => f.name.toUpperCase().includes("PRODUCTOS") && f.name.toUpperCase().endsWith(".CSV"));
      const gasFile = fileValues.find(f => f.name.toUpperCase().includes("GASTOS") && f.name.toUpperCase().endsWith(".CSV"));
      const fixFile = fileValues.find(f => f.name.toUpperCase().includes("FIJOS") && f.name.toUpperCase().endsWith(".CSV"));
      const dunFile = fileValues.find(f => f.name.toUpperCase().includes("DUN") && f.name.toUpperCase().endsWith(".CSV"));

      if (!prodFile || !gasFile) {
        alert("Subir PRODUCTOS.csv y GASTOS.csv juntos.");
        return;
      }
      
      const pick = (obj: any, key: string) => {
          const k = Object.keys(obj).find(x => x.trim().toLowerCase() === key.toLowerCase());
          return k ? obj[k] : "";
      };
      
      const dunMap: { [key: string]: string } = {};
      if (dunFile) {
          const parsedDuns = parseCSV(await dunFile.text());
          parsedDuns.forEach(d => {
              const prodName = pick(d, "Producto");
              const dunName = pick(d, "DUN");
              if (prodName && dunName) {
                  dunMap[prodName.trim()] = dunName.trim();
              }
          });
      }

      const parsedProds = parseCSV(await prodFile.text()).map(r => {
        const prodName = pick(r, "Producto");
        const p: Product = {
          Producto: prodName, 
          DUN: dunMap[prodName.trim()],
          Venta: pick(r, "Venta"), Costo: pick(r, "Costo"),
          VolVenta: pick(r, "VolVenta"), VolStock: pick(r, "VolStock"), StockVal: pick(r, "StockVal"), Bultos: pick(r, "Bultos"),
          StockIdealVal: pick(r, "StockIdealVal"),
          Activo: true, _sim: false, _original: null
        };
        p._original = cloneDeep(p);
        return p;
      }).filter(x => x.Producto);
      
      const initialTotalVenta = parsedProds.reduce((sum, p) => sum + toNum(p.Venta), 0);
      
      const parsedGastos = parseCSV(await gasFile.text()).map(r => {
        const tipoStr = pick(r, "Directo/Indirecto").trim().toLowerCase();
        const esDirecto = tipoStr === 'directo';
        const importe = toNum(pick(r, "Importe"));
        
        let pctSobreVenta = 0;
        if (esDirecto && initialTotalVenta > 0) {
            pctSobreVenta = (importe / initialTotalVenta) * 100;
        }

        const g: Gasto = {
            Gasto: pick(r, "Gasto"), 
            Importe: importe, 
            Driver: pick(r, "Driver"),
            Tipo: esDirecto ? 'Directo' : 'Indirecto',
            PctVenta: pctSobreVenta,
        };
        return g;
      }).filter(x => x.Gasto);

      const parsedFijos = fixFile ? parseCSV(await fixFile.text()).map(r => ({
          GastoFijo: pick(r, "GastoFijo"), Importe: pick(r, "Importe")
      })) : [];

      setInitialProducts(cloneDeep(parsedProds));
      setInitialGastos(cloneDeep(parsedGastos));
      setInitialFijos(cloneDeep(parsedFijos));
      
      setProducts(cloneDeep(parsedProds));
      setGastos(cloneDeep(parsedGastos));
      setFijos(cloneDeep(parsedFijos));
      setIndividualGastosScenarios({ operativos: {}, fijos: {} });

    } catch (error) {
      console.error(error);
      alert("Error al procesar los archivos CSV. Revisa el formato.");
    } finally {
        if(fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  
  const calculationResult: CalculationResult | null = useMemo(() => {
    return runCalculation(
        products,
        gastos,
        fijos,
        globalScenario,
        scenarioByProduct,
        gastosOperativosPct,
        gastosFijosPct,
        individualGastosScenarios,
        selectedDun,
        dunScenarios,
        scenarioMode
    );
  }, [products, gastos, fijos, globalScenario, scenarioByProduct, gastosOperativosPct, gastosFijosPct, individualGastosScenarios, selectedDun, dunScenarios, scenarioMode]);

  const baselineResult: CalculationResult | null = useMemo(() => {
    if (initialProducts.length === 0) return null;
    return runCalculation(
        initialProducts,
        initialGastos,
        initialFijos,
        { ventaPct: 0, costoPct: 0, volVentaPct: 0, volStockPct: 0, stockValPct: 0, bultosPct: 0 },
        {},
        0,
        0,
        { operativos: {}, fijos: {} },
        selectedDun,
        {},
        'REAL'
    );
  }, [initialProducts, initialGastos, initialFijos, selectedDun]);

    const displaySummary: Summary | null = useMemo(() => {
        if (!calculationResult) return null;
        if (!selectedDun) {
            return calculationResult.summary;
        }

        const dunProducts = calculationResult.allProds.filter(p => p.DUN === selectedDun);
        const activeDunProducts = dunProducts.filter(p => p.Activo);

        const dunSummaryData: Summary = {
            totalVenta: activeDunProducts.reduce((sum, p) => sum + (p.Venta as number), 0),
            totalResultado: activeDunProducts.reduce((sum, p) => sum + p.Resultado!, 0),
            totalMargenOper: activeDunProducts.reduce((sum, p) => sum + p.MargenOper!, 0),
            totalGastosOperativos: 0,
            resultadoFinal: 0, // Not applicable for DUN view
            totalFijos: 0, // Not applicable for DUN view
            margenOperPctGlobal: 0,
            activos: activeDunProducts.length,
            tot: dunProducts.length,
            sim: dunProducts.filter(x => x._sim).length,
            precioPromedio: 0,
            totalBultos: 0,
            costoPromedio: 0,
            gastosOperativosPct: 0,
            gastosFijosPct: 0,
            markupPct: 0,
            avgMarkUp: 0,
            avgMarkup: 0,
            avgContribMarginalPct: 0,
            avgROI: 0
        };

        const totalBultos = activeDunProducts.reduce((sum, p) => sum + toNum(p.Bultos), 0);
        const totalCosto = activeDunProducts.reduce((sum, p) => sum + toNum(p.Costo), 0);
        dunSummaryData.totalBultos = totalBultos;
        dunSummaryData.precioPromedio = totalBultos === 0 ? 0 : dunSummaryData.totalVenta / totalBultos;
        dunSummaryData.costoPromedio = totalBultos === 0 ? 0 : totalCosto / totalBultos;
        dunSummaryData.totalGastosOperativos = dunSummaryData.totalResultado - dunSummaryData.totalMargenOper;
        dunSummaryData.margenOperPctGlobal = dunSummaryData.totalVenta === 0 ? 0 : dunSummaryData.totalMargenOper / dunSummaryData.totalVenta;

        // New KPIs for DUN view
        dunSummaryData.gastosOperativosPct = dunSummaryData.totalVenta === 0 ? 0 : (dunSummaryData.totalGastosOperativos / dunSummaryData.totalVenta);
        dunSummaryData.gastosFijosPct = 0; 
        dunSummaryData.markupPct = totalCosto === 0 ? 0 : (dunSummaryData.totalResultado / totalCosto);

        return dunSummaryData;
    }, [calculationResult, selectedDun]);

    const baselineSummary: Summary | null = useMemo(() => {
        if (!baselineResult) return null;
        if (!selectedDun) {
            return baselineResult.summary;
        }

        const dunProducts = baselineResult.allProds.filter(p => p.DUN === selectedDun);
        const activeDunProducts = dunProducts.filter(p => p.Activo);

        const dunSummaryData: Summary = {
            totalVenta: activeDunProducts.reduce((sum, p) => sum + (p.Venta as number), 0),
            totalResultado: activeDunProducts.reduce((sum, p) => sum + p.Resultado!, 0),
            totalMargenOper: activeDunProducts.reduce((sum, p) => sum + p.MargenOper!, 0),
            totalGastosOperativos: 0,
            resultadoFinal: 0, // Not applicable for DUN view
            totalFijos: 0, // Not applicable for DUN view
            margenOperPctGlobal: 0,
            activos: activeDunProducts.length,
            tot: dunProducts.length,
            sim: dunProducts.filter(x => x._sim).length,
            precioPromedio: 0,
            totalBultos: 0,
            costoPromedio: 0,
            gastosOperativosPct: 0,
            gastosFijosPct: 0,
            markupPct: 0,
            avgMarkUp: 0,
            avgMarkup: 0,
            avgContribMarginalPct: 0,
            avgROI: 0
        };

        const totalBultos = activeDunProducts.reduce((sum, p) => sum + toNum(p.Bultos), 0);
        const totalCosto = activeDunProducts.reduce((sum, p) => sum + toNum(p.Costo), 0);
        dunSummaryData.totalBultos = totalBultos;
        dunSummaryData.precioPromedio = totalBultos === 0 ? 0 : dunSummaryData.totalVenta / totalBultos;
        dunSummaryData.costoPromedio = totalBultos === 0 ? 0 : totalCosto / totalBultos;
        dunSummaryData.totalGastosOperativos = dunSummaryData.totalResultado - dunSummaryData.totalMargenOper;
        dunSummaryData.margenOperPctGlobal = dunSummaryData.totalVenta === 0 ? 0 : dunSummaryData.totalMargenOper / dunSummaryData.totalVenta;

        // New KPIs for DUN view
        dunSummaryData.gastosOperativosPct = dunSummaryData.totalVenta === 0 ? 0 : (dunSummaryData.totalGastosOperativos / dunSummaryData.totalVenta);
        dunSummaryData.gastosFijosPct = 0; 
        dunSummaryData.markupPct = totalCosto === 0 ? 0 : (dunSummaryData.totalResultado / totalCosto);

        return dunSummaryData;
    }, [baselineResult, selectedDun]);


  useEffect(() => {
    if (calculationResult) {
      const { summary } = calculationResult;
      setStatus({ text: `${summary.activos} activas · ${summary.sim} simuladas`, kind: summary.activos ? "good" : "warn" });
    } else {
      setStatus({ text: 'Esperando datos', kind: 'neutral' });
    }
  }, [calculationResult]);

  const loadSampleData = useCallback(() => {
    const prods = [
      { Producto: "Opticas", DUN: "Juan Perez", Venta: 12000000, Costo: 8000000, VolVenta: 300, VolStock: 900, StockVal: 6500000, Bultos: 1200, StockIdealVal: 4000000, Activo: true, _sim:false },
      { Producto: "Paragolpes", DUN: "Maria Garcia", Venta: 9000000, Costo: 6400000, VolVenta: 220, VolStock: 500, StockVal: 4200000, Bultos: 900, StockIdealVal: 3000000, Activo: true, _sim:false },
      { Producto: "Espejos", DUN: "Juan Perez", Venta: 5000000, Costo: 3800000, VolVenta: 90, VolStock: 700, StockVal: 5100000, Bultos: 700, StockIdealVal: 2000000, Activo: true, _sim:false },
    ].map(p => ({ ...p, _original: cloneDeep(p) }));
    const sampleGastos: Gasto[] = [
      { Gasto: "Sueldos Logística", Importe: 1400000, Driver: "Bultos", Tipo: 'Indirecto' },
      { Gasto: "Fletes", Importe: 900000, Driver: "VolVenta", Tipo: 'Indirecto' },
      { Gasto: "IIBB", Importe: 0, Driver: "Venta", Tipo: 'Directo', PctVenta: '3%' },
    ];
    const sampleFijos = [{ GastoFijo: "Estructura", Importe: 950000 }];

    setInitialProducts(cloneDeep(prods));
    setInitialGastos(cloneDeep(sampleGastos));
    setInitialFijos(cloneDeep(sampleFijos));
    
    setProducts(cloneDeep(prods));
    setGastos(cloneDeep(sampleGastos));
    setFijos(cloneDeep(sampleFijos));
    
    setGlobalScenario({ ventaPct: 0, costoPct: 0, volVentaPct: 0, volStockPct: 0, stockValPct: 0, bultosPct: 0 });
    setScenarioByProduct({});
    setIndividualGastosScenarios({ operativos: {}, fijos: {} });
    setDunScenarios({});
  }, []);
  
  const handleUpdateProductField = useCallback((index: number, field: keyof Product, value: any) => {
    setProducts(current => {
        const newProducts = [...current];
        (newProducts[index] as any)[field] = value;
        return newProducts;
    });
  }, []);

  const handleRevertProductField = useCallback((index: number, field: keyof Product) => {
    setProducts(current => {
        const newProducts = [...current];
        const originalValue = newProducts[index]._original?.[field];
        if (originalValue !== undefined) {
          (newProducts[index] as any)[field] = originalValue;
        }
        return newProducts;
    });
  }, []);
  
  const handleSelectProduct = (product: Product) => {
    const scenario = scenarioByProduct[product.Producto] || { ventaPct: 0, costoPct: 0, volVentaPct: 0, volStockPct: 0, stockValPct: 0, bultosPct: 0 };
    setScenarioByProduct(prev => ({ ...prev, [product.Producto]: scenario }));
    setSelectedProduct(product);
  };
  
  const handleUpdateProductScenario = useCallback((productName: string, newScenario: Scenario) => {
      setScenarioByProduct(prev => ({ ...prev, [productName]: newScenario }));
  }, []);
  
  const handleAddProduct = useCallback((newProductData: NewProductData) => {
    const nameExists = products.some(p => p.Producto.trim().toLowerCase() === newProductData.Producto.trim().toLowerCase());
    if (nameExists) {
        alert(`El producto "${newProductData.Producto}" ya existe.`);
        return;
    }
    const newProduct: Product = {
        ...newProductData,
        Activo: true,
        _sim: false,
        _original: null
    };
    newProduct._original = cloneDeep(newProduct);

    setProducts(current => [...current, newProduct]);
    setIsAddModalOpen(false);
  }, [products]);
  
  const handleDeleteProduct = useCallback((productName: string) => {
    setProducts(current => current.filter(p => p.Producto !== productName));
    if (selectedProduct?.Producto === productName) {
        setSelectedProduct(null);
    }
    setIsDeleteModalOpen(false);
  }, [selectedProduct]);

  const handleUndoAllChanges = useCallback(() => {
    if (initialProducts.length === 0) return;
    if (window.confirm("¿Estás seguro de que deseas deshacer todos los cambios? Se perderán todas las simulaciones, adiciones y eliminaciones, volviendo al estado inicial de los datos cargados.")) {
        setProducts(cloneDeep(initialProducts));
        setGastos(cloneDeep(initialGastos));
        setFijos(cloneDeep(initialFijos));
        
        // Reset all scenarios
        setGlobalScenario({ ventaPct: 0, costoPct: 0, volVentaPct: 0, volStockPct: 0, stockValPct: 0, bultosPct: 0 });
        setGastosOperativosPct(0);
        setGastosFijosPct(0);
        setIndividualGastosScenarios({ operativos: {}, fijos: {} });
        setScenarioByProduct({});
        setDunScenarios({});

        // Reset UI state
        setSelectedProduct(null);
        setSearchTerm('');
        setSelectedDun('');
        setSort({ key: 'MargenOper', order: 'desc' });
    }
  }, [initialProducts, initialGastos, initialFijos]);

  const selectedCalculatedProduct = useMemo(() => {
    if (!selectedProduct || !calculationResult) return null;
    return calculationResult.allProds.find(p => p.Producto === selectedProduct.Producto) || null;
  }, [selectedProduct, calculationResult]);

  const handleManualVentaChange = (newTotalVenta: number) => {
    if (!displaySummary || displaySummary.totalVenta === 0) return;
    
    const currentVenta = displaySummary.totalVenta;
    
    if (selectedDun) {
      const currentDunScenario = dunScenarios[selectedDun] || { precioPromedioPct: 0 };
      const currentPct = currentDunScenario.precioPromedioPct || 0;
      const newAdj = (newTotalVenta / currentVenta) * (1 + currentPct / 100);
      const newPct = (newAdj - 1) * 100;
      
      setDunScenarios({
        ...dunScenarios,
        [selectedDun]: {
          ...(dunScenarios[selectedDun] || { cmvPct: 0, gastosOperativosPct: 0, bultosPct: 0, precioPromedioPct: 0 }),
          precioPromedioPct: newPct
        }
      });
    } else {
      const currentPct = globalScenario.ventaPct;
      const newAdj = (newTotalVenta / currentVenta) * (1 + currentPct / 100);
      const newPct = (newAdj - 1) * 100;
      
      setGlobalScenario({
        ...globalScenario,
        ventaPct: newPct
      });
    }
  };

  return (
    <div className="min-h-screen bg-bg-dark text-slate-200 p-4 lg:p-6 space-y-6">
      <Header
        displayMillions={displayMillions}
        onDisplayMillionsChange={setDisplayMillions}
        onFileChange={handleFileChange}
        onLoadSample={loadSampleData}
        onThemeChange={toggleTheme}
        fileInputRef={fileInputRef}
        scenarioMode={scenarioMode}
        onScenarioModeChange={setScenarioMode}
      />
      
      <Banner />
      
      <DunFilterBar
        selectedDun={selectedDun}
        setSelectedDun={setSelectedDun}
        products={calculationResult?.allProds || []}
        displayMillions={displayMillions}
        hasData={products.length > 0}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <KpiDashboard 
          summary={baselineSummary} 
          globalSummary={baselineResult?.summary}
          selectedDun={selectedDun}
          displayMillions={displayMillions} 
          title={selectedDun ? `Original: ${selectedDun}` : 'Cuadro de Resultados Original'}
        />
        <GlobalScenarios
            gastos={gastos}
            fijos={fijos}
            scenario={globalScenario}
            onScenarioChange={setGlobalScenario}
            gastosOperativosPct={gastosOperativosPct}
            onGastosOperativosPctChange={setGastosOperativosPct}
            gastosFijosPct={gastosFijosPct}
            onGastosFijosPctChange={setGastosFijosPct}
            individualGastosScenarios={individualGastosScenarios}
            onIndividualGastosScenariosChange={setIndividualGastosScenarios}
            hasData={products.length > 0}
            selectedDun={selectedDun}
            dunScenarios={dunScenarios}
            onDunScenariosChange={setDunScenarios}
            baselineSummary={baselineSummary}
        />
        <KpiDashboard 
          summary={displaySummary} 
          globalSummary={calculationResult?.summary}
          selectedDun={selectedDun}
          displayMillions={displayMillions} 
          title={selectedDun ? `Modificado: ${selectedDun}` : 'Cuadro de Resultados Modificado'}
          isBaseline={false}
          onVentaChange={handleManualVentaChange}
        />
      </div>

      <ProductScenarioPanel
        product={selectedCalculatedProduct}
        scenario={selectedProduct ? scenarioByProduct[selectedProduct.Producto] : undefined}
        onScenarioChange={handleUpdateProductScenario}
        onClose={() => setSelectedProduct(null)}
        displayMillions={displayMillions}
        selectedDun={selectedDun}
      />
      
      <ProductTable
        products={calculationResult?.allProds || []}
        gastos={calculationResult?.gastos || []}
        totals={calculationResult?.totals}
        sort={sort}
        setSort={setSort}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedDun={selectedDun}
        setSelectedDun={setSelectedDun}
        status={status}
        onUpdateField={handleUpdateProductField}
        onRevertField={handleRevertProductField}
        onSelectProduct={handleSelectProduct}
        onAddProductClick={() => setIsAddModalOpen(true)}
        onDeleteProductClick={() => setIsDeleteModalOpen(true)}
        onUndoAllChanges={handleUndoAllChanges}
        displayMillions={displayMillions}
        hasData={products.length > 0}
        summary={displaySummary}
      />

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddProduct={handleAddProduct}
        existingProductNames={products.map(p => p.Producto.trim().toLowerCase())}
      />
      
      <DeleteProductModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onDeleteProduct={handleDeleteProduct}
        products={products}
      />
    </div>
  );
};

export default App;
