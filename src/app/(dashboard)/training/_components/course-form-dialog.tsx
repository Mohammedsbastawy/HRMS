
'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { TrainingCourse } from '@/lib/types';

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  course: TrainingCourse | null;
}

const courseFormSchema = z.object({
  title: z.string().min(3, { message: 'العنوان مطلوب' }),
  provider: z.string().optional(),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export function CourseFormDialog({ open, onOpenChange, onSuccess, course }: CourseFormDialogProps) {
  const { toast } = useToast();
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      provider: '',
      description: '',
      start_date: '',
      end_date: '',
    },
  });

  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        provider: course.provider || '',
        description: course.description || '',
        start_date: course.start_date?.split('T')[0] || '',
        end_date: course.end_date?.split('T')[0] || '',
      });
    } else {
      reset({
        title: '', provider: '', description: '', start_date: '', end_date: '',
      });
    }
  }, [course, open, reset]);

  const onSubmit = async (data: CourseFormValues) => {
    try {
      const url = course ? `/api/training-courses/${course.id}` : '/api/training-courses';
      const method = course ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(course ? 'فشل تحديث الدورة' : 'فشل إنشاء الدورة');

      toast({
        title: course ? 'تم التحديث بنجاح' : 'تم الإنشاء بنجاح',
        description: `تم حفظ دورة "${data.title}".`,
      });
      onSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{course ? 'تعديل دورة تدريبية' : 'إضافة دورة تدريبية جديدة'}</DialogTitle>
            <DialogDescription>املأ تفاصيل الدورة التدريبية أدناه.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الدورة</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">الجهة المقدمة (اختياري)</Label>
              <Input id="provider" {...register('provider')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="start_date">تاريخ البدء</Label>
                    <Input id="start_date" type="date" {...register('start_date')} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="end_date">تاريخ الانتهاء</Label>
                    <Input id="end_date" type="date" {...register('end_date')} />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea id="description" {...register('description')} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'جاري الحفظ...' : '💾 حفظ الدورة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
