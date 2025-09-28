
'use client';

import { useState } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, UploadCloud } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AddApplicantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  onSuccess: () => void;
}

const applicantSchema = z.object({
  full_name: z.string().min(2, { message: 'الاسم الكامل مطلوب' }),
  email: z.string().email({ message: 'بريد إلكتروني غير صالح' }),
  phone: z.string().optional(),
  source: z.string().default('manual'),
  linkedin_url: z.string().url().optional().or(z.literal('')),
  portfolio_url: z.string().url().optional().or(z.literal('')),
  cv_path: z.string().optional(), // For file upload simulation
});

const formSchema = z.object({
  applicants: z.array(applicantSchema).min(1),
});

type FormValues = z.infer<typeof formSchema>;

export function AddApplicantDialog({ open, onOpenChange, jobId, onSuccess }: AddApplicantDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicants: [{ full_name: '', email: '', phone: '', source: 'manual', linkedin_url: '', portfolio_url: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'applicants',
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('authToken');
      const promises = data.applicants.map(applicant =>
        fetch('/api/recruitment/applicants', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ ...applicant, job_id: jobId }),
        })
      );
      
      const results = await Promise.all(promises);
      const failed = results.filter(res => !res.ok);

      if (failed.length > 0) {
        throw new Error(`فشل إضافة ${failed.length} من المتقدمين.`);
      }

      toast({ title: `تم إضافة ${data.applicants.length} متقدمين بنجاح` });
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewApplicant = () => {
    append({ full_name: '', email: '', phone: '', source: 'manual', linkedin_url: '', portfolio_url: '' });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            form.reset({ applicants: [{ full_name: '', email: '', phone: '', source: 'manual', linkedin_url: '', portfolio_url: '' }] });
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>إضافة متقدمين جدد</DialogTitle>
          <DialogDescription>أدخل بيانات المتقدمين. يمكنك إضافة أكثر من متقدم في نفس الوقت.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="max-h-[60vh] overflow-y-auto pr-4 space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 left-2 h-6 w-6 text-destructive"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`applicants.${index}.full_name`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>الاسم الكامل</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`applicants.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>البريد الإلكتروني</FormLabel>
                          <FormControl><Input type="email" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name={`applicants.${index}.phone`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>رقم الهاتف (اختياري)</FormLabel>
                          <FormControl><Input {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`applicants.${index}.source`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>مصدر التقديم</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="manual">يدوي</SelectItem>
                              <SelectItem value="website">الموقع الإلكتروني</SelectItem>
                              <SelectItem value="linkedin">LinkedIn</SelectItem>
                              <SelectItem value="referral">توصية</SelectItem>
                              <SelectItem value="other">آخر</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <div className="space-y-2">
                        <Label>السيرة الذاتية (CV)</Label>
                        <div className="flex items-center justify-center w-full">
                            <Label htmlFor={`cv_upload_${index}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">انقر للرفع</span> أو قم بسحب الملف وإفلاته</p>
                                </div>
                                <Input id={`cv_upload_${index}`} type="file" className="hidden" />
                            </Label>
                        </div>
                    </div>
                </div>
              ))}
            </div>
             <Button type="button" variant="outline" onClick={handleAddNewApplicant}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة متقدم آخر
              </Button>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>إلغاء</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                {`حفظ (${fields.length}) متقدمين`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
