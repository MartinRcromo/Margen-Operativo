-- ============================================================
-- ROW LEVEL SECURITY (RLS) — Margen Operativo
-- Ejecutar en: Supabase Dashboard → SQL Editor
--
-- IMPORTANTE: Ejecutar DESPUÉS de crear las tablas.
-- Solo usuarios autenticados (con sesión de Supabase Auth)
-- pueden leer y escribir. El anon key no tiene acceso.
-- ============================================================

-- ── periodos ────────────────────────────────────────────────
ALTER TABLE periodos ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer y escribir periodos
CREATE POLICY "Authenticated users can read periodos"
  ON periodos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert periodos"
  ON periodos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete periodos"
  ON periodos FOR DELETE
  TO authenticated
  USING (true);

-- ── productos ────────────────────────────────────────────────
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read productos"
  ON productos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert productos"
  ON productos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete productos"
  ON productos FOR DELETE
  TO authenticated
  USING (true);

-- ── gastos ───────────────────────────────────────────────────
ALTER TABLE gastos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read gastos"
  ON gastos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert gastos"
  ON gastos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete gastos"
  ON gastos FOR DELETE
  TO authenticated
  USING (true);

-- ── fijos ────────────────────────────────────────────────────
ALTER TABLE fijos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read fijos"
  ON fijos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert fijos"
  ON fijos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete fijos"
  ON fijos FOR DELETE
  TO authenticated
  USING (true);

-- ── dun_map (si existe) ──────────────────────────────────────
-- Descomentar si tenés la tabla dun_map:
-- ALTER TABLE dun_map ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Authenticated users can read dun_map" ON dun_map FOR SELECT TO authenticated USING (true);
-- CREATE POLICY "Authenticated users can insert dun_map" ON dun_map FOR INSERT TO authenticated WITH CHECK (true);
-- CREATE POLICY "Authenticated users can delete dun_map" ON dun_map FOR DELETE TO authenticated USING (true);


-- ============================================================
-- VERIFICACIÓN: después de ejecutar, correr esto para confirmar
-- que RLS está activo en todas las tablas:
-- ============================================================
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- ORDER BY tablename;
