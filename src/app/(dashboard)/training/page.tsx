import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { trainingRecords, employees, performanceReviews } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { TrainingAnalysis } from '@/components/dashboard/training-analysis';

export default function TrainingPage() {
  const getStatusVariant = (status: 'Completed' | 'In Progress' | 'Not Started') => {
    switch (status) {
      case 'Completed':
        return 'default';
      case 'In Progress':
        return 'secondary';
      case 'Not Started':
        return 'outline';
    }
  };
  
  const getStatusText = (status: 'Completed' | 'In Progress' | 'Not Started') => {
    switch (status) {
      case 'Completed':
        return 'مكتمل';
      case 'In Progress':
        return 'قيد التنفيذ';
      case 'Not Started':
        return 'لم يبدأ';
    }
  };
  
  const getOutcomeVariant = (outcome: 'Exceeded Expectations' | 'Met Expectations' | 'Did Not Meet Expectations' | 'N/A') => {
    switch (outcome) {
      case 'Exceeded Expectations':
        return 'default';
      case 'Met Expectations':
        return 'secondary';
      case 'Did Not Meet Expectations':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  const getOutcomeText = (outcome: 'Exceeded Expectations' | 'Met Expectations' | 'Did Not Meet Expectations' | 'N/A') => {
    switch (outcome) {
      case 'Exceeded Expectations':
        return 'تجاوز التوقعات';
      case 'Met Expectations':
        return 'حقق التوقعات';
      case 'Did Not Meet Expectations':
        return 'لم يحقق التوقعات';
      default:
        return 'N/A';
    }
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
              <TableHead>الموظف</TableHead>
              <TableHead>الدورة التدريبية</TableHead>
              <TableHead>الحالة</TableHead>
              <TableHead>النتيجة</TableHead>
              <TableHead>الإجراء</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {trainingRecords.map((record) => {
              const employee = employees.find(e => e.id === record.employeeId);
              const review = performanceReviews.find(r => r.employeeId === record.employeeId);
              if (!employee || !review) return null;

              return (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">{record.employeeName}</TableCell>
                  <TableCell>{record.courseTitle}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(record.status)}>{getStatusText(record.status)}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getOutcomeVariant(record.outcome)}>{getOutcomeText(record.outcome)}</Badge>
                  </TableCell>
                  <TableCell>
                    {record.status === 'Completed' && (
                       <TrainingAnalysis record={record} employee={employee} performanceReviewComments={review.comments} />
                    )}
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
