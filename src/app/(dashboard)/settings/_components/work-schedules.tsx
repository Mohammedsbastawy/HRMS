
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
import { Loader2, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { WorkSchedule } from '@/lib/types';
import { WorkScheduleFormDialog } from './work-schedule-form';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

export function WorkSchedules() {
  const [schedules, setSchedules] = useState<WorkSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WorkSchedule | null>(null);

  const fetchSchedules = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch('/api/work-schedules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية' });
        router.push('/login');
        return;
      }
      if (!response.ok) throw new Error('فشل في جلب جداول العمل');
      const data = await response.json();
      setSchedules(data || []);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  const handleAddClick = () => {
    setSelectedSchedule(null);
    setIsFormOpen(true);
  };
  
  const handleEditClick = async (schedule: WorkSchedule) => {
    // Fetch full schedule with days
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

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    fetchSchedules();
  };
  
  const confirmDelete = async () => {
    if (!selectedSchedule) return;
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`/api/work-schedules/${selectedSchedule.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('فشل حذف جدول العمل');
        toast({ title: 'تم الحذف بنجاح' });
        fetchSchedules();
    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
        setIsDeleteAlertOpen(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>إدارة جداول العمل</CardTitle>
              <CardDescription>
                تعريف وتخصيص ساعات العمل الرسمية والإجازات الأسبوعية.
              </CardDescription>
            </div>
            <Button size="sm" onClick={handleAddClick}>
              <PlusCircle className="ml-2 h-4 w-4" />
              إضافة جدول عمل
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>الاسم</TableHead>
                <TableHead>الإجازة الأسبوعية</TableHead>
                <TableHead>الحالة</TableHead>
                <TableHead>إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : schedules.length > 0 ? (
                schedules.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>{s.weekly_off_days ? JSON.parse(s.weekly_off_days).join(', ') : '-'}</TableCell>
                    <TableCell>
                      <Badge variant={s.active ? 'default' : 'secondary'}>
                        {s.active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </TableCell>
                    <TableCell className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(s)}>
                            <Edit className="h-4 w-4" />
                        </Button>
                         <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(s)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    لا توجد جداول عمل. ابدأ بإضافة جدول جديد.
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
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
                سيتم حذف جدول العمل "{selectedSchedule?.name}". لا يمكن التراجع عن هذا الإجراء.
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
