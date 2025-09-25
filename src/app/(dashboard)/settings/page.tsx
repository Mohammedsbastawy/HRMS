'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [ipAddress, setIpAddress] = useState(process.env.NEXT_PUBLIC_ZKTECO_IP || '');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: 'تم الحفظ (محاكاة)',
      description: `تم حفظ الإعدادات. يرجى تعيينها كمتغيرات بيئة للتشغيل الفعلي.`,
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      // This is a placeholder for an API call to a backend that would test the connection.
      // In a real app, you'd have an API route like '/api/zkt/test-connection'
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      if (ipAddress === '192.168.1.201') {
        setTestResult({ success: true, message: 'تم الاتصال بالجهاز بنجاح!' });
      } else {
        throw new Error('فشل الاتصال. تحقق من عنوان IP أو الشبكة.');
      }

    } catch (error: any) {
       setTestResult({ success: false, message: error.message || 'حدث خطأ غير متوقع.' });
    } finally {
        setIsTesting(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>إعدادات جهاز البصمة (ZKTeco)</CardTitle>
          <CardDescription>
            تكوين إعدادات الاتصال بجهاز الحضور والانصراف.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="ip-address">عنوان IP للجهاز</Label>
              <Input
                id="ip-address"
                placeholder="192.168.1.201"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">اسم المستخدم (اختياري)</Label>
              <Input
                id="username"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور (اختياري)</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {testResult && (
             <Alert variant={testResult.success ? 'default' : 'destructive'} className={testResult.success ? 'border-green-500 text-green-700' : ''}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertTitle>{testResult.success ? 'نجاح' : 'فشل'}</AlertTitle>
              <AlertDescription>
                {testResult.message}
              </AlertDescription>
            </Alert>
          )}

          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>ملاحظة هامة للمطور</AlertTitle>
            <AlertDescription>
              <p>للتشغيل الفعلي، يجب تعيين هذه القيم كمتغيرات بيئة في ملف <code>.env</code>:</p>
              <ul className="list-disc pr-5 mt-2 font-mono text-xs">
                <li><code>ZKTECO_IP={ipAddress || '192.168.1.201'}</code></li>
                <li><code>ZKTECO_USER={username || ''}</code></li>
                <li><code>ZKTECO_PASS={password || ''}</code></li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 flex justify-between">
          <Button onClick={handleSave}>حفظ الإعدادات</Button>
          <Button onClick={handleTestConnection} variant="outline" disabled={isTesting}>
            {isTesting ? (
              <>
                <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                جاري الاختبار...
              </>
            ) : (
              'اختبار الاتصال'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
