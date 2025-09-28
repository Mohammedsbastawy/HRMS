
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
import type { PayrollComponent } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface ComponentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  component: PayrollComponent | null;
}

const componentSchema = z.object({
  code: z.string().min(1, 'الرمز مطلوب').max(10, 'الرمز طويل جدًا'),
  name: z.string().min(1, 'الاسم مطلوب'),
  component_type: z.enum(['earning', 'deduction', 'benefit', 'insurance']),
  calculation_type: z.enum(['fixed', 'percent', 'slab', 'formula']),
  value: z.coerce.number().optional().nullable(),
  rate: z.coerce.number().optional().nullable(),
  base: z.enum(['base', 'gross', 'custom']).optional(),
  taxable: z.boolean().default(true),
  pre_tax: z.boolean().default(false),
  active: z.boolean().default(true),
});

type ComponentFormValues = z.infer<typeof componentSchema>;

export function ComponentFormDialog({ open, onOpenChange, onSuccess, component }: ComponentFormDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ComponentFormValues>({
    resolver: zodResolver(componentSchema),
    defaultValues: {
      taxable: true,
      pre_tax: false,
      active: true,
    },
  });

  const calculationType = watch('calculation_type');

  useEffect(() => {
    if (open) {
      if (component) {
        reset({ ...component });
      } else {
        reset({
          code: '',
          name: '',
          component_type: 'earning',
          calculation_type: 'fixed',
          value: 0,
          rate: 0,
          base: 'base',
          taxable: true,
          pre_tax: false,
          active: true,
        });
      }
    }
  }, [component, open, reset]);

  const onSubmit = async (data: ComponentFormValues) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const url = component ? `/api/payroll-components/${component.id}` : '/api/payroll-components';
      const method = component ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(component ? 'فشل تحديث المكون' : 'فشل إنشاء المكون');

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
            <DialogTitle>{component ? 'تعديل مكون راتب' : 'إضافة مكون راتب جديد'}</DialogTitle>
            <DialogDescription>
              عرف مكونات الرواتب مثل البدلات، الخصومات، والمزايا.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">الرمز</Label>
                <Input id="code" {...register('code')} />
                {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>نوع المكون</Label>
                <Controller
                  name="component_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="earning">إيراد</SelectItem>
                        <SelectItem value="deduction">استقطاع</SelectItem>
                        <SelectItem value="benefit">ميزة</SelectItem>
                        <SelectItem value="insurance">تأمين</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label>طريقة الحساب</Label>
                <Controller
                  name="calculation_type"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fixed">مبلغ ثابت</SelectItem>
                        <SelectItem value="percent">نسبة مئوية</SelectItem>
                        <SelectItem value="slab" disabled>شريحة</SelectItem>
                        <SelectItem value="formula" disabled>صيغة</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>
            {calculationType === 'fixed' && (
              <div className="space-y-2">
                <Label htmlFor="value">القيمة الثابتة</Label>
                <Input id="value" type="number" {...register('value')} />
              </div>
            )}
            {calculationType === 'percent' && (
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="rate">النسبة المئوية (%)</Label>
                    <Input id="rate" type="number" placeholder="مثال: 20" {...register('rate')} />
                 </div>
                 <div className="space-y-2">
                    <Label>تُحسب من</Label>
                     <Controller
                        name="base"
                        control={control}
                        render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="base">الراتب الأساسي</SelectItem>
                                    <SelectItem value="gross">الراتب الإجمالي</SelectItem>
                                    <SelectItem value="custom" disabled>مخصص</SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        />
                 </div>
              </div>
            )}
             <div className="flex items-center space-x-2 space-x-reverse pt-4">
                <Controller name="taxable" control={control} render={({ field }) => <Switch id="taxable" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="taxable">خاضع للضريبة</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
                 <Controller name="pre_tax" control={control} render={({ field }) => <Switch id="pre_tax" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="pre_tax">يُخصم قبل الضريبة</Label>
            </div>
             <div className="flex items-center space-x-2 space-x-reverse">
                 <Controller name="active" control={control} render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />} />
                <Label htmlFor="active">نشط</Label>
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
