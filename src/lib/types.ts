export type Employee = {
  id: string;
  name: string;
  avatar: string;
  email: string;
  jobTitle: string;
  department: 'Engineering' | 'HR' | 'Marketing' | 'Sales' | 'Finance';
  status: 'Active' | 'On Leave' | 'Terminated';
  hireDate: string;
  salary: number;
  performanceReviewScore: number;
};

export type Attendance = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  workedHours: number;
};

export type LeaveRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  leaveType: 'Annual' | 'Sick' | 'Unpaid' | 'Maternity';
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
};

export type Payroll = {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  baseSalary: number;
  bonus: number;
  deductions: number;
  netSalary: number;
};

export type PerformanceReview = {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewDate: string;
  score: number;
  comments: string;
};

export type Applicant = {
  id: string;
  name: string;
  avatar: string;
  jobTitle: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected';
};

export type TrainingCourse = {
  id: string;
  title: string;
  description: string;
  duration: number; // in hours
};

export type TrainingRecord = {
  id: string;
  employeeId: string;
  employeeName: string;
  courseId: string;
  courseTitle: string;
  enrollmentDate: string;
  status: 'Completed' | 'In Progress' | 'Not Started';
  outcome: 'Exceeded Expectations' | 'Met Expectations' | 'Did Not Meet Expectations' | 'N/A';
};

export type AuditLog = {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details: string;
};
