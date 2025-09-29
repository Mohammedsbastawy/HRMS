
'use client';

import { useState, useEffect } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { addDays, format, isSameDay } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { Employee } from '@/lib/types';


interface RequestLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  employees: Employee[];
  isManager: boolean;
}

export function RequestLeaveDialog({ open, onOpenChange, onSuccess, employees, isManager }: RequestLeaveDialogProps) {
  const [employeeId, setEmployeeId] = useState('');
  const [leaveType, setLeaveType] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: new Date() });
  const [partDay, setPartDay] = useState('none');
  const [hours, setHours] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const isSingleDay = dateRange?.from && dateRange?.to && isSameDay(dateRange.from, dateRange.to);

  useEffect(() => {
    if (!isSingleDay) {
        setPartDay('none');
    }
  }, [isSingleDay]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !dateRange?.from || !dateRange?.to || (isManager && !employeeId)) {
        toast({ variant: 'destructive', title: 'بيانات غير مكتملة', description: 'يرجى ملء جميع الحقول المطلوبة.' });
        return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const payload = {
          leave_type: leaveType,
          start_date: format(dateRange.from, 'yyyy-MM-dd'),
          end_date: format(dateRange.to, 'yyyy-MM-dd'),
          part_day: partDay,
          hours_count: partDay === 'hours' ? Number(hours) : null,
          notes: notes,
          ...(isManager && { employee_id: Number(employeeId) })
      };

      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'فشل تقديم الطلب');

      toast({ title: 'تم إرسال طلبك بنجاح', description: 'سيتم مراجعة الطلب قريبًا.' });
      onSuccess();
      // Reset form
      setEmployeeId('');
      setLeaveType('');
      setDateRange(undefined);
      setPartDay('none');
      setHours('');
      setNotes('');
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isManager ? 'إضافة إجازة/إذن يدوي' : 'طلب إجازة جديد'}</DialogTitle>
            <DialogDescription>املأ النموذج لتقديم الطلب.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            {isManager && (
                 <div className="space-y-2">
                    <Label htmlFor="employeeId">الموظف</Label>
                    <Select onValueChange={setEmployeeId} value={employeeId} required>
                        <SelectTrigger id="employeeId"><SelectValue placeholder="اختر الموظف" /></SelectTrigger>
                        <SelectContent>
                        {employees.map(emp => (
                            <SelectItem key={emp.id} value={String(emp.id)}>{emp.full_name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="leaveType">نوع الطلب</Label>
              <Select onValueChange={setLeaveType} value={leaveType} required>
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="اختر نوع الطلب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">إجازة سنوية</SelectItem>
                  <SelectItem value="Sick">إجازة مرضية</SelectItem>
                  <SelectItem value="Unpaid">إجازة غير مدفوعة</SelectItem>
                  <SelectItem value="Maternity">إجازة أمومة</SelectItem>
                  <SelectItem value="Permission">إذن (بالساعات)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>تاريخ الطلب</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn('w-full justify-start text-right font-normal', !dateRange && 'text-muted-foreground')}
                  >
                    <CalendarIcon className="ml-2 h-4 w-4" />
                    {dateRange?.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, 'd MMMM yyyy', {locale: arSA})} - {format(dateRange.to, 'd MMMM yyyy', {locale: arSA})}
                        </>
                      ) : (
                        format(dateRange.from, 'd MMMM yyyy', {locale: arSA})
                      )
                    ) : (
                      <span>اختر تاريخًا</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange?.from}
                    selected={dateRange}
                    onSelect={setDateRange}
                    numberOfMonths={1}
                    locale={arSA}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {isSingleDay && (
                <div className="space-y-2 rounded-md border p-4">
                    <Label>جزء من اليوم</Label>
                    <RadioGroup value={partDay} onValueChange={setPartDay} className="flex gap-4">
                        <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="none" id="none" />
                            <Label htmlFor="none">يوم كامل</Label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="first_half" id="first_half" />
                            <Label htmlFor="first_half">النصف الأول</Label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="second_half" id="second_half" />
                            <Label htmlFor="second_half">النصف الثاني</Label>
                        </div>
                         <div className="flex items-center space-x-2 space-x-reverse">
                            <RadioGroupItem value="hours" id="hours" />
                            <Label htmlFor="hours">ساعات</Label>
                        </div>
                    </RadioGroup>
                    {partDay === 'hours' && (
                        <div className="pt-2">
                             <Input 
                                type="number" 
                                placeholder="أدخل عدد الساعات" 
                                value={hours}
                                onChange={e => setHours(e.target.value)}
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="notes">السبب / ملاحظات (اختياري)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أذكر سبب طلب الإجازة إذا لزم الأمر."
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>إلغاء</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'جاري الإرسال...' : 'إرسال الطلب'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
