
'use client';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { TrainingCourse, Employee } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AssignEmployeesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  courses: TrainingCourse[];
  employees: Employee[];
}

const assignSchema = z.object({
  course_id: z.string().min(1, { message: 'يجب اختيار دورة تدريبية.' }),
  employee_ids: z.array(z.number()).min(1, { message: 'يجب اختيار موظف واحد على الأقل.' }),
});

type AssignFormValues = z.infer<typeof assignSchema>;

export function AssignEmployeesDialog({ open, onOpenChange, onSuccess, courses, employees }: AssignEmployeesDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { isSubmitting, errors },
  } = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { course_id: '', employee_ids: [] },
  });
  
  const selectedEmployeeIds = watch('employee_ids');

  const onSubmit = async (data: AssignFormValues) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const response = await fetch('/api/training-records', {
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

      toast({ title: 'تم التسجيل بنجاح', description: 'تم تسجيل الموظفين في الدورة.' });
      reset();
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
            <DialogTitle>تسجيل موظفين في دورة تدريبية</DialogTitle>
            <DialogDescription>اختر الدورة والموظفين الذين سيتم تسجيلهم.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>الدورة التدريبية</Label>
              <Controller
                name="course_id"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="اختر دورة..." /></SelectTrigger>
                    <SelectContent>
                      {courses.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.course_id && <p className="text-sm text-destructive">{errors.course_id.message}</p>}
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
                        const currentIds = selectedEmployeeIds;
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
              {isSubmitting ? 'جاري التسجيل...' : 'تسجيل الموظفين'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
