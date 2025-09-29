
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import type { Employee } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface AddUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserAdded: () => void;
}

export function AddUserDialog({ open, onOpenChange, onUserAdded }: AddUserDialogProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'Admin' | 'HR' | 'Manager' | 'Employee' | ''>('');
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [employees, setEmployees] = useState<Pick<Employee, 'id' | 'full_name'>[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (open) {
      // Fetch employees when the dialog opens
      const fetchEmployees = async () => {
        try {
          const token = localStorage.getItem('authToken');
          if (!token) {
            router.push('/login');
            return;
          }
          const response = await fetch('/api/employees', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to fetch employees');
          const data = await response.json();
          setEmployees(data.employees);
        } catch (error) {
          toast({ variant: 'destructive', title: 'فشل في جلب الموظفين' });
        }
      };
      fetchEmployees();
    }
  }, [open, toast, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username,
          password,
          role,
          employee_id: employeeId && employeeId !== 'none' ? Number(employeeId) : null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل في إضافة المستخدم');
      }

      toast({
        title: 'تمت إضافة المستخدم بنجاح!',
        description: `تم إنشاء حساب للمستخدم ${username}.`,
      });
      onUserAdded();
      onOpenChange(false);
      // Reset form
      setUsername('');
      setPassword('');
      setRole('');
      setEmployeeId(null);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
            <DialogDescription>
              املأ البيانات لإنشاء حساب مستخدم جديد في النظام.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">الدور (الصلاحية)</Label>
              <Select onValueChange={(value) => setRole(value as any)} value={role || ''} required>
                <SelectTrigger>
                  <SelectValue placeholder="اختر دور المستخدم" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">مدير نظام (Admin)</SelectItem>
                  <SelectItem value="HR">موارد بشرية (HR)</SelectItem>
                  <SelectItem value="Manager">مدير (Manager)</SelectItem>
                  <SelectItem value="Employee">موظف (Employee)</SelectItem>
                </SelectContent>
              </Select>
            </div>
             <div className="space-y-2">
              <Label htmlFor="employee">ربط بموظف (اختياري)</Label>
              <Select onValueChange={setEmployeeId} value={employeeId || ''}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر موظفًا لربط الحساب به" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بلا</SelectItem>
                  {employees.map(emp => (
                    <SelectItem key={emp.id} value={String(emp.id)}>{emp.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              إلغاء
            </Button>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'جاري الحفظ...' : 'حفظ المستخدم'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
