
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { Shift } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface ShiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shift: Shift | null;
}

const shiftSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  code: z.string().optional(),
  type: z.enum(['fixed', 'flex', 'night', 'split']),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'صيغة الوقت غير صحيحة (HH:MM)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'صيغة الوقت غير صحيحة (HH:MM)'),
  break_minutes: z.coerce.number().int().min(0).default(0),
  grace_in: z.coerce.number().int().min(0).default(0),
  grace_out: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
});

type ShiftFormValues = z.infer<typeof shiftSchema>;

export function ShiftFormDialog({ open, onOpenChange, onSuccess, shift }: ShiftFormDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
    defaultValues: {
      name: '',
      type: 'fixed',
      start_time: '09:00',
      end_time: '17:00',
      break_minutes: 60,
      grace_in: 15,
      grace_out: 15,
      active: true,
    },
  });

  useEffect(() => {
    if (open) {
      if (shift) {
        reset({ ...shift, start_time: shift.start_time.substring(0,5), end_time: shift.end_time.substring(0,5) });
      } else {
        reset({
          name: '',
          code: '',
          type: 'fixed',
          start_time: '09:00',
          end_time: '17:00',
          break_minutes: 60,
          grace_in: 15,
          grace_out: 15,
          active: true,
        });
      }
    }
  }, [shift, open, reset]);

  const onSubmit = async (data: ShiftFormValues) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const url = shift ? `/api/shifts/${shift.id}` : '/api/shifts';
      const method = shift ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(shift ? 'فشل تحديث الوردية' : 'فشل إنشاء الوردية');

      toast({ title: 'تم الحفظ بنجاح' });
      onSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{shift ? 'تعديل وردية عمل' : 'إضافة وردية عمل جديدة'}</DialogTitle>
            <DialogDescription>
              عرف تفاصيل الوردية مثل الأوقات وفترات السماح والراحة.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">اسم الوردية</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="code">الرمز (اختياري)</Label>
                <Input id="code" {...register('code')} />
              </div>
            </div>
            <div className="space-y-2">
                <Label>نوع الوردية</Label>
                <Controller
                  name="type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">ثابتة</SelectItem>
                        <SelectItem value="flex">مرنة</SelectItem>
                        <SelectItem value="night">ليلية</SelectItem>
                        <SelectItem value="split">مجزأة</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="start_time">وقت البدء</Label>
                    <Input id="start_time" type="time" {...register('start_time')} />
                    {errors.start_time && <p className="text-sm text-destructive">{errors.start_time.message}</p>}
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="end_time">وقت الانتهاء</Label>
                    <Input id="end_time" type="time" {...register('end_time')} />
                    {errors.end_time && <p className="text-sm text-destructive">{errors.end_time.message}</p>}
                 </div>
            </div>
             <div className="grid grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="break_minutes">الراحة (دقائق)</Label>
                    <Input id="break_minutes" type="number" {...register('break_minutes')} />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="grace_in">سماح الحضور (دقائق)</Label>
                    <Input id="grace_in" type="number" {...register('grace_in')} />
                 </div>
                 <div className="space-y-2">
                    <Label htmlFor="grace_out">سماح الانصراف (دقائق)</Label>
                    <Input id="grace_out" type="number" {...register('grace_out')} />
                 </div>
            </div>
             <div className="flex items-center space-x-2 space-x-reverse pt-4">
                 <Controller name="active" control={control} render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="active">نشطة</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
