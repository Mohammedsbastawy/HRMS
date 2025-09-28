
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { TrainingCourse, TrainingRecord } from '@/lib/types';
import { UpdateParticipantDialog } from './update-participant-dialog';
import { useRouter } from 'next/navigation';

interface CourseDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: TrainingCourse;
  onUpdate: () => void;
}

export function CourseDetailsDialog({ open, onOpenChange, course, onUpdate }: CourseDetailsDialogProps) {
  const [participants, setParticipants] = useState<TrainingRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  const [isUpdateParticipantOpen, setUpdateParticipantOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TrainingRecord | null>(null);

  const fetchParticipants = async () => {
    if (!course) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`/api/training-records?course_id=${course.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.status === 401) {
        toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.' });
        router.push('/login');
        return;
      }
      if (!response.ok) throw new Error('فشل في جلب المشاركين');
      const data = await response.json();
      setParticipants(data.records);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && course.id) {
      fetchParticipants();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course, open]);
  
  const handleEditClick = (record: TrainingRecord) => {
    setSelectedRecord(record);
    setUpdateParticipantOpen(true);
  }

  const handleUpdateSuccess = () => {
    fetchParticipants(); // Refresh participant list
    onUpdate(); // Refresh main courses table
    setUpdateParticipantOpen(false);
  }
  
  const handleDeleteParticipant = async (recordId: number) => {
     try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`/api/training-records/${recordId}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` } 
      });
      if (!response.ok) throw new Error('فشل حذف المشارك');
      toast({ title: 'تم الحذف' });
      fetchParticipants();
      onUpdate();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  }

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'Completed': return 'default';
      case 'In Progress': return 'secondary';
      case 'Failed': return 'destructive';
      case 'Enrolled': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'Completed': return 'مكتمل';
      case 'In Progress': return 'قيد التنفيذ';
      case 'Failed': return 'فشل';
      case 'Enrolled': return 'مسجل';
      default: return status || '-';
    }
  };


  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{course.title}</DialogTitle>
            <DialogDescription>
              <div>
                <span>{course.provider}</span>
                <span className="mx-2">|</span>
                <span>{course.start_date ? new Date(course.start_date).toLocaleDateString('ar-EG') : ''} - {course.end_date ? new Date(course.end_date).toLocaleDateString('ar-EG') : ''}</span>
                {course.price && (
                    <>
                        <span className="mx-2">|</span>
                        <span>التكلفة: {new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(course.price)}</span>
                    </>
                )}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{course.description}</p>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <h3 className="mb-2 font-semibold">المشاركون ({participants.length})</h3>
            {isLoading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الموظف</TableHead>
                    <TableHead className="text-right">القسم</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">النتيجة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.length > 0 ? (
                    participants.map(p => (
                      <TableRow key={p.id}>
                        <TableCell>{p.employee?.full_name}</TableCell>
                        <TableCell>{p.employee?.department?.name_ar || '-'}</TableCell>
                        <TableCell><Badge variant={getStatusVariant(p.status)}>{getStatusText(p.status)}</Badge></TableCell>
                        <TableCell>{p.result || '-'}</TableCell>
                        <TableCell className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(p)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteParticipant(p.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={5} className="h-24 text-center">لا يوجد مشاركون في هذه الدورة.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => onOpenChange(false)}>إغلاق</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {selectedRecord && (
        <UpdateParticipantDialog
            open={isUpdateParticipantOpen}
            onOpenChange={setUpdateParticipantOpen}
            onSuccess={handleUpdateSuccess}
            record={selectedRecord}
        />
      )}
    </>
  );
}
