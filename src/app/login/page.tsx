
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { HrmsIcon } from '@/components/icons';
import { Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل تسجيل الدخول');
      }

      // Store the token and user info
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast({
        title: 'تم تسجيل الدخول بنجاح',
        description: `أهلاً بك، ${data.user.username}!`,
      });

      router.push('/'); // Redirect to the dashboard
      router.refresh(); // Refresh the page to update layout

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ في تسجيل الدخول',
        description: error.message || 'يرجى التحقق من اسم المستخدم وكلمة المرور.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-2 mb-4">
               <HrmsIcon className="h-8 w-8 text-primary" />
               <span className="text-2xl font-headline font-semibold">HRMS</span>
            </div>
          <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
          <CardDescription>أدخل بياناتك للوصول إلى لوحة التحكم</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="username">اسم المستخدم</Label>
                <Input
                id="username"
                type="text"
                placeholder="مثال: admin"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                dir="rtl"
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                dir="rtl"
                />
            </div>
            </CardContent>
            <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
                {isLoading ? 'جاري التحقق...' : 'تسجيل الدخول'}
            </Button>
            </CardFooter>
        </form>
      </Card>
    </div>
  );
}
