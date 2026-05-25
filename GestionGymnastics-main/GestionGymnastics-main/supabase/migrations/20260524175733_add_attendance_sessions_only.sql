/*
  # Attendance Sessions table
*/

CREATE TABLE IF NOT EXISTS attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE (group_id, date)
);

ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "att_sessions_select" ON attendance_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "att_sessions_insert" ON attendance_sessions FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "att_sessions_update" ON attendance_sessions FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "att_sessions_delete" ON attendance_sessions FOR DELETE TO authenticated USING (true);
