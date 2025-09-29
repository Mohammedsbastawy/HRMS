
'use client';

import { useState, useCallback } from 'react';
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
import { useToast } from '@/components/ui/use-toast';
import { Loader2, UploadCloud, FileCheck2, AlertCircle } from 'lucide-react';
import type { ChecklistItem } from '../page';
import { useDropzone } from 'react-dropzone';

interface UploadDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  checklistItem: ChecklistItem;
  employeeId: number;
}

const uploadSchema = z.object({
  expiry_date: z.string().optional(),
  file: z.instanceof(File).refine(file => file.size > 0, { message: 'الملف مطلوب' }),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function UploadDocumentDialog({ open, onOpenChange, onSuccess, checklistItem, employeeId }: UploadDocumentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { control, handleSubmit, setValue, watch, reset } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      expiry_date: checklistItem.expiry_date?.split('T')[0] || '',
    },
  });

  const file = watch('file');

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setUploadError(null);
    if (fileRejections.length > 0) {
      const error = fileRejections[0].errors[0];
      if (error.code === 'file-too-large') {
        setUploadError(`حجم الملف كبير جدًا. الحد الأقصى: ${checklistItem.doc_type.max_size_mb}MB`);
      } else if (error.code === 'file-invalid-type') {
        setUploadError(`نوع الملف غير صالح. الأنواع المسموح بها: ${checklistItem.doc_type.allowed_mime}`);
      } else {
        setUploadError(error.message);
      }
      return;
    }
    if (acceptedFiles.length > 0) {
      setValue('file', acceptedFiles[0], { shouldValidate: true });
    }
  }, [setValue, checklistItem]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
    accept: checklistItem.doc_type.allowed_mime ? 
        Object.fromEntries(checklistItem.doc_type.allowed_mime.split(',').map(mime => [mime.trim(), []]))
        : undefined,
    maxSize: checklistItem.doc_type.max_size_mb * 1024 * 1024,
  });

  const onSubmit = async (data: UploadFormValues) => {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.append('doc_type_id', String(checklistItem.doc_type.id));
    formData.append('file', data.file);
    if (data.expiry_date) {
      formData.append('expiry_date', data.expiry_date);
    }
    
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/documents/employee/${employeeId}/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || 'فشل رفع الملف');
      }
      onSuccess();
      reset();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>رفع مستند: {checklistItem.doc_type.title_ar}</DialogTitle>
            <DialogDescription>
              {checklistItem.file_path ? 'سيتم استبدال الملف القديم بالملف الجديد.' : 'اختر الملف المطلوب لرفعه.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
                <Label htmlFor="file-upload">ملف المستند</Label>
                <div {...getRootProps()} className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted hover:bg-muted/80 ${isDragActive ? 'border-primary' : ''}`}>
                    <input {...getInputProps()} />
                    {file ? (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                            <FileCheck2 className="w-8 h-8 mb-2 text-green-500"/>
                            <p className="font-semibold">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                    ) : (
                       <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <UploadCloud className="w-8 h-8 mb-2 text-muted-foreground" />
                            <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">انقر للرفع</span> أو قم بالسحب</p>
                            <p className="text-xs text-muted-foreground">
                                {checklistItem.doc_type.allowed_mime} (بحد أقصى {checklistItem.doc_type.max_size_mb}MB)
                            </p>
                        </div>
                    )}
                </div>
                {uploadError && <p className="text-sm text-destructive mt-2 flex items-center gap-1"><AlertCircle className="h-4 w-4" /> {uploadError}</p>}
            </div>

            {checklistItem.doc_type.requires_expiry && (
              <div className="space-y-2">
                <Label htmlFor="expiry_date">تاريخ انتهاء الصلاحية</Label>
                <Controller
                  name="expiry_date"
                  control={control}
                  render={({ field }) => (
                    <Input id="expiry_date" type="date" {...field} />
                  )}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={isSubmitting || !file}>
              {isSubmitting && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? 'جاري الرفع...' : 'رفع وحفظ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
