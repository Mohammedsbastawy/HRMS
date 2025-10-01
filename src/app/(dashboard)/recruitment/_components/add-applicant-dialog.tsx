
'use client';

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Loader2, Plus, Trash2, UploadCloud, FileCheck2, AlertCircle } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';

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
  linkedin_url: z.string().url({ message: 'رابط LinkedIn غير صالح' }).optional().or(z.literal('')),
  portfolio_url: z.string().url({ message: 'رابط معرض الأعمال غير صالح' }).optional().or(z.literal('')),
  years_experience: z.coerce.number().optional(),
  current_title: z.string().optional(),
  current_company: z.string().optional(),
  expected_salary: z.coerce.number().optional(),
  cvFile: z.instanceof(File).optional(),
  cv_path: z.string().optional(),
});


const formSchema = z.object({
  applicants: z.array(applicantSchema).min(1),
});

type FormValues = z.infer<typeof formSchema>;

const newApplicantDefaultValues: z.infer<typeof applicantSchema> = {
  full_name: '',
  email: '',
  phone: '',
  source: 'manual',
  linkedin_url: '',
  portfolio_url: '',
  years_experience: undefined,
  current_title: '',
  current_company: '',
  expected_salary: undefined,
  cvFile: undefined,
};


const FileUploader = ({ control, index }: { control: any, index: number }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, field: any) => {
        const file = event.target.files?.[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                 setError('يرجى اختيار ملف بصيغة PDF فقط.');
                 setFileName(null);
                 field.onChange(undefined);
                 return;
            }
            if (file.size > 5 * 1024 * 1024) { // 5MB
                setError('حجم الملف يجب أن يكون أقل من 5 ميجابايت.');
                setFileName(null);
                field.onChange(undefined);
                return;
            }
            setError(null);
            setFileName(file.name);
            field.onChange(file);
        }
    };
    
    return (
         <div className="space-y-2">
            <Label>السيرة الذاتية (PDF)</Label>
             <FormField
                control={control}
                name={`applicants.${index}.cvFile`}
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                            <Input id={`cv_upload_${index}`} type="file" className="hidden" accept="application/pdf" onChange={(e) => handleFileChange(e, field)} />
                        </FormControl>
                        <Label htmlFor={`cv_upload_${index}`} className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80">
                           {fileName ? (
                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                                    <FileCheck2 className="w-8 h-8 mb-2 text-green-500"/>
                                    <p className="font-semibold">{fileName}</p>
                                    <p className="text-xs text-muted-foreground">تم اختيار الملف بنجاح</p>
                                </div>
                            ) : (
                               <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                                    <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">انقر للرفع</span> أو قم بسحب الملف وإفلاته</p>
                                    <p className="text-xs text-muted-foreground">PDF (بحد أقصى 5 ميجا)</p>
                                </div>
                            )}
                        </Label>
                         {error && <p className="text-sm text-destructive mt-2 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {error}</p>}
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}

export function AddApplicantDialog({ open, onOpenChange, jobId, onSuccess }: AddApplicantDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      applicants: [newApplicantDefaultValues],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'applicants',
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    const token = localStorage.getItem('authToken');
    if (!token) {
        toast({ variant: 'destructive', title: 'خطأ', description: 'الجلسة منتهية، يرجى تسجيل الدخول مرة أخرى.' });
        setIsSubmitting(false);
        return;
    }

    try {
        const createdApplicants = [];
        for (const applicantData of data.applicants) {
            const formData = new FormData();
            formData.append('job_id', String(jobId));
            formData.append('full_name', applicantData.full_name);
            formData.append('email', applicantData.email);
            formData.append('phone', applicantData.phone || '');
            formData.append('source', applicantData.source || 'manual');
            
            // Add optional fields only if they have a value
            if (applicantData.years_experience) formData.append('years_experience', String(applicantData.years_experience));
            if (applicantData.current_title) formData.append('current_title', applicantData.current_title);
            if (applicantData.current_company) formData.append('current_company', applicantData.current_company);
            if (applicantData.expected_salary) formData.append('expected_salary', String(applicantData.expected_salary));
            if (applicantData.linkedin_url) formData.append('linkedin_url', applicantData.linkedin_url);
            if (applicantData.portfolio_url) formData.append('portfolio_url', applicantData.portfolio_url);
            
            if (applicantData.cvFile) {
                formData.append('cv_file', applicantData.cvFile);
            }
            
            const response = await fetch('/api/recruitment/applicants', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || `فشل إضافة المتقدم: ${applicantData.full_name}`);
            }
            createdApplicants.push(result);
        }

      toast({ title: `تم إضافة ${createdApplicants.length} متقدمين بنجاح` });
      form.reset();
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message,
        details: error.details || error
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddNewApplicant = () => {
    append(newApplicantDefaultValues);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        if (!isOpen) {
            form.reset({ applicants: [newApplicantDefaultValues] });
        }
        onOpenChange(isOpen);
    }}>
      <DialogContent className="max-w-4xl">
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
                  <h4 className="font-semibold text-lg border-b pb-2">بيانات المتقدم الأساسية</h4>
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
                   <FileUploader control={form.control} index={index} />

                   <h4 className="font-semibold text-lg border-b pb-2 pt-4">تفاصيل إضافية (اختياري)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name={`applicants.${index}.years_experience`} render={({ field }) => (<FormItem><FormLabel>سنوات الخبرة</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`applicants.${index}.expected_salary`} render={({ field }) => (<FormItem><FormLabel>الراتب المتوقع</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`applicants.${index}.current_title`} render={({ field }) => (<FormItem><FormLabel>المسمى الوظيفي الحالي</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`applicants.${index}.current_company`} render={({ field }) => (<FormItem><FormLabel>الشركة الحالية</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`applicants.${index}.linkedin_url`} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>رابط ملف LinkedIn</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name={`applicants.${index}.portfolio_url`} render={({ field }) => (<FormItem className="md:col-span-2"><FormLabel>رابط معرض الأعمال (Portfolio)</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
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
