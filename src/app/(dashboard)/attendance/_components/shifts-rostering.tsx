
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { ShiftFormDialog } from './shift-form-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import type { Shift, WorkSchedule } from '@/lib/types';
import { WorkSchedules } from '../../settings/_components/work-schedules';


function ShiftsCatalog() {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const { toast } = useToast();
    const router = useRouter();

    const fetchShifts = async () => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            if (!token) {
                router.push('/login');
                return;
            }
            const response = await fetch('/api/shifts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('فشل في جلب بيانات الورديات');
            const data = await response.json();
            setShifts(data.shifts);
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts();
    }, []);

    const handleAddClick = () => {
        setSelectedShift(null);
        setIsFormOpen(true);
    };

    const handleEditClick = (shift: Shift) => {
        setSelectedShift(shift);
        setIsFormOpen(true);
    };
    
    const handleDeleteClick = (shift: Shift) => {
        setSelectedShift(shift);
        setIsDeleteAlertOpen(true);
    };
    
    const handleFormSuccess = () => {
        setIsFormOpen(false);
        fetchShifts();
    };

    const confirmDelete = async () => {
        if (!selectedShift) return;
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`/api/shifts/${selectedShift.id}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('فشل حذف الوردية');
            toast({ title: 'تم الحذف' });
            fetchShifts();
        } catch (error: any) {
             toast({ variant: 'destructive', title: 'خطأ', description: error.message });
        } finally {
            setIsDeleteAlertOpen(false);
        }
    };

    const typeTranslations: { [key: string]: string } = {
        'fixed': 'ثابتة',
        'flex': 'مرنة',
        'night': 'ليلية',
        'split': 'مجزأة',
    };

    const formatTime = (timeStr: string | null | undefined) => {
      if (!timeStr) return '-';
      const [hours, minutes] = timeStr.split(':');
      return `${hours}:${minutes}`;
    }
    
    const getTimeDisplay = (shift: Shift) => {
        if (shift.type === 'fixed' || shift.type === 'night') {
            return `${formatTime(shift.start_time)} - ${formatTime(shift.end_time)}`;
        }
        if (shift.type === 'flex') {
            return `${shift.total_hours} ساعات`;
        }
        if (shift.type === 'split' && shift.periods && shift.periods.length > 0) {
            return shift.periods.map(p => `${formatTime(p.start_time)}-${formatTime(p.end_time)}`).join(' | ');
        }
        return '-';
    }


    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>كتالوج الورديات</CardTitle>
                            <CardDescription>إدارة الورديات (صباحي، مسائي، مرنة...) وتعيينها للموظفين.</CardDescription>
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
                                <TableHead>الاسم</TableHead>
                                <TableHead>النوع</TableHead>
                                <TableHead>الوقت / المدة</TableHead>
                                <TableHead>الراحة (د)</TableHead>
                                <TableHead>الحالة</TableHead>
                                <TableHead>إجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell>
                                </TableRow>
                            ) : shifts.length > 0 ? (
                                shifts.map((shift) => (
                                    <TableRow key={shift.id}>
                                        <TableCell className="font-medium">{shift.name}</TableCell>
                                        <TableCell>{typeTranslations[shift.type] || shift.type}</TableCell>
                                        <TableCell dir="ltr" className="text-right">{getTimeDisplay(shift)}</TableCell>
                                        <TableCell>{shift.break_minutes}</TableCell>
                                        <TableCell>
                                            <Badge variant={shift.active ? 'default' : 'secondary'}>
                                                {shift.active ? 'نشطة' : 'غير نشطة'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="flex justify-end gap-2">
                                            <Button variant="ghost" size="icon" onClick={() => handleEditClick(shift)}>
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteClick(shift)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">لا توجد ورديات معرفة. ابدأ بإضافة وردية جديدة.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <ShiftFormDialog
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                onSuccess={handleFormSuccess}
                shift={selectedShift}
            />

            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
                        <AlertDialogDescription>
                            سيتم حذف الوردية "{selectedShift?.name}" نهائيًا. لا يمكن التراجع عن هذا الإجراء.
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


export function ShiftsAndRostering() {
    return (
        <div className="space-y-8">
            <ShiftsCatalog />
            <WorkSchedules />
        </div>
    )
}
