
'use client';

import { useState } from 'react';
import type { Applicant } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Eye, Edit, Trash2, ArrowRightCircle, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/components/ui/use-toast';
import { useRouter } from 'next/navigation';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ApplicantCardProps {
  applicant: Applicant;
  onActionComplete: () => void;
  onEdit: (applicant: Applicant) => void;
}

const STAGES = [
  { id: 'Applied', title: 'التقديم' },
  { id: 'Screening', title: 'الفرز' },
  { id: 'Interview', title: 'المقابلة' },
  { id: 'Offer', title: 'العرض' },
  { id: 'Hired', title: 'تم التوظيف' },
  { id: 'Rejected', title: 'مرفوض' },
];

export function ApplicantCard({ applicant, onActionComplete, onEdit }: ApplicantCardProps) {
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleAction = async (action: 'move' | 'delete' | 'hire', newStage?: string) => {
    try {
      const token = localStorage.getItem('authToken');
      let url = '';
      let method = 'PUT';
      let body: any = null;

      if (action === 'move') {
        url = `/api/recruitment/applicants/${applicant.id}/stage`;
        body = JSON.stringify({ stage: newStage });
      } else if (action === 'delete') {
        url = `/api/recruitment/applicants/${applicant.id}`;
        method = 'DELETE';
      } else if (action === 'hire') {
        url = `/api/recruitment/applicants/${applicant.id}/hire`;
        method = 'POST';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'فشل تنفيذ الإجراء');
      
      let successMessage = `تم نقل ${applicant.full_name} إلى مرحلة "${STAGES.find(s => s.id === newStage)?.title}"`;
      if (action === 'delete') successMessage = `تم حذف ${applicant.full_name}`;
      if (action === 'hire') successMessage = `تم توظيف ${applicant.full_name} بنجاح!`;

      toast({ title: successMessage });
      
      if (action === 'hire') {
        router.push('/employees?tab=new_joiners'); // Navigate to employees page to see new joiner
      } else {
        onActionComplete();
      }

    } catch (error: any) {
      toast({ variant: 'destructive', title: 'خطأ', description: error.message });
    } finally {
      if (action === 'delete') setIsDeleteAlertOpen(false);
    }
  };


  return (
    <>
      <Card className="mb-2">
        <CardContent className="p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <Avatar className="h-9 w-9">
                <AvatarImage src={applicant.avatar} alt={applicant.full_name} />
                <AvatarFallback>{applicant.full_name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="grid gap-0.5 text-sm overflow-hidden">
                <div className="font-medium truncate">{applicant.full_name}</div>
                <div className="text-xs text-muted-foreground truncate">{applicant.email}</div>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">إجراءات المتقدم</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>إجراءات</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => handleAction('hire')}>
                  <Briefcase className="ml-2 h-4 w-4" />
                  توظيف
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onEdit(applicant)}>
                  <Eye className="ml-2 h-4 w-4" />
                  عرض / تعديل التفاصيل
                </DropdownMenuItem>
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <ArrowRightCircle className="ml-2 h-4 w-4" />
                      <span>نقل إلى</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        {STAGES.map(stage => (
                          <DropdownMenuItem 
                            key={stage.id} 
                            disabled={applicant.stage === stage.id}
                            onSelect={() => handleAction('move', stage.id)}
                          >
                            {stage.title}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => setIsDeleteAlertOpen(true)}>
                  <Trash2 className="ml-2 h-4 w-4" />
                  حذف المتقدم
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </CardContent>
      </Card>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                    هل أنت متأكد من رغبتك في حذف المتقدم "{applicant.full_name}"؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleAction('delete')} className="bg-destructive hover:bg-destructive/90">تأكيد الحذف</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
