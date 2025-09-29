'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ListFilter, Upload, PlusCircle, ServerCog, Loader2 } from 'lucide-react';
import { TodayView } from './_components/today-view';
import { DailyLog } from './_components/daily-log';
import { WeeklyTimesheet } from './_components/weekly-timesheet';
import { MonthlyCalendar } from './_components/monthly-calendar';
import { ExceptionsQueue } from './_components/exceptions-queue';
import { CorrectionsView } from './_components/corrections-view';
import { OvertimeView } from './_components/overtime-view';
import { ShiftsRostering } from './_components/shifts-rostering';
import { DevicesImport } from './_components/devices-import';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';

export default function AttendancePage() {
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    toast({
      title: "بدء المزامنة",
      description: "جاري الاتصال بالأجهزة وسحب البيانات. قد تستغرق هذه العملية بضع دقائق...",
    });
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast({
          variant: "destructive",
          title: "الجلسة منتهية",
          description: "يرجى تسجيل الدخول مرة أخرى.",
          responseStatus: 401,
        });
        return;
      }
      const response = await fetch('/api/attendance/sync-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'فشل في المزامنة');
      }
      
      toast({
        title: "اكتملت المزامنة",
        description: result.message,
      });

      // Optionally, you might want to trigger a refresh of the views here
      // For example by using a shared state or context. For now, we'll rely on manual refresh.

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "فشل المزامنة",
        description: error.message,
        details: error
      });
    } finally {
      setIsSyncing(false);
    }
  };


  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>الحضور والانصراف</CardTitle>
              <CardDescription>إدارة شاملة للحضور، الورديات، والجداول الزمنية للموظفين.</CardDescription>
            </div>
            <div className="flex flex-shrink-0 gap-2">
              <Button size="sm" variant="outline" className="gap-1" disabled>
                <ListFilter className="h-3.5 w-3.5" />
                <span>فلاتر</span>
              </Button>
               <Button size="sm" variant="outline" className="gap-1" disabled>
                <Upload className="h-3.5 w-3.5" />
                <span>استيراد</span>
              </Button>
               <Button size="sm" variant="outline" className="gap-1" disabled>
                <PlusCircle className="h-3.5 w-3.5" />
                <span>إدخال يدوي</span>
              </Button>
               <Button size="sm" className="gap-1" onClick={handleSync} disabled={isSyncing}>
                {isSyncing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <ServerCog className="h-3.5 w-3.5" />
                )}
                <span>{isSyncing ? 'جاري المزامنة...' : 'مزامنة'}</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>
      
      <Tabs defaultValue="today" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-5 lg:grid-cols-9">
          <TabsTrigger value="today">اليوم</TabsTrigger>
          <TabsTrigger value="daily">السجل اليومي</TabsTrigger>
          <TabsTrigger value="weekly">الجدول الأسبوعي</TabsTrigger>
          <TabsTrigger value="monthly">التقويم الشهري</TabsTrigger>
          <TabsTrigger value="exceptions">الاستثناءات</TabsTrigger>
          <TabsTrigger value="corrections">التصحيحات</TabsTrigger>
          <TabsTrigger value="overtime">الإضافي</TabsTrigger>
          <TabsTrigger value="shifts">الورديات</TabsTrigger>
          <TabsTrigger value="devices">الأجهزة</TabsTrigger>
        </TabsList>
        
        <TabsContent value="today">
          <TodayView />
        </TabsContent>
        <TabsContent value="daily">
          <DailyLog />
        </TabsContent>
        <TabsContent value="weekly">
          <WeeklyTimesheet />
        </TabsContent>
         <TabsContent value="monthly">
          <MonthlyCalendar />
        </TabsContent>
        <TabsContent value="exceptions">
          <ExceptionsQueue />
        </TabsContent>
        <TabsContent value="corrections">
          <CorrectionsView />
        </TabsContent>
        <TabsContent value="overtime">
          <OvertimeView />
        </TabsContent>
        <TabsContent value="shifts">
          <ShiftsRostering />
        </TabsContent>
        <TabsContent value="devices">
          <DevicesImport />
        </TabsContent>
      </Tabs>
    </div>
  );
}
