
from flask import Flask, jsonify, request, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime, date, time, timedelta
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager, get_jwt
from zk import ZK, const
from collections import defaultdict
from sqlalchemy import func, inspect, CheckConstraint, Time, Date, cast, text
from werkzeug.utils import secure_filename
import re

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize Flask App
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configure Database & Secret Key
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'hrms.db')
UPLOAD_FOLDER = os.path.join(basedir, 'uploads')


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config["JWT_SECRET_KEY"] = os.environ.get('SECRET_KEY', "super-secret-key-change-it") # Change this in your production environment
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Ensure upload directory exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)


# --- Database Models ---

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True)
    username = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)
    role = db.Column(db.String, nullable=False, default='Employee')
    account_status = db.Column(db.String, default='Active')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    employee = db.relationship('Employee', backref='user_account', uselist=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'account_status': self.account_status,
            'employee_id': self.employee_id
        }

class Location(db.Model):
    __tablename__ = 'locations'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String, unique=True)
    name_ar = db.Column(db.String, nullable=False)
    name_en = db.Column(db.String, nullable=False)
    description = db.Column(db.String)
    address = db.Column(db.String)
    city = db.Column(db.String)
    country = db.Column(db.String)
    phone = db.Column(db.String)
    email = db.Column(db.String)
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self, include_manager=False):
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if include_manager and hasattr(self, 'manager') and self.manager:
            data['manager'] = {'full_name': self.manager.full_name}
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('updated_at'), datetime):
            data['updated_at'] = data['updated_at'].isoformat()
        return data

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String, unique=True)
    name_ar = db.Column(db.String, nullable=False)
    name_en = db.Column(db.String, nullable=False)
    description = db.Column(db.String)
    phone = db.Column(db.String)
    email = db.Column(db.String)
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    budget = db.Column(db.Float)
    parent_department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    job_titles = db.relationship('JobTitle', backref='department', lazy=True, cascade="all, delete-orphan")


    def to_dict(self):
        d = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        d['headcount'] = Employee.query.filter_by(department_id=self.id).count()
        if isinstance(d.get('created_at'), datetime):
            d['created_at'] = d['created_at'].isoformat()
        if isinstance(d.get('updated_at'), datetime):
            d['updated_at'] = d['updated_at'].isoformat()
        return d

class JobTitle(db.Model):
    __tablename__ = 'job_titles'
    id = db.Column(db.Integer, primary_key=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    title_ar = db.Column(db.String, nullable=False)
    title_en = db.Column(db.String, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_department=False):
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if include_department and self.department:
            data['department_name_ar'] = self.department.name_ar
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        if isinstance(data.get('updated_at'), datetime):
            data['updated_at'] = data['updated_at'].isoformat()
        return data

class Employee(db.Model):
    __tablename__ = 'employees'
    id = db.Column(db.Integer, primary_key=True, autoincrement=False)
    full_name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True, nullable=False)
    phone = db.Column(db.String)
    date_of_birth = db.Column(db.String)
    gender = db.Column(db.String)
    address = db.Column(db.String)
    marital_status = db.Column(db.String)
    national_id = db.Column(db.String, unique=True)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    job_title_id = db.Column(db.Integer, db.ForeignKey('job_titles.id'))
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    contract_type = db.Column(db.String)
    hire_date = db.Column(db.String)
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    base_salary = db.Column(db.Float)
    allowances = db.Column(db.Float)
    bank_account_number = db.Column(db.String)
    tax_number = db.Column(db.String)
    social_insurance_number = db.Column(db.String)
    status = db.Column(db.String, default='Active')
    avatar = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    department = db.relationship('Department', foreign_keys=[department_id], backref='employees', lazy=True)
    job_title = db.relationship('JobTitle', backref='employees', lazy=True)
    location = db.relationship('Location', foreign_keys=[location_id], backref='employees', lazy=True)
    
    manager = db.relationship('Employee', remote_side=[id])
    managed_locations = db.relationship('Location', foreign_keys=[Location.manager_id], backref='manager', lazy=True)


    def to_dict(self, full=False):
        data = {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'hire_date': self.hire_date,
            'status': self.status,
            'avatar': self.avatar,
            'department': {'name_ar': self.department.name_ar, 'name_en': self.department.name_en} if self.department else None,
            'jobTitle': {'title_ar': self.job_title.title_ar} if self.job_title else None
        }
        if full:
            # Add all other fields for the edit form
            for c in self.__table__.columns:
                if c.name not in data:
                    val = getattr(self, c.name)
                    if isinstance(val, (datetime, date)):
                        data[c.name] = val.isoformat()
                    else:
                        data[c.name] = val
        return data

# --- Attendance & Timesheets Models ---

class ZktDevice(db.Model):
    __tablename__ = 'zkt_devices'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    provider = db.Column(db.String, default='zkteco', nullable=False)
    ip_address = db.Column(db.String, nullable=False, unique=True)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    last_sync_at = db.Column(db.DateTime)
    status = db.Column(db.String, default='online') # online, offline, error
    
    location = db.relationship('Location', backref='zkt_devices')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'location_id': self.location_id,
            'location_name': self.location.name_ar if self.location else None,
            'last_sync_at': self.last_sync_at.isoformat() if self.last_sync_at else None,
            'status': self.status
        }

class DeviceLog(db.Model):
    __tablename__ = 'device_logs'
    id = db.Column(db.Integer, primary_key=True)
    device_id = db.Column(db.Integer, db.ForeignKey('zkt_devices.id'))
    employee_id = db.Column(db.Integer)
    log_datetime = db.Column(db.DateTime, nullable=False)
    log_type = db.Column(db.String, default='punch') # in, out, punch
    source = db.Column(db.String, default='device') # device, file, api, manual
    raw_payload = db.Column(db.String)

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    date = db.Column(db.String, nullable=False)
    check_in = db.Column(db.String)
    check_out = db.Column(db.String)
    status = db.Column(db.String, default='Present') # Present, Absent, On Leave
    
    employee = db.relationship('Employee', backref='attendance_records')

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employeeName': self.employee.full_name if self.employee else None,
            'employeeAvatar': self.employee.avatar if self.employee else None,
            'date': self.date,
            'check_in': self.check_in,
            'check_out': self.check_out,
            'status': self.status
        }

# --- End of Attendance Models ---


class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    leave_type = db.Column(db.String, nullable=False)
    start_date = db.Column(db.String, nullable=False)
    end_date = db.Column(db.String, nullable=False)
    status = db.Column(db.String, default='Pending')
    approved_by = db.Column(db.Integer)
    notes = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    employee = db.relationship('Employee', backref='leave_requests', lazy=True)
    
    def to_dict(self):
      data = {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name not in ['created_at', 'updated_at']}
      if self.employee:
          data['employee'] = {
              'id': self.employee.id,
              'full_name': self.employee.full_name,
              'avatar': self.employee.avatar
          }
      created_at_val = getattr(self, 'created_at', None)
      if isinstance(created_at_val, datetime):
          data['created_at'] = created_at_val.isoformat()
      return data

class Payroll(db.Model):
    __tablename__ = 'payrolls'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    month = db.Column(db.Integer, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    base_salary = db.Column(db.Float, nullable=False)
    overtime = db.Column(db.Float)
    deductions = db.Column(db.Float)
    tax = db.Column(db.Float)
    insurance = db.Column(db.Float)
    net_salary = db.Column(db.Float, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String, default='Generated')
    employee = db.relationship('Employee', backref='payrolls')

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee': {'full_name': self.employee.full_name} if self.employee else None,
            'month': self.month,
            'year': self.year,
            'base_salary': self.base_salary,
            'overtime': self.overtime,
            'deductions': self.deductions,
            'tax': self.tax,
            'insurance': self.insurance,
            'net_salary': self.net_salary,
            'status': self.status
        }
        
class PerformanceReview(db.Model):
    __tablename__ = 'performance_reviews'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    review_date = db.Column(db.String, nullable=False)
    score = db.Column(db.Float, nullable=False)
    reviewer_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    comments = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    employee = db.relationship('Employee', foreign_keys=[employee_id], backref='reviews')
    reviewer = db.relationship('Employee', foreign_keys=[reviewer_id])

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'review_date': self.review_date,
            'score': self.score,
            'comments': self.comments,
            'employee': {'full_name': self.employee.full_name} if self.employee else None,
        }

class TrainingCourse(db.Model):
    __tablename__ = 'training_courses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    provider = db.Column(db.String)
    description = db.Column(db.Text)
    start_date = db.Column(db.String)
    end_date = db.Column(db.String)
    price = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        d = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        d['participant_count'] = TrainingRecord.query.filter_by(course_id=self.id).count()
        return d

class TrainingRecord(db.Model):
    __tablename__ = 'training_records'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('training_courses.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String, default='Enrolled') # Enrolled, In Progress, Completed, Failed
    result = db.Column(db.String)
    
    employee = db.relationship('Employee', backref=db.backref('training_records', cascade="all, delete-orphan"))
    course = db.relationship('TrainingCourse', backref=db.backref('training_records', cascade="all, delete-orphan"))
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'course_id': self.course_id,
            'status': self.status,
            'result': self.result,
            'employee': {
                'full_name': self.employee.full_name,
                'department': {
                    'name_ar': self.employee.department.name_ar if self.employee.department else None
                } if self.employee else None
            } if self.employee else None,
            'course': { 'title': self.course.title } if self.course else None
        }

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer) 
    username = db.Column(db.String, default='نظام')
    action = db.Column(db.String, nullable=False)
    details = db.Column(db.String)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'action': self.action,
            'details': self.details,
            'timestamp': self.timestamp.isoformat()
        }

class InAppNotification(db.Model):
    __tablename__ = 'in_app_notifications'
    id = db.Column(db.Integer, primary_key=True)
    recipient_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title = db.Column(db.String, nullable=False)
    message = db.Column(db.String, nullable=False)
    type = db.Column(db.String) # e.g., LeaveApproval, Payroll
    related_link = db.Column(db.String) # e.g., /leaves/123
    status = db.Column(db.String, default='Unread', nullable=False) # Unread, Read
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    recipient = db.relationship('User', backref='notifications')

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'related_link': self.related_link,
            'status': self.status,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class DisciplinaryAction(db.Model):
    __tablename__ = 'disciplinary_actions'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    policy_id = db.Column(db.Integer) # ForeignKey to a future DisciplinaryPolicy table
    source = db.Column(db.String, default='manual')
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String, nullable=False) # warning, deduction, suspension
    severity = db.Column(db.String) # low, medium, high
    points = db.Column(db.Integer, default=0)
    status = db.Column(db.String, default='Draft') # Draft, PendingApproval, Approved, Applied, Rejected, Reversed
    issue_date = db.Column(db.String, default=lambda: date.today().isoformat())
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employee = db.relationship('Employee', backref='disciplinary_actions')

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': self.employee.full_name if self.employee else None,
            'title': self.title,
            'description': self.description,
            'type': self.type,
            'severity': self.severity,
            'status': self.status,
            'issue_date': self.issue_date
        }

class PayrollComponent(db.Model):
    __tablename__ = 'payroll_components'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String, unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    component_type = db.Column(db.String, nullable=False) # earning, deduction, benefit, insurance
    calculation_type = db.Column(db.String, nullable=False) # fixed, percent, slab, formula
    value = db.Column(db.Float)
    rate = db.Column(db.Float)
    base = db.Column(db.String, default='base')
    taxable = db.Column(db.Boolean, default=True)
    pre_tax = db.Column(db.Boolean, default=True)
    active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class TaxScheme(db.Model):
    __tablename__ = 'tax_schemes'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    method = db.Column(db.String, nullable=False, default='slab') # slab, flat
    active = db.Column(db.Boolean, default=True)
    brackets = db.relationship('TaxBracket', backref='scheme', lazy='dynamic', cascade="all, delete-orphan")

    def to_dict(self, include_brackets=False):
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if include_brackets:
            data['brackets'] = [b.to_dict() for b in self.brackets.all()]
        return data

class TaxBracket(db.Model):
    __tablename__ = 'tax_brackets'
    id = db.Column(db.Integer, primary_key=True)
    scheme_id = db.Column(db.Integer, db.ForeignKey('tax_schemes.id', ondelete='CASCADE'), nullable=False)
    min_amount = db.Column(db.Float, nullable=False)
    max_amount = db.Column(db.Float)
    rate = db.Column(db.Float, nullable=False)
    
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

# --- Recruitment Models ---
class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.Text, nullable=False)
    dept_id = db.Column(db.Integer, db.ForeignKey('departments.id'), nullable=False)
    description = db.Column(db.Text)
    location = db.Column(db.Text)
    employment_type = db.Column(db.Text, CheckConstraint("employment_type IN ('full-time','part-time','contract','intern','temporary')"), default='full-time')
    seniority = db.Column(db.Text, CheckConstraint("seniority IN ('junior','mid','senior','lead','manager','director')"))
    openings = db.Column(db.Integer, default=1)
    hires_count = db.Column(db.Integer, default=0)
    salary_min = db.Column(db.REAL)
    salary_max = db.Column(db.REAL)
    currency = db.Column(db.Text, default='SAR')
    remote_allowed = db.Column(db.Integer, default=0)
    status = db.Column(db.Text, CheckConstraint("status IN ('Open','On-Hold','Closed')"), default='Open')
    publish_external = db.Column(db.Integer, default=0)
    external_slug = db.Column(db.Text, unique=True)
    external_url = db.Column(db.Text)
    created_at = db.Column(db.Text, default=lambda: datetime.utcnow().isoformat())
    
    department = db.relationship('Department', backref='jobs', lazy=True)
    applicants = db.relationship('Applicant', backref='job', lazy='dynamic')
    

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'dept_id': self.dept_id,
            'department': {'name_ar': self.department.name_ar} if self.department else None,
            'openings': self.openings,
            'hires_count': self.hires_count,
            'status': self.status,
            'created_at': self.created_at,
            'applicants_count': self.applicants.count()
        }

class Applicant(db.Model):
    __tablename__ = 'applicants'
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    full_name = db.Column(db.Text, nullable=False)
    email = db.Column(db.Text, nullable=False)
    phone = db.Column(db.Text)
    source = db.Column(db.Text, default='manual') # 'manual','referral','website','linkedin',…
    stage = db.Column(db.Text, CheckConstraint("stage IN ('Applied','Screening','Interview','Offer','Hired','Rejected')"), default='Applied')
    cv_path = db.Column(db.Text)
    rating = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.Text, default=lambda: datetime.utcnow().isoformat())
    avatar = db.Column(db.String)
    
    __table_args__ = (db.UniqueConstraint('job_id', 'email', name='_job_email_uc'),)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
# --- End of Recruitment Models ---

# --- Utility Functions ---
def log_action(action, details, username="نظام", user_id=None):
    try:
        log = AuditLog(action=action, details=details, username=username, user_id=user_id)
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Failed to log action: {e}")
        db.session.rollback()

def create_notification(recipient_user_id, title, message, type, related_link=None):
    try:
        notification = InAppNotification(
            recipient_user_id=recipient_user_id,
            title=title,
            message=message,
            type=type,
            related_link=related_link,
            status='Unread'
        )
        db.session.add(notification)
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Failed to create notification: {e}")
        db.session.rollback()

def migrate_db():
    """A simple migration utility to add missing columns."""
    with app.app_context():
        inspector = inspect(db.engine)
        all_tables = inspector.get_table_names()
        
        for table_name, model in db.metadata.tables.items():
            if table_name not in all_tables:
                continue
                
            # Get existing columns in the database table
            existing_columns = {c['name'] for c in inspector.get_columns(table_name)}
            
            # Get columns defined in the model
            model_columns = {c.name for c in model.columns}
            
            # Find missing columns
            missing_columns = model_columns - existing_columns
            
            if missing_columns:
                app.logger.info(f"Table '{table_name}': Found missing columns: {', '.join(missing_columns)}")
                for column_name in missing_columns:
                    column_obj = model.columns[column_name]
                    # Using a raw ALTER TABLE statement for simplicity
                    # This works for SQLite but might need adjustments for other DBs
                    try:
                        col_type = column_obj.type.compile(db.engine.dialect)
                        # A very basic ALTER TABLE. More complex changes (like NOT NULL on existing tables) need more care.
                        stmt = f'ALTER TABLE {table_name} ADD COLUMN {column_name} {col_type}'
                        db.session.execute(text(stmt))
                        app.logger.info(f"Added column '{column_name}' to table '{table_name}'.")
                    except Exception as e:
                        app.logger.error(f"Error adding column {column_name} to {table_name}: {e}")
                db.session.commit()

# --- API Routes ---

@app.route("/api")
def index():
    return jsonify({"message": "Python Flask backend for HRMS is running."})

# --- Auth API ---
@app.route("/api/login", methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        if user.account_status != 'Active':
            return jsonify({"message": "الحساب غير نشط"}), 403
        
        additional_claims = {"username": user.username, "role": user.role}
        access_token = create_access_token(identity=str(user.id), additional_claims=additional_claims)

        response = jsonify({
            "message": "Login successful",
            "token": access_token,
            "user": {
                "id": user.id,
                "username": user.username,
                "role": user.role,
            }
        })
        log_action("تسجيل دخول", f"نجح المستخدم {username} في تسجيل الدخول.", username=username, user_id=user.id)
        return response, 200

    log_action("محاولة تسجيل دخول فاشلة", f"محاولة فاشلة للدخول باسم المستخدم {username}.", username=username)
    return jsonify({"message": "اسم المستخدم أو كلمة المرور غير صحيحة"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Successfully logged out"})
    return response

# --- Account Self-Service API ---
@app.route('/api/account/me', methods=['GET'])
@jwt_required()
def get_my_account():
    current_user_id = get_jwt_identity()
    user = User.query.options(
        db.joinedload(User.employee).joinedload(Employee.department),
        db.joinedload(User.employee).joinedload(Employee.job_title)
    ).get(int(current_user_id))

    if not user:
        return jsonify({"message": "المستخدم غير موجود"}), 404

    employee_data = None
    if user.employee:
        employee_data = user.employee.to_dict()

    recent_logs = AuditLog.query.filter_by(user_id=user.id).order_by(AuditLog.timestamp.desc()).limit(10).all()

    return jsonify({
        "username": user.username,
        "role": user.role,
        "employee": employee_data,
        "audit_logs": [log.to_dict() for log in recent_logs]
    })


@app.route('/api/account/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    data = request.get_json()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if not user.check_password(current_password):
        return jsonify({"message": "كلمة المرور الحالية غير صحيحة"}), 400

    user.set_password(new_password)
    db.session.commit()

    log_action("تغيير كلمة المرور", "قام المستخدم بتغيير كلمة المرور الخاصة به.", username=user.username, user_id=user.id)
    return jsonify({"message": "تم تغيير كلمة المرور بنجاح."}), 200


# --- Users API ---
@app.route("/api/users", methods=['GET', 'POST'])
@jwt_required()
def handle_users():
    claims = get_jwt()
    user_role = claims.get('role')

    if not user_role or user_role != 'Admin':
        return jsonify({"message": "صلاحيات غير كافية"}), 403

    if request.method == 'POST':
        data = request.get_json()
        if not data or not data.get('username') or not data.get('password') or not data.get('role'):
            return jsonify({"message": "بيانات غير مكتملة"}), 400
        
        if User.query.filter_by(username=data['username']).first():
            return jsonify({"message": "اسم المستخدم موجود بالفعل"}), 409

        new_user = User(
            username=data['username'],
            role=data['role'],
            employee_id=data.get('employee_id'),
            account_status='Active'
        )
        new_user.set_password(data['password'])
        db.session.add(new_user)
        db.session.commit()
        
        user_id = get_jwt_identity()
        username = claims.get('username')
        log_action("إضافة مستخدم", f"تمت إضافة مستخدم جديد: {new_user.username}", username=username, user_id=int(user_id))
        create_notification(
            recipient_user_id=new_user.id,
            title="أهلاً بك في نظام HRMS!",
            message=f"تم إنشاء حسابك بنجاح بدور {new_user.role}.",
            type="AccountCreation"
        )
        return jsonify(new_user.to_dict()), 201

    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]})


# --- Employees API ---
@app.route("/api/employees", methods=['GET', 'POST'])
@jwt_required()
def handle_employees():
    if request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({"message": "No input data provided"}), 400
        try:
            manager_id = data.get('manager_id')
            if manager_id == 'none' or manager_id == '':
                manager_id = None
            else:
                manager_id = int(manager_id)

            new_employee = Employee(
                id=int(data['id']),
                full_name=data['full_name'],
                email=data['email'],
                department_id=int(data['department_id']),
                job_title_id=int(data['job_title_id']),
                location_id=int(data['location_id']),
                hire_date=data['hire_date'],
                base_salary=float(data['base_salary']),
                manager_id=manager_id,
                status=data['status']
            )
            db.session.add(new_employee)
            db.session.commit()
            log_action("إضافة موظف", f"تمت إضافة موظف جديد: {new_employee.full_name}")
            return jsonify(new_employee.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error adding employee: {e}")
            if 'UNIQUE constraint failed: employees.id' in str(e):
                 return jsonify({"message": "ID الموظف موجود بالفعل. يرجى استخدام ID فريد."}), 409
            if 'UNIQUE constraint failed: employees.email' in str(e):
                 return jsonify({"message": "البريد الإلكتروني موجود بالفعل. يرجى استخدام بريد إلكتروني فريد."}), 409
            return jsonify({"message": "حدث خطأ داخلي"}), 500

    exclude_id = request.args.get('exclude_id')
    query = Employee.query
    if exclude_id:
        query = query.filter(Employee.id != exclude_id)
        
    is_manager = request.args.get('is_manager')
    if is_manager == 'true':
        # Find employees who are managers of other employees
        manager_ids = db.session.query(Employee.manager_id).distinct()
        query = query.filter(Employee.id.in_([mid[0] for mid in manager_ids if mid[0] is not None]))
        employees = query.all()
        return jsonify({"employees": [{'id': e.id, 'full_name': e.full_name} for e in employees]})

    employees = query.order_by(Employee.created_at.desc()).all()
    return jsonify({"employees": [e.to_dict() for e in employees]})

@app.route("/api/employees/<int:id>", methods=['GET', 'PUT'])
@jwt_required()
def handle_employee(id):
    employee = Employee.query.get_or_404(id)
    
    if request.method == 'GET':
        return jsonify(employee.to_dict(full=True))

    if request.method == 'PUT':
        data = request.get_json()
        if not data:
            return jsonify({"message": "No input data provided"}), 400
        try:
            manager_id = data.get('manager_id')
            if manager_id == 'none' or manager_id == '':
                employee.manager_id = None
            else:
                employee.manager_id = int(manager_id)

            # ID is not editable after creation
            employee.full_name = data.get('full_name', employee.full_name)
            employee.email = data.get('email', employee.email)
            employee.department_id = int(data.get('department_id', employee.department_id))
            employee.job_title_id = int(data.get('job_title_id', employee.job_title_id))
            employee.location_id = int(data.get('location_id', employee.location_id))
            employee.hire_date = data.get('hire_date', employee.hire_date)
            employee.base_salary = float(data.get('base_salary', employee.base_salary))
            employee.status = data.get('status', employee.status)

            db.session.commit()
            log_action("تحديث موظف", f"تم تحديث بيانات الموظف: {employee.full_name}")
            return jsonify(employee.to_dict(full=True)), 200
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error updating employee {id}: {e}")
            if 'UNIQUE constraint failed: employees.email' in str(e):
                 return jsonify({"message": "البريد الإلكتروني موجود بالفعل. يرجى استخدام بريد إلكتروني فريد."}), 409
            return jsonify({"message": "حدث خطأ داخلي أثناء التحديث"}), 500

# --- Departments API ---
@app.route("/api/departments", methods=['GET', 'POST'])
@jwt_required()
def handle_departments():
    if request.method == 'POST':
        data = request.get_json()
        new_dept = Department(
            name_ar=data['name_ar'],
            name_en=data['name_en'],
            code=data.get('code'),
            email=data.get('email'),
            budget=float(data['budget']) if data.get('budget') else None,
            description=data.get('description'),
        )
        db.session.add(new_dept)
        db.session.commit()
        log_action("إضافة قسم", f"تمت إضافة قسم جديد: {new_dept.name_ar}")
        return jsonify(new_dept.to_dict()), 201
    
    departments = Department.query.order_by(Department.name_ar).all()
    return jsonify({"departments": [d.to_dict() for d in departments]})
    
# --- Job Titles API ---
@app.route("/api/job-titles", methods=['GET', 'POST'])
@jwt_required()
def handle_job_titles():
    if request.method == 'POST':
        data = request.get_json()
        new_jt = JobTitle(
            department_id=int(data['department_id']),
            title_ar=data['title_ar'],
            title_en=data['title_en'],
        )
        db.session.add(new_jt)
        db.session.commit()
        log_action("إضافة مسمى وظيفي", f"تمت إضافة مسمى وظيفي جديد: {new_jt.title_ar}")
        return jsonify(new_jt.to_dict()), 201

    job_titles = JobTitle.query.join(Department).order_by(JobTitle.created_at.desc()).all()
    return jsonify([jt.to_dict(include_department=True) for jt in job_titles])

# --- Locations API ---
@app.route("/api/locations", methods=['GET', 'POST'])
@jwt_required()
def handle_locations():
    if request.method == 'POST':
        data = request.get_json()
        new_loc = Location(
            name_ar=data['name_ar'],
            name_en=data['name_en'],
            code=data.get('code'),
            description=data.get('description'),
            address=data.get('address'),
            city=data.get('city'),
            country=data.get('country'),
            phone=data.get('phone'),
            email=data.get('email'),
            manager_id=int(data['manager_id']) if data.get('manager_id') and data['manager_id'].isdigit() else None
        )
        db.session.add(new_loc)
        db.session.commit()
        log_action("إضافة موقع", f"تمت إضافة موقع جديد: {new_loc.name_ar}")
        return jsonify(new_loc.to_dict()), 201
        
    locations = Location.query.options(db.joinedload(Location.manager)).order_by(Location.created_at.desc()).all()
    return jsonify({"locations": [loc.to_dict(include_manager=True) for loc in locations]})

@app.route("/api/locations/<int:id>", methods=['PUT', 'DELETE'])
@jwt_required()
def handle_location(id):
    location = Location.query.get_or_404(id)
    
    if request.method == 'PUT':
        data = request.get_json()
        location.name_ar = data.get('name_ar', location.name_ar)
        location.name_en = data.get('name_en', location.name_en)
        location.code = data.get('code', location.code)
        manager_id = data.get('manager_id')
        if manager_id == 'none' or manager_id == '':
            location.manager_id = None
        else:
            location.manager_id = int(manager_id)

        db.session.commit()
        log_action("تحديث موقع", f"تم تحديث بيانات الموقع: {location.name_ar}")
        return jsonify(location.to_dict(include_manager=True))

    if request.method == 'DELETE':
        log_action("حذف موقع", f"تم حذف الموقع: {location.name_ar}")
        db.session.delete(location)
        db.session.commit()
        return jsonify({'message': 'Location deleted successfully'})

# --- Leaves API ---
@app.route("/api/leaves", methods=['GET', 'POST'])
@jwt_required()
def handle_leaves():
    user_id = get_jwt_identity()
    claims = get_jwt()
    user_role = claims.get('role')
    user = User.query.get(int(user_id))

    if request.method == 'POST':
        data = request.get_json()
        employee_id_to_use = None

        if user_role in ['Admin', 'HR']:
            # HR can create for any employee
            employee_id_to_use = data.get('employee_id')
            if not employee_id_to_use:
                return jsonify({"message": "يجب اختيار الموظف"}), 400
        else: # Employee creates for self
            employee_id_to_use = user.employee_id
            if not employee_id_to_use:
                return jsonify({"message": "الحساب غير مربوط بموظف"}), 400

        new_leave_request = LeaveRequest(
            employee_id=employee_id_to_use,
            leave_type=data.get('leave_type'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            notes=data.get('notes'),
            status='Pending' # Always starts as pending now
        )
        db.session.add(new_leave_request)
        db.session.commit()
        
        employee_of_leave = Employee.query.get(employee_id_to_use)
        log_action("تقديم طلب إجازة", f"تم تقديم طلب إجازة للموظف {employee_of_leave.full_name}", username=user.username, user_id=user.id)
        
        # Notify manager(s)
        # This will be refined in Phase 2
        managers = User.query.filter(User.role.in_(['Admin', 'HR', 'Manager'])).all()
        for manager in managers:
             if manager.id != user.id:
                create_notification(
                    recipient_user_id=manager.id,
                    title="طلب إجازة جديد",
                    message=f"قدم الموظف {employee_of_leave.full_name} طلب إجازة جديد.",
                    type="LeaveRequest",
                    related_link="/leaves"
                )

        return jsonify(new_leave_request.to_dict()), 201

    # GET request
    query = LeaveRequest.query
    if user_role == 'Employee' and user.employee_id:
        query = query.filter_by(employee_id=user.employee_id)
        
    leave_requests = query.order_by(LeaveRequest.created_at.desc()).all()
    return jsonify({"leaveRequests": [lr.to_dict() for lr in leave_requests]})


@app.route("/api/leaves/<int:id>", methods=['PATCH'])
@jwt_required()
def update_leave(id):
    claims = get_jwt()
    user_role = claims.get('role')

    if user_role not in ['Admin', 'HR', 'Manager']:
        return jsonify({"success": False, "message": "صلاحيات غير كافية"}), 403

    leave_request = LeaveRequest.query.get_or_404(id)
    data = request.get_json()
    action = data.get('action')

    if leave_request.status != 'Pending':
        return jsonify({"success": False, "message": "لم يتم العثور على الطلب أو تمت معالجته بالفعل."}), 404
    
    user_id = get_jwt_identity()
    approver_user = User.query.get(int(user_id))

    if action == 'approve':
        leave_request.status = 'Approved' # In Phase 1, HR approves directly
        leave_request.approved_by = approver_user.id
        details = f"تمت الموافقة على طلب الإجازة للموظف {leave_request.employee.full_name}"
        log_action("الموافقة على إجازة", details, username=approver_user.username, user_id=approver_user.id)
        
        recipient = User.query.filter_by(employee_id=leave_request.employee_id).first()
        if recipient:
            create_notification(
                recipient_user_id=recipient.id,
                title="تمت الموافقة على طلب الإجازة",
                message=f"تمت الموافقة على طلب إجازتك من {leave_request.start_date} إلى {leave_request.end_date}.",
                type="LeaveApproval",
                related_link="/leaves"
            )

        db.session.commit()
        return jsonify({"success": True, "message": "تمت الموافقة على طلب الإجازة."})
    elif action == 'reject':
        leave_request.status = 'Rejected'
        leave_request.approved_by = approver_user.id
        leave_request.notes = data.get('notes', '')
        details = f"تم رفض طلب الإجازة للموظف {leave_request.employee.full_name} بسبب: {leave_request.notes}"
        log_action("رفض إجازة", details, username=approver_user.username, user_id=approver_user.id)

        recipient = User.query.filter_by(employee_id=leave_request.employee_id).first()
        if recipient:
            create_notification(
                recipient_user_id=recipient.id,
                title="تم رفض طلب الإجازة",
                message=f"تم رفض طلب إجازتك. السبب: {leave_request.notes}",
                type="LeaveRejection",
                related_link="/leaves"
            )

        db.session.commit()
        return jsonify({"success": True, "message": "تم رفض طلب الإجازة."})
    else:
        return jsonify({"success": False, "message": "إجراء غير صالح"}), 400


# --- Dashboard API ---
@app.route("/api/dashboard", methods=['GET'])
@jwt_required()
def get_dashboard_data():
    employees = Employee.query.all()
    leave_requests = LeaveRequest.query.all()
    performance_reviews = PerformanceReview.query.all()
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(5).all()

    recent_activities = [{
        "text": f"{log.username or 'النظام'} قام بـ \"{log.action}\" - {log.details}",
        "time": f"منذ {int((datetime.utcnow() - log.timestamp).total_seconds() / 60)} دقائق"
    } for log in logs]

    return jsonify({
        "employees": [e.to_dict() for e in employees],
        "leaveRequests": [lr.to_dict() for lr in leave_requests],
        "performanceReviews": [pr.to_dict() for pr in performance_reviews],
        "recentActivities": recent_activities,
        "jobs": [j.to_dict() for j in Job.query.filter_by(status='Open').all()]
    })

# --- Recruitment API ---
@app.route("/api/recruitment/jobs", methods=['GET'])
@jwt_required()
def get_recruitment_jobs():
    jobs = Job.query.options(db.joinedload(Job.department)).order_by(Job.created_at.desc()).all()
    return jsonify({'jobs': [j.to_dict() for j in jobs]})
    
@app.route("/api/recruitment/applicants", methods=['GET'])
@jwt_required()
def get_applicants():
    applicants = Applicant.query.order_by(Applicant.created_at.desc()).all()
    return jsonify({'applicants': [a.to_dict() for a in applicants]})


# --- Other Read-only APIs ---
@app.route("/api/payrolls", methods=['GET'])
@jwt_required()
def get_payrolls():
    payrolls = Payroll.query.options(db.joinedload(Payroll.employee)).order_by(Payroll.year.desc(), Payroll.month.desc()).all()
    return jsonify({"payrolls": [p.to_dict() for p in payrolls]})
    
@app.route("/api/performance", methods=['GET'])
@jwt_required()
def get_performance():
    reviews = PerformanceReview.query.options(db.joinedload(PerformanceReview.employee)).order_by(PerformanceReview.review_date.desc()).all()
    return jsonify({"performanceReviews": [r.to_dict() for r in reviews]})

@app.route("/api/audit-log", methods=['GET'])
@jwt_required()
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    return jsonify({"auditLogs": [log.to_dict() for log in logs]})

# --- Attendance APIs ---
@app.route("/api/attendance", methods=['GET'])
@jwt_required()
def get_attendance():
    attendance_records = Attendance.query.options(db.joinedload(Attendance.employee)).order_by(Attendance.date.desc(), Attendance.check_in.desc()).all()
    return jsonify({"attendance": [record.to_dict() for record in attendance_records]})

@app.route("/api/attendance/daily-log", methods=['GET'])
@jwt_required()
def get_daily_log():
    today = date.today().isoformat()
    
    # KPIs
    present_count = Attendance.query.filter_by(date=today, status='Present').count()
    late_count = Attendance.query.filter_by(date=today, status='Late').count()
    
    present_employee_ids = {a.employee_id for a in Attendance.query.filter_by(date=today).all()}
    on_leave_employee_ids = {l.employee_id for l in LeaveRequest.query.filter(LeaveRequest.start_date <= today, LeaveRequest.end_date >= today, LeaveRequest.status == 'Approved').all()}
    
    absent_count = Employee.query.filter(
        Employee.status == 'Active',
        ~Employee.id.in_(list(present_employee_ids) + list(on_leave_employee_ids))
    ).count()

    offline_devices_count = ZktDevice.query.filter_by(status='offline').count()

    kpis = {
        'present': present_count,
        'late': late_count,
        'absent': absent_count,
        'offline_devices': offline_devices_count
    }

    # Daily Log Table
    records = Attendance.query.options(db.joinedload(Attendance.employee)).filter_by(date=today).all()
    return jsonify({
        "kpis": kpis,
        "dailyLog": [record.to_dict() for record in records]
    })


# --- ZKTeco Sync ---
@app.route("/api/attendance/sync-all", methods=['POST'])
@jwt_required()
def sync_all_devices():
    devices = ZktDevice.query.all()
    total_new_logs = 0
    errors = []
    
    for device in devices:
        conn = None
        zk = ZK(device.ip_address, port=4370, timeout=5)
        try:
            conn = zk.connect()
            attendance_logs = conn.get_attendance()
            device.status = 'online'
            db.session.commit()
            
            if not attendance_logs:
                continue

            daily_punches = defaultdict(list)
            for log in attendance_logs:
                daily_punches[(log.user_id, log.timestamp.date())].append(log.timestamp.time())

            for (user_id, log_date), punches in daily_punches.items():
                try:
                    emp_id = int(user_id)
                except (ValueError, TypeError):
                    continue
                
                check_in_time = min(punches)
                check_out_time = max(punches) if len(punches) > 1 else None
                
                att_record = Attendance.query.filter_by(employee_id=emp_id, date=log_date.isoformat()).first()

                if not att_record:
                    new_att = Attendance(
                        employee_id=emp_id,
                        date=log_date.isoformat(),
                        check_in=check_in_time.strftime('%H:%M:%S'),
                        check_out=check_out_time.strftime('%H:%M:%S') if check_out_time else None,
                        status='Present' # This is simplified. Status should be calculated.
                    )
                    db.session.add(new_att)
                    total_new_logs += 1
            
            if total_new_logs > 0:
                 db.session.commit()

        except Exception as e:
            device.status = 'offline'
            db.session.commit()
            error_message = f"فشل الاتصال بجهاز {device.name} ({device.ip_address}): {e}"
            errors.append(error_message)
            log_action("فشل المزامنة", error_message)
        finally:
            if conn:
                conn.disconnect()

    final_message = f"تمت إضافة {total_new_logs} سجلات حضور جديدة."
    
    if not errors and total_new_logs == 0:
        return jsonify({"message": "لا توجد سجلات جديدة للمزامنة.", "errors": []})
    
    if errors:
        return jsonify({"message": f"تمت المزامنة مع بعض المشاكل. {final_message}", "errors": errors}), 207
        
    return jsonify({"message": f"تمت المزامنة بنجاح. {final_message}", "errors": []})


# --- Notifications API ---
@app.route('/api/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({"message": "Invalid token"}), 422
    
    notifications = InAppNotification.query.filter_by(recipient_user_id=int(user_id)).order_by(InAppNotification.created_at.desc()).all()
    unread_count = InAppNotification.query.filter_by(recipient_user_id=int(user_id), status='Unread').count()

    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count
    })

@app.route('/api/notifications/<int:id>/read', methods=['PATCH'])
@jwt_required()
def mark_notification_as_read(id):
    user_id = get_jwt_identity()
    
    notification = InAppNotification.query.filter_by(id=id, recipient_user_id=int(user_id)).first_or_404()
    notification.status = 'Read'
    db.session.commit()
    
    return jsonify({'message': 'Notification marked as read.'})

@app.route('/api/notifications/read-all', methods=['POST'])
@jwt_required()
def mark_all_notifications_as_read():
    user_id = get_jwt_identity()
    
    InAppNotification.query.filter_by(recipient_user_id=int(user_id), status='Unread').update({'status': 'Read'})
    db.session.commit()
    
    return jsonify({'message': 'All notifications marked as read.'})

# --- Disciplinary API ---
@app.route('/api/disciplinary/actions', methods=['GET', 'POST'])
@jwt_required()
def handle_disciplinary_actions():
    if request.method == 'POST':
        data = request.get_json()
        new_action = DisciplinaryAction(
            employee_id=int(data['employee_id']),
            title=data['title'],
            description=data.get('description'),
            type=data['type'],
            severity=data['severity'],
            status='Draft'
        )
        db.session.add(new_action)
        db.session.commit()
        log_action("إضافة إجراء تأديبي", f"تمت إضافة إجراء تأديبي للموظف ID {data['employee_id']}.")
        return jsonify(new_action.to_dict()), 201
    
    actions = DisciplinaryAction.query.options(db.joinedload(DisciplinaryAction.employee)).order_by(DisciplinaryAction.created_at.desc()).all()
    return jsonify({"actions": [a.to_dict() for a in actions]})

# --- Payroll Settings APIs ---
@app.route('/api/payroll-components', methods=['GET', 'POST'])
@jwt_required()
def handle_payroll_components():
    if request.method == 'POST':
        data = request.get_json()
        new_component = PayrollComponent(**data)
        db.session.add(new_component)
        db.session.commit()
        log_action("إضافة مكون راتب", f"تمت إضافة مكون الراتب: {data['name']}.")
        return jsonify(new_component.to_dict()), 201

    components = PayrollComponent.query.all()
    return jsonify({"components": [c.to_dict() for c in components]})

@app.route('/api/payroll-components/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def handle_payroll_component(id):
    component = PayrollComponent.query.get_or_404(id)
    if request.method == 'PUT':
        data = request.get_json()
        for key, value in data.items():
            if hasattr(component, key):
                setattr(component, key, value)
        db.session.commit()
        log_action("تحديث مكون راتب", f"تم تحديث مكون الراتب: {component.name}.")
        return jsonify(component.to_dict())
    if request.method == 'DELETE':
        log_action("حذف مكون راتب", f"تم حذف مكون الراتب: {component.name}.")
        db.session.delete(component)
        db.session.commit()
        return jsonify({'message': 'Component deleted successfully'})

@app.route('/api/tax-schemes', methods=['GET', 'POST'])
@jwt_required()
def handle_tax_schemes():
    if request.method == 'POST':
        data = request.get_json()
        brackets_data = data.pop('brackets', [])
        new_scheme = TaxScheme(**data)
        db.session.add(new_scheme)
        db.session.flush() # To get the new_scheme.id
        for bracket_data in brackets_data:
            bracket_data.pop('id', None)
            new_bracket = TaxBracket(scheme_id=new_scheme.id, **bracket_data)
            db.session.add(new_bracket)
        db.session.commit()
        log_action("إضافة مخطط ضريبي", f"تمت إضافة مخطط ضريبي جديد: {new_scheme.name}.")
        return jsonify(new_scheme.to_dict()), 201

    schemes = TaxScheme.query.all()
    return jsonify({"schemes": [s.to_dict() for s in schemes]})

@app.route('/api/tax-schemes/<int:id>', methods=['GET', 'PUT'])
@jwt_required()
def handle_tax_scheme(id):
    scheme = TaxScheme.query.get_or_404(id)
    if request.method == 'GET':
        return jsonify(scheme.to_dict(include_brackets=True))
        
    if request.method == 'PUT':
        data = request.get_json()
        brackets_data = data.pop('brackets', [])
        
        for key, value in data.items():
            if hasattr(scheme, key) and key != 'id':
                setattr(scheme, key, value)
        
        # Simple deletion and re-creation of brackets for simplicity
        TaxBracket.query.filter_by(scheme_id=scheme.id).delete()
        for bracket_data in brackets_data:
            bracket_data.pop('id', None)
            new_bracket = TaxBracket(scheme_id=scheme.id, **bracket_data)
            db.session.add(new_bracket)
            
        db.session.commit()
        log_action("تحديث مخطط ضريبي", f"تم تحديث المخطط الضريبي: {scheme.name}.")
        return jsonify(scheme.to_dict(include_brackets=True))

# --- App Context and DB Initialization ---
def create_initial_admin_user():
    with app.app_context():
        if User.query.first() is None:
            app.logger.info("No users found. Creating initial admin user...")
            admin_user = User(
                username='admin',
                role='Admin',
                account_status='Active'
            )
            admin_user.set_password('admin')
            db.session.add(admin_user)
            db.session.commit()
            app.logger.info("Initial admin user created with username 'admin' and password 'admin'.")


def init_db():
    with app.app_context():
        # This will create tables that don't exist yet, without dropping existing ones.
        app.logger.info("Ensuring all tables exist...")
        db.create_all()
        app.logger.info("Tables created or verified.")
        
        # Now, run migrations and seeding
        migrate_db()
        create_initial_admin_user()
        app.logger.info("Database initialization complete.")


init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

    

    
