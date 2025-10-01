
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { Loader2, PlusCircle, Edit, Trash2, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { Employee, WorkSchedule } from '@/lib/types';
import { WorkScheduleFormDialog } from './work-schedule-form';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { EmployeeAssignmentDialog } from './employee-assignment-dialog';


export function WorkSchedules() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const headers = { 'Authorization': `Bearer ${token}` };
      const [schedulesRes, employeesRes] = await Promise.all([
        fetch('/api/work-schedules', { headers }),
        fetch('/api/employees?status=Active', { headers })
      ]);
      
      if (schedulesRes.status === 401 || employeesRes.status === 401) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية' });
        router.push('/login');
        return;
      }
      if (!schedulesRes.ok) throw new Error('فشل في جلب جداول العمل');
      if (!employeesRes.ok) throw new Error('فشل في جلب الموظفين');

      const schedulesData = await schedulesRes.json();
      const employeesData = await employeesRes.json();
      setSchedules(schedulesData || []);
      setEmployees(employeesData.employees || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddClick = () => {
    setSelectedSchedule(null);
    setIsFormOpen(true);
  };
  
  const handleEditClick = async (schedule: WorkSchedule) => {
     const token = localStorage.getItem('authToken');
     const response = await fetch(`/api/work-schedules/${schedule.id}`, {
         headers: { 'Authorization': `Bearer ${token}` }
     });
     const fullSchedule = await response.json();
     setSelectedSchedule(fullSchedule);
     setIsFormOpen(true);
  };

  const handleDeleteClick = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteAlertOpen(true);
  };
  
  const handleAssignClick = (schedule: WorkSchedule) => {
    setSelectedSchedule(schedule);
    setIsAssignmentOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setIsAssignmentOpen(false);
    fetchData();
  };
  
  const confirmDelete = async () => {
    if (!selectedSchedule) return;
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/work-schedules/${selectedSchedule.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('فشل حذف الوردية');
        toast({ title: 'تم الحذف بنجاح' });
        fetchData();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
        setIsDeleteAlertOpen(false);
    }
  };

  const WEEKDAYS_AR: { [key: string]: string } = {
    Sat: 'السبت', Sun: 'الأحد', Mon: 'الاثنين', Tue: 'الثلاثاء', 
    Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة'
  };

  const formatOffDays = (daysJson: string) => {
    try {
      const days: string[] = JSON.parse(daysJson);
      return days.map(day => WEEKDAYS_AR[day] || day).join('، ');
    } catch (e) {
      return '-';
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>إدارة الورديات</CardTitle>
              <CardDescription>
                تعريف وتخصيص الورديات وساعات العمل الرسمية والإجازات الأسبوعية.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddClick}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة وردية
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">الإجازة الأسبوعية</TableHead>
                <TableHead className="text-right">الموظفون المسكنون</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : schedules.length > 0 ? (
                schedules.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{formatOffDays(s.weekly_off_days)}</TableCell>
                    <TableCell>{s.assigned_employees_count ?? 0}</TableCell>
                    <TableCell>
                      <Badge variant={s.active ? 'default' : 'secondary'}>
                        {s.active ? 'نشطة' : 'غير نشطة'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex justify-end gap-1">
                             <Button variant="outline" size="sm" onClick={() => handleAssignClick(s)}>
                                <Users className="ml-2 h-4 w-4" />
                                تسكين
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(s)}>
                                <Edit className="h-4 w-4" />
                            </Button>
                             <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(s)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    لا توجد ورديات معرفة. ابدأ بإضافة وردية جديدة.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <WorkScheduleFormDialog 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        schedule={selectedSchedule}
      />
      
      {selectedSchedule && (
        <EmployeeAssignmentDialog
          open={isAssignmentOpen}
          onOpenChange={setIsAssignmentOpen}
          onSuccess={handleFormSuccess}
          schedule={selectedSchedule}
          employees={employees}
        />
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
                سيتم حذف الوردية "{selectedSchedule?.name}". لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">حذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
