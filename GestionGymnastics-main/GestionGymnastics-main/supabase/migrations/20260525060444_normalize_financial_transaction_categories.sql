/*
  # Normalize financial_transactions categories to English keys

  Some records were inserted with Spanish display names as the category value
  (e.g. "Sueldos", "Alquiler", "Insumos", "Mantenimiento", "Servicios") instead
  of the canonical English keys used in the application
  (salary, rent, supplies, maintenance, utilities).

  This migration normalises all existing rows to use the English keys so that
  the stats page does not show duplicate categories.
*/

UPDATE financial_transactions SET category = 'salary'      WHERE category = 'Sueldos';
UPDATE financial_transactions SET category = 'rent'        WHERE category = 'Alquiler';
UPDATE financial_transactions SET category = 'supplies'    WHERE category = 'Insumos';
UPDATE financial_transactions SET category = 'maintenance' WHERE category = 'Mantenimiento';
UPDATE financial_transactions SET category = 'utilities'   WHERE category = 'Servicios';
UPDATE financial_transactions SET category = 'other'       WHERE category = 'Otros';
UPDATE financial_transactions SET category = 'equipment'   WHERE category = 'Equipamiento';
UPDATE financial_transactions SET category = 'event'       WHERE category = 'Eventos';
UPDATE financial_transactions SET category = 'rental'      WHERE category = 'Alquileres';
UPDATE financial_transactions SET category = 'quota'       WHERE category = 'Cuotas';
