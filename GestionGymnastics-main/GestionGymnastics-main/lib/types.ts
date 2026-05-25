export type UserRole = 'super_admin' | 'admin' | 'teacher' | 'reception';
export type StudentStatus = 'active' | 'inactive' | 'suspended' | 'waiting';
export type PaymentStatus = 'pending' | 'paid' | 'partial' | 'overdue' | 'cancelled' | 'forgiven';
export type PaymentMethod = 'cash' | 'transfer' | 'mercadopago' | 'card' | 'other';
export type TransactionType = 'income' | 'expense';
export type EmployeeRole = 'director' | 'admin' | 'instructor' | 'reception' | 'maintenance' | 'other';
export type EventType = 'class' | 'event' | 'birthday' | 'tournament' | 'meeting' | 'rental' | 'holiday' | 'vacation_camp' | 'payment_due' | 'other';

export interface Sede {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  sede_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Discipline {
  id: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  sede_id?: string;
  created_at: string;
}

export interface Employee {
  id: string;
  profile_id?: string;
  first_name: string;
  last_name: string;
  dni?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  address?: string;
  birth_date?: string;
  hire_date: string;
  role: EmployeeRole;
  specializations?: string[];
  salary_amount: number;
  salary_type: 'monthly' | 'hourly' | 'per_class';
  status: 'active' | 'inactive' | 'on_leave';
  sede_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduleSlot {
  day: string;
  start_time: string;
  end_time: string;
}

export interface Group {
  id: string;
  name: string;
  discipline_id: string;
  instructor_id?: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'competition' | 'recreational';
  min_age?: number;
  max_age?: number;
  capacity: number;
  schedule: ScheduleSlot[];
  monthly_fee: number;
  days_per_week: number;
  is_active: boolean;
  sede_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  discipline?: Discipline;
  instructor?: Employee;
  enrolled_count?: number;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  dni?: string;
  birth_date?: string;
  gender?: 'male' | 'female' | 'other';
  address?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  medical_notes?: string;
  blood_type?: string;
  has_medical_insurance: boolean;
  insurance_details?: string;
  school?: string;
  has_scholarship: boolean;
  scholarship_percentage: number;
  sibling_discount: boolean;
  sibling_discount_percentage: number;
  status: StudentStatus;
  enrollment_date: string;
  withdrawal_date?: string;
  qr_code?: string;
  sede_id?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined
  guardians?: StudentGuardian[];
  groups?: Group[];
  payments?: Payment[];
}

export interface StudentGuardian {
  id: string;
  student_id: string;
  full_name: string;
  relationship: 'parent' | 'mother' | 'father' | 'guardian' | 'grandparent' | 'sibling' | 'other';
  dni?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  is_primary: boolean;
  created_at: string;
}

export interface StudentGroup {
  id: string;
  student_id: string;
  group_id: string;
  enrolled_at: string;
  status: 'active' | 'inactive' | 'trial';
  notes?: string;
}

export interface PaymentPlan {
  id: string;
  name: string;
  discipline_id: string;
  days_per_week: number;
  amount: number;
  description?: string;
  is_active: boolean;
  sede_id?: string;
  created_at: string;
}

export interface Payment {
  id: string;
  student_id: string;
  group_id?: string;
  month: number;
  year: number;
  base_amount: number;
  discount_amount: number;
  surcharge_amount: number;
  final_amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  paid_at?: string;
  due_date?: string;
  receipt_number?: string;
  notes?: string;
  created_by?: string;
  sede_id?: string;
  created_at: string;
  updated_at: string;
  // Joined
  student?: Student;
  group?: Group;
}

export interface FinancialTransaction {
  id: string;
  type: TransactionType;
  category: string;
  amount: number;
  description: string;
  date: string;
  payment_method: PaymentMethod;
  reference_id?: string;
  reference_type?: string;
  receipt_url?: string;
  created_by?: string;
  sede_id?: string;
  notes?: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  type: EventType;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  color: string;
  group_id?: string;
  created_by?: string;
  sede_id?: string;
  is_recurring: boolean;
  recurrence_rule?: string;
  notes?: string;
  created_at: string;
}

export interface Document {
  id: string;
  student_id: string;
  name: string;
  type: 'medical_certificate' | 'enrollment_contract' | 'authorization' | 'id_copy' | 'insurance' | 'other';
  file_url?: string;
  file_size?: number;
  mime_type?: string;
  notes?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface WhatsappLog {
  id: string;
  student_id: string;
  guardian_id?: string;
  phone_number: string;
  message_type: 'payment_reminder' | 'overdue_notice' | 'general' | 'confirmation' | 'custom';
  message_content?: string;
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  sent_at?: string;
  month?: number;
  year?: number;
  created_by?: string;
  created_at: string;
}

// Dashboard stats type
export interface DashboardStats {
  totalActiveStudents: number;
  newStudentsMonth: number;
  withdrawalsMonth: number;
  monthlyRevenue: number;
  pendingPayments: number;
  overduePayments: number;
  delinquencyRate: number;
  totalGroups: number;
}

// Database type for Supabase client
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Database = any;
