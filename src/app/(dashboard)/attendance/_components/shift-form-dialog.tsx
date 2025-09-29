
'use client';

import { useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
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
import { Loader2, PlusCircle, Trash2 } from 'lucide-react';
import type { Shift, ShiftPeriod } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { TimePicker } from '@/components/ui/time-picker';

interface ShiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  shift: Shift | null;
}

const shiftPeriodSchema = z.object({
  id: z.number().optional(),
  start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'صيغة الوقت غير صحيحة (HH:MM)'),
  end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'صيغة الوقت غير صحيحة (HH:MM)'),
});

const shiftSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  code: z.string().optional(),
  type: z.enum(['fixed', 'flex', 'night', 'split']),
  start_time: z.string().optional().nullable(),
  end_time: z.string().optional().nullable(),
  total_hours: z.coerce.number().optional().nullable(),
  break_minutes: z.coerce.number().int().min(0).default(0),
  grace_in: z.coerce.number().int().min(0).default(0),
  grace_out: z.coerce.number().int().min(0).default(0),
  active: z.boolean().default(true),
  periods: z.array(shiftPeriodSchema).optional(),
}).refine(data => {
    if (data.type === 'flex') return data.total_hours !== null && data.total_hours > 0;
    if (data.type === 'fixed' || data.type === 'night') return !!data.start_time && !!data.end_time;
    if (data.type === 'split') return data.periods && data.periods.length > 0;
    return true;
}, {
    message: "يرجى ملء الحقول المطلوبة لنوع الوردية المختار",
    path: ['type'],
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ShiftFormValues>({
    resolver: zodResolver(shiftSchema),
  });

  const shiftType = watch('type');
  const { fields, append, remove } = useFieldArray({
    control,
    name: "periods"
  });

  useEffect(() => {
    if (open) {
      if (shift) {
        reset({ 
            ...shift, 
            start_time: shift.start_time ? shift.start_time.substring(0,5) : null, 
            end_time: shift.end_time ? shift.end_time.substring(0,5) : null,
            periods: shift.periods?.map(p => ({
                ...p,
                start_time: p.start_time.substring(0,5),
                end_time: p.end_time.substring(0,5),
            })) || []
        });
      } else {
        reset({
          name: '',
          code: '',
          type: 'fixed',
          start_time: '09:00',
          end_time: '17:00',
          total_hours: 8,
          break_minutes: 60,
          grace_in: 15,
          grace_out: 15,
          active: true,
          periods: [{ start_time: '09:00', end_time: '12:00' }, { start_time: '13:00', end_time: '18:00' }],
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
            
            {(shiftType === 'fixed' || shiftType === 'night') && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="start_time">وقت البدء</Label>
                        <Controller
                            name="start_time"
                            control={control}
                            render={({ field }) => <TimePicker value={field.value || '00:00'} onChange={field.onChange} />}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="end_time">وقت الانتهاء</Label>
                        <Controller
                            name="end_time"
                            control={control}
                            render={({ field }) => <TimePicker value={field.value || '00:00'} onChange={field.onChange} />}
                        />
                    </div>
                </div>
            )}
            
            {shiftType === 'flex' && (
                <div className="space-y-2">
                    <Label htmlFor="total_hours">إجمالي ساعات العمل المطلوبة</Label>
                    <Input id="total_hours" type="number" {...register('total_hours')} placeholder="مثال: 8" />
                </div>
            )}

            {shiftType === 'split' && (
                <div className="space-y-4 rounded-md border p-4">
                    <Label className="font-semibold">فترات العمل</Label>
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex items-end gap-2">
                             <div className="grid grid-cols-2 gap-2 flex-grow">
                                <div className="space-y-1">
                                    <Label htmlFor={`periods.${index}.start_time`} className="text-xs">من</Label>
                                    <Controller
                                        name={`periods.${index}.start_time`}
                                        control={control}
                                        render={({ field }) => <TimePicker value={field.value} onChange={field.onChange} />}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`periods.${index}.end_time`} className="text-xs">إلى</Label>
                                     <Controller
                                        name={`periods.${index}.end_time`}
                                        control={control}
                                        render={({ field }) => <TimePicker value={field.value} onChange={field.onChange} />}
                                    />
                                </div>
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4 text-destructive"/>
                            </Button>
                        </div>
                    ))}
                     <Button type="button" variant="outline" size="sm" onClick={() => append({ start_time: '00:00', end_time: '00:00' })}>
                        <PlusCircle className="ml-2 h-4 w-4" />
                        إضافة فترة
                    </Button>
                </div>
            )}

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
