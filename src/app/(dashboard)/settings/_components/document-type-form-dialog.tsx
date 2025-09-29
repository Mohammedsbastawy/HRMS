
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
import type { DocumentType } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface DocumentTypeFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  docType: DocumentType | null;
}

const docTypeSchema = z.object({
  code: z.string().min(2, 'الرمز مطلوب').max(20, 'الرمز طويل جدًا').regex(/^[A-Z_]+$/, 'استخدم حروف إنجليزية كبيرة و _ فقط'),
  title_ar: z.string().min(2, 'الاسم بالعربية مطلوب'),
  title_en: z.string().min(2, 'الاسم بالإنجليزية مطلوب'),
  category: z.enum(['basic', 'additional']),
  default_required: z.boolean().default(false),
  requires_expiry: z.boolean().default(false),
  active: z.boolean().default(true),
  allowed_mime: z.string().optional(),
  max_size_mb: z.coerce.number().min(1).max(50).optional(),
  description: z.string().optional(),
});

type DocTypeFormValues = z.infer<typeof docTypeSchema>;

export function DocumentTypeFormDialog({ open, onOpenChange, onSuccess, docType }: DocumentTypeFormDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DocTypeFormValues>({
    resolver: zodResolver(docTypeSchema),
  });

  useEffect(() => {
    if (open) {
      if (docType) {
        reset({ ...docType });
      } else {
        reset({
          code: '',
          title_ar: '',
          title_en: '',
          category: 'additional',
          default_required: false,
          requires_expiry: false,
          active: true,
          allowed_mime: 'application/pdf,image/jpeg,image/png',
          max_size_mb: 10,
          description: '',
        });
      }
    }
  }, [docType, open, reset]);

  const onSubmit = async (data: DocTypeFormValues) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      const url = docType ? `/api/documents/types/${docType.id}` : '/api/documents/types';
      const method = docType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error(docType ? 'فشل تحديث النوع' : 'فشل إنشاء النوع');

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
            <DialogTitle>{docType ? 'تعديل نوع مستند' : 'إضافة نوع مستند جديد'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
               <div>
                    <Label htmlFor="title_ar">الاسم (بالعربية)</Label>
                    <Input id="title_ar" {...register('title_ar')} />
                    {errors.title_ar && <p className="text-sm text-destructive">{errors.title_ar.message}</p>}
                </div>
                 <div>
                    <Label htmlFor="title_en">الاسم (بالإنجليزية)</Label>
                    <Input id="title_en" {...register('title_en')} />
                    {errors.title_en && <p className="text-sm text-destructive">{errors.title_en.message}</p>}
                </div>
            </div>
             <div className="grid grid-cols-2 gap-4">
               <div>
                    <Label htmlFor="code">الرمز (Code)</Label>
                    <Input id="code" {...register('code')} placeholder="EXAMPLE_DOC" />
                    {errors.code && <p className="text-sm text-destructive">{errors.code.message}</p>}
                </div>
                 <div>
                    <Label>الفئة</Label>
                    <Controller name="category" control={control} render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="basic">أساسي</SelectItem>
                            <SelectItem value="additional">إضافي</SelectItem>
                        </SelectContent>
                        </Select>
                    )} />
                </div>
            </div>
            <div>
              <Label htmlFor="description">الوصف (اختياري)</Label>
              <Textarea id="description" {...register('description')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                    <Label htmlFor="allowed_mime">أنواع الملفات المسموحة</Label>
                    <Input id="allowed_mime" {...register('allowed_mime')} placeholder="application/pdf,image/jpeg" />
                </div>
                 <div>
                    <Label htmlFor="max_size_mb">أقصى حجم (MB)</Label>
                    <Input id="max_size_mb" type="number" {...register('max_size_mb')} />
                </div>
            </div>
            <div className="flex items-center space-x-4 space-x-reverse pt-4">
                <div className="flex items-center gap-2">
                    <Controller name="requires_expiry" control={control} render={({ field }) => <Switch id="requires_expiry" checked={field.value} onCheckedChange={field.onChange} />} />
                    <Label htmlFor="requires_expiry">يتطلب تاريخ انتهاء</Label>
                </div>
                 <div className="flex items-center gap-2">
                    <Controller name="default_required" control={control} render={({ field }) => <Switch id="default_required" checked={field.value} onCheckedChange={field.onChange} />} />
                    <Label htmlFor="default_required">مطلوب بشكل افتراضي</Label>
                </div>
                 <div className="flex items-center gap-2">
                    <Controller name="active" control={control} render={({ field }) => <Switch id="active" checked={field.value} onCheckedChange={field.onChange} />} />
                    <Label htmlFor="active">نشط</Label>
                </div>
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

