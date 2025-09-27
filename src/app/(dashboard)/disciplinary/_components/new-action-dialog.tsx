
'use client';

import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { Employee } from '@/lib/types';

interface NewActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSuccess: () => void;
}

export function NewActionDialog({ open, onOpenChange, employees, onSuccess }: NewActionDialogProps) {
  const [formData, setFormData] = useState({
    employee_id: '',
    title: '',
    description: '',
    type: '',
    severity: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employee_id || !formData.title || !formData.type || !formData.severity) {
      toast({ variant: 'destructive', title: 'بيانات ناقصة', description: 'يرجى ملء جميع الحقول الإلزامية.' });
      return;
    }
    setIsLoading(true);
    try {
        const token = localStorage.getItem('authToken');
      const response = await fetch('/api/disciplinary/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'فشل إنشاء الإجراء');
      
      toast({ title: 'تم الحفظ بنجاح', description: 'تم حفظ الإجراء كمسودة.' });
      onSuccess();
      onOpenChange(false);
      // Reset form
      setFormData({ employee_id: '', title: '', description: '', type: '', severity: '' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>إجراء تأديبي يدوي جديد</DialogTitle>
            <DialogDescription>أدخل تفاصيل الإجراء التأديبي ليتم تسجيله.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">الموظف</Label>
              <Select onValueChange={(value) => handleSelectChange('employee_id', value)} value={formData.employee_id}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الموظف" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={String(emp.id)}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">عنوان الإجراء</Label>
              <Input id="title" value={formData.title} onChange={handleInputChange} placeholder="مثال: إنذار بسبب تأخير متكرر" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="type">نوع الإجراء</Label>
                    <Select onValueChange={(value) => handleSelectChange('type', value)} value={formData.type}>
                        <SelectTrigger><SelectValue placeholder="اختر النوع" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="warning">إنذار</SelectItem>
                            <SelectItem value="deduction">خصم</SelectItem>
                            <SelectItem value="suspension">إيقاف عن العمل</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="severity">مستوى الخطورة</Label>
                    <Select onValueChange={(value) => handleSelectChange('severity', value)} value={formData.severity}>
                        <SelectTrigger><SelectValue placeholder="اختر الخطورة" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="low">منخفضة</SelectItem>
                            <SelectItem value="medium">متوسطة</SelectItem>
                            <SelectItem value="high">عالية</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">الوصف والتفاصيل</Label>
                <Textarea id="description" value={formData.description} onChange={handleInputChange} placeholder="اذكر تفاصيل الواقعة والأسباب..." />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'جاري الحفظ...' : 'حفظ كمسودة'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
