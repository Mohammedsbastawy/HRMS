






// Base types derived from the SQLite schema

export type Department = {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string | null;
  code?: string | null;
  phone?: string | null;
  email?: string | null;
  manager_id?: number | null;
  budget?: number | null;
  headcount?: number;
  parent_department_id?: number | null;
  created_at?: string;
  updated_at?: string;
  location_id?: number | null; 
};

export type JobTitle = {
  id: number;
  department_id: number;
  title_ar: string;
  title_en: string;
  created_at?: string;
  updated_at?: string;
};

export type Employee = {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  address?: string | null;
  marital_status?: string | null;
  national_id?: string | null;
  department_id?: number | null;
  job_title_id?: number | null;
  location_id?: number | null;
  contract_type?: string | null; // Full-time / Part-time / Temporary / Intern
  hire_date?: string | null;
  manager_id?: number | null;
  base_salary?: number | null;
  allowances?: number | null;
  bank_account_number?: string | null;
  tax_number?: string | null;
  social_insurance_number?: string | null;
  status?: 'Active' | 'Resigned' | 'Terminated' | 'PendingOnboarding';
  avatar?: string;
  department?: Partial<Department>; // For UI display
  jobTitle?: Partial<JobTitle>; // For UI display
  manager?: Partial<Employee>; // For UI display
};

export type User = {
  id: number;
  employee_id?: number | null;
  username: string;
  password_hash: string;
  role: 'Admin' | 'HR' | 'Manager' | 'Employee';
  account_status?: 'Active' | 'Inactive';
};

export type Attendance = {
  id: string;
  employee_id: number;
  employee_name?: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'Present' | 'Absent' | 'On Leave' | 'Late';
  source?: string;
  late_minutes?: number;
  early_leave_minutes?: number;
  overtime_minutes?: number;
  notes?: string;
};

export type LeaveRequest = {
  id: number;
  employee_id: number;
  leave_type: 'Annual' | 'Sick' | 'Maternity' | 'Unpaid' | 'Permission';
  start_date: string;
  end_date: string;
  part_day: 'none' | 'first_half' | 'second_half' | 'hours';
  hours_count?: number | null;
  days_count?: number | null;
  reason?: string | null;
  notes?: string | null;
  status: 'Pending' | 'Approved' | 'Rejected' | 'PendingManager' | 'ManagerApproved' | 'HRApproved';
  approved_by?: number | null;
  employee: Partial<Employee>; // For UI display
};

export type Payroll = {
  id: number;
  employee_id: number;
  month: number;
  year: number;
  base_salary: number;
  overtime?: number | null;
  deductions?: number | null;
  tax?: number | null;
  insurance?: number | null;
  net_salary: number;
  generated_at?: string;
  status?: string;
  employee?: Partial<Employee>; // For UI display
};

export type PerformanceReview = {
  id: number;
  employee_id: number;
  review_date: string;
  score: number;
  reviewer_id?: number | null;
  comments?: string | null;
  employee?: Partial<Employee>; // For UI display
};

export type Job = {
  id: number;
  title: string;
  dept_id: number;
  description?: string | null;
  location?: string | null;
  employment_type: 'full-time' | 'part-time' | 'contract' | 'intern' | 'temporary';
  seniority?: 'junior' | 'mid' | 'senior' | 'lead' | 'manager' | 'director' | null;
  openings: number;
  hires_count: number;
  salary_min?: number | null;
  salary_max?: number | null;
  currency: string;
  remote_allowed: boolean;
  status: 'Open' | 'On-Hold' | 'Closed';
  created_at: string;
  department?: { name_ar: string }; // For UI
  applicants_count?: number; // For UI
  close_reason?: string;
};


export type Applicant = {
  id: number;
  job_id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  source: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  cv_path?: string | null;
  rating?: number;
  notes?: string | null;
  created_at: string;
  avatar?: string;
  job?: Partial<Job>;
  linkedin_url?: string | null;
  portfolio_url?: string | null;
  years_experience?: number | null;
  current_title?: string | null;
  current_company?: string | null;
  expected_salary?: number | null;
};

export type TrainingCourse = {
  id: number;
  title: string;
  provider?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  description?: string | null;
  price?: number | null;
  participant_count?: number; // Added for UI
};

export type TrainingRecord = {
  id: number;
  employee_id: number;
  course_id: number;
  status?: 'Enrolled' | 'In Progress' | 'Completed' | 'Failed';
  result?: string | null;
  employee?: Partial<Employee & { department?: Partial<Department> }>;
  course?: Partial<TrainingCourse>;
};

export type SystemSettings = {
  key: string;
  value: string;
};

export type AuditLog = {
  id: number;
  user_id?: number | null;
  action: string;
  details?: string | null;
  timestamp: string;
  username?: string;
};

export type Location = {
  id: number;
  code?: string | null;
  name_ar: string;
  name_en: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  manager_id?: number | null;
  created_at?: string;
  updated_at?: string;
  manager?: Partial<Employee>; // for UI display
};

export type DisciplinaryAction = {
  id: number;
  employee_id: number;
  employee_name?: string;
  title: string;
  description?: string;
  type: 'warning' | 'deduction' | 'suspension';
  severity: 'low' | 'medium' | 'high';
  status: 'Draft' | 'PendingApproval' | 'Approved' | 'Applied' | 'Rejected' | 'Reversed';
  issue_date: string;
};

export type PayrollComponent = {
  id: number;
  code: string;
  name: string;
  component_type: 'earning' | 'deduction' | 'benefit' | 'insurance';
  calculation_type: 'fixed' | 'percent' | 'slab' | 'formula';
  value?: number | null;
  rate?: number | null;
  base?: 'base' | 'gross' | 'custom';
  taxable: boolean;
  pre_tax: boolean;
  active: boolean;
};

export type TaxBracket = {
  id?: number;
  min_amount: number;
  max_amount: number | null;
  rate: number;
};

export type TaxScheme = {
  id: number;
  name: string;
  method: 'slab' | 'flat';
  active: boolean;
  brackets?: TaxBracket[];
};

export type DocumentType = {
  id: number;
  code: string;
  title_ar: string;
  title_en: string;
  description?: string | null;
  category: 'basic' | 'additional';
  default_required: boolean;
  requires_expiry: boolean;
  allowed_mime?: string | null;
  max_size_mb: number;
  active: boolean;
};

export type EmployeeDocument = {
  id: number;
  employee_id: number;
  doc_type_id: number;
  file_path: string;
  file_name: string;
  mime_type: string;
  expiry_date?: string | null;
  status: 'Uploaded' | 'Verified' | 'Rejected' | 'Expired';
  note?: string | null;
};

export type ZktDevice = {
    id: number;
    name: string;
    ip_address: string;
    location_id?: number | null;
    location_name?: string;
    last_sync_at?: string | null;
    status: 'online' | 'offline' | 'error';
};

export type EmployeeWithCompliance = Employee & {
  compliance_percent: number;
  missing_docs_count: number;
  expiring_docs_count: number;
  last_updated: string;
};

export type ShiftPeriod = {
    id?: number;
    start_time: string;
    end_time: string;
}

export type Shift = {
    id: number;
    name: string;
    code?: string | null;
    type: 'fixed' | 'flex' | 'night' | 'split';
    start_time?: string | null;
    end_time?: string | null;
    total_hours?: number | null;
    break_minutes: number;
    grace_in: number;
    grace_out: number;
    active: boolean;
    periods?: ShiftPeriod[];
};

export type WorkScheduleDay = {
    id?: number;
    weekday: string;
    enabled: boolean;
    start_time: string | null;
    end_time: string | null;
    break_start: string | null;
    break_end: string | null;
};

export type WorkSchedule = {
    id: number;
    name: string;
    description: string | null;
    weekly_off_days: string; // JSON array of weekdays
    active: boolean;
    created_at?: string;
    days?: WorkScheduleDay[];
    assigned_employees_count?: number;
};

export type OnboardingRecord = {
    id: number;
    employee_id: number;
    status: 'Draft' | 'InProgress' | 'Completed' | 'Cancelled';
};

export type EmployeeEvent = {
    id: number;
    employee_id: number;
    event: string;
};

export type EmployeeWorkSchedule = {
    id: number;
    employee_id: number;
    schedule_id: number;
    effective_from: string;
    effective_to?: string | null;
};
