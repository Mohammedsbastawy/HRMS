
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Loader2, AlertCircle, CheckCircle, FileText, Clock, XCircle, Ban, HelpCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useParams, useRouter } from 'next/navigation';
import type { Employee } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DocumentType {
  id: number;
  code: string;
  title_ar: string;
  title_en: string;
  category: string;
  default_required: boolean;
  requires_expiry: boolean;
}

interface ChecklistItem {
  doc_type: DocumentType;
  status: 'Missing' | 'Uploaded' | 'Verified' | 'Rejected' | 'Expired' | 'Expiring' | 'NotApplicable';
  file_path: string | null;
  expiry_date: string | null;
  note: string | null;
}

const statusMap = {
  Missing: { text: 'مفقود', icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  Uploaded: { text: 'تم الرفع', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  Verified: { text: 'تم التحقق', icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10' },
  Rejected: { text: 'مرفوض', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  Expired: { text: 'منتهي الصلاحية', icon: AlertCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
  Expiring: { text: 'قارب على الانتهاء', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  NotApplicable: { text: 'غير مطلوب', icon: Ban, color: 'text-muted-foreground', bg: 'bg-muted/50' },
};


export default function EmployeeChecklistPage() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const employeeId = params.employeeId as string;

  useEffect(() => {
    async function fetchData() {
      if (!employeeId) return;
      setIsLoading(true);
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          router.push('/login');
          return;
        }
        const headers = { Authorization: `Bearer ${token}` };

        const [employeeRes, checklistRes] = await Promise.all([
          fetch(`/api/employees/${employeeId}`, { headers }),
          fetch(`/api/documents/employee/${employeeId}/checklist`, { headers }),
        ]);

        if (!employeeRes.ok) throw new Error('فشل في جلب بيانات الموظف');
        if (!checklistRes.ok) throw new Error('فشل في جلب قائمة المستندات');

        const employeeData = await employeeRes.json();
        const checklistData = await checklistRes.json();
        
        setEmployee(employeeData);
        setChecklist(checklistData.checklist || []);

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
    fetchData();
  }, [employeeId, router, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return <div>لم يتم العثور على الموظف.</div>
  }

  const basicDocs = checklist.filter(item => item.doc_type.category === 'basic');
  const additionalDocs = checklist.filter(item => item.doc_type.category === 'additional');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={employee?.avatar} alt={employee?.full_name} />
            <AvatarFallback>{employee?.full_name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{employee?.full_name}</CardTitle>
            <CardDescription>
              {employee?.jobTitle?.title_ar} في قسم {employee?.department?.name_ar}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {checklist.map(item => {
            const status = statusMap[item.status] || statusMap.Missing;
            const Icon = status.icon;
            let expiryColor = "text-muted-foreground";
            if (item.status === 'Expired') expiryColor = "text-destructive font-semibold";
            if (item.status === 'Expiring') expiryColor = "text-amber-600 font-semibold";

            return (
                <Card key={item.doc_type.id} className={`${status.bg} border-0`}>
                    <CardHeader>
                         <div className="flex justify-between items-start">
                             <div className="flex items-center gap-2">
                                <Icon className={`h-5 w-5 ${status.color}`} />
                                <CardTitle className="text-lg">{item.doc_type.title_ar}</CardTitle>
                             </div>
                             <Badge variant={item.doc_type.default_required ? 'default' : 'secondary'}>
                                {item.doc_type.default_required ? 'مطلوب' : 'اختياري'}
                             </Badge>
                         </div>
                    </CardHeader>
                    <CardContent>
                        <p className={`text-sm font-semibold ${status.color}`}>{status.text}</p>
                        {item.doc_type.requires_expiry && (
                             <p className={`text-xs mt-1 ${expiryColor}`}>
                                {item.expiry_date ? `تاريخ الانتهاء: ${new Date(item.expiry_date).toLocaleDateString('ar-EG')}` : 'تاريخ الانتهاء غير محدد'}
                             </p>
                        )}
                         <div className="mt-4 flex gap-2">
                            <Button size="sm" variant="outline">
                                {item.file_path ? 'استبدال' : 'رفع'}
                            </Button>
                             {item.file_path && (
                                <Button size="sm" variant="ghost">معاينة</Button>
                            )}
                         </div>
                    </CardContent>
                </Card>
            )
        })}
        {checklist.length === 0 && (
             <div className="md:col-span-2 text-center text-muted-foreground p-8 border rounded-lg">
                لا توجد متطلبات مستندات معرفة لهذا الموظف.
            </div>
        )}
      </div>
    </div>
  );
}
