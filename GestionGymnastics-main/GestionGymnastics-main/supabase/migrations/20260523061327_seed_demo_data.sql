
/*
  # Seed Demo Data

  Populates the system with realistic sample data including:
  - Employees (instructors, admin)
  - Groups per discipline with schedules
  - Students with guardians
  - Payments for 3 months
  - Financial transactions for 6 months
  - Calendar events
*/

DO $$
DECLARE
  v_sede_id uuid;
  v_disc_gimnasia uuid;
  v_disc_acrobacia uuid;
  v_disc_natacion uuid;
  v_emp1 uuid;
  v_emp2 uuid;
  v_group1 uuid;
  v_group2 uuid;
  v_group3 uuid;
  v_group4 uuid;
  v_st1 uuid;
  v_st2 uuid;
  v_st3 uuid;
  v_st4 uuid;
  v_st5 uuid;
  v_st6 uuid;
  v_st7 uuid;
  cur_month int := EXTRACT(MONTH FROM CURRENT_DATE)::int;
  cur_year int := EXTRACT(YEAR FROM CURRENT_DATE)::int;
  prev_month int;
  prev_year int;
  prev2_month int;
  prev2_year int;
  month_names text[] := ARRAY['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
BEGIN
  prev_month := CASE WHEN cur_month = 1 THEN 12 ELSE cur_month - 1 END;
  prev_year := CASE WHEN cur_month = 1 THEN cur_year - 1 ELSE cur_year END;
  prev2_month := CASE WHEN prev_month = 1 THEN 12 ELSE prev_month - 1 END;
  prev2_year := CASE WHEN prev_month = 1 THEN prev_year - 1 ELSE prev_year END;

  SELECT id INTO v_sede_id FROM sedes LIMIT 1;
  SELECT id INTO v_disc_gimnasia FROM disciplines WHERE name ILIKE '%gimnasia%' LIMIT 1;
  SELECT id INTO v_disc_acrobacia FROM disciplines WHERE name ILIKE '%acrobacia%' LIMIT 1;
  SELECT id INTO v_disc_natacion FROM disciplines WHERE name ILIKE '%nataci%' LIMIT 1;

  -- Employees
  INSERT INTO employees (first_name, last_name, role, hire_date, salary_amount, salary_type, status, sede_id, specializations, phone, email)
  VALUES
    ('Laura', 'Martínez', 'instructor', '2022-03-01', 120000, 'monthly', 'active', v_sede_id, ARRAY['Gimnasia Artística', 'Acrobacia'], '+54 9 11 1234-5678', 'laura@gymnastics.com'),
    ('Carlos', 'González', 'instructor', '2021-06-15', 110000, 'monthly', 'active', v_sede_id, ARRAY['Natación'], '+54 9 11 2345-6789', 'carlos@gymnastics.com'),
    ('María', 'Rodríguez', 'admin', '2020-01-10', 90000, 'monthly', 'active', v_sede_id, NULL, '+54 9 11 3456-7890', 'maria@gymnastics.com');

  SELECT id INTO v_emp1 FROM employees WHERE first_name = 'Laura' AND last_name = 'Martínez' LIMIT 1;
  SELECT id INTO v_emp2 FROM employees WHERE first_name = 'Carlos' AND last_name = 'González' LIMIT 1;

  -- Groups
  INSERT INTO groups (name, discipline_id, instructor_id, level, capacity, monthly_fee, days_per_week, schedule, is_active, sede_id)
  VALUES ('Gimnasia Artística — Principiantes', v_disc_gimnasia, v_emp1, 'beginner', 15, 1200000, 3,
    '[{"day":"Lunes","start_time":"09:00","end_time":"10:30"},{"day":"Miércoles","start_time":"09:00","end_time":"10:30"},{"day":"Viernes","start_time":"09:00","end_time":"10:30"}]'::jsonb, true, v_sede_id);
  SELECT id INTO v_group1 FROM groups WHERE name = 'Gimnasia Artística — Principiantes' LIMIT 1;

  INSERT INTO groups (name, discipline_id, instructor_id, level, capacity, monthly_fee, days_per_week, schedule, is_active, sede_id)
  VALUES ('Acrobacia Aérea — Intermedio', v_disc_acrobacia, v_emp1, 'intermediate', 10, 1500000, 2,
    '[{"day":"Martes","start_time":"18:00","end_time":"19:30"},{"day":"Jueves","start_time":"18:00","end_time":"19:30"}]'::jsonb, true, v_sede_id);
  SELECT id INTO v_group2 FROM groups WHERE name = 'Acrobacia Aérea — Intermedio' LIMIT 1;

  INSERT INTO groups (name, discipline_id, instructor_id, level, capacity, monthly_fee, days_per_week, schedule, is_active, sede_id)
  VALUES ('Natación — Bebés', v_disc_natacion, v_emp2, 'beginner', 8, 1100000, 2,
    '[{"day":"Martes","start_time":"10:00","end_time":"11:00"},{"day":"Jueves","start_time":"10:00","end_time":"11:00"}]'::jsonb, true, v_sede_id);
  SELECT id INTO v_group3 FROM groups WHERE name = 'Natación — Bebés' LIMIT 1;

  INSERT INTO groups (name, discipline_id, instructor_id, level, capacity, monthly_fee, days_per_week, schedule, is_active, sede_id)
  VALUES ('Natación — Avanzado', v_disc_natacion, v_emp2, 'advanced', 12, 1300000, 3,
    '[{"day":"Lunes","start_time":"17:00","end_time":"18:00"},{"day":"Miércoles","start_time":"17:00","end_time":"18:00"},{"day":"Viernes","start_time":"17:00","end_time":"18:00"}]'::jsonb, true, v_sede_id);
  SELECT id INTO v_group4 FROM groups WHERE name = 'Natación — Avanzado' LIMIT 1;

  -- Students
  INSERT INTO students (first_name, last_name, dni, birth_date, gender, phone, whatsapp, status, enrollment_date, sede_id, has_medical_insurance, has_scholarship, scholarship_percentage, sibling_discount, sibling_discount_percentage)
  VALUES ('Sofía', 'García', '45123456', '2016-03-12', 'female', '+54 9 11 4567-8901', '+54 9 11 4567-8901', 'active', '2024-02-01', v_sede_id, false, false, 0, false, 0);
  SELECT id INTO v_st1 FROM students WHERE dni = '45123456' LIMIT 1;

  INSERT INTO students (first_name, last_name, dni, birth_date, gender, phone, whatsapp, status, enrollment_date, sede_id, has_medical_insurance, has_scholarship, scholarship_percentage, sibling_discount, sibling_discount_percentage)
  VALUES ('Valentina', 'López', '46234567', '2015-07-22', 'female', '+54 9 11 5678-9012', '+54 9 11 5678-9012', 'active', '2024-01-15', v_sede_id, true, false, 0, true, 10);
  SELECT id INTO v_st2 FROM students WHERE dni = '46234567' LIMIT 1;

  INSERT INTO students (first_name, last_name, dni, birth_date, gender, phone, whatsapp, status, enrollment_date, sede_id, has_medical_insurance, has_scholarship, scholarship_percentage, sibling_discount, sibling_discount_percentage)
  VALUES ('Martina', 'Fernández', '47345678', '2018-11-05', 'female', '+54 9 11 6789-0123', '+54 9 11 6789-0123', 'active', '2024-03-10', v_sede_id, false, true, 25, false, 0);
  SELECT id INTO v_st3 FROM students WHERE dni = '47345678' LIMIT 1;

  INSERT INTO students (first_name, last_name, dni, birth_date, gender, phone, whatsapp, status, enrollment_date, sede_id, has_medical_insurance, has_scholarship, scholarship_percentage, sibling_discount, sibling_discount_percentage)
  VALUES ('Lucas', 'Pérez', '48456789', '2014-05-18', 'male', '+54 9 11 7890-1234', '+54 9 11 7890-1234', 'active', '2023-08-01', v_sede_id, true, false, 0, false, 0);
  SELECT id INTO v_st4 FROM students WHERE dni = '48456789' LIMIT 1;

  INSERT INTO students (first_name, last_name, dni, birth_date, gender, phone, whatsapp, status, enrollment_date, sede_id, has_medical_insurance, has_scholarship, scholarship_percentage, sibling_discount, sibling_discount_percentage)
  VALUES ('Emma', 'González', '49567890', '2019-02-28', 'female', '+54 9 11 8901-2345', '+54 9 11 8901-2345', 'active', '2024-04-01', v_sede_id, false, false, 0, true, 10);
  SELECT id INTO v_st5 FROM students WHERE dni = '49567890' LIMIT 1;

  INSERT INTO students (first_name, last_name, dni, birth_date, gender, phone, whatsapp, status, enrollment_date, sede_id, has_medical_insurance, has_scholarship, scholarship_percentage, sibling_discount, sibling_discount_percentage)
  VALUES ('Tomás', 'Martínez', '50678901', '2013-09-14', 'male', '+54 9 11 9012-3456', '+54 9 11 9012-3456', 'active', '2023-11-01', v_sede_id, true, false, 0, false, 0);
  SELECT id INTO v_st6 FROM students WHERE dni = '50678901' LIMIT 1;

  INSERT INTO students (first_name, last_name, dni, birth_date, gender, phone, whatsapp, status, enrollment_date, sede_id, has_medical_insurance, has_scholarship, scholarship_percentage, sibling_discount, sibling_discount_percentage)
  VALUES ('Isabella', 'Rodríguez', '51789012', '2017-06-30', 'female', '+54 9 11 0123-4567', '+54 9 11 0123-4567', 'active', '2024-02-15', v_sede_id, false, false, 0, false, 0);
  SELECT id INTO v_st7 FROM students WHERE dni = '51789012' LIMIT 1;

  -- Guardians
  INSERT INTO student_guardians (student_id, full_name, relationship, phone, whatsapp, email, is_primary)
  VALUES
    (v_st1, 'Ana García', 'mother', '+54 9 11 4444-1111', '+54 9 11 4444-1111', 'ana.garcia@email.com', true),
    (v_st2, 'Roberto López', 'father', '+54 9 11 5555-2222', '+54 9 11 5555-2222', 'roberto.lopez@email.com', true),
    (v_st3, 'Claudia Fernández', 'mother', '+54 9 11 6666-3333', '+54 9 11 6666-3333', 'claudia.fern@email.com', true),
    (v_st4, 'Diego Pérez', 'father', '+54 9 11 7777-4444', '+54 9 11 7777-4444', 'diego.perez@email.com', true),
    (v_st5, 'Fernanda González', 'mother', '+54 9 11 8888-5555', '+54 9 11 8888-5555', 'fer.gonza@email.com', true),
    (v_st6, 'Jorge Martínez', 'father', '+54 9 11 9999-6666', '+54 9 11 9999-6666', 'jorge.mart@email.com', true),
    (v_st7, 'Gabriela Rodríguez', 'mother', '+54 9 11 0000-7777', '+54 9 11 0000-7777', 'gabi.rod@email.com', true);

  -- Enrollments
  INSERT INTO student_groups (student_id, group_id, status, enrolled_at)
  VALUES
    (v_st1, v_group1, 'active', '2024-02-01'),
    (v_st2, v_group1, 'active', '2024-01-15'),
    (v_st3, v_group1, 'active', '2024-03-10'),
    (v_st2, v_group2, 'active', '2024-01-15'),
    (v_st6, v_group2, 'active', '2023-11-01'),
    (v_st4, v_group4, 'active', '2023-08-01'),
    (v_st5, v_group3, 'active', '2024-04-01'),
    (v_st7, v_group3, 'active', '2024-02-15');

  -- Payments: 2 months ago (all paid)
  INSERT INTO payments (student_id, group_id, month, year, base_amount, discount_amount, surcharge_amount, final_amount, method, status, paid_at, sede_id)
  VALUES
    (v_st1, v_group1, prev2_month, prev2_year, 1200000, 0, 0, 1200000, 'transfer', 'paid', make_date(prev2_year, prev2_month, 10)::timestamp, v_sede_id),
    (v_st2, v_group1, prev2_month, prev2_year, 1200000, 120000, 0, 1080000, 'cash', 'paid', make_date(prev2_year, prev2_month, 8)::timestamp, v_sede_id),
    (v_st3, v_group1, prev2_month, prev2_year, 1200000, 300000, 0, 900000, 'transfer', 'paid', make_date(prev2_year, prev2_month, 5)::timestamp, v_sede_id),
    (v_st4, v_group4, prev2_month, prev2_year, 1300000, 0, 0, 1300000, 'mercadopago', 'paid', make_date(prev2_year, prev2_month, 12)::timestamp, v_sede_id),
    (v_st5, v_group3, prev2_month, prev2_year, 1100000, 110000, 0, 990000, 'cash', 'paid', make_date(prev2_year, prev2_month, 7)::timestamp, v_sede_id),
    (v_st6, v_group2, prev2_month, prev2_year, 1500000, 0, 0, 1500000, 'transfer', 'paid', make_date(prev2_year, prev2_month, 9)::timestamp, v_sede_id),
    (v_st7, v_group3, prev2_month, prev2_year, 1100000, 0, 0, 1100000, 'cash', 'paid', make_date(prev2_year, prev2_month, 11)::timestamp, v_sede_id);

  -- Payments: last month
  INSERT INTO payments (student_id, group_id, month, year, base_amount, discount_amount, surcharge_amount, final_amount, method, status, paid_at, sede_id)
  VALUES
    (v_st1, v_group1, prev_month, prev_year, 1200000, 0, 120000, 1320000, 'transfer', 'paid', make_date(prev_year, prev_month, 18)::timestamp, v_sede_id),
    (v_st2, v_group1, prev_month, prev_year, 1200000, 120000, 0, 1080000, 'cash', 'paid', make_date(prev_year, prev_month, 6)::timestamp, v_sede_id),
    (v_st3, v_group1, prev_month, prev_year, 1200000, 300000, 0, 900000, 'transfer', 'paid', make_date(prev_year, prev_month, 4)::timestamp, v_sede_id),
    (v_st4, v_group4, prev_month, prev_year, 1300000, 0, 0, 1300000, 'mercadopago', 'paid', make_date(prev_year, prev_month, 10)::timestamp, v_sede_id),
    (v_st5, v_group3, prev_month, prev_year, 1100000, 110000, 0, 990000, 'cash', 'paid', make_date(prev_year, prev_month, 8)::timestamp, v_sede_id),
    (v_st6, v_group2, prev_month, prev_year, 1500000, 0, 0, 1500000, 'transfer', 'overdue', NULL, v_sede_id),
    (v_st7, v_group3, prev_month, prev_year, 1100000, 0, 0, 1100000, 'cash', 'paid', make_date(prev_year, prev_month, 3)::timestamp, v_sede_id);

  -- Payments: current month
  INSERT INTO payments (student_id, group_id, month, year, base_amount, discount_amount, surcharge_amount, final_amount, method, status, paid_at, sede_id)
  VALUES
    (v_st1, v_group1, cur_month, cur_year, 1200000, 0, 0, 1200000, 'transfer', 'paid', CURRENT_TIMESTAMP, v_sede_id),
    (v_st2, v_group1, cur_month, cur_year, 1200000, 120000, 0, 1080000, 'cash', 'paid', CURRENT_TIMESTAMP, v_sede_id),
    (v_st3, v_group1, cur_month, cur_year, 1200000, 300000, 0, 900000, 'transfer', 'pending', NULL, v_sede_id),
    (v_st4, v_group4, cur_month, cur_year, 1300000, 0, 0, 1300000, 'mercadopago', 'pending', NULL, v_sede_id),
    (v_st5, v_group3, cur_month, cur_year, 1100000, 110000, 0, 990000, 'cash', 'pending', NULL, v_sede_id),
    (v_st6, v_group2, cur_month, cur_year, 1500000, 0, 0, 1500000, 'transfer', 'overdue', NULL, v_sede_id),
    (v_st7, v_group3, cur_month, cur_year, 1100000, 0, 0, 1100000, 'cash', 'paid', CURRENT_TIMESTAMP, v_sede_id);

  -- Financial transactions
  INSERT INTO financial_transactions (type, category, amount, description, date, payment_method, sede_id)
  VALUES
    ('income', 'Cuotas', 7200000, 'Recaudación mensual — ' || month_names[prev2_month], make_date(prev2_year, prev2_month, 28), 'transfer', v_sede_id),
    ('expense', 'Sueldos', 3200000, 'Sueldos docentes — ' || month_names[prev2_month], make_date(prev2_year, prev2_month, 30), 'transfer', v_sede_id),
    ('expense', 'Alquiler', 800000, 'Alquiler sede — ' || month_names[prev2_month], make_date(prev2_year, prev2_month, 1), 'transfer', v_sede_id),
    ('expense', 'Servicios', 150000, 'Agua, luz, gas — ' || month_names[prev2_month], make_date(prev2_year, prev2_month, 15), 'cash', v_sede_id),
    ('income', 'Cuotas', 8400000, 'Recaudación mensual — ' || month_names[prev_month], make_date(prev_year, prev_month, 28), 'transfer', v_sede_id),
    ('income', 'Alquiler gimnasio', 500000, 'Alquiler evento fin de semana', make_date(prev_year, prev_month, 14), 'cash', v_sede_id),
    ('expense', 'Sueldos', 3200000, 'Sueldos docentes — ' || month_names[prev_month], make_date(prev_year, prev_month, 30), 'transfer', v_sede_id),
    ('expense', 'Mantenimiento', 320000, 'Reparación equipos gimnasia', make_date(prev_year, prev_month, 20), 'cash', v_sede_id),
    ('expense', 'Insumos', 95000, 'Material didáctico y elementos', make_date(prev_year, prev_month, 10), 'cash', v_sede_id),
    ('income', 'Cuotas', 4300000, 'Recaudación parcial — mes actual', CURRENT_DATE, 'transfer', v_sede_id),
    ('expense', 'Sueldos', 3200000, 'Sueldos docentes — mes actual', CURRENT_DATE, 'transfer', v_sede_id);

  -- Calendar events
  INSERT INTO events (title, type, start_datetime, end_datetime, all_day, color, sede_id, is_recurring, description)
  VALUES
    ('Clase Gimnasia Artística', 'class', (CURRENT_DATE + interval '1 day') + interval '9 hours', (CURRENT_DATE + interval '1 day') + interval '10 hours 30 minutes', false, '#f59e0b', v_sede_id, true, 'Grupo principiantes'),
    ('Clase Acrobacia Aérea', 'class', (CURRENT_DATE + interval '2 days') + interval '18 hours', (CURRENT_DATE + interval '2 days') + interval '19 hours 30 minutes', false, '#ef4444', v_sede_id, true, 'Grupo intermedio'),
    ('Clase Natación Bebés', 'class', (CURRENT_DATE + interval '2 days') + interval '10 hours', (CURRENT_DATE + interval '2 days') + interval '11 hours', false, '#3b82f6', v_sede_id, true, NULL),
    ('Muestra fin de temporada', 'event', (CURRENT_DATE + interval '15 days') + interval '18 hours', (CURRENT_DATE + interval '15 days') + interval '21 hours', false, '#10b981', v_sede_id, false, 'Presentación anual de todas las disciplinas'),
    ('Cumpleaños — Reserva', 'birthday', (CURRENT_DATE + interval '5 days') + interval '16 hours', (CURRENT_DATE + interval '5 days') + interval '19 hours', false, '#ec4899', v_sede_id, false, 'Cumpleaños privado — alquiler salón'),
    ('Torneo interno gimnasia', 'tournament', CURRENT_DATE + interval '20 days', (CURRENT_DATE + interval '20 days') + interval '8 hours', true, '#8b5cf6', v_sede_id, false, 'Competencia interna para todas las categorías'),
    ('Reunión de padres', 'meeting', (CURRENT_DATE + interval '8 days') + interval '19 hours', (CURRENT_DATE + interval '8 days') + interval '20 hours', false, '#6b7280', v_sede_id, false, 'Reunión informativa inicio de temporada');

END $$;
