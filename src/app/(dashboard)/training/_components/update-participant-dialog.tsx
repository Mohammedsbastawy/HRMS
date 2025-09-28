
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { TrainingRecord } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface UpdateParticipantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  record: TrainingRecord;
}

const statusSchema = z.object({
  status: z.enum(['Enrolled', 'In Progress', 'Completed', 'Failed']),
  result: z.string().optional(),
});

type StatusFormValues = z.infer<typeof statusSchema>;

const statusOptions = ['Enrolled', 'In Progress', 'Completed', 'Failed'];
const statusTranslations: { [key: string]: string } = {
  Enrolled: 'مسجل',
  'In Progress': 'قيد التنفيذ',
  Completed: 'مكتمل',
  Failed: 'فشل',
};


export function UpdateParticipantDialog({ open, onOpenChange, onSuccess, record }: UpdateParticipantDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    register,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<StatusFormValues>({
    resolver: zodResolver(statusSchema),
  });

  useEffect(() => {
    if (record) {
      reset({
        status: record.status || 'Enrolled',
        result: record.result || '',
      });
    }
  }, [record, open, reset]);

  const onSubmit = async (data: StatusFormValues) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch(`/api/training-records/${record.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('فشل تحديث حالة المشارك');

      toast({ title: 'تم التحديث بنجاح' });
      onSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>تحديث حالة المشارك</DialogTitle>
            <DialogDescription>تحديث حالة ونتيجة {record.employee?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>الحالة</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger><SelectValue placeholder="اختر الحالة" /></SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(s => (
                        <SelectItem key={s} value={s}>{statusTranslations[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.status && <p className="text-sm text-destructive">{errors.status.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="result">النتيجة (اختياري)</Label>
              <Input id="result" {...register('result')} placeholder="مثال: 95% أو 'ممتاز'"/>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ التحديث
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
