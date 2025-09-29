
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { addDays, format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface RequestLeaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RequestLeaveDialog({ open, onOpenChange, onSuccess }: RequestLeaveDialogProps) {
  const [leaveType, setLeaveType] = useState('');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({ from: new Date(), to: addDays(new Date(), 4) });
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveType || !dateRange?.from || !dateRange?.to) {
        toast({ variant: 'destructive', title: 'بيانات غير مكتملة', description: 'يرجى ملء جميع الحقول المطلوبة.' });
        return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: format(dateRange.from, 'yyyy-MM-dd'),
          end_date: format(dateRange.to, 'yyyy-MM-dd'),
          notes: notes,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'فشل تقديم الطلب');

      toast({ title: 'تم إرسال طلبك بنجاح', description: 'سيتم مراجعة طلب الإجازة الخاص بك قريبًا.' });
      onSuccess();
      // Reset form
      setLeaveType('');
      setDateRange(undefined);
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
            <DialogTitle>طلب إجازة جديد</DialogTitle>
            <DialogDescription>املأ النموذج لتقديم طلب إجازة جديد.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leaveType">نوع الإجازة</Label>
              <Select onValueChange={setLeaveType} value={leaveType} required>
                <SelectTrigger id="leaveType">
                  <SelectValue placeholder="اختر نوع الإجازة" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Annual">سنوية</SelectItem>
                  <SelectItem value="Sick">مرضية</SelectItem>
                  <SelectItem value="Unpaid">غير مدفوعة</SelectItem>
                  <SelectItem value="Maternity">أمومة</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>تاريخ الإجازة</Label>
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
                          {format(dateRange.from, 'dd LLL, yyyy')} - {format(dateRange.to, 'dd LLL, yyyy')}
                        </>
                      ) : (
                        format(dateRange.from, 'dd LLL, yyyy')
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
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
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

    
