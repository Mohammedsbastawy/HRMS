
'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Trash2 } from 'lucide-react';
import { TimePicker } from '@/components/ui/time-picker';
import type { WorkSchedule, WorkScheduleDay } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { Checkbox } from '@/components/ui/checkbox';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Textarea } from '@/components/ui/textarea';

interface WorkScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  schedule: WorkSchedule | null;
}

const WEEKDAYS = ['Sat', 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WEEKDAYS_AR = {
  Sat: 'السبت', Sun: 'الأحد', Mon: 'الاثنين', Tue: 'الثلاثاء', 
  Wed: 'الأربعاء', Thu: 'الخميس', Fri: 'الجمعة'
};


const daySchema = z.object({
    weekday: z.string(),
    enabled: z.boolean().default(true),
    start_time: z.string().nullable(),
    end_time: z.string().nullable(),
    break_start: z.string().nullable(),
    break_end: z.string().nullable(),
});

const scheduleSchema = z.object({
  name: z.string().min(1, 'الاسم مطلوب'),
  description: z.string().optional(),
  weekly_off_days: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  days: z.array(daySchema).length(7),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

export function WorkScheduleFormDialog({ open, onOpenChange, onSuccess, schedule }: WorkScheduleFormDialogProps) {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
  });

  const { control, register, handleSubmit, reset, watch, setValue } = form;
  const { fields } = useFieldArray({ control, name: "days" });

  useEffect(() => {
    if (open) {
      if (schedule) {
        reset({
            name: schedule.name,
            description: schedule.description || '',
            active: schedule.active,
            weekly_off_days: schedule.weekly_off_days ? JSON.parse(schedule.weekly_off_days) : [],
            days: WEEKDAYS.map(day => {
                const dayData = schedule.days?.find(d => d.weekday === day);
                return {
                    weekday: day,
                    enabled: dayData?.enabled ?? true,
                    start_time: dayData?.start_time ?? '09:00',
                    end_time: dayData?.end_time ?? '17:00',
                    break_start: dayData?.break_start ?? '13:00',
                    break_end: dayData?.break_end ?? '14:00',
                };
            })
        });
      } else {
        reset({
          name: '',
          description: '',
          active: true,
          weekly_off_days: ['Fri'],
          days: WEEKDAYS.map(day => ({
            weekday: day,
            enabled: day !== 'Fri',
            start_time: '09:00',
            end_time: '17:00',
            break_start: '13:00',
            break_end: '14:00',
          }))
        });
      }
    }
  }, [schedule, open, reset]);

  const onSubmit = async (data: ScheduleFormValues) => {
    const payload = {
        ...data,
        weekly_off_days: JSON.stringify(data.weekly_off_days)
    };

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const url = schedule ? `/api/work-schedules/${schedule.id}` : '/api/work-schedules';
      const method = schedule ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error(schedule ? 'فشل تحديث الجدول' : 'فشل إنشاء الجدول');

      toast({ title: 'تم الحفظ بنجاح' });
      onSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };

  const offDays = watch('weekly_off_days');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>{schedule ? 'تعديل جدول عمل' : 'إضافة جدول عمل جديد'}</DialogTitle>
            <DialogDescription>
              عرف تفاصيل جدول العمل وأيام الإجازة الأسبوعية وساعات العمل.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="name">اسم الجدول</Label>
                    <Input id="name" {...register('name')} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="description">الوصف (اختياري)</Label>
                    <Textarea id="description" {...register('description')} rows={1} />
                </div>
            </div>

            <div className="space-y-2">
                <Label>أيام الإجازة الأسبوعية</Label>
                <Controller
                    name="weekly_off_days"
                    control={control}
                    render={({ field }) => (
                         <ToggleGroup
                            type="multiple"
                            variant="outline"
                            value={field.value}
                            onValueChange={field.onChange}
                            className="justify-start flex-wrap"
                            >
                            {Object.entries(WEEKDAYS_AR).map(([key, value]) => (
                                <ToggleGroupItem key={key} value={key}>{value}</ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    )}
                />
            </div>

            <div className="space-y-4 pt-4">
                <Label className="font-semibold">ساعات العمل اليومية</Label>
                {fields.map((field, index) => {
                    const dayKey = field.weekday as keyof typeof WEEKDAYS_AR;
                    const isOff = offDays.includes(dayKey);
                    return (
                        <div key={field.id} className={`grid grid-cols-12 items-center gap-x-4 gap-y-2 p-2 rounded-md ${isOff ? 'bg-muted/50' : ''}`}>
                             <div className="col-span-2 flex items-center">
                                <Controller
                                    name={`days.${index}.enabled`}
                                    control={control}
                                    defaultValue={!isOff}
                                    render={({ field }) => (
                                        <Checkbox 
                                            id={`days.${index}.enabled`}
                                            checked={field.value && !isOff}
                                            onCheckedChange={field.onChange}
                                            disabled={isOff}
                                        />
                                    )}
                                />
                                <Label htmlFor={`days.${index}.enabled`} className="mr-2 font-medium">{WEEKDAYS_AR[dayKey]}</Label>
                            </div>

                            <div className="col-span-5 grid grid-cols-2 gap-2">
                                <Controller name={`days.${index}.start_time`} control={control} render={({ field }) => <TimePicker {...field} value={field.value || '00:00'} />} />
                                <Controller name={`days.${index}.end_time`} control={control} render={({ field }) => <TimePicker {...field} value={field.value || '00:00'} />} />
                            </div>

                            <div className="col-span-5 grid grid-cols-2 gap-2">
                                <Controller name={`days.${index}.break_start`} control={control} render={({ field }) => <TimePicker {...field} value={field.value || '00:00'} />} />
                                <Controller name={`days.${index}.break_end`} control={control} render={({ field }) => <TimePicker {...field} value={field.value || '00:00'} />} />
                            </div>
                        </div>
                    );
                })}
                 <div className="grid grid-cols-12 items-center gap-x-4 gap-y-2 px-2 text-xs text-muted-foreground">
                    <div className="col-span-2">اليوم</div>
                    <div className="col-span-5 grid grid-cols-2 gap-2"><div>وقت البدء</div><div>وقت الانتهاء</div></div>
                    <div className="col-span-5 grid grid-cols-2 gap-2"><div>بداية الراحة</div><div>نهاية الراحة</div></div>
                </div>
            </div>
            
             <div className="flex items-center space-x-2 space-x-reverse pt-4">
                 <Controller name="active" control={control} render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="active">نشط</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              حفظ
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
