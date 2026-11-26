-- Ejecutar una sola vez, con los servicios detenidos y respaldo verificado.
-- No ejecutar schema.sql sobre datos existentes (contiene DROP TABLE).
USE db_inventario;
ALTER TABLE productos ADD COLUMN valor_stock_costo DECIMAL(28,8) NULL AFTER precio;
ALTER TABLE movimientos_inventario ADD COLUMN costo_total DECIMAL(28,8) NULL AFTER variacion_fisica;
-- No imputar costos históricos desconocidos. NULL no equivale a cero.
