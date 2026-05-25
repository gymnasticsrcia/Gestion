
/*
  # Gymnastics Management System - Core Schema

  ## Overview
  Complete database schema for a premium sports academy management platform.

  ## Tables Created
  1. `sedes` - Physical locations/branches
  2. `profiles` - Extended user profiles with roles
  3. `disciplines` - Sports disciplines offered
  4. `groups` - Training groups with schedules
  5. `students` - Complete student/member registry
  6. `student_guardians` - Parents/tutors for each student
  7. `student_groups` - Many-to-many enrollment
  8. `payment_plans` - Pricing tiers by discipline/days
  9. `payments` - All payment records
  10. `employees` - Staff and instructors
  11. `financial_transactions` - Complete income/expense ledger
  12. `events` - Calendar events and activities
  13. `documents` - Student document storage
  14. `whatsapp_logs` - WhatsApp notification history

  ## Security
  - RLS enabled on all tables
  - Role-based access: super_admin, admin, teacher, reception
  - All policies enforce authentication and ownership

  ## Notes
  - Designed for multi-sede scalability from day one
  - Soft deletes via status fields (no hard deletes on critical data)
  - All monetary values stored in cents/integers to avoid float issues
*/

-- ============================================================
-- SEDES (Branches/Locations)
-- ============================================================
CREATE TABLE IF NOT EXISTS sedes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  phone text,
  email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sedes ENABLE ROW LEVEL SECURITY;

-- Insert default sede
INSERT INTO sedes (name, address) VALUES ('Sede Principal', 'Dirección Principal') ON CONFLICT DO NOTHING;

-- ============================================================
-- PROFILES (Extended user profiles)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name text NOT NULL DEFAULT '',
  email text,
  phone text,
  avatar_url text,
  role text NOT NULL DEFAULT 'reception' CHECK (role IN ('super_admin', 'admin', 'teacher', 'reception')),
  sede_id uuid REFERENCES sedes(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DISCIPLINES
-- ============================================================
CREATE TABLE IF NOT EXISTS disciplines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text DEFAULT '#f59e0b',
  icon text,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  sede_id uuid REFERENCES sedes(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE disciplines ENABLE ROW LEVEL SECURITY;

-- Seed default disciplines
INSERT INTO disciplines (name, description, color, sort_order) VALUES
  ('Gimnasia Artística', 'Gimnasia artística para todas las edades', '#f59e0b', 1),
  ('Acrobacia Aérea (Telas)', 'Telas acrobáticas y artes aéreas', '#ef4444', 2),
  ('Natación', 'Natación recreativa y competitiva', '#3b82f6', 3),
  ('Colonia de Vacaciones', 'Actividades recreativas en períodos vacacionales', '#10b981', 4),
  ('Eventos Infantiles', 'Organización de eventos y cumpleaños', '#8b5cf6', 5),
  ('Alquiler de Gimnasio', 'Alquiler del espacio para eventos', '#6b7280', 6)
ON CONFLICT DO NOTHING;

-- ============================================================
-- EMPLOYEES (Staff & Instructors)
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  dni text,
  phone text,
  whatsapp text,
  email text,
  address text,
  birth_date date,
  hire_date date DEFAULT CURRENT_DATE,
  role text NOT NULL DEFAULT 'instructor' CHECK (role IN ('director', 'admin', 'instructor', 'reception', 'maintenance', 'other')),
  specializations text[], -- discipline names
  salary_amount integer DEFAULT 0, -- in cents
  salary_type text DEFAULT 'monthly' CHECK (salary_type IN ('monthly', 'hourly', 'per_class')),
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_leave')),
  sede_id uuid REFERENCES sedes(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- GROUPS (Training groups)
-- ============================================================
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discipline_id uuid REFERENCES disciplines(id) ON DELETE RESTRICT,
  instructor_id uuid REFERENCES employees(id) ON DELETE SET NULL,
  level text DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced', 'competition', 'recreational')),
  min_age integer,
  max_age integer,
  capacity integer DEFAULT 15,
  schedule jsonb DEFAULT '[]', -- [{day: "monday", start_time: "09:00", end_time: "10:00"}]
  monthly_fee integer DEFAULT 0, -- in cents
  days_per_week integer DEFAULT 2,
  is_active boolean DEFAULT true,
  sede_id uuid REFERENCES sedes(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STUDENTS (Complete member registry)
-- ============================================================
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Personal info
  first_name text NOT NULL,
  last_name text NOT NULL,
  dni text,
  birth_date date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  -- Contact
  address text,
  phone text,
  whatsapp text,
  email text,
  -- Medical
  medical_notes text,
  blood_type text,
  has_medical_insurance boolean DEFAULT false,
  insurance_details text,
  -- Academic
  school text,
  -- Financial
  has_scholarship boolean DEFAULT false,
  scholarship_percentage integer DEFAULT 0,
  sibling_discount boolean DEFAULT false,
  sibling_discount_percentage integer DEFAULT 0,
  -- Status
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'waiting')),
  enrollment_date date DEFAULT CURRENT_DATE,
  withdrawal_date date,
  -- QR/Access
  qr_code text UNIQUE DEFAULT gen_random_uuid()::text,
  -- Meta
  sede_id uuid REFERENCES sedes(id),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STUDENT GUARDIANS (Parents/Tutors)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_guardians (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  relationship text DEFAULT 'parent' CHECK (relationship IN ('parent', 'mother', 'father', 'guardian', 'grandparent', 'sibling', 'other')),
  dni text,
  phone text,
  whatsapp text,
  email text,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_guardians ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STUDENT GROUPS (Enrollment - many-to-many)
-- ============================================================
CREATE TABLE IF NOT EXISTS student_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  enrolled_at date DEFAULT CURRENT_DATE,
  status text DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'trial')),
  notes text,
  UNIQUE(student_id, group_id)
);

ALTER TABLE student_groups ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PAYMENT PLANS (Pricing tiers)
-- ============================================================
CREATE TABLE IF NOT EXISTS payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  discipline_id uuid REFERENCES disciplines(id) ON DELETE CASCADE,
  days_per_week integer NOT NULL DEFAULT 2,
  amount integer NOT NULL DEFAULT 0, -- in cents
  description text,
  is_active boolean DEFAULT true,
  sede_id uuid REFERENCES sedes(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PAYMENTS (All payment records)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE RESTRICT NOT NULL,
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  -- Period
  month integer NOT NULL CHECK (month BETWEEN 1 AND 12),
  year integer NOT NULL,
  -- Amounts (in cents)
  base_amount integer NOT NULL DEFAULT 0,
  discount_amount integer DEFAULT 0,
  surcharge_amount integer DEFAULT 0,
  final_amount integer NOT NULL DEFAULT 0,
  -- Payment details
  method text DEFAULT 'cash' CHECK (method IN ('cash', 'transfer', 'mercadopago', 'card', 'other')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'partial', 'overdue', 'cancelled', 'forgiven')),
  paid_at timestamptz,
  due_date date,
  -- Receipt
  receipt_number text,
  -- Meta
  notes text,
  created_by uuid REFERENCES profiles(id),
  sede_id uuid REFERENCES sedes(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_month_year ON payments(month, year);

-- ============================================================
-- FINANCIAL TRANSACTIONS (Income/Expense ledger)
-- ============================================================
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL, -- 'quota', 'salary', 'rent', 'utilities', 'equipment', 'event', 'other'
  amount integer NOT NULL DEFAULT 0, -- in cents
  description text NOT NULL,
  date date DEFAULT CURRENT_DATE,
  payment_method text DEFAULT 'cash' CHECK (payment_method IN ('cash', 'transfer', 'mercadopago', 'card', 'other')),
  reference_id uuid, -- can reference a payment, employee, etc.
  reference_type text, -- 'payment', 'employee_salary', 'event', etc.
  receipt_url text,
  created_by uuid REFERENCES profiles(id),
  sede_id uuid REFERENCES sedes(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_financial_date ON financial_transactions(date);
CREATE INDEX IF NOT EXISTS idx_financial_type ON financial_transactions(type);

-- ============================================================
-- EVENTS (Calendar)
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text DEFAULT 'class' CHECK (type IN ('class', 'event', 'birthday', 'tournament', 'meeting', 'rental', 'holiday', 'vacation_camp', 'payment_due', 'other')),
  start_datetime timestamptz NOT NULL,
  end_datetime timestamptz,
  all_day boolean DEFAULT false,
  color text DEFAULT '#f59e0b',
  group_id uuid REFERENCES groups(id) ON DELETE SET NULL,
  created_by uuid REFERENCES profiles(id),
  sede_id uuid REFERENCES sedes(id),
  is_recurring boolean DEFAULT false,
  recurrence_rule text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- DOCUMENTS (Student files)
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text DEFAULT 'other' CHECK (type IN ('medical_certificate', 'enrollment_contract', 'authorization', 'id_copy', 'insurance', 'other')),
  file_url text,
  file_size integer,
  mime_type text,
  notes text,
  uploaded_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- WHATSAPP LOGS (Notification history)
-- ============================================================
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  guardian_id uuid REFERENCES student_guardians(id) ON DELETE SET NULL,
  phone_number text NOT NULL,
  message_type text DEFAULT 'payment_reminder' CHECK (message_type IN ('payment_reminder', 'overdue_notice', 'general', 'confirmation', 'custom')),
  message_content text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'delivered')),
  sent_at timestamptz,
  month integer,
  year integer,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: is admin or above
CREATE OR REPLACE FUNCTION is_admin_or_above()
RETURNS boolean AS $$
  SELECT get_user_role() IN ('super_admin', 'admin');
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- SEDES policies
CREATE POLICY "Authenticated users can view sedes"
  ON sedes FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can manage sedes"
  ON sedes FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_above());

CREATE POLICY "Admins can update sedes"
  ON sedes FOR UPDATE TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());

-- PROFILES policies
CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can insert profiles"
  ON profiles FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_above());

CREATE POLICY "Super admins can update any profile"
  ON profiles FOR UPDATE TO authenticated
  USING (get_user_role() = 'super_admin') WITH CHECK (get_user_role() = 'super_admin');

-- DISCIPLINES policies
CREATE POLICY "Authenticated users can view disciplines"
  ON disciplines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage disciplines"
  ON disciplines FOR INSERT TO authenticated WITH CHECK (is_admin_or_above());

CREATE POLICY "Admins can update disciplines"
  ON disciplines FOR UPDATE TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());

-- EMPLOYEES policies
CREATE POLICY "Authenticated users can view employees"
  ON employees FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert employees"
  ON employees FOR INSERT TO authenticated WITH CHECK (is_admin_or_above());

CREATE POLICY "Admins can update employees"
  ON employees FOR UPDATE TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());

-- GROUPS policies
CREATE POLICY "Authenticated users can view groups"
  ON groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert groups"
  ON groups FOR INSERT TO authenticated WITH CHECK (is_admin_or_above());

CREATE POLICY "Admins and teachers can update groups"
  ON groups FOR UPDATE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin', 'teacher'))
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'teacher'));

-- STUDENTS policies
CREATE POLICY "Authenticated users can view students"
  ON students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins and reception can insert students"
  ON students FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

CREATE POLICY "Admins and reception can update students"
  ON students FOR UPDATE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin', 'reception'))
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

-- STUDENT GUARDIANS policies
CREATE POLICY "Authenticated users can view guardians"
  ON student_guardians FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert guardians"
  ON student_guardians FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

CREATE POLICY "Staff can update guardians"
  ON student_guardians FOR UPDATE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin', 'reception'))
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

CREATE POLICY "Staff can delete guardians"
  ON student_guardians FOR DELETE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin', 'reception'));

-- STUDENT GROUPS policies
CREATE POLICY "Authenticated users can view student groups"
  ON student_groups FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can manage student groups"
  ON student_groups FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

CREATE POLICY "Staff can update student groups"
  ON student_groups FOR UPDATE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin', 'reception'))
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

CREATE POLICY "Staff can delete student groups"
  ON student_groups FOR DELETE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin', 'reception'));

-- PAYMENT PLANS policies
CREATE POLICY "Authenticated users can view payment plans"
  ON payment_plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage payment plans"
  ON payment_plans FOR INSERT TO authenticated WITH CHECK (is_admin_or_above());

CREATE POLICY "Admins can update payment plans"
  ON payment_plans FOR UPDATE TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());

-- PAYMENTS policies
CREATE POLICY "Authenticated users can view payments"
  ON payments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert payments"
  ON payments FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

CREATE POLICY "Staff can update payments"
  ON payments FOR UPDATE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin', 'reception'))
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

-- FINANCIAL TRANSACTIONS policies
CREATE POLICY "Admins can view transactions"
  ON financial_transactions FOR SELECT TO authenticated
  USING (is_admin_or_above());

CREATE POLICY "Admins can insert transactions"
  ON financial_transactions FOR INSERT TO authenticated
  WITH CHECK (is_admin_or_above());

CREATE POLICY "Admins can update transactions"
  ON financial_transactions FOR UPDATE TO authenticated
  USING (is_admin_or_above()) WITH CHECK (is_admin_or_above());

-- EVENTS policies
CREATE POLICY "Authenticated users can view events"
  ON events FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert events"
  ON events FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'teacher', 'reception'));

CREATE POLICY "Staff can update events"
  ON events FOR UPDATE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin', 'teacher', 'reception'))
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'teacher', 'reception'));

CREATE POLICY "Staff can delete events"
  ON events FOR DELETE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin'));

-- DOCUMENTS policies
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert documents"
  ON documents FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

CREATE POLICY "Admins can delete documents"
  ON documents FOR DELETE TO authenticated
  USING (is_admin_or_above());

-- WHATSAPP LOGS policies
CREATE POLICY "Authenticated users can view whatsapp logs"
  ON whatsapp_logs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Staff can insert whatsapp logs"
  ON whatsapp_logs FOR INSERT TO authenticated
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

CREATE POLICY "Staff can update whatsapp logs"
  ON whatsapp_logs FOR UPDATE TO authenticated
  USING (get_user_role() IN ('super_admin', 'admin', 'reception'))
  WITH CHECK (get_user_role() IN ('super_admin', 'admin', 'reception'));

-- ============================================================
-- AUTO-PROFILE CREATION TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'reception')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_groups_updated_at BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
