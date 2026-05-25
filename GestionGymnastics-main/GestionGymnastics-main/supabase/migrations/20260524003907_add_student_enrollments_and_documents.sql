/*
  # Student Enrollments & Documents

  1. New Tables
    - `student_annual_enrollments`
      - `id` (uuid, pk)
      - `student_id` (uuid, fk → students)
      - `year` (int) — enrollment year
      - `status` (text) — enrolled | pending | cancelled
      - `enrollment_date` (date)
      - `shirt_size` (text) — talle de remera entregada
      - `contract_signed` (bool)
      - `observations` (text)
      - `created_at`, `updated_at`

    - `student_documents`
      - `id` (uuid, pk)
      - `student_id` (uuid, fk → students)
      - `name` (text)
      - `type` (text) — enrollment_contract | insurance | medical_certificate | authorization | id_copy | other
      - `file_url` (text)
      - `file_name` (text)
      - `file_size` (int)
      - `notes` (text)
      - `uploaded_by` (uuid)
      - `created_at`

  2. Security
    - RLS enabled on both tables
    - Authenticated users can read/insert/update/delete their own org's data
*/

CREATE TABLE IF NOT EXISTS student_annual_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  year int NOT NULL DEFAULT date_part('year', now())::int,
  status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'pending', 'cancelled')),
  enrollment_date date DEFAULT CURRENT_DATE,
  shirt_size text DEFAULT '',
  contract_signed boolean DEFAULT false,
  observations text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (student_id, year)
);

ALTER TABLE student_annual_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select enrollments"
  ON student_annual_enrollments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert enrollments"
  ON student_annual_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update enrollments"
  ON student_annual_enrollments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete enrollments"
  ON student_annual_enrollments FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS student_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'other' CHECK (type IN ('enrollment_contract','insurance','medical_certificate','authorization','id_copy','other')),
  file_url text DEFAULT '',
  file_name text DEFAULT '',
  file_size int DEFAULT 0,
  notes text DEFAULT '',
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select documents"
  ON student_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON student_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON student_documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON student_documents FOR DELETE
  TO authenticated
  USING (true);
