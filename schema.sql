-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.academic_years (
  id bigint NOT NULL DEFAULT nextval('academic_years_id_seq'::regclass),
  year_name character varying NOT NULL UNIQUE,
  start_date date,
  end_date date,
  is_current boolean DEFAULT false,
  CONSTRAINT academic_years_pkey PRIMARY KEY (id)
);
CREATE TABLE public.activity_logs (
  id bigint NOT NULL DEFAULT nextval('activity_logs_id_seq'::regclass),
  user_id bigint,
  student_id bigint,
  action character varying,
  details jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT activity_logs_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.assignment_submissions (
  id bigint NOT NULL DEFAULT nextval('assignment_submissions_id_seq'::regclass),
  assignment_id bigint,
  student_id bigint,
  submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  file_url text,
  marks_obtained numeric,
  feedback text,
  status character varying DEFAULT 'submitted'::character varying CHECK (status::text = ANY (ARRAY['submitted'::character varying, 'late'::character varying, 'graded'::character varying]::text[])),
  CONSTRAINT assignment_submissions_pkey PRIMARY KEY (id),
  CONSTRAINT assignment_submissions_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id),
  CONSTRAINT assignment_submissions_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.assignments (
  id bigint NOT NULL DEFAULT nextval('assignments_id_seq'::regclass),
  title character varying NOT NULL,
  description text,
  subject_id bigint,
  class_id bigint,
  teacher_id bigint NOT NULL,
  due_date timestamp without time zone NOT NULL,
  max_marks numeric DEFAULT 100,
  attachments jsonb,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT assignments_pkey PRIMARY KEY (id),
  CONSTRAINT assignments_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT assignments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT assignments_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);
CREATE TABLE public.attendance (
  id bigint NOT NULL DEFAULT nextval('attendance_id_seq'::regclass),
  student_id bigint NOT NULL,
  class_id bigint NOT NULL,
  subject_id bigint,
  date date NOT NULL,
  status character varying NOT NULL CHECK (status::text = ANY (ARRAY['present'::character varying, 'absent'::character varying, 'late'::character varying, 'excused'::character varying]::text[])),
  marked_by bigint,
  notes text,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT attendance_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT attendance_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT attendance_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT attendance_marked_by_fkey FOREIGN KEY (marked_by) REFERENCES public.teachers(id)
);
CREATE TABLE public.classes (
  id bigint NOT NULL DEFAULT nextval('classes_id_seq'::regclass),
  name character varying NOT NULL,
  grade_level character varying,
  academic_year_id bigint,
  capacity integer DEFAULT 40,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT classes_pkey PRIMARY KEY (id),
  CONSTRAINT classes_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
);
CREATE TABLE public.fee_payments (
  id bigint NOT NULL DEFAULT nextval('fee_payments_id_seq'::regclass),
  student_fee_id bigint,
  amount numeric NOT NULL,
  payment_date date DEFAULT CURRENT_DATE,
  payment_method character varying,
  receipt_number character varying UNIQUE,
  created_by bigint,
  notes text,
  CONSTRAINT fee_payments_pkey PRIMARY KEY (id),
  CONSTRAINT fee_payments_student_fee_id_fkey FOREIGN KEY (student_fee_id) REFERENCES public.student_fees(id),
  CONSTRAINT fee_payments_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.fee_structures (
  id bigint NOT NULL DEFAULT nextval('fee_structures_id_seq'::regclass),
  academic_year_id bigint,
  class_id bigint,
  fee_type character varying NOT NULL,
  amount numeric NOT NULL,
  due_date date,
  late_fee_rate numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  CONSTRAINT fee_structures_pkey PRIMARY KEY (id),
  CONSTRAINT fee_structures_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id),
  CONSTRAINT fee_structures_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id)
);
CREATE TABLE public.grade_entries (
  id bigint NOT NULL DEFAULT nextval('grade_entries_id_seq'::regclass),
  student_id bigint,
  subject_id bigint,
  class_id bigint,
  assignment_id bigint,
  marks numeric NOT NULL,
  max_marks numeric NOT NULL,
  weight numeric DEFAULT 1.0,
  recorded_by bigint,
  recorded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT grade_entries_pkey PRIMARY KEY (id),
  CONSTRAINT grade_entries_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT grade_entries_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT grade_entries_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT grade_entries_assignment_id_fkey FOREIGN KEY (assignment_id) REFERENCES public.assignments(id),
  CONSTRAINT grade_entries_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.teachers(id)
);
CREATE TABLE public.invoices (
  id bigint NOT NULL DEFAULT nextval('invoices_id_seq'::regclass),
  student_id bigint,
  invoice_number character varying NOT NULL UNIQUE,
  period character varying,
  total_amount numeric,
  generated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  pdf_url text,
  CONSTRAINT invoices_pkey PRIMARY KEY (id),
  CONSTRAINT invoices_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id)
);
CREATE TABLE public.notifications (
  id bigint NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id bigint NOT NULL,
  title character varying,
  message text,
  type character varying,
  is_read boolean DEFAULT false,
  related_id bigint,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.parents (
  id bigint NOT NULL DEFAULT nextval('parents_id_seq'::regclass),
  user_id bigint NOT NULL,
  full_name character varying NOT NULL,
  relationship character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT parents_pkey PRIMARY KEY (id),
  CONSTRAINT parents_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.refresh_tokens (
  id bigint NOT NULL DEFAULT nextval('refresh_tokens_id_seq'::regclass),
  user_id bigint,
  token text NOT NULL UNIQUE,
  expires_at timestamp without time zone NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.student_enrollments (
  id bigint NOT NULL DEFAULT nextval('student_enrollments_id_seq'::regclass),
  student_id bigint NOT NULL,
  class_id bigint NOT NULL,
  academic_year_id bigint NOT NULL,
  enrollment_date date NOT NULL DEFAULT CURRENT_DATE,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'transferred'::character varying, 'dropped'::character varying]::text[])),
  CONSTRAINT student_enrollments_pkey PRIMARY KEY (id),
  CONSTRAINT student_enrollments_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT student_enrollments_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT student_enrollments_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
);
CREATE TABLE public.student_fees (
  id bigint NOT NULL DEFAULT nextval('student_fees_id_seq'::regclass),
  student_id bigint,
  fee_structure_id bigint,
  total_amount numeric NOT NULL,
  paid_amount numeric DEFAULT 0,
  due_date date,
  status character varying DEFAULT 'pending'::character varying,
  CONSTRAINT student_fees_pkey PRIMARY KEY (id),
  CONSTRAINT student_fees_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT student_fees_fee_structure_id_fkey FOREIGN KEY (fee_structure_id) REFERENCES public.fee_structures(id)
);
CREATE TABLE public.student_parents (
  student_id bigint NOT NULL,
  parent_id bigint NOT NULL,
  is_primary boolean DEFAULT false,
  CONSTRAINT student_parents_pkey PRIMARY KEY (student_id, parent_id),
  CONSTRAINT student_parents_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.students(id),
  CONSTRAINT student_parents_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id)
);
CREATE TABLE public.students (
  id bigint NOT NULL DEFAULT nextval('students_id_seq'::regclass),
  user_id bigint,
  student_code character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  date_of_birth date,
  gender character varying,
  address text,
  medical_history text,
  allergies text,
  emergency_contact_name character varying,
  emergency_contact_phone character varying,
  photo_url text,
  enrollment_date date NOT NULL,
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'graduated'::character varying, 'dropped'::character varying, 'suspended'::character varying]::text[])),
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT students_pkey PRIMARY KEY (id),
  CONSTRAINT students_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.subjects (
  id bigint NOT NULL DEFAULT nextval('subjects_id_seq'::regclass),
  name character varying NOT NULL,
  code character varying,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT subjects_pkey PRIMARY KEY (id)
);
CREATE TABLE public.substitutions (
  id bigint NOT NULL DEFAULT nextval('substitutions_id_seq'::regclass),
  timetable_id bigint,
  original_teacher_id bigint,
  substitute_teacher_id bigint,
  substitution_date date NOT NULL,
  reason text,
  notified_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT substitutions_pkey PRIMARY KEY (id),
  CONSTRAINT substitutions_timetable_id_fkey FOREIGN KEY (timetable_id) REFERENCES public.timetables(id),
  CONSTRAINT substitutions_original_teacher_id_fkey FOREIGN KEY (original_teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT substitutions_substitute_teacher_id_fkey FOREIGN KEY (substitute_teacher_id) REFERENCES public.teachers(id)
);
CREATE TABLE public.teacher_class_subjects (
  id bigint NOT NULL DEFAULT nextval('teacher_class_subjects_id_seq'::regclass),
  teacher_id bigint NOT NULL,
  class_id bigint NOT NULL,
  subject_id bigint NOT NULL,
  academic_year_id bigint NOT NULL,
  is_primary boolean DEFAULT true,
  assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT teacher_class_subjects_pkey PRIMARY KEY (id),
  CONSTRAINT teacher_class_subjects_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id),
  CONSTRAINT teacher_class_subjects_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT teacher_class_subjects_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT teacher_class_subjects_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id)
);
CREATE TABLE public.teachers (
  id bigint NOT NULL DEFAULT nextval('teachers_id_seq'::regclass),
  user_id bigint NOT NULL UNIQUE,
  employee_code character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  department character varying,
  joining_date date,
  is_class_teacher boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT teachers_pkey PRIMARY KEY (id),
  CONSTRAINT teachers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.timetables (
  id bigint NOT NULL DEFAULT nextval('timetables_id_seq'::regclass),
  class_id bigint,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  period_number smallint NOT NULL,
  subject_id bigint,
  teacher_id bigint,
  start_time time without time zone,
  end_time time without time zone,
  room character varying,
  academic_year_id bigint,
  CONSTRAINT timetables_pkey PRIMARY KEY (id),
  CONSTRAINT timetables_class_id_fkey FOREIGN KEY (class_id) REFERENCES public.classes(id),
  CONSTRAINT timetables_subject_id_fkey FOREIGN KEY (subject_id) REFERENCES public.subjects(id),
  CONSTRAINT timetables_academic_year_id_fkey FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id),
  CONSTRAINT timetables_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES public.teachers(id)
);
CREATE TABLE public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  full_name character varying NOT NULL,
  email character varying UNIQUE,
  phone character varying NOT NULL UNIQUE,
  password text NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['admin'::character varying, 'teacher'::character varying, 'parent'::character varying, 'student'::character varying]::text[])),
  avatar_url text,
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);