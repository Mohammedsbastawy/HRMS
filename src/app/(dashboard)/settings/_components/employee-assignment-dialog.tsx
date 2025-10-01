
'use client';

import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import type { WorkSchedule, Employee } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface EmployeeAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  schedule: WorkSchedule;
  employees: Employee[];
}

const assignmentSchema = z.object({
  schedule_id: z.number(),
  employee_ids: z.array(z.number()).min(1, { message: 'يجب اختيار موظف واحد على الأقل.' }),
  effective_from: z.string().min(1, { message: 'تاريخ البدء مطلوب.' }),
  effective_to: z.string().optional(),
});

type AssignmentFormValues = z.infer<typeof assignmentSchema>;

export function EmployeeAssignmentDialog({ open, onOpenChange, onSuccess, schedule, employees }: EmployeeAssignmentDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: { schedule_id: schedule.id, employee_ids: [], effective_from: '', effective_to: '' },
  });
  
  const selectedEmployeeIds = watch('employee_ids');

  const onSubmit = async (data: AssignmentFormValues) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch('/api/employee-work-schedules/assign', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'فشل تسجيل الموظفين');
      }

      toast({ title: 'تم التسجيل بنجاح', description: 'تم تسكين الموظفين على الوردية.' });
      reset();
      onSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) reset();
      onOpenChange(isOpen);
    }}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>تسكين موظفين على وردية: {schedule.name}</DialogTitle>
            <DialogDescription>اختر الموظفين والفترة الزمنية لتطبيق هذه الوردية.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="effective_from">تبدأ من تاريخ</Label>
                    <Input id="effective_from" type="date" {...control.register('effective_from')} />
                    {errors.effective_from && <p className="text-sm text-destructive">{errors.effective_from.message}</p>}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="effective_to">تنتهي في تاريخ (اختياري)</Label>
                    <Input id="effective_to" type="date" {...control.register('effective_to')} />
                </div>
            </div>
            <div className="space-y-2">
              <Label>الموظفون</Label>
              <ScrollArea className="h-60 w-full rounded-md border p-4">
                {employees.map(employee => (
                  <div key={employee.id} className="flex items-center space-x-2 space-x-reverse mb-2">
                    <Checkbox
                      id={`emp-${employee.id}`}
                      checked={selectedEmployeeIds.includes(employee.id)}
                      onCheckedChange={(checked) => {
                        const currentIds = selectedEmployeeIds || [];
                        const newIds = checked
                          ? [...currentIds, employee.id]
                          : currentIds.filter(id => id !== employee.id);
                        setValue('employee_ids', newIds, { shouldValidate: true });
                      }}
                    />
                    <label htmlFor={`emp-${employee.id}`} className="text-sm font-medium leading-none">
                      {employee.full_name}
                    </label>
                  </div>
                ))}
              </ScrollArea>
              {errors.employee_ids && <p className="text-sm text-destructive">{errors.employee_ids.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'جاري التسكين...' : 'تسكين الموظفين'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
