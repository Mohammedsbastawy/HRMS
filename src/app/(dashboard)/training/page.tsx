
'use client';

import { useState, useEffect } from 'react';
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
import type { TrainingRecord, Employee, PerformanceReview } from '@/lib/types';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function TrainingPage() {
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [performanceReviews, setPerformanceReviews] = useState<PerformanceReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
        setIsLoading(true);
        try {
            const response = await fetch('/api/training');
            if(!response.ok) throw new Error('فشل في جلب بيانات التدريب');
            const data = await response.json();
            setTrainingRecords(data.trainingRecords);
            setEmployees(data.employees);
            setPerformanceReviews(data.performanceReviews);
        } catch (error: any) {
            toast({
                variant: 'destructive',
                title: 'خطأ',
                description: error.message
            });
        } finally {
            setIsLoading(false);
        }
    }
    fetchData();
  }, [toast]);


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
            {isLoading ? (
                <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                    </TableCell>
                </TableRow>
            ) : trainingRecords.length > 0 ? (
                trainingRecords.map((record) => {
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
                })
            ) : (
                 <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                        لا توجد سجلات تدريب لعرضها.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
