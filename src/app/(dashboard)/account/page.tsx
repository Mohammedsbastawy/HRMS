
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, KeyRound, ShieldCheck, Languages, Camera } from 'lucide-react';
import type { AuditLog, Employee } from '@/lib/types';
import { useRouter } from 'next/navigation';

interface UserAccount {
  username: string;
  role: string;
  employee?: Partial<Employee & { department?: { name_ar: string }, jobTitle?: { title_ar: string } }>;
  audit_logs: AuditLog[];
}

export default function AccountSettingsPage() {
  const [account, setAccount] = useState<UserAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    async function fetchAccountData() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }
        const response = await fetch('/api/account/me', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.status === 401) {
            toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.' });
            router.push('/login');
            return;
        }
        if (!response.ok) throw new Error('فشل في جلب بيانات الحساب');

        const data = await response.json();
        setAccount(data);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
      } finally {
        setIsLoading(false);
      }
    }
    fetchAccountData();
  }, [toast, router]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ variant: 'destructive', title: 'خطأ', description: 'كلمة المرور الجديدة غير متطابقة.' });
      return;
    }
    setIsPasswordLoading(true);
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }
        const response = await fetch('/api/account/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || 'فشل تغيير كلمة المرور');
        
        toast({ title: 'نجاح', description: 'تم تغيير كلمة المرور بنجاح.' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

    } catch (error: any) {
        toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
        setIsPasswordLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!account) {
    return <div className="text-center">لم يتم العثور على بيانات الحساب.</div>;
  }
  
  const employee = account.employee;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">حسابي</h1>
        <p className="text-muted-foreground">إدارة معلومات ملفك الشخصي وإعدادات الأمان.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column for Profile */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="flex flex-col items-center text-center">
               <div className="relative mb-4">
                 <Avatar className="h-24 w-24">
                    <AvatarImage src={employee?.avatar} alt={account.username} />
                    <AvatarFallback className="text-3xl">{account.username.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <Button size="icon" variant="outline" className="absolute bottom-0 left-0 rounded-full h-8 w-8">
                    <Camera className="h-4 w-4"/>
                    <span className="sr-only">تغيير الصورة</span>
                </Button>
               </div>
              <CardTitle>{employee?.full_name || account.username}</CardTitle>
              <CardDescription>{employee?.jobTitle?.title_ar || account.role}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 text-sm">
                    {employee && (
                        <>
                         <Separator />
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">القسم</span>
                            <span className="font-medium">{employee.department?.name_ar}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">البريد الإلكتروني</span>
                            <span className="font-medium">{employee.email}</span>
                         </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">تاريخ التعيين</span>
                            <span className="font-medium">{employee.hire_date ? new Date(employee.hire_date).toLocaleDateString('ar-EG') : '-'}</span>
                         </div>
                        </>
                    )}
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column for Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5"/> إعدادات الأمان</CardTitle>
              <CardDescription>تغيير كلمة المرور وإدارة إعدادات الأمان الخاصة بحسابك.</CardDescription>
            </CardHeader>
            <form onSubmit={handlePasswordChange}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="currentPassword">كلمة المرور الحالية</Label>
                        <Input id="currentPassword" type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
                            <Input id="newPassword" type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
                            <Input id="confirmPassword" type="password" required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                        </div>
                    </div>
                     <Separator />
                     <div className="flex items-center justify-between">
                        <div>
                            <Label htmlFor="2fa-switch" className="font-medium">المصادقة الثنائية (2FA)</Label>
                            <p className="text-xs text-muted-foreground">أضف طبقة أمان إضافية لحسابك.</p>
                        </div>
                        <Switch id="2fa-switch" disabled />
                    </div>
                </CardContent>
                <CardFooter className="border-t px-6 py-4">
                    <Button type="submit" disabled={isPasswordLoading}>
                        {isPasswordLoading && <Loader2 className="ml-2 h-4 w-4 animate-spin"/>}
                        حفظ كلمة المرور
                    </Button>
                </CardFooter>
            </form>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5"/> آخر الأنشطة</CardTitle>
              <CardDescription>آخر 10 إجراءات قمت بها في النظام.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {account.audit_logs.length > 0 ? (
                  account.audit_logs.map(log => (
                    <li key={log.id} className="flex items-start gap-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                        <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{log.action}</p>
                        <p className="text-sm text-muted-foreground">{log.details}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(log.timestamp).toLocaleString('ar-EG')}</p>
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">لا توجد أنشطة حديثة.</p>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
