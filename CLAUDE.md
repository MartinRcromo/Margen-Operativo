# CLAUDE.md — Contexto del Proyecto

> Este archivo es leído automáticamente por Claude Code al iniciar una sesión.
> Mantenerlo actualizado al terminar cada sesión de trabajo.

---

## ¿Qué es este proyecto?

**Margen Operativo por Línea — Motor de Drivers (CSV)**

App React para analizar rentabilidad por línea de producto en contexto logístico/distribución. Permite cargar datos de ventas, costos y gastos operativos, asignarlos a productos mediante "drivers" (VENTA, RESULTADO, VOLVENTA, VOLSTOCK, STOCKVAL, BULTOS), y simular escenarios de negocio.

**URL producción:** https://margen-operativo.netlify.app/
**Repositorio:** MartinRcromo/Margen-Operativo (GitHub)
**Deploy:** Netlify (auto-deploy desde `main`)

---

## Stack técnico

- React 19 + TypeScript 5.8
- Vite 6 (build tool)
- Netlify (hosting) — `netlify.toml` con Node 20 y SPA redirect
- **Supabase** — integración PENDIENTE (próximos pasos)
- Sin librerías de UI — todo CSS custom en `index.html`

---

## Estructura de archivos clave

```
App.tsx                    → componente raíz, todo el state y lógica de cálculo
types.ts                   → interfaces: Product, Gasto, Fijo, Scenario, Summary, etc.
index.tsx                  → entry point React DOM
utils/csvParser.ts         → parser CSV con detección de delimitadores (;  ,)
utils/helpers.ts           → fmtM(), fmtRaw(), pct2(), cloneDeep()
components/
  Header.tsx               → barra superior, upload de archivos, tema
  KpiDashboard.tsx         → P&L (Venta, CMV, Margen Bruto, Gastos, Margen Operativo)
  GlobalScenarios.tsx      → sliders de escenarios globales + por gasto individual
  ProductTable.tsx         → tabla principal con sorting/filtering/tabs
  ProductRow.tsx           → fila de la tabla
  ProductScenarioPanel.tsx → panel de escenario por producto
  BiRecommendations.tsx    → insights automáticos (ROI, logística, crecimiento)
  DunFilterBar.tsx         → filtro por DUN (unidad de venta)
  AddProductModal.tsx      → modal alta de producto
  DeleteProductModal.tsx   → modal baja de producto
```

---

## Cómo funciona el flujo de datos actual

1. El usuario sube **4 CSV** en `Header.tsx`:
   - `PRODUCTOS.csv` → `Product[]` (Producto, DUN, Venta, Costo, VolVenta, VolStock, StockVal, Bultos)
   - `GASTOS.csv` → `Gasto[]` (Gasto, Importe, Driver, Directo/Indirecto)
   - `FIJOS.csv` → `Fijo[]` (GastoFijo, Importe) — opcional
   - `DUN.csv` → map producto→DUN — opcional

2. `App.tsx` parsea y almacena en `useState`

3. `useMemo: calculationResult` aplica escenarios y asigna gastos por driver:
   ```
   Resultado = Venta - Costo
   GastosAsignados = Σ(gasto × proporción del driver del producto)
   MargenOper = Resultado - GastosAsignados
   MargenPct = MargenOper / Venta
   ROI = MargenOper / StockVal
   ```

4. Los componentes reciben el resultado calculado como props

**Importante:** No hay persistencia. Cada sesión del browser empieza vacía.

---

## Escenarios (niveles)

- **Global**: afecta todos los productos (precio, CMV, volúmenes, bultos)
- **Por producto**: override del global para un producto específico
- **Por DUN**: ajustes cuando hay un DUN seleccionado
- **Por gasto individual**: ajuste % de cada gasto operativo o fijo

---

## Próximos cambios planificados (PENDIENTE)

### 1. Integración con Supabase
Migrar el almacenamiento de datos de "en memoria" a Supabase (PostgreSQL).

**Schema de tablas a crear:**
```sql
periodos    (id, nombre, fecha_inicio, fecha_fin, created_at)
productos   (id, periodo_id FK, Producto, DUN, Venta, Costo, VolVenta, VolStock, StockVal, Bultos, Activo)
gastos      (id, periodo_id FK, Gasto, Importe, Driver, Tipo, PctVenta)
fijos       (id, periodo_id FK, GastoFijo, Importe)
dun_map     (id, periodo_id FK, Producto, DUN)
```

**Archivos nuevos a crear:**
```
lib/supabase.ts              → cliente Supabase
services/dataService.ts      → funciones CRUD (getPeriodos, getPeriodo, insertPeriodo)
components/PeriodoSelector.tsx  → dropdown de periodos en el Header
components/ImportModal.tsx      → modal para importar CSV a la BD con fecha de periodo
```

**Variables de entorno necesarias (Netlify + .env.local):**
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Nuevo paquete:**
```
@supabase/supabase-js
```

### 2. Periodos con fecha
- Cada importación de CSVs se asocia a un periodo (ej: "Febrero 2025")
- El periodo tiene `fecha_inicio` y `fecha_fin`
- La fecha NO va dentro de los CSV — se selecciona en el `ImportModal`

### 3. Importador en la app
- Nuevo `ImportModal` con dos pasos:
  1. Nombre del periodo + fecha inicio/fin
  2. Carga de los 4 archivos CSV + preview de filas detectadas + botón "Importar a BD"
- `PeriodoSelector` en el Header para cargar un periodo guardado

### 4. Comparación de periodos (futuro)
- Comparar dos periodos lado a lado
- Tabla de deltas con variación %

---

## Archivos que se van a modificar en el próximo paso

| Archivo | Cambio |
|---|---|
| `package.json` | + `@supabase/supabase-js` |
| `vite.config.ts` | + env vars VITE_SUPABASE_* |
| `netlify.toml` | ya tiene NODE_VERSION=20 y SPA redirect ✓ |
| `types.ts` | + tipos `Periodo` |
| `App.tsx` | coexistencia modo Supabase + modo CSV |
| `components/Header.tsx` | + `PeriodoSelector` + botón importar |

---

## Estado del deploy

- `netlify.toml` tiene `NODE_VERSION = "20"` y redirect SPA configurado ✓
- El build local `npx vite build` funciona sin errores ✓
- La rama de trabajo es `claude/fix-netlify-deployment-yyJfY`
- Mergear a `main` trigerea auto-deploy en Netlify

---

## Convenciones del proyecto

- Español en UI y nombres de datos de negocio (`Venta`, `Costo`, `Producto`, `GastoFijo`)
- Sin librerías de componentes — CSS custom en `index.html` con CSS variables
- Números en formato argentino: `1.234.567,89` con `es-AR` locale
- El parser de CSV maneja ambos formatos numéricos (europeo y anglosajón)
- Commits en inglés con prefix `fix:`, `feat:`, `chore:`
