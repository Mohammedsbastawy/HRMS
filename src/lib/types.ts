


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
  status?: 'Active' | 'Resigned' | 'Terminated';
  avatar?: string;
  department?: Partial<Department>; // For UI display
  jobTitle?: Partial<JobTitle>; // For UI display
};

export type User = {
  id: number;
  employee_id?: number | null;
  username: string;
  password_hash: string;
  role: 'Admin' | 'HR' | 'Manager' | 'Employee';
  account_status?: 'Active' | 'Inactive';
};

export type Document = {
  id: number;
  employee_id: number;
  file_path: string;
  type: 'Contract' | 'Identity' | 'Certificate' | 'CV';
  uploaded_at?: string;
};

export type Attendance = {
  id: number;
  employee_id: number;
  employeeName: string;
  employeeAvatar?: string | null;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'Present' | 'Absent' | 'On Leave' | 'Late';
};

export type LeaveRequest = {
  id: number;
  employee_id: number;
  leave_type: 'Annual' | 'Sick' | 'Maternity' | 'Unpaid';
  start_date: string;
  end_date: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: number | null;
  notes?: string | null;
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
  description?: string | null;
  department_id?: number | null;
  status?: 'Open' | 'Closed' | 'On-Hold';
  created_at?: string;
  department?: Partial<Department>; // For UI display
};

export type Applicant = {
  id: number;
  job_id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  cv_path?: string | null;
  stage?: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
  applied_at?: string;
notes?: string | null;
  avatar?: string; // For UI display
  job?: Partial<Job>; // For UI display
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
