
'use client';

import { useState, useEffect } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UploadCloud, FileCheck2, AlertCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Applicant } from '@/lib/types';

interface EditApplicantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  applicant: Applicant | null;
  onSuccess: () => void;
}

const applicantSchema = z.object({
  full_name: z.string().min(2, { message: 'الاسم الكامل مطلوب' }),
  email: z.string().email({ message: 'بريد إلكتروني غير صالح' }),
  phone: z.string().optional(),
  source: z.string().default('manual'),
  linkedin_url: z.string().url({ message: 'رابط LinkedIn غير صالح' }).optional().or(z.literal('')),
  portfolio_url: z.string().url({ message: 'رابط معرض الأعمال غير صالح' }).optional().or(z.literal('')),
  years_experience: z.coerce.number().optional(),
  current_title: z.string().optional(),
  current_company: z.string().optional(),
  expected_salary: z.coerce.number().optional(),
  cvFile: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof applicantSchema>;

export function EditApplicantDialog({ open, onOpenChange, applicant, onSuccess }: EditApplicantDialogProps) {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(applicantSchema),
  });

  useEffect(() => {
    if (applicant) {
      form.reset({
        full_name: applicant.full_name || '',
        email: applicant.email || '',
        phone: applicant.phone || '',
        source: applicant.source || 'manual',
        linkedin_url: applicant.linkedin_url || '',
        portfolio_url: applicant.portfolio_url || '',
        years_experience: applicant.years_experience || undefined,
        current_title: applicant.current_title || '',
        current_company: applicant.current_company || '',
        expected_salary: applicant.expected_salary || undefined,
      });
    }
  }, [applicant, form]);

  const onSubmit = async (data: FormValues) => {
    if (!applicant) return;

    const token = localStorage.getItem('authToken');
    if (!token) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الجلسة منتهية، يرجى تسجيل الدخول مرة أخرى.' });
        return;
    }

    try {
        const formData = new FormData();
        // Append all form data fields
        Object.entries(data).forEach(([key, value]) => {
            if (value !== undefined && value !== null && key !== 'cvFile') {
                formData.append(key, String(value));
            }
        });

        if (data.cvFile) {
            formData.append('cv_file', data.cvFile);
        }

        const response = await fetch(`/api/recruitment/applicants/${applicant.id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
        });
        
        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || `فشل تعديل المتقدم`);
        }

      toast({ title: `تم تعديل بيانات ${data.full_name} بنجاح` });
      onSuccess();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>تعديل بيانات المتقدم</DialogTitle>
          <DialogDescription>تحديث بيانات {applicant?.full_name}.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6">
                <div className="p-4 border rounded-lg relative space-y-4">
                  <h4 className="font-semibold text-lg border-b pb-2">البيانات الأساسية</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="full_name" render={({ field }) => (<FormItem><FormLabel>الاسم الكامل</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="email" render={({ field }) => (<FormItem><FormLabel>البريد الإلكتروني</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="phone" render={({ field }) => (<FormItem><FormLabel>رقم الهاتف</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="source" render={({ field }) => (<FormItem><FormLabel>مصدر التقديم</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="manual">يدوي</SelectItem>
                              <SelectItem value="website">الموقع الإلكتروني</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                              <SelectItem value="referral">توصية</SelectItem>
                              <SelectItem value="other">آخر</SelectItem>
                            </SelectContent>
                          </Select><FormMessage /></FormItem>)}/>
                  </div>
                  <div className="space-y-2">
                    <Label>استبدال السيرة الذاتية (PDF)</Label>
                    <FormField control={form.control} name="cvFile" render={({ field }) => (<FormItem><FormControl>
                          <Input id={`cv_upload_edit`} type="file" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" accept="application/pdf" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} />
                    </FormControl><FormMessage /></FormItem>)}/>
                    {applicant?.cv_path && <p className="text-xs text-muted-foreground">الملف الحالي: {applicant.cv_path.split('/').pop()}</p>}
                  </div>

                   <h4 className="font-semibold text-lg border-b pb-2 pt-4">تفاصيل إضافية (اختياري)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="years_experience" render={({ field }) => (<FormItem><FormLabel>سنوات الخبرة</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="expected_salary" render={({ field }) => (<FormItem><FormLabel>الراتب المتوقع</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="current_title" render={({ field }) => (<FormItem><FormLabel>المسمى الوظيفي الحالي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="current_company" render={({ field }) => (<FormItem><FormLabel>الشركة الحالية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="linkedin_url" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>رابط ملف LinkedIn</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="portfolio_url" render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>رابط معرض الأعمال (Portfolio)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                حفظ التعديلات
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
