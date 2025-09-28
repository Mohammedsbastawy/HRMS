'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ListFilter, Upload, PlusCircle, ServerCog } from 'lucide-react';
import { TodayView } from './_components/today-view';
import { DailyLog } from './_components/daily-log';
import { WeeklyTimesheet } from './_components/weekly-timesheet';
import { MonthlyCalendar } from './_components/monthly-calendar';
import { ExceptionsQueue } from './_components/exceptions-queue';
import { CorrectionsView } from './_components/corrections-view';
import { OvertimeView } from './_components/overtime-view';
import { ShiftsRostering } from './_components/shifts-rostering';
import { DevicesImport } from './_components/devices-import';

export default function AttendancePage() {
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
              <Button size="sm" variant="outline" className="gap-1">
                <ListFilter className="h-3.5 w-3.5" />
                <span>فلاتر</span>
              </Button>
               <Button size="sm" variant="outline" className="gap-1">
                <Upload className="h-3.5 w-3.5" />
                <span>استيراد</span>
              </Button>
               <Button size="sm" variant="outline" className="gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span>إدخال يدوي</span>
              </Button>
               <Button size="sm" className="gap-1">
                <ServerCog className="h-3.5 w-3.5" />
                <span>مزامنة</span>
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
