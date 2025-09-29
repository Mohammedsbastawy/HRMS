
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useRouter, useParams } from 'next/navigation';
import type { Employee } from '@/lib/types';


export default function EmployeeChecklistPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ employeeId: string }>();
  const { employeeId } = params;

  useEffect(() => {
    async function fetchEmployee() {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }
        const response = await fetch(`/api/employees/${employeeId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error('فشل في جلب بيانات الموظف');
        const data = await response.json();
        setEmployee(data);
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'خطأ',
          description: error.message,
        });
      } finally {
        setIsLoading(false);
      }
    }
    if (employeeId) {
        fetchEmployee();
    }
  }, [employeeId, router, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>قائمة مستندات الموظف: {employee?.full_name}</CardTitle>
        <CardDescription>
          إدارة المستندات المطلوبة والمرفوعة للموظف. (قيد التطوير)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-muted-foreground p-8">
            سيتم هنا عرض قائمة المستندات المطلوبة من الموظف وحالتها وخيارات الرفع.
        </div>
      </CardContent>
    </Card>
  );
}
