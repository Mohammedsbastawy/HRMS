
// Base types derived from the SQLite schema

export type Department = {
  id: number;
  name_ar: string;
  name_en: string;
  description?: string | null;
  code?: string | null;
  location?: string | null;
  phone?: string | null;
  email?: string | null;
  manager_id?: number | null;
  budget?: number | null;
  headcount?: number;
  parent_department_id?: number | null;
  created_at?: string;
  updated_at?: string;
  location_id?: number | null; // Added
};

export type JobTitle = {
  id: number;
  department_id: number;
  title_ar: string;
  title_en: string;
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
  location_id?: number | null; // Added
  contract_type?: string | null; // Full-time / Part-time / Temporary / Intern
  hire_date?: string | null;
  manager_id?: number | null;
  base_salary?: number | null;
  allowances?: number | null;
  bank_account_number?: string | null;
  tax_number?: string | null;
  social_insurance_number?: string | null;
  status?: 'Active' | 'Resigned' | 'Terminated';
  avatar?: string; // Not in schema, but useful for UI
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
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  hours_worked?: number | null;
  status?: 'Present' | 'Absent' | 'On Leave' | 'Late';
  employeeName?: string; // For UI display
  employeeAvatar?: string; // For UI display
  workedHours?: number; // For UI consistency
};

export type LeaveRequest = {
  id: number;
  employee_id: number;
  leave_type?: 'Annual' | 'Sick' | 'Maternity' | 'Unpaid';
  start_date?: string;
  end_date?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  approved_by?: number | null;
  notes?: string | null;
  employeeName?: string; // For UI display
  employeeAvatar?: string; // For UI display
};

export type Payroll = {
  id: number;
  employee_id: number;
  month: string;
  base_salary: number;
  overtime?: number;
  deductions?: number;
  tax?: number;
  insurance?: number;
  net_salary: number;
  generated_at?: string;
  employeeName?: string; // For UI display
  bonus?: number; // For UI consistency
  netSalary?: number; // For UI consistency
};

export type PerformanceReview = {
  id: number;
  employee_id: number;
  review_date: string;
  score: number;
  reviewer_id?: number | null;
  comments?: string | null;
  employeeName?: string; // For UI display
};

export type Job = {
  id: number;
  title: string;
  description?: string | null;
  dept_id?: number | null;
  status?: 'Open' | 'Closed' | 'On-Hold';
  created_at?: string;
  department?: string; // For UI display
  postedDate?: string; // For UI display
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
  jobTitle?: string; // For UI display
};

export type TrainingCourse = {
  id: number;
  title: string;
  provider?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

export type TrainingRecord = {
  id: number;
  employee_id: number;
  course_id: number;
  status?: 'Enrolled' | 'In Progress' | 'Completed' | 'Failed';
  result?: string | null;
  employeeName?: string; // For UI display
  courseTitle?: string; // For UI display
  outcome?: 'Exceeded Expectations' | 'Met Expectations' | 'Did Not Meet Expectations' | 'N/A'; // For UI
};

export type SystemSettings = {
  id: number;
  tax_rate?: number;
  insurance_rate?: number;
  other_deductions?: number;
  effective_from?: string;
};

export type AuditLog = {
  id: number;
  user_id?: number | null;
  action?: string | null;
  timestamp?: string;
  user?: string; // for UI display
  details?: string; // for UI display
};

export type Location = {
  id: number;
  code?: string | null;
  name: string;
  description?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  manager_id?: number | null;
  created_at?: string;
  updated_at?: string;
};
