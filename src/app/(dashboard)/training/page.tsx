
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrainingAnalysis } from '@/components/dashboard/training-analysis';
import db from '@/lib/db';
import type { TrainingRecord, Employee, PerformanceReview } from '@/lib/types';


export default function TrainingPage() {
  const trainingRecords: any[] = (() => {
    try {
        return db.prepare(`
            SELECT tr.*, e.full_name as employeeName, tc.title as courseTitle
            FROM training_records tr
            JOIN employees e ON tr.employee_id = e.id
            JOIN training_courses tc ON tr.course_id = tc.id
        `).all();
    } catch(e) {
        return [];
    }
  })();
  
  const employees: Employee[] = (() => {
    try {
        return db.prepare('SELECT * FROM employees').all() as Employee[];
    } catch(e) {
        return [];
    }
  })();
  
  const performanceReviews: PerformanceReview[] = (() => {
    try {
        return db.prepare('SELECT * FROM performance_reviews').all() as PerformanceReview[];
    } catch(e) {
        return [];
    }
  })();


  const getStatusVariant = (status: 'Enrolled' | 'In Progress' | 'Completed' | 'Failed') => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'In Progress':
        return 'secondary';
      default:
        return 'outline';
    }
  };
  
  const getStatusText = (status: 'Enrolled' | 'In Progress' | 'Completed' | 'Failed') => {
    switch (status) {
      case 'Completed':
        return 'مكتمل';
      case 'In Progress':
        return 'قيد التنفيذ';
      case 'Enrolled':
        return 'مسجل';
      case 'Failed':
        return 'فشل';
    }
  };
  
  const getOutcomeVariant = (outcome: string | null) => {
    // This is just an example. You can define your own logic.
    if (!outcome) return 'outline';
    const score = parseFloat(outcome);
    if (score > 85) return 'default';
    if (score > 60) return 'secondary';
    return 'destructive';
  };
  

  return (
    <Card>
      <CardHeader>
        <CardTitle>سجلات التدريب</CardTitle>
        <CardDescription>تتبع حالة التدريب ونتائج الموظفين.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">الموظف</TableHead>
              <TableHead className="text-right">الدورة التدريبية</TableHead>
              <TableHead className="text-right">الحالة</TableHead>
              <TableHead className="text-right">النتيجة</TableHead>
              <TableHead className="text-right">تحليل الذكاء الاصطناعي</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainingRecords.map((record) => {
              const employee = employees.find(e => e.id === record.employee_id);
              const review = performanceReviews.find(r => r.employee_id === record.employee_id);
              if (!employee) return null;

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.employeeName}</TableCell>
                  <TableCell>{record.courseTitle}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(record.status)}>{getStatusText(record.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    {record.result && <Badge variant={getOutcomeVariant(record.result)}>{record.result}</Badge>}
                  </TableCell>
                  <TableCell>
                    <TrainingAnalysis 
                      record={record} 
                      employee={employee}
                      performanceReviewComments={review?.comments || ''}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
