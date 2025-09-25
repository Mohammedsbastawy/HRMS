

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
  department?: Department; // For UI display
  jobTitle?: JobTitle; // For UI display
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
  employeeId: number;
  date: string;
  checkIn?: string;
  checkOut?: string;
  workedHours: number;
  employeeName: string;
  employeeAvatar: string;
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
  employee?: Employee; // For UI display
};

export type Payroll = {
  id: number;
  employeeId: number;
  month: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
  employeeName: string;
};

export type PerformanceReview = {
  id: number;
  employeeId: number;
  reviewDate: string;
  score: number;
  reviewer: string;
  comments: string;
  employeeName: string;
};

export type Job = {
  id: number;
  title: string;
  description?: string | null;
  department_id?: number | null;
  status?: 'Open' | 'Closed' | 'On-Hold';
  created_at?: string;
  department?: Department; // For UI display
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
  job?: Job; // For UI display
};

export type TrainingCourse = {
  id: number;
  title: string;
  provider: string;
  duration: number; // in hours
};

export type TrainingRecord = {
  id: number;
  employeeId: number;
  courseId: number;
  status: 'Completed' | 'In Progress' | 'Not Started';
  outcome: 'Exceeded Expectations' | 'Met Expectations' | 'Did Not Meet Expectations' | 'N/A';
  employeeName: string;
  courseTitle: string;
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
  timestamp: string;
  user: string;
  action: string;
  details: string;
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
  manager?: Employee; // for UI display
};

    
