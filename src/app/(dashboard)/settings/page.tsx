
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function SettingsPage() {
  const [ipAddress, setIpAddress] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load config from localStorage on the client
    const savedConfig = localStorage.getItem('zktConfig');
    if (savedConfig) {
      const config = JSON.parse(savedConfig);
      setIpAddress(config.ip || '');
      setUsername(config.user || '');
      setPassword(config.pass || '');
    }
  }, []);

  const handleSave = () => {
    const config = { ip: ipAddress, user: username, pass: password };
    localStorage.setItem('zktConfig', JSON.stringify(config));
    toast({
      title: 'تم الحفظ بنجاح',
      description: `تم حفظ إعدادات جهاز البصمة في المتصفح.`,
    });
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/attendance/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip: ipAddress, user: username, pass: password, test: true }), // Add a test flag
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setTestResult({ success: true, message: result.message || 'تم الاتصال بالجهاز بنجاح!' });
      } else {
        throw new Error(result.message || 'فشل الاتصال. تحقق من عنوان IP أو الشبكة.');
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
            تكوين إعدادات الاتصال بجهاز الحضور والانصراف. سيتم حفظ هذه الإعدادات في متصفحك.
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
