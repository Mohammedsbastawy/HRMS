import type { Employee, Attendance, LeaveRequest, Payroll, PerformanceReview, Applicant, TrainingCourse, TrainingRecord, AuditLog, Job, Department, JobTitle } from './types';

export const departments: Department[] = [
  { id: '1', name: 'الهندسة', description: 'مسؤول عن تطوير وصيانة المنتجات التقنية.' },
  { id: '2', name: 'الموارد البشرية', description: 'إدارة شؤون الموظفين والتوظيف والتدريب.' },
  { id: '3', name: 'التسويق', description: 'مسؤول عن الحملات التسويقية والترويج للعلامة التجارية.' },
  { id: '4', name: 'المبيعات', description: 'مسؤول عن تحقيق أهداف المبيعات وإدارة علاقات العملاء.' },
  { id: '5', name: 'المالية', description: 'إدارة الشؤون المالية والميزانيات والتقارير المالية.' },
];

export const jobTitles: JobTitle[] = [
  // الهندسة
  { id: 'jt1', departmentId: '1', title: 'مهندس برمجيات' },
  { id: 'jt2', departmentId: '1', title: 'قائد فريق تقني' },
  { id: 'jt3', departmentId: '1', title: 'مهندس DevOps' },
  // الموارد البشرية
  { id: 'jt4', departmentId: '2', title: 'أخصائي موارد بشرية' },
  { id: 'jt5', departmentId: '2', title: 'مدير موارد بشرية' },
  { id: 'jt6', departmentId: '2', title: 'مسؤول توظيف' },
  // التسويق
  { id: 'jt7', departmentId: '3', title: 'مسوق رقمي' },
  { id: 'jt8', departmentId: '3', title: 'مدير تسويق' },
  // المبيعات
  { id: 'jt9', departmentId: '4', title: 'مندوب مبيعات' },
  { id: 'jt10', departmentId: '4', title: 'مدير مبيعات' },
  // المالية
  { id: 'jt11', departmentId: '5', title: 'محاسب' },
  { id: 'jt12', departmentId: '5', title: 'محلل مالي' },
];

export const employees: Employee[] = [
  { id: '1', name: 'نورة عبدالله', avatar: 'https://picsum.photos/seed/avatar1/100/100', email: 'noura.a@example.com', jobTitle: 'مهندسة برمجيات', department: 'الهندسة', status: 'Active', hireDate: '2022-01-15', salary: 90000, performanceReviewScore: 4.5 },
  { id: '2', name: 'أحمد خان', avatar: 'https://picsum.photos/seed/avatar2/100/100', email: 'ahmed.k@example.com', jobTitle: 'مدير الموارد البشرية', department: 'الموارد البشرية', status: 'Active', hireDate: '2021-03-20', salary: 110000, performanceReviewScore: 4.8 },
  { id: '3', name: 'فاطمة محمد', avatar: 'https://picsum.photos/seed/avatar3/100/100', email: 'fatima.m@example.com', jobTitle: 'مسوقة رقمية', department: 'التسويق', status: 'On Leave', hireDate: '2022-07-01', salary: 75000, performanceReviewScore: 4.2 },
  { id: '4', name: 'علي حسن', avatar: 'https://picsum.photos/seed/avatar4/100/100', email: 'ali.h@example.com', jobTitle: 'مدير مبيعات', department: 'المبيعات', status: 'Active', hireDate: '2020-11-10', salary: 130000, performanceReviewScore: 4.9 },
  { id: '5', name: 'سارة إبراهيم', avatar: 'https://picsum.photos/seed/avatar5/100/100', email: 'sara.i@example.com', jobTitle: 'محللة مالية', department: 'المالية', status: 'Terminated', hireDate: '2021-09-05', salary: 95000, performanceReviewScore: 3.8 },
];

export const attendance: Attendance[] = [
  { id: 'att1', employeeId: '1', employeeName: 'نورة عبدالله', employeeAvatar: 'https://picsum.photos/seed/avatar1/100/100', date: '2024-07-28', checkIn: '09:05', checkOut: '17:30', workedHours: 8.42 },
  { id: 'att2', employeeId: '2', employeeName: 'أحمد خان', employeeAvatar: 'https://picsum.photos/seed/avatar2/100/100', date: '2024-07-28', checkIn: '08:58', checkOut: '18:02', workedHours: 9.07 },
  { id: 'att3', employeeId: '4', employeeName: 'علي حسن', employeeAvatar: 'https://picsum.photos/seed/avatar4/100/100', date: '2024-07-28', checkIn: '09:15', checkOut: '17:00', workedHours: 7.75 },
  { id: 'att4', employeeId: '3', employeeName: 'فاطمة محمد', employeeAvatar: 'https://picsum.photos/seed/avatar3/100/100', date: '2024-07-28', checkIn: null, checkOut: null, workedHours: 0 },
];

export const leaveRequests: LeaveRequest[] = [
  { id: 'lr1', employeeId: '3', employeeName: 'فاطمة محمد', employeeAvatar: 'https://picsum.photos/seed/avatar3/100/100', leaveType: 'Maternity', startDate: '2024-07-01', endDate: '2024-09-30', status: 'Approved' },
  { id: 'lr2', employeeId: '1', employeeName: 'نورة عبدالله', employeeAvatar: 'https://picsum.photos/seed/avatar1/100/100', leaveType: 'Annual', startDate: '2024-08-05', endDate: '2024-08-09', status: 'Pending' },
  { id: 'lr3', employeeId: '4', employeeName: 'علي حسن', employeeAvatar: 'https://picsum.photos/seed/avatar4/100/100', leaveType: 'Sick', startDate: '2024-07-22', endDate: '2024-07-22', status: 'Approved' },
  { id: 'lr4', employeeId: '2', employeeName: 'أحمد خان', employeeAvatar: 'https://picsum.photos/seed/avatar2/100/100', leaveType: 'Unpaid', startDate: '2024-09-01', endDate: '2024-09-05', status: 'Rejected' },
];

export const payrolls: Payroll[] = [
  { id: 'pay1', employeeId: '1', employeeName: 'نورة عبدالله', period: 'July 2024', baseSalary: 7500, bonus: 500, deductions: 200, netSalary: 7800 },
  { id: 'pay2', employeeId: '2', employeeName: 'أحمد خان', period: 'July 2024', baseSalary: 9167, bonus: 1000, deductions: 450, netSalary: 9717 },
  { id: 'pay3', employeeId: '4', employeeName: 'علي حسن', period: 'July 2024', baseSalary: 10833, bonus: 1200, deductions: 500, netSalary: 11533 },
];

export const performanceReviews: PerformanceReview[] = [
  { id: 'pr1', employeeId: '1', employeeName: 'نورة عبدالله', reviewDate: '2024-06-30', score: 4.5, comments: 'أداء ممتاز، تجاوزت التوقعات في مشروع "ألفا".' },
  { id: 'pr2', employeeId: '2', employeeName: 'أحمد خان', reviewDate: '2024-06-28', score: 4.8, comments: 'قيادة استثنائية وتأثير إيجابي كبير على الفريق.' },
  { id: 'pr3', employeeId: '4', employeeName: 'علي حسن', reviewDate: '2024-06-29', score: 4.9, comments: 'تحقيق أرقام مبيعات قياسية للربع الثاني.' },
  { id: 'pr4', employeeId: '3', employeeName: 'فاطمة محمد', reviewDate: '2024-06-15', score: 4.2, comments: 'مساهمات إبداعية في الحملات التسويقية الأخيرة.' },
];

export const jobs: Job[] = [
    { id: '1', title: 'مهندس برمجيات', department: 'الهندسة', status: 'Open', postedDate: '01-08-2024', description: '...'},
    { id: '2', title: 'أخصائي موارد بشرية', department: 'الموارد البشرية', status: 'Closed', postedDate: '15-07-2024', description: '...'},
    { id: '3', title: 'مصمم واجهات', department: 'الهندسة', status: 'On-Hold', postedDate: '20-08-2024', description: '...'},
]

export const applicants: Applicant[] = [
  { id: 'app1', name: 'خالد الغامدي', avatar: 'https://picsum.photos/seed/app1/100/100', jobTitle: 'مهندس برمجيات', stage: 'Interview' },
  { id: 'app2', name: 'مريم العتيبي', avatar: 'https://picsum.photos/seed/app2/100/100', jobTitle: 'مهندس برمجيات', stage: 'Applied' },
  { id: 'app3', name: 'يوسف المصري', avatar: 'https://picsum.photos/seed/app3/100/100', jobTitle: 'مصمم واجهات', stage: 'Offer' },
  { id: 'app4', name: 'زينب الشمري', avatar: 'https://picsum.photos/seed/app4/100/100', jobTitle: 'مهندس برمجيات', stage: 'Screening' },
  { id: 'app5', name: 'عبدالرحمن الشهري', avatar: 'https://picsum.photos/seed/app5/100/100', jobTitle: 'مصمم واجهات', stage: 'Hired' },
  { id: 'app6', name: 'هند القحطاني', avatar: 'https://picsum.photos/seed/app6/100/100', jobTitle: 'مهندس برمجيات', stage: 'Rejected' },
];

export const trainingCourses: TrainingCourse[] = [
  { id: 'tc1', title: 'Advanced JavaScript', description: 'Deep dive into modern JavaScript features.', duration: 40 },
  { id: 'tc2', title: 'Leadership & Management', description: 'Essential skills for new managers.', duration: 24 },
  { id: 'tc3', title: 'Digital Marketing Fundamentals', description: 'Introduction to SEO, SEM, and social media marketing.', duration: 30 },
];

export const trainingRecords: TrainingRecord[] = [
  { id: 'tr1', employeeId: '1', courseId: 'tc1', courseTitle: 'Advanced JavaScript', enrollmentDate: '2024-05-01', status: 'Completed', outcome: 'Exceeded Expectations' },
  { id: 'tr2', employeeId: '2', courseId: 'tc2', courseTitle: 'Leadership & Management', enrollmentDate: '2024-04-15', status: 'Completed', outcome: 'Met Expectations' },
  { id: 'tr3', employeeId: '3', courseId: 'tc3', courseTitle: 'Digital Marketing Fundamentals', enrollmentDate: '2024-06-01', status: 'In Progress', outcome: 'N/A' },
  { id: 'tr4', employeeId: '4', courseId: 'tc2', courseTitle: 'Leadership & Management', enrollmentDate: '2024-07-01', status: 'Not Started', outcome: 'N/A' },
];

export const auditLogs: AuditLog[] = [
  { id: 'log1', user: 'أحمد خان', action: 'Approved Leave Request', timestamp: '2024-07-28 10:15 AM', details: 'Approved leave for فاطمة محمد (ID: 3)' },
  { id: 'log2', user: 'system', action: 'Payroll Generated', timestamp: '2024-07-25 02:00 AM', details: 'Monthly payroll for July 2024' },
  { id: 'log3', user: 'أحمد خان', action: 'Updated Employee', timestamp: '2024-07-24 03:20 PM', details: 'Updated job title for نورة عبدالله (ID: 1)' },
  { id: 'log4', user: 'علي حسن', action: 'Added Applicant', timestamp: '2024-07-23 11:00 AM', details: 'Added new applicant خالد الغامدي' },
];
