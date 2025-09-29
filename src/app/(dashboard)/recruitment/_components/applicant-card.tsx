
'use client';

import type { Applicant } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, Eye, Edit, Trash2, ArrowRightCircle } from 'lucide-react';
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

interface ApplicantCardProps {
  applicant: Applicant;
}

const STAGES = [
  { id: 'Applied', title: 'التقديم' },
  { id: 'Screening', title: 'الفرز' },
  { id: 'Interview', title: 'المقابلة' },
  { id: 'Offer', title: 'العرض' },
  { id: 'Hired', title: 'تم التوظيف' },
  { id: 'Rejected', title: 'مرفوض' },
];

export function ApplicantCard({ applicant }: ApplicantCardProps) {
  
  const handleMove = (newStage: string) => {
    // Placeholder for moving logic
    console.log(`Move applicant ${applicant.id} to stage ${newStage}`);
  };

  return (
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
              <DropdownMenuItem>
                <Eye className="ml-2 h-4 w-4" />
                عرض التفاصيل
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="ml-2 h-4 w-4" />
                تعديل
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
                          onClick={() => handleMove(stage.id)}
                        >
                          {stage.title}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="ml-2 h-4 w-4" />
                حذف المتقدم
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </CardContent>
    </Card>
  );
}
