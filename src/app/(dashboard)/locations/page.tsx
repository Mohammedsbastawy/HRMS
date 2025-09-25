
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Edit, Trash2, Eye } from 'lucide-react';
import Link from 'next/link';
import type { Location, Employee } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';


const locations: Location[] = []; // Data is now empty
const employees: Employee[] = []; // Data is now empty

export default function LocationsPage() {

    const getManagerName = (managerId: number | null | undefined) => {
        if (!managerId) return 'غير محدد';
        const manager = employees.find(e => e.id === managerId);
        return manager?.full_name || 'غير معروف';
    };

  return (
    <div className="flex flex-col gap-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>إدارة مواقع الشركة</CardTitle>
            <CardDescription>عرض وتعديل فروع ومواقع الشركة.</CardDescription>
          </div>
            <div className="flex items-center gap-2">
                 <div className="relative">
                     <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                     <Input
                        type="search"
                        placeholder="بحث عن موقع..."
                        className="w-full appearance-none bg-background pr-8"
                     />
                </div>
                <Button asChild size="sm" className="gap-1">
                    <Link href="/locations/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">إضافة موقع</span>
                    </Link>
                </Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الرمز</TableHead>
                <TableHead className="text-right">اسم الموقع</TableHead>
                <TableHead className="text-right">المدينة</TableHead>
                <TableHead className="text-right">الدولة</TableHead>
                <TableHead className="text-right">المدير المسؤول</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.length > 0 ? (
                locations.map((loc) => (
                    <TableRow key={loc.id}>
                    <TableCell>{loc.code}</TableCell>
                    <TableCell className="font-medium">{loc.name}</TableCell>
                    <TableCell>{loc.city}</TableCell>
                    <TableCell>{loc.country}</TableCell>
                    <TableCell>{getManagerName(loc.manager_id)}</TableCell>
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
                ))
              ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                        لا توجد مواقع مسجلة حتى الآن.
                        <Button variant="link" asChild className="mt-2 block">
                           <Link href="/locations/new">ابدأ بإضافة موقع جديد</Link>
                        </Button>
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
