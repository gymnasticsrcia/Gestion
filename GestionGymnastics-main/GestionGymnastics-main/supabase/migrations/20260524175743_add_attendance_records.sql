/*
  # Attendance Records table
*/

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'present',
  notes text DEFAULT '',
  UNIQUE (session_id, student_id),
  CONSTRAINT attendance_status_check CHECK (status IN ('present', 'absent', 'late', 'excused'))
);

ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "att_records_select" ON attendance_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "att_records_insert" ON attendance_records FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "att_records_update" ON attendance_records FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "att_records_delete" ON attendance_records FOR DELETE TO authenticated USING (true);
