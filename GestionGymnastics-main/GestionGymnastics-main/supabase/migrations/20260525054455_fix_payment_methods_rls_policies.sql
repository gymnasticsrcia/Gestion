/*
  # Fix payment_methods RLS policies

  The existing policies checked `profiles.id = auth.uid()` but profiles.id is
  the row UUID, while auth.uid() returns the auth user ID stored in profiles.user_id.
  This caused all INSERT/UPDATE/DELETE operations to fail silently for every user.

  1. Changes
     - Drop the four broken policies
     - Re-create them using profiles.user_id = auth.uid()
*/

-- Drop broken policies
DROP POLICY IF EXISTS "Admins can delete payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admins can insert payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Admins can update payment methods" ON payment_methods;
DROP POLICY IF EXISTS "Authenticated users can view payment methods" ON payment_methods;

-- Re-create with correct join condition
CREATE POLICY "Authenticated users can view payment methods"
  ON payment_methods FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert payment methods"
  ON payment_methods FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can update payment methods"
  ON payment_methods FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin')
    )
  );

CREATE POLICY "Admins can delete payment methods"
  ON payment_methods FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role IN ('super_admin', 'admin')
    )
  );
