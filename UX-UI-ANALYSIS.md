# Análisis UX/UI — Margen Operativo por Línea

> Generado: 2026-02-28
> Rama: `claude/analyze-ux-ui-issues-eq3vF`
> Metodología: revisión estática de código fuente + CSS global (`index.html`)

---

## Resumen ejecutivo

La app tiene una base visual sólida (design system oscuro con variables CSS, grid responsivo, glassmorphism consistente), pero acumula varios problemas de **usabilidad oculta** (double-click como única affordance en múltiples componentes), **inconsistencias en el design system** (variables CSS inexistentes referenciadas desde componentes), y **jerarquía visual débil** en tipografía y color semántico. Las mejoras de mayor impacto son las críticas de variables CSS rotas y la unificación del modelo de interacción.

---

## Leyenda de prioridad

| Nivel | Descripción |
|-------|-------------|
| 🔴 ALTO | Bug visible o bloqueo de usabilidad |
| 🟡 MEDIO | Problema de comprensión o inconsistencia notable |
| 🟢 BAJO | Pulido visual, refinamiento de UX |

---

## 1. Design System Global (`index.html`)

### 1.1 Variables CSS rotas — `LoginPage.tsx` e `ImportModal.tsx`
**Prioridad: 🔴 ALTO**

Los siguientes componentes referencian variables CSS que **no existen** en `:root` ni en `[data-theme="light"]`:

| Componente | Variable usada | Variable correcta |
|---|---|---|
| `LoginPage.tsx:28` | `var(--border)` | `var(--stroke)` |
| `LoginPage.tsx:37` | `var(--card)` | no existe — usar `rgba(255,255,255,.06)` o definir `--card` |
| `ImportModal.tsx:185` | `var(--text-muted)` | `var(--muted)` |
| `ImportModal.tsx:209` | `var(--text-muted)` | `var(--muted)` |
| `ImportModal.tsx:284` | `var(--bg-card)` | no existe — usar `rgba(255,255,255,.04)` |
| `ImportModal.tsx:313,314` | `var(--text-muted)`, `var(--text-dim)` | `var(--muted)`, `var(--muted2)` |

**Impacto**: el formulario de login y el modal de importación renderizan sin estilos correctos en producción.
**Fix**: unificar los nombres de variables o definir los aliases faltantes en `:root`.

---

### 1.2 Ausencia de estilos `:focus-visible`
**Prioridad: 🔴 ALTO**

No hay ninguna regla `:focus-visible` definida en el CSS global. Al navegar con teclado (Tab), los botones, inputs y sliders no muestran ningún indicador de foco visible, lo que hace la app **inasequible** para usuarios de teclado y falla WCAG 2.1 criterio 2.4.7.

**Fix**:
```css
:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: 4px;
}
```

---

### 1.3 Tamaños de fuente por debajo del mínimo accesible
**Prioridad: 🟡 MEDIO**

| Ubicación | Tamaño | Problema |
|---|---|---|
| `KpiDashboard.tsx:109` — encabezados de tabla comparativa | `9px` | Ilegible, falla WCAG |
| `KpiDashboard.tsx:113-118` — labels y números en tabla comparativa | `11px` | Muy ajustado |
| `ProductRow.tsx` — badge SIM | `9px` | Ilegible |
| `BiRecommendations.tsx:109` — texto de insight | `11px` | Borderline |
| `.footnote` (global) | `11px` | Aceptable solo si es secundario |

**Fix**: usar como mínimo `12px` para cualquier texto funcional. Los encabezados `9px` deben ser al menos `11px`.

---

### 1.4 Modelo de interacción inconsistente: doble-clic como affordance oculta
**Prioridad: 🟡 MEDIO**

El doble-clic se usa en 4 lugares distintos como única forma de acceder a información detallada:

| Componente | Acción oculta |
|---|---|
| `GlobalScenarios.tsx:90` | Doble-clic en slider de Gastos Operativos → detalle |
| `GlobalScenarios.tsx:100` | Doble-clic en slider de Gastos Fijos → detalle |
| `ProductTable.tsx:228` | Doble-clic en barra de gasto → drilldown por producto |
| `BiRecommendations.tsx:93` | Doble-clic en insight card → modal de detalle |

Además, `ProductScenarioPanel.tsx:78` usa doble-clic para expandir CMV y gastos asignados.

El texto de ayuda es un `tooltip` en `title=""` (solo visible en desktop con hover prolongado) o un `footnote` de `11px` al fondo del card, que los usuarios raramente leen.

**Fix**: reemplazar el doble-clic por un ícono de expansión (`›`, `⋯`, chevron) o botón "Ver detalle" visible. Mantener doble-clic como shortcut adicional, no como única vía.

---

### 1.5 Color semántico ambiguo en valores financieros
**Prioridad: 🟡 MEDIO**

| Color | Usado para | Problema |
|---|---|---|
| `var(--warn)` (amarillo) | Margen Bruto en `ProductRow.tsx:42` | Yellow/orange = "advertencia" en todo el sistema, pero aquí es solo un valor |
| `var(--accent)` (cyan) | Contrib. Marginal en `ProductRow.tsx:44` | El acento no tiene un significado financiero claro |
| `var(--good)` (verde) | Resultado Neto positivo en KpiDashboard | Correcto |
| `var(--bad)` (rojo) | Valores negativos | Correcto |

No hay leyenda de colores en ningún lugar de la UI. Los usuarios no saben por qué Margen Bruto es amarillo y Contrib. Marg. es cyan.

**Fix**: usar un color neutro (`var(--text)`) para valores informativos y reservar `--good`/`--bad` para indicadores de salud. Agregar una microleyenda o tooltip explicativo.

---

## 2. Header (`components/Header.tsx`)

### 2.1 Duplicación de mecanismos de carga CSV
**Prioridad: 🟡 MEDIO**

Cuando Supabase está activo, el header muestra simultáneamente:
1. **"+ Importar CSV"** (botón, línea 62) → modal de importación a BD
2. **"Cargar Archivos"** (label/input, línea 66-77) → carga directa en memoria

Para un usuario no técnico, no es obvio cuál usar ni cuál es la diferencia. El `file-input-label` además tiene una UI diferente al botón, creando inconsistencia visual.

**Fix**: cuando Supabase está activo, ocultar la carga directa (o moverla al footer como opción avanzada). Agregar tooltip explicativo a cada opción.

---

### 2.2 Toggle de tema: label verboso sin ícono
**Prioridad: 🟢 BAJO**

`"Modo Claro/Oscuro"` (línea 80) ocupa ~120px en el topbar. Un ícono de luna/sol con tooltip usaría ~32px.

**Fix**: reemplazar con `<button title="Cambiar tema">🌙</button>` o ícono SVG.

---

### 2.3 "Ver en millones" usa checkbox nativo
**Prioridad: 🟢 BAJO**

El checkbox nativo en la línea 51-58 es inconsistente con el toggle styled que se usa en `ProductRow.tsx` (clase `.toggle`). El mismo patrón debería aplicarse en ambos lugares.

---

### 2.4 Overflow del topbar en viewports medianos
**Prioridad: 🟢 BAJO**

Con `flex-wrap: wrap` en `.actions`, en pantallas de ~1024px los controles del header pueden saltar a una segunda fila, doblando la altura del topbar sin aviso. No hay un breakpoint de diseño para este caso.

---

## 3. DUN Filter Bar (`components/DunFilterBar.tsx`)

### 3.1 Select estilizado con clase `.search`
**Prioridad: 🟢 BAJO**

El `<select>` en línea 37 usa la clase `.search`, que es semánticamente incorrecta (la clase fue diseñada para inputs de texto). El estilo visual es aceptable pero la intención del código es confusa.

---

### 3.2 Pill de margen DUN con layout shift
**Prioridad: 🟡 MEDIO**

El pill de "Margen Op. Total del DUN:" (línea 50-53) aparece/desaparece según si hay un DUN seleccionado. Esto causa un layout shift visible que puede desorientar al usuario y afecta el rendimiento de CLS (Core Web Vitals).

**Fix**: renderizar el pill siempre pero con `visibility: hidden` cuando no hay DUN seleccionado, o reservar el espacio con `min-height`.

---

### 3.3 Select con ancho hardcodeado
**Prioridad: 🟢 BAJO**

`style={{ width: '250px' }}` puede truncar DUN names largos. Usar `min-width: 200px; max-width: 300px` con texto truncado + tooltip.

---

## 4. KPI Dashboard (`components/KpiDashboard.tsx`)

### 4.1 Botón "Congelar Base" visualmente secundario para una acción primaria
**Prioridad: 🟡 MEDIO**

El botón tiene `fontSize: '11px', padding: '4px 10px'` — mucho más pequeño que los botones estándar (`.btn` usa `padding: 10px 12px; font-size: 12px`). Dado que "Congelar Base" habilita la funcionalidad de comparación (un feature central), debería tener mayor visibilidad.

**Fix**: usar el estilo `.btn primary` estándar en lugar de un mini-botón personalizado.

---

### 4.2 Sin indicador persistente de modo comparación
**Prioridad: 🟡 MEDIO**

Cuando el modo comparación está activo (`isComparing = true`), el único indicador visual es que el título del card no cambia y hay un footnote de 11px al fondo. El botón "Limpiar" tiene color `var(--warn)` pero sin badge o estado claro de "modo activo".

**Fix**: agregar un borde o background tintado al card cuando `isComparing` es true, similar a cómo los pills de estado usan colores.

---

### 4.3 Tabla comparativa: `maxWidth: '100px'` trunca labels
**Prioridad: 🟡 MEDIO**

En `labelStyle` (línea 113): `maxWidth: '100px'` con `textOverflow: 'ellipsis'`. Labels como "(-) Gs. Fijos" tienen 12 chars y entran, pero en viewports comprimidos o con fuentes grandes pueden truncarse.

---

### 4.4 "Resultado Neto (Final)" — redundancia en label
**Prioridad: 🟢 BAJO**

`(Final)` entre paréntesis es redundante con "Neto". Recomendación: `Resultado Neto` a secas.

---

## 5. Global Scenarios (`components/GlobalScenarios.tsx`)

### 5.1 Warning color en pill informativo
**Prioridad: 🟡 MEDIO**

```tsx
<span className="pill warn">Impacto global en todas las líneas activas</span>
```
El pill usa clase `warn` (amarillo) para comunicar el alcance del slider, no para advertir de un problema. Esto crea ambigüedad: ¿es una advertencia real o solo contexto?

**Fix**: usar clase `pill` sin `warn` o crear una variante `info` con color neutro (azul o gris).

---

### 5.2 Doble-clic en sliders sin affordance visible
**Prioridad: 🟡 MEDIO**
(Ya cubierto en §1.4 — afecta directamente a los sliders de Gastos Operativos y Gastos Fijos)

El `title=""` tooltip aparece solo después de un hover prolongado de ~1s en desktop. En móvil es invisible.

---

### 5.3 Transición brusca al modo DUN
**Prioridad: 🟢 BAJO**

Al seleccionar un DUN en el filter bar, el panel de escenarios cambia completamente de contenido (de 5 sliders globales a 4 sliders de DUN) sin ninguna transición o encabezado explicativo del cambio de contexto.

**Fix**: agregar una transición CSS `opacity` y un badge que diga "Modo DUN: [nombre]" debajo del h2.

---

## 6. Product Table (`components/ProductTable.tsx`)

### 6.1 Typo y abreviaciones inconsistentes en headers de columna
**Prioridad: 🟡 MEDIO**

| Header actual | Problema |
|---|---|
| `"Margen Bruto."` (línea 100) | Punto final tipográfico incorrecto |
| `"Contrib. Marg."` (línea 101) | Abreviación con punto final |
| `"Contrib Marg. %"` (línea 102) | Sin punto después de "Contrib", pero con punto después de "Marg" |
| `"Acción"` (línea 104) | Columna con un solo botón "Cfg" — el header no aclara la acción |

**Fix**: estandarizar a `Margen Bruto`, `C. Marginal $`, `C. Marginal %`. Cambiar `Acción` → `Detalle`.

---

### 6.2 Botón "Cfg" extremadamente ambiguo
**Prioridad: 🟡 MEDIO**

`ProductRow.tsx:49` — el botón "Cfg" (3 chars) no comunica qué hace. ¿Configura? ¿Abre un modal? ¿Edita? El usuario debe haberlo probado para saberlo.

**Fix**: cambiar a "Escenario" o añadir un ícono de ajuste (⚙) con tooltip `"Configurar escenario de este producto"`.

---

### 6.3 Dos divs con clase `left` como hijos de `.row`
**Prioridad: 🟢 BAJO**

```tsx
<div className="row">
    <div className="left"> {/* tabs + search */} </div>
    <div className="left"> {/* botones */} </div>
</div>
```
`.row` usa `justify-content: space-between`, por lo que los dos `.left` se posicionan en los extremos. El segundo debería tener clase `right` (o el CSS debe actualizar `.row .right`). Es un problema semántico que puede romper estilos si se modifican los estilos de `.left`.

---

### 6.4 Sin contador de productos filtrados
**Prioridad: 🟢 BAJO**

Cuando el usuario busca por nombre o filtra por DUN, no hay feedback del tipo "Mostrando 3 de 42 productos". Los usuarios no saben si el filtro está activo o si hay más resultados.

---

### 6.5 Acciones destructivas sin diferenciación de peso visual
**Prioridad: 🟡 MEDIO**

Los tres botones de gestión de líneas tienen el mismo tamaño y estructura:
```
[+ Nueva Línea] [Eliminar Línea] [Deshacer todos los cambios]
```
"Eliminar Línea" es `.btn danger` (rojo tenue) pero "Deshacer todos los cambios" es `.btn` (neutro), lo que implica que deshacer es una acción menor. Sin embargo, puede ser más impactante que eliminar una línea.

**Fix**: considerar separar los botones destructivos visualmente (con un divisor o grupo diferente).

---

## 7. Product Row (`components/ProductRow.tsx`)

### 7.1 Toggle de activación sin label accesible
**Prioridad: 🟡 MEDIO**

```tsx
<label className="toggle">
  <input type="checkbox" checked={product.Activo} ... />
  <span className="pill ...">ACT / OFF</span>
</label>
```
El checkbox está asociado al label visualmente pero no tiene `aria-label`. Los lectores de pantalla anunciarán solo "checkbox" sin contexto del producto.

**Fix**: añadir `aria-label={`${product.Activo ? 'Desactivar' : 'Activar'} ${product.Producto}`}` al input.

---

### 7.2 `fontWeight: 900` en demasiados campos
**Prioridad: 🟢 BAJO**

Producto (900), Mark-Up % (700), Margen Bruto (700), Contrib. Marg. (900), Contrib. % (900). Cuando todo tiene peso máximo, nada resalta. La jerarquía visual se pierde.

**Fix**: usar `900` solo para el nombre del producto y el Resultado Neto. Los demás valores a `600` o `700`.

---

## 8. Product Scenario Panel (`components/ProductScenarioPanel.tsx`)

### 8.1 Panel debajo de la tabla: rompe la proximidad espacial
**Prioridad: 🟡 MEDIO**

El panel de escenario de producto se renderiza después de `<ProductTable>` en el DOM, por lo que aparece visualmente debajo de una tabla potencialmente larga. El usuario hace clic en "Cfg" en una fila y debe scrollear hacia abajo para ver el efecto.

**Fix ideal**: mostrar el panel como un drawer lateral (`position: sticky`) o inline expandido dentro de la fila (table row expansion pattern).

---

### 8.2 Botones de collapse/expand no estándar
**Prioridad: 🟢 BAJO**

`✚` para expandir y `−` para contraer (línea 157) son caracteres no estándar. El estándar es `▼`/`▲` o `+`/`-` con fuente monospace, o íconos chevron.

---

### 8.3 Doble-clic para expandir CMV y gastos
**Prioridad: 🟡 MEDIO**
(Ya cubierto en §1.4 — líneas 78 y 101 de este componente)

Los expandibles de "CMV (Post-Escenario)" y "Gastos Asignados" se activan solo con doble-clic. El `▶` expand-indicator es la única pista visual, pero muchos usuarios no lo asociarán con "doble-clic".

---

## 9. BI Recommendations (`components/BiRecommendations.tsx`)

### 9.1 Doble-clic como único acceso al modal de insight
**Prioridad: 🟡 MEDIO**
(Ya cubierto en §1.4)

```tsx
onDoubleClick={() => handleInsightClick(insight)}
title="Doble clic para ver detalle"
```
Los insight cards tienen `cursor: pointer` (sugiere un clic) pero solo responden a doble-clic. Los usuarios harán clic simple, no verán respuesta, y asumirán que los cards no son interactivos.

**Fix**: cambiar a `onClick`.

---

### 9.2 Sin estado de "0 insights"
**Prioridad: 🟢 BAJO**

Cuando todo está bien, el placeholder dice `"Estructura de rentabilidad equilibrada."` — correcto, pero podría complementarse con un micro-ícono de checkmark verde para reforzar visualmente el estado positivo.

---

## 10. Login Page (`components/LoginPage.tsx`)

### 10.1 Variables CSS rotas (crítico — ver §1.1)
**Prioridad: 🔴 ALTO**

`var(--border)` y `var(--card)` no existen. El formulario de login probablemente se muestra con fondo transparente y sin bordes.

---

### 10.2 Sin toggle de visibilidad de contraseña
**Prioridad: 🟢 BAJO**

No hay botón de mostrar/ocultar contraseña. En una app de uso frecuente por el mismo equipo, este es un UX básico.

---

### 10.3 Sin feedback de carga visual más allá del texto
**Prioridad: 🟢 BAJO**

Cuando `loading = true`, el botón dice "Ingresando..." con `opacity: 0.7`. Podría complementarse con un spinner para reforzar el estado de carga.

---

## 11. Import Modal (`components/ImportModal.tsx`)

### 11.1 Variables CSS rotas (crítico — ver §1.1)
**Prioridad: 🔴 ALTO**

`var(--text-muted)`, `var(--bg-card)`, `var(--text-dim)` no existen en el design system.

---

### 11.2 Sin stepper visual para flujo multi-paso
**Prioridad: 🟡 MEDIO**

El modal tiene 2-3 pasos pero el indicador es solo texto ("Paso 1 de 2"). Un stepper visual (círculos numerados o barra de progreso) daría contexto inmediato de en qué punto del flujo está el usuario y cuántos pasos restan.

---

### 11.3 Detección de archivos por nombre: affordance pobre
**Prioridad: 🟡 MEDIO**

Los archivos se detectan por si el nombre contiene "PRODUCTO", "GASTO", "FIJO", "DUN" (líneas 83-88). Si el usuario tiene archivos con nombres distintos, no hay feedback de por qué no se detectan. El `FileStatus` solo muestra `✗` en rojo, sin explicar el criterio de nombre esperado.

**Fix**: agregar una nota: `"Los archivos deben contener 'PRODUCTO', 'GASTO', 'FIJO' o 'DUN' en su nombre"`.

---

### 11.4 Jerga técnica en CTA final
**Prioridad: 🟢 BAJO**

"Importar a BD" (línea 298) usa "BD" (base de datos) — jerga técnica que puede confundir a usuarios de negocio.

**Fix**: cambiar a "Guardar en la plataforma" o "Confirmar importación".

---

## Resumen priorizado de mejoras

### 🔴 ALTO — Implementar primero

| # | Descripción | Componente/Archivo |
|---|---|---|
| A1 | Corregir variables CSS rotas (`--border`, `--card`, `--text-muted`, `--bg-card`, `--text-dim`) | `LoginPage.tsx`, `ImportModal.tsx`, `index.html` |
| A2 | Agregar estilos `:focus-visible` para accesibilidad de teclado | `index.html` |

### 🟡 MEDIO — Segunda iteración

| # | Descripción | Componente/Archivo |
|---|---|---|
| M1 | Reemplazar doble-clic por affordance visible (botón/ícono) en todos los puntos | `GlobalScenarios`, `ProductTable`, `BiRecommendations`, `ProductScenarioPanel` |
| M2 | Cambiar color semántico `--warn` en Margen Bruto — usar color neutro | `ProductRow.tsx` |
| M3 | Corregir typos y abreviaciones inconsistentes en headers de tabla | `ProductTable.tsx` |
| M4 | Cambiar "Cfg" por "Escenario" o botón con ícono | `ProductRow.tsx` |
| M5 | Agregar `aria-label` al toggle de activación | `ProductRow.tsx` |
| M6 | Cambiar insight cards a `onClick` en lugar de `onDoubleClick` | `BiRecommendations.tsx` |
| M7 | Aumentar tamaño mínimo de fuente a 12px en tabla comparativa | `KpiDashboard.tsx` |
| M8 | Cambiar pill `warn` por pill neutro en "Impacto global" | `GlobalScenarios.tsx` |
| M9 | Agregar nota de criterio de nombres de archivos en ImportModal | `ImportModal.tsx` |
| M10 | Agregar indicador visual de modo comparación activo | `KpiDashboard.tsx` |
| M11 | Resolver layout shift del pill DUN | `DunFilterBar.tsx` |

### 🟢 BAJO — Pulido

| # | Descripción | Componente/Archivo |
|---|---|---|
| L1 | Reemplazar "Modo Claro/Oscuro" por ícono con tooltip | `Header.tsx` |
| L2 | Homogeneizar toggle "Ver en millones" con el estilo `.toggle` de productos | `Header.tsx` |
| L3 | Agregar contador de productos filtrados (Ej: "3 de 42") | `ProductTable.tsx` |
| L4 | Reducir `fontWeight: 900` a solo Product name y total final | `ProductRow.tsx` |
| L5 | Estandarizar botones collapse a chevrons `▼`/`▲` | `ProductScenarioPanel.tsx` |
| L6 | Agregar transición visual al cambiar entre modo global y modo DUN | `GlobalScenarios.tsx` |
| L7 | Cambiar "Importar a BD" por texto más amigable | `ImportModal.tsx` |
| L8 | Agregar stepper visual al ImportModal | `ImportModal.tsx` |
| L9 | Agregar toggle de visibilidad de contraseña en login | `LoginPage.tsx` |
| L10 | Limpiar clase semántica: segundo `.left` en `.row` → `.right` | `ProductTable.tsx` |

---

## Notas adicionales

- **Responsividad**: la app declara breakpoints en `@media (max-width: 1300px)` y `@media (max-width: 900px)` pero no define comportamiento del topbar en móvil. Con 6-7 acciones en el header, en `<768px` el flex-wrap genera una segunda fila no diseñada.
- **Sin estado de loading global**: cuando se cargan datos CSV grandes, no hay indicador de progreso en la UI principal (solo el botón de importar tiene feedback).
- **Código defensivo**: `ProductTable.tsx:109` usa `findIndex` para recuperar el índice original en cada render — potencialmente lento con muchos productos. No es UX pero impacta la experiencia percibida.
