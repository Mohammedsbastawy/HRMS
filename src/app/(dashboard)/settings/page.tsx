'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

export default function SettingsPage() {
  const [ipAddress, setIpAddress] = useState(process.env.NEXT_PUBLIC_ZKTECO_IP || '');
  const { toast } = useToast();

  const handleSave = () => {
    // In a real application, this would save to a config file or a database.
    // For this demo, we'll just show a toast.
    // The user needs to set the environment variable as instructed.
    toast({
      title: 'تم الحفظ (محاكاة)',
      description: `تم حفظ عنوان IP: ${ipAddress}. يرجى تعيينه كمتغير بيئة.`,
    });
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
          <div className="space-y-2">
            <Label htmlFor="ip-address">عنوان IP للجهاز</Label>
            <Input
              id="ip-address"
              placeholder="192.168.1.201"
              value={ipAddress}
              onChange={(e) => setIpAddress(e.target.value)}
            />
          </div>
          <Alert>
            <Terminal className="h-4 w-4" />
            <AlertTitle>ملاحظة هامة للمطور</AlertTitle>
            <AlertDescription>
                للتشغيل الفعلي، يجب تعيين عنوان IP كمتغير بيئة باسم <code>ZKTECO_IP</code> في ملف <code>.env</code>. القيمة المدخلة هنا هي لأغراض العرض فقط.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSave}>حفظ الإعدادات</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
