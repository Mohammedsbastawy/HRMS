
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { DisciplinaryAction, Employee } from '@/lib/types';
import { NewActionDialog } from './_components/new-action-dialog';
import { useRouter } from 'next/navigation';

export default function DisciplinaryPage() {
  const [actions, setActions] = useState<DisciplinaryAction[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const fetchData = async () => {
    setIsLoading(true);
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }
        const [actionsRes, employeesRes] = await Promise.all([
            fetch('/api/disciplinary/actions', { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        if (!actionsRes.ok || !employeesRes.ok) {
            throw new Error('فشل في جلب البيانات');
        }

        const actionsData = await actionsRes.json();
        const employeesData = await employeesRes.json();
        setActions(actionsData.actions);
        setEmployees(employeesData.employees);
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'Approved':
      case 'Applied':
        return 'default';
      case 'Draft':
      case 'PendingApproval':
        return 'secondary';
      case 'Rejected':
      case 'Reversed':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusText = (status?: string) => {
    const translations: { [key: string]: string } = {
      Draft: 'مسودة',
      PendingApproval: 'بانتظار الموافقة',
      Approved: 'تمت الموافقة',
      Applied: 'مُطبق',
      Rejected: 'مرفوض',
      Reversed: 'تم التراجع',
    };
    return status ? translations[status] : '-';
  };

  const getSeverityVariant = (severity?: string) => {
     switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  }
   const getSeverityText = (severity?: string) => {
    const translations: { [key: string]: string } = {
      high: 'عالية',
      medium: 'متوسطة',
      low: 'منخفضة',
    };
    return severity ? translations[severity] : '-';
  };

  const getTypeTranslation = (type?: string) => {
    const translations: { [key: string]: string } = {
      'warning': 'إنذار',
      'deduction': 'خصم',
      'suspension': 'إيقاف عن العمل',
    };
    return type ? translations[type] : '-';
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>الإجراءات التأديبية</CardTitle>
              <CardDescription>
                تتبع وإدارة الإجراءات التأديبية والإنذارات للموظفين.
              </CardDescription>
            </div>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة إجراء يدوي
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الموظف</TableHead>
                <TableHead>نوع الإجراء</TableHead>
                <TableHead>الخطورة</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>تاريخ الإصدار</TableHead>
                <TableHead>الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : actions.length > 0 ? (
                actions.map((action) => (
                  <TableRow key={action.id}>
                    <TableCell className="font-medium">{action.employee_name}</TableCell>
                    <TableCell>{getTypeTranslation(action.type)}</TableCell>
                    <TableCell><Badge variant={getSeverityVariant(action.severity)}>{getSeverityText(action.severity)}</Badge></TableCell>
                    <TableCell><Badge variant={getStatusVariant(action.status)}>{getStatusText(action.status)}</Badge></TableCell>
                    <TableCell>{new Date(action.issue_date).toLocaleDateString('ar-EG')}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">
                        عرض
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    لا توجد إجراءات تأديبية مسجلة.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <NewActionDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        employees={employees}
        onSuccess={fetchData}
      />
    </>
  );
}
