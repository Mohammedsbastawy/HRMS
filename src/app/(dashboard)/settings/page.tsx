
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Fingerprint, Users, KeyRound, WalletCards } from 'lucide-react';
import { ZktFingerprintSettings } from './_components/zkt-settings';
import { UserManagement } from './_components/user-management';
import { PayrollComponents } from './_components/payroll-components';

export default function SettingsPage() {
  return (
    <Tabs defaultValue="users" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="users">
          <Users className="ml-2 h-4 w-4" />
          إدارة المستخدمين
        </TabsTrigger>
        <TabsTrigger value="roles">
          <KeyRound className="ml-2 h-4 w-4" />
          إدارة الأدوار
        </TabsTrigger>
        <TabsTrigger value="fingerprint">
          <Fingerprint className="ml-2 h-4 w-4" />
          جهاز البصمة
        </TabsTrigger>
        <TabsTrigger value="components">
          <WalletCards className="ml-2 h-4 w-4" />
          مكونات الرواتب
        </TabsTrigger>
      </TabsList>
      <TabsContent value="users">
        <UserManagement />
      </TabsContent>
       <TabsContent value="roles">
        {/* Role Management Component will go here */}
         <div className="text-center p-8 text-muted-foreground">
            سيتم تنفيذ إدارة الأدوار قريبًا.
        </div>
      </TabsContent>
      <TabsContent value="fingerprint">
        <ZktFingerprintSettings />
      </TabsContent>
       <TabsContent value="components">
        <PayrollComponents />
      </TabsContent>
    </Tabs>
  );
}
