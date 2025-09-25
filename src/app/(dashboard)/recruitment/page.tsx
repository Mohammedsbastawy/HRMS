
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, PlusCircle, Search, Eye, Edit, Trash2 } from 'lucide-react';
import { applicants, jobs } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

const stages = ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected'];
const stageLabels: { [key: string]: string } = {
  Applied: 'المتقدمون',
  Screening: 'الفحص',
  Interview: 'المقابلة',
  Offer: 'العرض',
  Hired: 'تم التعيين',
  Rejected: 'مرفوض',
};

const ApplicantCard = ({ applicant }: { applicant: (typeof applicants)[0] }) => (
  <Card>
    <CardContent className="p-4">
      <div className="flex items-start gap-4">
        <Avatar>
          <AvatarImage src={applicant.avatar} alt={applicant.name} />
          <AvatarFallback>{applicant.name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="font-semibold">{applicant.name}</p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>عرض التفاصيل</DropdownMenuItem>
                <DropdownMenuItem>نقل إلى...</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <p className="text-sm text-muted-foreground">{applicant.jobTitle}</p>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function RecruitmentPage() {
  const getStatusVariant = (status: 'Open' | 'Closed' | 'On-Hold') => {
    switch (status) {
      case 'Open':
        return 'default';
      case 'Closed':
        return 'destructive';
      case 'On-Hold':
        return 'secondary';
      default:
        return 'outline';
    }
  };
   const getStatusText = (status: 'Open' | 'Closed' | 'On-Hold') => {
    switch (status) {
      case 'Open':
        return 'مفتوحة';
      case 'Closed':
        return 'مغلقة';
      case 'On-Hold':
        return 'معلقة';
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader>
        <div className="flex items-center justify-between">
            <div>
                <CardTitle>الوظائف الشاغرة</CardTitle>
                <CardDescription>إدارة الوظائف المفتوحة والمغلقة في الشركة.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative">
                     <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                     <Input
                        type="search"
                        placeholder="بحث عن وظيفة..."
                        className="w-full appearance-none bg-background pl-8"
                     />
                </div>
                <Button asChild size="sm" className="gap-1">
                <Link href="#">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة وظيفة</span>
                </Link>
                </Button>
            </div>
        </div>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="text-right">الرقم</TableHead>
                        <TableHead className="text-right">المسمى الوظيفي</TableHead>
                        <TableHead className="text-right">القسم</TableHead>
                        <TableHead className="text-right">الحالة</TableHead>
                        <TableHead className="text-right">تاريخ النشر</TableHead>
                        <TableHead className="text-right">إجراءات</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.map(job => (
                        <TableRow key={job.id}>
                            <TableCell>{job.id}</TableCell>
                            <TableCell className="font-medium">{job.title}</TableCell>
                            <TableCell>{job.department}</TableCell>
                            <TableCell>
                               <Badge variant={getStatusVariant(job.status)}>{getStatusText(job.status)}</Badge>
                            </TableCell>
                            <TableCell>{job.postedDate}</TableCell>
                            <TableCell className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon">
                                    <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

      <div>
        <div className="mb-4">
          <h2 className="font-headline text-2xl font-bold">مسار توظيف: <span className="font-body font-normal">مهندس برمجيات</span></h2>
          <p className="text-muted-foreground">إدارة المتقدمين للوظائف من البداية إلى النهاية.</p>
        </div>
        <div className="flex-1 overflow-x-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 min-w-max">
            {stages.map((stage) => (
                <div key={stage} className="flex flex-col gap-4">
                <div className="rounded-lg bg-muted p-3">
                    <h3 className="font-semibold mb-4">{stageLabels[stage]}</h3>
                    <div className="space-y-4">
                    {applicants
                        .filter((applicant) => applicant.stage === stage)
                        .map((applicant) => (
                        <ApplicantCard key={applicant.id} applicant={applicant} />
                        ))}
                    </div>
                </div>
                </div>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}
