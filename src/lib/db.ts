
import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const dbPath = path.join(process.cwd(), 'database');
const dbFile = path.join(dbPath, 'hrms.db');

// Ensure the database directory exists
fs.mkdirSync(dbPath, { recursive: true });

const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// --- Schema Definition ---
const schema = `
CREATE TABLE IF NOT EXISTS locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    address TEXT,
    city TEXT,
    country TEXT,
    phone TEXT,
    email TEXT,
    manager_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE,
    name_ar TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    phone TEXT,
    email TEXT,
    manager_id INTEGER,
    budget REAL,
    headcount INTEGER DEFAULT 0,
    parent_department_id INTEGER,
    location_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL,
    FOREIGN KEY (parent_department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS job_titles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    department_id INTEGER NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    date_of_birth TEXT,
    gender TEXT,
    address TEXT,
    marital_status TEXT,
    national_id TEXT UNIQUE,
    department_id INTEGER,
    job_title_id INTEGER,
    location_id INTEGER,
    contract_type TEXT,
    hire_date TEXT,
    manager_id INTEGER,
    base_salary REAL,
    allowances REAL,
    bank_account_number TEXT,
    tax_number TEXT,
    social_insurance_number TEXT,
    status TEXT DEFAULT 'Active',
    avatar TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (job_title_id) REFERENCES job_titles(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL,
    FOREIGN KEY (manager_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER UNIQUE,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Employee',
    account_status TEXT DEFAULT 'Active',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    file_path TEXT NOT NULL,
    type TEXT NOT NULL,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    check_in TEXT,
    check_out TEXT,
    status TEXT,
    notes TEXT,
    UNIQUE(employee_id, date),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leave_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    leave_type TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    status TEXT DEFAULT 'Pending',
    approved_by INTEGER,
    notes TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS payrolls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    month TEXT NOT NULL,
    year INTEGER NOT NULL,
    base_salary REAL NOT NULL,
    overtime REAL DEFAULT 0,
    deductions REAL DEFAULT 0,
    tax REAL DEFAULT 0,
    insurance REAL DEFAULT 0,
    net_salary REAL NOT NULL,
    generated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'Generated',
    UNIQUE(employee_id, month, year),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS performance_reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    review_date TEXT NOT NULL,
    score REAL NOT NULL,
    reviewer_id INTEGER,
    comments TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES employees(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    department_id INTEGER,
    job_title_id INTEGER,
    location_id INTEGER,
    status TEXT DEFAULT 'Open',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    FOREIGN KEY (job_title_id) REFERENCES job_titles(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS applicants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    cv_path TEXT,
    stage TEXT DEFAULT 'Applied',
    applied_at TEXT DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    avatar TEXT,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS training_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    provider TEXT,
    start_date TEXT,
    end_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS training_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Enrolled',
    result TEXT,
    completed_at TEXT,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES training_courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action TEXT NOT NULL,
    details TEXT,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);
`;

// Execute the schema to create tables if they don't exist
db.exec(schema);

export default db;

// --- Update Triggers ---
// This is a more robust way to handle `updated_at`
const tablesWithUpdatedAt = [
    'locations', 'departments', 'job_titles', 'employees', 'users', 'leave_requests', 'jobs'
];

tablesWithUpdatedAt.forEach(table => {
    db.exec(`
        CREATE TRIGGER IF NOT EXISTS update_${table}_updated_at
        AFTER UPDATE ON ${table}
        FOR EACH ROW
        BEGIN
            UPDATE ${table}
            SET updated_at = CURRENT_TIMESTAMP
            WHERE id = OLD.id;
        END;
    `);
});

// --- Headcount Trigger for Departments ---
db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_department_headcount_on_insert
    AFTER INSERT ON employees
    WHEN NEW.department_id IS NOT NULL
    BEGIN
        UPDATE departments
        SET headcount = (SELECT COUNT(*) FROM employees WHERE department_id = NEW.department_id)
        WHERE id = NEW.department_id;
    END;
`);

db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_department_headcount_on_delete
    AFTER DELETE ON employees
    WHEN OLD.department_id IS NOT NULL
    BEGIN
        UPDATE departments
        SET headcount = (SELECT COUNT(*) FROM employees WHERE department_id = OLD.department_id)
        WHERE id = OLD.department_id;
    END;
`);

db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_department_headcount_on_update
    AFTER UPDATE OF department_id ON employees
    BEGIN
        -- Decrement old department count
        UPDATE departments
        SET headcount = (SELECT COUNT(*) FROM employees WHERE department_id = OLD.department_id)
        WHERE id = OLD.department_id;
        
        -- Increment new department count
        UPDATE departments
        SET headcount = (SELECT COUNT(*) FROM employees WHERE department_id = NEW.department_id)
        WHERE id = NEW.department_id;
    END;
`);

console.log('Database initialized successfully.');
