'use client';

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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Edit, Trash2 } from 'lucide-react';
import type { Job } from '@/lib/types';

interface JobsTableProps {
    jobs: Job[];
}

export function JobsTable({ jobs }: JobsTableProps) {
  
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Open': return 'default';
      case 'On-Hold': return 'secondary';
      case 'Closed': return 'destructive';
      default: return 'outline';
    }
  };
  const getStatusText = (status: string) => {
    const map: { [key: string]: string } = { 'Open': 'مفتوحة', 'On-Hold': 'معلقة', 'Closed': 'مغلقة' };
    return map[status] || status;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>المسمى الوظيفي</TableHead>
          <TableHead>القسم</TableHead>
          <TableHead>المتاح</TableHead>
          <TableHead>تم التوظيف</TableHead>
          <TableHead>المتقدمون</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead>الإجراءات</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.length > 0 ? (
          jobs.map(job => (
            <TableRow key={job.id}>
              <TableCell className="font-medium">{job.title}</TableCell>
              <TableCell>{job.department?.name_ar || 'غير محدد'}</TableCell>
              <TableCell>{job.openings}</TableCell>
              <TableCell>{job.hires_count}</TableCell>
              <TableCell>{job.applicants_count}</TableCell>
              <TableCell>
                <Badge variant={getStatusVariant(job.status)}>{getStatusText(job.status)}</Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="ml-2 h-4 w-4" /> عرض المتقدمين
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="ml-2 h-4 w-4" /> تعديل الوظيفة
                    </DropdownMenuItem>
                    <DropdownMenuItem disabled>
                        🌐 معاينة الصفحة العامة
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive focus:text-destructive">
                      <Trash2 className="ml-2 h-4 w-4" /> حذف
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={7} className="h-24 text-center">
              لا توجد وظائف شاغرة حاليًا.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
