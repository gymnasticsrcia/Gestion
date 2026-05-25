/*
  # Payment enhancements

  1. Modified Tables
    - `payments`
      - Add `receipt_url` (text) — URL to attached PDF/transfer screenshot
      - Add `receipt_name` (text) — friendly filename
      - Add `discount_percentage` (numeric) — percentage applied for discount
      - Add `surcharge_percentage` (numeric) — percentage applied for surcharge
      - Add `payment_link` (text) — generated payment link
*/

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='receipt_url') THEN
    ALTER TABLE payments ADD COLUMN receipt_url text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='receipt_name') THEN
    ALTER TABLE payments ADD COLUMN receipt_name text DEFAULT '';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='discount_percentage') THEN
    ALTER TABLE payments ADD COLUMN discount_percentage numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='surcharge_percentage') THEN
    ALTER TABLE payments ADD COLUMN surcharge_percentage numeric DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='payment_link') THEN
    ALTER TABLE payments ADD COLUMN payment_link text DEFAULT '';
  END IF;
END $$;
