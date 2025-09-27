
'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CourseDetailsDialog } from './course-details-dialog';
import { useToast } from '@/components/ui/use-toast';
import type { TrainingCourse } from '@/lib/types';

interface CoursesTableProps {
  courses: TrainingCourse[];
  onEdit: (course: TrainingCourse) => void;
  onDeleteSuccess: () => void;
}

export function CoursesTable({ courses, onEdit, onDeleteSuccess }: CoursesTableProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const { toast } = useToast();

  const handleDeleteClick = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setIsDeleteAlertOpen(true);
  };

  const handleViewClick = (course: TrainingCourse) => {
    setSelectedCourse(course);
    setIsDetailsOpen(true);
  };
  
  const onDetailsUpdated = () => {
    // Re-fetch course data to update participant count
    onDeleteSuccess();
  };

  const confirmDelete = async () => {
    if (!selectedCourse) return;
    try {
      const response = await fetch(`/api/training-courses/${selectedCourse.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('فشل حذف الدورة');
      toast({ title: 'تم الحذف', description: `تم حذف دورة "${selectedCourse.title}".` });
      onDeleteSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsDeleteAlertOpen(false);
    }
  };
  
  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(price);
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-right">ID</TableHead>
            <TableHead className="text-right">عنوان الدورة</TableHead>
            <TableHead className="text-right">الجهة المقدمة</TableHead>
            <TableHead className="text-right">التواريخ</TableHead>
            <TableHead className="text-right">السعر</TableHead>
            <TableHead className="text-right">المشاركون</TableHead>
            <TableHead className="text-right">إجراءات</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.length > 0 ? (
            courses.map((course) => (
              <TableRow key={course.id}>
                <TableCell>{course.id}</TableCell>
                <TableCell className="font-medium">{course.title}</TableCell>
                <TableCell>{course.provider || '-'}</TableCell>
                <TableCell>
                    {course.start_date ? new Date(course.start_date).toLocaleDateString('ar-EG') : ''}
                    {course.end_date ? ` - ${new Date(course.end_date).toLocaleDateString('ar-EG')}` : ''}
                </TableCell>
                <TableCell>{formatPrice(course.price)}</TableCell>
                <TableCell>{course.participant_count || 0}</TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleViewClick(course)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEdit(course)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => handleDeleteClick(course)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                لا توجد دورات تدريبية لعرضها.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {selectedCourse && (
         <CourseDetailsDialog
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            course={selectedCourse}
            onUpdate={onDetailsUpdated}
        />
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد تمامًا؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف الدورة "{selectedCourse?.title}" نهائيًا. سيتم أيضًا حذف جميع سجلات تسجيل الموظفين في هذه الدورة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
