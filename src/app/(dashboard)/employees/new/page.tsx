
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { Department, JobTitle, Location } from "@/lib/types";
import db from '@/lib/db';
import { EmployeeForm } from "./_components/employee-form";

// This is now a server component to fetch initial data
export default function NewEmployeePage() {
  
  const departments: Department[] = (() => {
    try {
      return db.prepare('SELECT id, name_ar FROM departments').all() as Department[];
    } catch (error) {
      console.error(error);
      return [];
    }
  })();

  const jobTitles: JobTitle[] = (() => {
    try {
      return db.prepare('SELECT id, title_ar, department_id FROM job_titles').all() as JobTitle[];
    } catch (error) {
      console.error(error);
      return [];
    }
  })();
  
  const locations: Location[] = (() => {
    try {
      return db.prepare('SELECT id, name_ar FROM locations').all() as Location[];
    } catch (error) {
      console.error(error);
      return [];
    }
  })();

  const managers: { id: number, full_name: string }[] = (() => {
    try {
      // Fetching potential managers (can be any employee)
      return db.prepare('SELECT id, full_name FROM employees WHERE status = \'Active\'').all() as { id: number, full_name: string }[];
    } catch (error) {
      console.error(error);
      return [];
    }
  })();


  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>إضافة موظف جديد</CardTitle>
        <CardDescription>
          املأ النموذج أدناه لإضافة موظف جديد إلى النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <EmployeeForm 
          departments={departments}
          jobTitles={jobTitles}
          locations={locations}
          managers={managers}
        />
      </CardContent>
    </Card>
  );
}

