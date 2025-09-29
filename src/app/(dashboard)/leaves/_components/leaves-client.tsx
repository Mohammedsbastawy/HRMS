
'use client';

import { useState, useEffect, startTransition, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, PlusCircle, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { LeaveRequest, Employee } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { RequestLeaveDialog } from './request-leave-dialog';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

type User = {
  id: number;
  username: string;
  role: 'Admin' | 'HR' | 'Manager' | 'Employee';
}

export function LeaveRequestClientPage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  const fetchLeaveRequests = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        router.push('/login');
        return;
      }
      
      const [leavesRes, employeesRes] = await Promise.all([
        fetch('/api/leaves', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/employees', { headers: { 'Authorization': `Bearer ${token}` } })
      ]);

      if (leavesRes.status === 401 || employeesRes.status === 401) {
          toast({ variant: 'destructive', title: 'الجلسة منتهية', description: 'يرجى تسجيل الدخول مرة أخرى.', responseStatus: 401 });
          return;
      }
      
      if (!leavesRes.ok) throw new Error('Failed to fetch leave requests');
      if (!employeesRes.ok) throw new Error('Failed to fetch employees');

      const leavesData = await leavesRes.json();
      const employeesData = await employeesRes.json();
      
      setLeaveRequests(leavesData.leaveRequests);
      setEmployees(employeesData.employees);

    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'خطأ',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, router]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchLeaveRequests();
  }, [fetchLeaveRequests]);

  const handleAction = async (id: number, action: 'approve' | 'reject', notes?: string) => {
    try {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/login');
            return;
        }
        const response = await fetch(`/api/leaves/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ action, notes }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'فشل في تحديث الطلب');
        }

        toast({
            title: result.success ? (action === 'approve' ? 'تمت الموافقة' : 'تم الرفض') : 'خطأ',
            description: result.message,
            variant: result.success ? 'default' : 'destructive',
        });
        
        startTransition(() => {
            fetchLeaveRequests();
        });

    } catch (error: any) {
        toast({
            title: 'حدث خطأ',
            description: error.message,
            variant: 'destructive',
        });
    }
  };


  const handleApprove = (id: number) => {
    handleAction(id, 'approve');
  };

  const handleRejectClick = (request: LeaveRequest) => {
    setSelectedRequest(request);
    setIsRejectDialogOpen(true);
  };
  
  const confirmReject = () => {
    if (selectedRequest) {
      handleAction(selectedRequest.id, 'reject', rejectionReason);
    }
    setIsRejectDialogOpen(false);
    setRejectionReason('');
    setSelectedRequest(null);
  };

  const getStatusVariant = (status: 'Pending' | 'Approved' | 'Rejected' | 'Draft') => {
    switch (status) {
      case 'Approved': return 'default';
      case 'Pending': return 'secondary';
      case 'Rejected': return 'destructive';
      case 'Draft': return 'outline';
      default: return 'outline';
    }
  };
  
  const getStatusText = (status: 'Pending' | 'Approved' | 'Rejected' | 'Draft') => {
    const translations: {[key: string]: string} = {
      'Approved': 'موافق عليه',
      'Pending': 'قيد الانتظار',
      'Rejected': 'مرفوض',
      'Draft': 'مسودة',
    };
    return translations[status] || status;
  };

  const getLeaveTypeText = (leaveType: string) => {
    const types: { [key: string]: string } = {
      'Annual': 'سنوية', 'Sick': 'مرضية', 'Unpaid': 'غير مدفوعة', 'Maternity': 'أمومة', 'Permission': 'إذن'
    };
    return types[leaveType] || leaveType;
  };
  
  const canManage = user?.role !== 'Employee';

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{canManage ? 'إدارة الإجازات والأذونات' : 'إجازاتي'}</CardTitle>
            <CardDescription>
              {canManage ? 'مراجعة وإدارة طلبات إجازات وأذونات الموظفين.' : 'عرض وتقديم طلبات الإجازة الخاصة بك.'}
            </CardDescription>
          </div>
          { (
            <Button size="sm" className="gap-1" onClick={() => setIsRequestDialogOpen(true)}>
              <PlusCircle className="h-3.5 w-3.5" />
              <span>{canManage ? 'إضافة إجازة/إذن يدوي' : 'طلب إجازة'}</span>
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {canManage && <TableHead className="text-right">الموظف</TableHead>}
                <TableHead className="text-right">نوع الطلب</TableHead>
                <TableHead className="text-right">التواريخ</TableHead>
                <TableHead className="text-right">المدة</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">ملاحظات</TableHead>
                {canManage && <TableHead><span className="sr-only">الإجراءات</span></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                  <TableRow>
                      <TableCell colSpan={canManage ? 7 : 5} className="h-24 text-center">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                      </TableCell>
                  </TableRow>
              ) : leaveRequests.length > 0 ? (
                leaveRequests.map((request) => (
                  <TableRow key={request.id}>
                    {canManage && (
                      <TableCell>
                        <div className="flex items-center gap-3 justify-end">
                          <div className='text-right'>
                            <div className="font-medium">{request.employee.full_name}</div>
                            <div className="text-sm text-muted-foreground">{`#${request.employee_id}`}</div>
                          </div>
                          <Avatar>
                            <AvatarImage src={request.employee.avatar || undefined} alt={request.employee.full_name || ''} />
                            <AvatarFallback>{request.employee.full_name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>{getLeaveTypeText(request.leave_type)}</TableCell>
                    <TableCell>{`${new Date(request.start_date).toLocaleDateString('ar-EG')} - ${new Date(request.end_date).toLocaleDateString('ar-EG')}`}</TableCell>
                    <TableCell>{request.days_count ? `${request.days_count} يوم` : (request.hours_count ? `${request.hours_count} س` : '-')}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusVariant(request.status)}
                        className={
                            request.status === 'Approved' ? 'bg-green-100 text-green-800 border-green-200' 
                          : request.status === 'Rejected' ? 'bg-red-100 text-red-800 border-red-200'
                          : ''
                        }
                      >
                        {getStatusText(request.status)}
                      </Badge>
                    </TableCell>
                     <TableCell>{request.notes || '-'}</TableCell>
                    {canManage && (
                        <TableCell>
                        {request.status === 'Pending' && (
                            <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuLabel>الإجراءات</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleApprove(request.id)}>
                                <CheckCircle className="ml-2 h-4 w-4 text-green-500" />
                                موافقة
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleRejectClick(request)} className="text-destructive focus:text-destructive">
                                <XCircle className="ml-2 h-4 w-4" />
                                رفض
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                        </TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={canManage ? 7 : 5} className="h-24 text-center">
                    لا توجد طلبات إجازة حاليًا.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <RequestLeaveDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        onSuccess={() => {
          setIsRequestDialogOpen(false);
          fetchLeaveRequests();
        }}
        employees={employees}
        isManager={canManage}
      />
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد رفض طلب الإجازة</DialogTitle>
            <DialogDescription>
              أنت على وشك رفض طلب الإجازة للموظف "{selectedRequest?.employee.full_name}". يرجى كتابة سبب الرفض.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">سبب الرفض</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="مثال: نقص في عدد الموظفين خلال هذه الفترة."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={!rejectionReason}>تأكيد الرفض</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
