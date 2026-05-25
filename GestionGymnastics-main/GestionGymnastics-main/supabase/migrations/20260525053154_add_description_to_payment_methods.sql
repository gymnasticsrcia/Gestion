/*
  # Add description column to payment_methods

  1. Changes
    - Adds optional `description` text column to `payment_methods` table
      for storing details like bank name, CBU, or alias for transfers
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payment_methods' AND column_name = 'description'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN description text DEFAULT '';
  END IF;
END $$;
