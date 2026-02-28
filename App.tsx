

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { Product, Gasto, Fijo, Scenario, Totals, CalculationResult, Sort, IndividualGastoScenario, NewProductData, Summary, DunScenario, Periodo } from './types';
import { parseCSV } from './utils/csvParser';
import { cloneDeep, toNum, normalizeDriver } from './utils/helpers';
import { getProductosByPeriodo, getGastosByPeriodo, getFijosByPeriodo } from './services/dataService';
import { supabase, supabaseReady } from './lib/supabase';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import KpiDashboard from './components/KpiDashboard';
import GlobalScenarios from './components/GlobalScenarios';
import ProductTable from './components/ProductTable';
import ProductScenarioPanel from './components/ProductScenarioPanel';
import Banner from './components/Banner';
import BiRecommendations from './components/BiRecommendations';
import DunDashboard from './components/DunDashboard';
import ObjetivoPanel from './components/ObjetivoPanel';
import AiPanel from './components/AiPanel';
import AddProductModal from './components/AddProductModal';
import DeleteProductModal from './components/DeleteProductModal';
import DunFilterBar from './components/DunFilterBar';
import ImportModal from './components/ImportModal';

const DRIVER_KEYS = new Set(["VENTA", "RESULTADO", "VOLVENTA", "VOLSTOCK", "STOCKVAL", "BULTOS"]);



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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [selectedPeriodoId, setSelectedPeriodoId] = useState('');
  const [periodoRefresh, setPeriodoRefresh] = useState(0);

  const [frozenSummary, setFrozenSummary] = useState<Summary | null>(null);

  const [session, setSession] = useState<Session | null | undefined>(undefined);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auth session
  useEffect(() => {
    if (!supabaseReady) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

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
          DUN: pick(r, "DUN") || dunMap[prodName.trim()],
          Venta: pick(r, "Venta"), Costo: pick(r, "Costo"),
          VolVenta: pick(r, "VolVenta"), VolStock: pick(r, "VolStock"), StockVal: pick(r, "StockVal"), Bultos: pick(r, "Bultos"),
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
  
  // Clear frozen comparison when base data changes (new CSV or periodo)
  useEffect(() => { setFrozenSummary(null); }, [products, gastos, fijos]);

  const calculationResult: CalculationResult | null = useMemo(() => {
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

            // Combine all price/sale multipliers
            // Combine all price/sale multipliers
            const priceMultiplier = multFromPct(g.ventaPct) * multFromPct(isSim ? (ps.precioPromedioPct || ps.ventaPct || 0) : 0);

            // Bultos multiplier is now separate and direct
            const bultosMultiplier = multFromPct(g.bultosPct) * multFromPct(isSim ? (ps.bultosPct || 0) : 0);
            newP.Bultos = toNum(original.Bultos) * bultosMultiplier;

            const newPrecio = originalPrecio * priceMultiplier;
            
            // The final sale is ALWAYS the product of the new components
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

    const summary = {
        totalVenta: totals.VENTA,
        totalResultado: totals.RESULTADO,
        totalMargenOper,
        totalGastosOperativos,
        resultadoFinal: totalMargenOper - totalFijos,
        totalFijos,
        margenOperPctGlobal: (totals.VENTA === 0) ? 0 : (totalMargenOper / totals.VENTA),
        activos: activeProds.length, tot: allProds.length,
        sim: allProds.filter(x => x._sim).length
    };
    
    return { allProds, gastos: currentGastos, totals, summary };
  }, [products, gastos, fijos, globalScenario, scenarioByProduct, gastosOperativosPct, gastosFijosPct, individualGastosScenarios, selectedDun, dunScenarios]);

    const displaySummary: Summary | null = useMemo(() => {
        if (!calculationResult) return null;
        if (!selectedDun) {
            return calculationResult.summary;
        }

        const dunProducts = calculationResult.allProds.filter(p => p.DUN === selectedDun);
        const activeDunProducts = dunProducts.filter(p => p.Activo);

        const dunSummaryData = {
            totalVenta: activeDunProducts.reduce((sum, p) => sum + (p.Venta as number), 0),
            totalResultado: activeDunProducts.reduce((sum, p) => sum + p.Resultado!, 0),
            totalMargenOper: activeDunProducts.reduce((sum, p) => sum + p.MargenOper!, 0),
            totalGastosOperativos: 0,
            resultadoFinal: 0, // Not applicable for DUN view
            totalFijos: 0, // Not applicable for DUN view
            margenOperPctGlobal: 0,
            activos: activeDunProducts.length,
            tot: dunProducts.length,
            sim: dunProducts.filter(x => x._sim).length
        };

        dunSummaryData.totalGastosOperativos = dunSummaryData.totalResultado - dunSummaryData.totalMargenOper;
        dunSummaryData.margenOperPctGlobal = dunSummaryData.totalVenta === 0 ? 0 : dunSummaryData.totalMargenOper / dunSummaryData.totalVenta;

        return dunSummaryData;
    }, [calculationResult, selectedDun]);


  useEffect(() => {
    if (calculationResult) {
      const { summary } = calculationResult;
      setStatus({ text: `${summary.activos} activas · ${summary.sim} simuladas`, kind: summary.activos ? "good" : "warn" });
    } else {
      setStatus({ text: 'Esperando datos', kind: 'neutral' });
    }
  }, [calculationResult]);

  const biResult: CalculationResult | null = useMemo(() => {
    if (!calculationResult) return null;
    if (!selectedDun) {
        return calculationResult;
    }

    // If a DUN is selected, create a new CalculationResult scoped to that DUN
    const dunProducts = calculationResult.allProds.filter(p => p.DUN === selectedDun);
    const dunSummary = displaySummary; // This is already calculated for the DUN

    if (!dunSummary) return null;

    return {
        ...calculationResult,
        allProds: dunProducts,
        summary: dunSummary,
    };
  }, [calculationResult, selectedDun, displaySummary]);

  const loadSampleData = useCallback(() => {
    const prods = [
      { Producto: "Opticas", DUN: "Juan Perez", Venta: 12000000, Costo: 8000000, VolVenta: 300, VolStock: 900, StockVal: 6500000, Bultos: 1200, Activo: true, _sim:false },
      { Producto: "Paragolpes", DUN: "Maria Garcia", Venta: 9000000, Costo: 6400000, VolVenta: 220, VolStock: 500, StockVal: 4200000, Bultos: 900, Activo: true, _sim:false },
      { Producto: "Espejos", DUN: "Juan Perez", Venta: 5000000, Costo: 3800000, VolVenta: 90, VolStock: 700, StockVal: 5100000, Bultos: 700, Activo: true, _sim:false },
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

  const loadDataFromState = useCallback((prods: Product[], gas: Gasto[], fij: Fijo[]) => {
    const prodsWithOriginal = prods.map(p => ({ ...p, _original: p._original ?? cloneDeep(p) }));
    setInitialProducts(cloneDeep(prodsWithOriginal));
    setInitialGastos(cloneDeep(gas));
    setInitialFijos(cloneDeep(fij));
    setProducts(cloneDeep(prodsWithOriginal));
    setGastos(cloneDeep(gas));
    setFijos(cloneDeep(fij));
    setGlobalScenario({ ventaPct: 0, costoPct: 0, volVentaPct: 0, volStockPct: 0, stockValPct: 0, bultosPct: 0 });
    setScenarioByProduct({});
    setIndividualGastosScenarios({ operativos: {}, fijos: {} });
    setDunScenarios({});
    setSelectedProduct(null);
    setSearchTerm('');
    setSelectedDun('');
  }, []);

  const handleImportSuccess = useCallback((periodo: Periodo, prods: Product[], gas: Gasto[], fij: Fijo[]) => {
    setSelectedPeriodoId(periodo.id);
    setPeriodoRefresh(n => n + 1);
    loadDataFromState(prods, gas, fij);
  }, [loadDataFromState]);

  const handlePeriodoSelect = useCallback(async (periodoId: string) => {
    setSelectedPeriodoId(periodoId);
    if (!periodoId) return;
    try {
      const [prods, gas, fij] = await Promise.all([
        getProductosByPeriodo(periodoId),
        getGastosByPeriodo(periodoId),
        getFijosByPeriodo(periodoId),
      ]);
      loadDataFromState(prods, gas, fij);
    } catch (err: any) {
      alert(`Error al cargar el periodo: ${err.message}`);
    }
  }, [loadDataFromState]);

  // Auth guards (only when Supabase is configured)
  if (supabaseReady && session === undefined) {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', color: 'var(--muted)' }}>Verificando sesión...</div>;
  }
  if (supabaseReady && session === null) {
    return <LoginPage />;
  }

  const handleSignOut = supabaseReady ? () => supabase.auth.signOut() : undefined;

  return (
    <div className="wrap">
      <Header
        displayMillions={displayMillions}
        onDisplayMillionsChange={setDisplayMillions}
        onFileChange={handleFileChange}
        onLoadSample={loadSampleData}
        onThemeChange={toggleTheme}
        fileInputRef={fileInputRef}
        onImportClick={() => setIsImportModalOpen(true)}
        selectedPeriodoId={selectedPeriodoId}
        onPeriodoSelect={handlePeriodoSelect}
        periodoRefresh={periodoRefresh}
        onSignOut={handleSignOut}
        userEmail={session?.user?.email}
      />
      <Banner />
      
      <DunFilterBar
        selectedDun={selectedDun}
        setSelectedDun={setSelectedDun}
        products={calculationResult?.allProds || []}
        displayMillions={displayMillions}
        hasData={products.length > 0}
      />

      <div className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <KpiDashboard
          summary={displaySummary}
          selectedDun={selectedDun}
          displayMillions={displayMillions}
          frozenSummary={frozenSummary}
          onFreezeBase={() => setFrozenSummary(displaySummary)}
          onClearFreeze={() => setFrozenSummary(null)}
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
        />
        <BiRecommendations result={biResult} selectedDun={selectedDun} />
      </div>

      {selectedDun && biResult && (
        <DunDashboard
          result={biResult}
          selectedDun={selectedDun}
          displayMillions={displayMillions}
        />
      )}

      {calculationResult && (
        <ObjetivoPanel
          summary={displaySummary}
          selectedDun={selectedDun}
          displayMillions={displayMillions}
          onApplyPrecio={(pct) => setGlobalScenario(prev => ({ ...prev, ventaPct: pct }))}
          onApplyVolumen={(pct) => setGlobalScenario(prev => ({ ...prev, bultosPct: pct }))}
          onApplyCmv={(pct) => setGlobalScenario(prev => ({ ...prev, costoPct: -pct }))}
          onApplyGastos={(pct) => setGastosOperativosPct(-pct)}
        />
      )}

      <AiPanel
        summary={displaySummary}
        frozenSummary={frozenSummary}
        result={calculationResult}
        globalScenario={globalScenario}
        gastosOperativosPct={gastosOperativosPct}
        selectedDun={selectedDun}
        displayMillions={displayMillions}
      />

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

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default App;
