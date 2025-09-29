
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

# Ensure upload directories exist
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)
if not os.path.exists(os.path.join(UPLOAD_FOLDER, 'employees')):
    os.makedirs(os.path.join(UPLOAD_FOLDER, 'employees'))


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
    jobs = db.relationship('Job', backref='department', lazy='dynamic')


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
    
    department = db.relationship('Department', foreign_keys=[department_id], backref=db.backref('dept_employees', lazy='dynamic'))
    job_title = db.relationship('JobTitle', backref='employees', lazy=True)
    location = db.relationship('Location', foreign_keys=[location_id], backref='employees', lazy=True)
    
    manager = db.relationship('Employee', remote_side=[id])
    managed_locations = db.relationship('Location', foreign_keys=[Location.manager_id], backref='manager', lazy='dynamic')


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
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True) # Null if user_id from device not in DB
    log_datetime = db.Column(db.DateTime, nullable=False)
    log_type = db.Column(db.String, default='punch') # in, out, punch
    source = db.Column(db.String, default='device') # device, file, api, manual
    raw_payload = db.Column(db.String)

class Shift(db.Model):
    __tablename__ = 'shifts'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    type = db.Column(db.String, default='fixed') # fixed, flex, split, night
    start_time = db.Column(Time)
    end_time = db.Column(Time)
    break_minutes = db.Column(db.Integer, default=0)
    grace_in = db.Column(db.Integer, default=0)
    grace_out = db.Column(db.Integer, default=0)
    rounding_minutes = db.Column(db.Integer, default=5)
    night_cross = db.Column(db.Boolean, default=False)
    weekly_off_json = db.Column(db.String, default='["Fri","Sat"]')
    overtime_policy_id = db.Column(db.Integer, db.ForeignKey('overtime_policies.id'))
    geofence_id = db.Column(db.Integer, db.ForeignKey('geofences.id'))
    active = db.Column(db.Boolean, default=True)

class ShiftAssignment(db.Model):
    __tablename__ = 'shift_assignments'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    shift_id = db.Column(db.Integer, db.ForeignKey('shifts.id'), nullable=False)
    effective_from = db.Column(Date, nullable=False)
    effective_to = db.Column(Date)
    days_mask = db.Column(db.String, default='["Sun","Mon","Tue","Wed","Thu"]')

class Geofence(db.Model):
    __tablename__ = 'geofences'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    lat = db.Column(db.Float)
    lng = db.Column(db.Float)
    radius_m = db.Column(db.Integer)

class QrSite(db.Model):
    __tablename__ = 'qr_sites'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String, unique=True, nullable=False)
    name = db.Column(db.String, nullable=False)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    active = db.Column(db.Boolean, default=True)

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    date = db.Column(Date, nullable=False)
    check_in = db.Column(Time)
    check_out = db.Column(Time)
    hours_worked = db.Column(db.Float)
    status = db.Column(db.String, default='Present') # Present, Absent, On Leave, Late, EarlyLeave, Holiday, WeeklyOff
    late_minutes = db.Column(db.Integer)
    early_leave_minutes = db.Column(db.Integer)
    overtime_minutes = db.Column(db.Integer)
    source = db.Column(db.String, default='device')
    notes = db.Column(db.Text)

    employee = db.relationship('Employee', backref='attendance_records')
    __table_args__ = (db.UniqueConstraint('employee_id', 'date', name='_employee_date_uc'),)

    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employee_name': self.employee.full_name if self.employee else None,
            'employee_avatar': self.employee.avatar if self.employee else None,
            'date': self.date.isoformat() if self.date else None,
            'check_in': self.check_in.strftime('%H:%M:%S') if self.check_in else None,
            'check_out': self.check_out.strftime('%H:%M:%S') if self.check_out else None,
            'status': self.status,
            'late_minutes': self.late_minutes,
            'early_leave_minutes': self.early_leave_minutes,
            'overtime_minutes': self.overtime_minutes,
            'source': self.source,
            'hours_worked': self.hours_worked
        }

class AttendanceException(db.Model):
    __tablename__ = 'attendance_exceptions'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    date = db.Column(Date, nullable=False)
    code = db.Column(db.String, nullable=False) # missing_in, missing_out, late, etc.
    severity = db.Column(db.String, default='low') # low, med, high
    status = db.Column(db.String, default='Pending') # Pending, Approved, Rejected, Auto
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)
    notes = db.Column(db.Text)

class AttendanceCorrection(db.Model):
    __tablename__ = 'attendance_corrections'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    date = db.Column(Date, nullable=False)
    requested_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    old_check_in = db.Column(Time)
    old_check_out = db.Column(Time)
    new_check_in = db.Column(Time)
    new_check_out = db.Column(Time)
    reason = db.Column(db.Text)
    status = db.Column(db.String, default='Pending') # Pending, Approved, Rejected
    approver_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    decided_at = db.Column(db.DateTime)
    audit_note = db.Column(db.Text)

class OvertimePolicy(db.Model):
    __tablename__ = 'overtime_policies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    require_approval = db.Column(db.Boolean, default=True)
    min_minutes = db.Column(db.Integer, default=30)
    round_to = db.Column(db.Integer, default=15)
    day_type = db.Column(db.String, default='all') # normal, weekend, holiday, all
    rate_multiplier = db.Column(db.Float, default=1.5)
    max_per_day_minutes = db.Column(db.Integer)

class OvertimeRequest(db.Model):
    __tablename__ = 'overtime_requests'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    date = db.Column(Date, nullable=False)
    minutes = db.Column(db.Integer, nullable=False)
    reason = db.Column(db.Text)
    status = db.Column(db.String, default='Pending') # Pending, Approved, Rejected, Posted
    approved_by_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    policy_id = db.Column(db.Integer, db.ForeignKey('overtime_policies.id'))
    posted_to_payroll = db.Column(db.Boolean, default=False)
    posted_at = db.Column(db.DateTime)

class Holiday(db.Model):
    __tablename__ = 'holidays'
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(Date, nullable=False)
    name = db.Column(db.String, nullable=False)
    scope = db.Column(db.String, default='company') # company, location, department
    scope_id = db.Column(db.Integer) # Corresponds to location_id or department_id if scope is not company

class TimesheetLock(db.Model):
    __tablename__ = 'timesheet_locks'
    id = db.Column(db.Integer, primary_key=True)
    period = db.Column(db.String, nullable=False) # 'YYYY-MM'
    locked_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    locked_at = db.Column(db.DateTime, default=datetime.utcnow)

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

class EmployeeRequest(db.Model):
    __tablename__ = 'employee_requests'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    type = db.Column(db.String, nullable=False) # e.g., Document, Expense Claim, Support
    subject = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.String, default='Pending') # Pending, Approved, Rejected, Closed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    resolved_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    resolved_at = db.Column(db.DateTime)

    employee = db.relationship('Employee', backref='service_requests')
    resolver = db.relationship('User', backref='resolved_requests')

class DisciplinaryPolicy(db.Model):
    __tablename__ = 'disciplinary_policies'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    trigger_type = db.Column(db.String, nullable=False)
    threshold_count = db.Column(db.Integer)
    period_days = db.Column(db.Integer)
    action_type = db.Column(db.String)
    severity = db.Column(db.String)
    deduction_type = db.Column(db.String)
    deduction_value = db.Column(db.Float)
    points = db.Column(db.Integer, default=0)
    active = db.Column(db.Boolean, default=True)

class DisciplinaryAction(db.Model):
    __tablename__ = 'disciplinary_actions'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    policy_id = db.Column(db.Integer, db.ForeignKey('disciplinary_policies.id'))
    source = db.Column(db.String, default='manual')
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    type = db.Column(db.String, nullable=False)
    severity = db.Column(db.String)
    points = db.Column(db.Integer, default=0)
    status = db.Column(db.String, default='Draft')
    issue_date = db.Column(db.String, default=lambda: date.today().isoformat())
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    employee = db.relationship('Employee', backref='disciplinary_actions')
    policy = db.relationship('DisciplinaryPolicy', backref='actions')

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

class DisciplinaryEvidence(db.Model):
    __tablename__ = 'disciplinary_evidence'
    id = db.Column(db.Integer, primary_key=True)
    action_id = db.Column(db.Integer, db.ForeignKey('disciplinary_actions.id', ondelete='CASCADE'), nullable=False)
    file_path = db.Column(db.String)
    note = db.Column(db.Text)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)

class PayrollAdjustment(db.Model):
    __tablename__ = 'payroll_adjustments'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    month = db.Column(db.String, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    reason = db.Column(db.String, nullable=False)
    source = db.Column(db.String, default='disciplinary')
    source_id = db.Column(db.Integer)
    __table_args__ = (db.UniqueConstraint('employee_id', 'month', 'source', 'source_id', name='_employee_month_source_uc'),)

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
    pre_tax = db.Column(db.Boolean, default=False)
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

# --- Documents Models ---
class DocumentType(db.Model):
    __tablename__ = 'document_types'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String, unique=True, nullable=False)
    title_ar = db.Column(db.String, nullable=False)
    title_en = db.Column(db.String, nullable=False)
    category = db.Column(db.String, default='basic')
    default_required = db.Column(db.Boolean, default=True)
    requires_expiry = db.Column(db.Boolean, default=False)
    allowed_mime = db.Column(db.String)
    max_size_mb = db.Column(db.Integer, default=15)
    description = db.Column(db.Text)
    active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class DocumentRequirement(db.Model):
    __tablename__ = 'document_requirements'
    id = db.Column(db.Integer, primary_key=True)
    doc_type_id = db.Column(db.Integer, db.ForeignKey('document_types.id', ondelete='CASCADE'), nullable=False)
    scope = db.Column(db.String, default='company')
    scope_id = db.Column(db.Integer, nullable=True)
    required = db.Column(db.Boolean, default=True)
    effective_from = db.Column(db.String)
    effective_to = db.Column(db.String, nullable=True)
    notes = db.Column(db.Text)
    __table_args__ = (db.UniqueConstraint('doc_type_id', 'scope', 'scope_id', 'effective_from', name='_doc_req_uc'),)


class EmployeeDocument(db.Model):
    __tablename__ = 'employee_documents'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    doc_type_id = db.Column(db.Integer, db.ForeignKey('document_types.id'), nullable=False)
    file_path = db.Column(db.String)
    file_name = db.Column(db.String)
    mime_type = db.Column(db.String)
    file_size = db.Column(db.Integer)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    issue_date = db.Column(db.String)
    expiry_date = db.Column(db.String)
    status = db.Column(db.String, default='Uploaded') # Uploaded, Verified, Rejected, Expired, Pending
    verified_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    verified_at = db.Column(db.String)
    note = db.Column(db.Text)
    version = db.Column(db.Integer, default=1)
    not_applicable = db.Column(db.Boolean, default=False)
    versions = db.relationship('EmployeeDocumentVersion', backref='main_document', lazy='dynamic', cascade="all, delete-orphan")
    __table_args__ = (db.UniqueConstraint('employee_id', 'doc_type_id', 'version', name='_emp_doc_version_uc'),)

class EmployeeDocumentVersion(db.Model):
    __tablename__ = 'employee_document_versions'
    id = db.Column(db.Integer, primary_key=True)
    employee_document_id = db.Column(db.Integer, db.ForeignKey('employee_documents.id', ondelete='CASCADE'), nullable=False)
    file_path = db.Column(db.String)
    file_name = db.Column(db.String)
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    version = db.Column(db.Integer)
    note = db.Column(db.Text)

class DocumentNotification(db.Model):
    __tablename__ = 'document_notifications'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    doc_type_id = db.Column(db.Integer, db.ForeignKey('document_types.id'), nullable=False)
    kind = db.Column(db.String) # missing, expiring, expired
    due_date = db.Column(db.String)
    sent_to = db.Column(db.String)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)


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
    years_experience = db.Column(db.REAL)
    current_title = db.Column(db.Text)
    current_company = db.Column(db.Text)
    expected_salary = db.Column(db.REAL)
    linkedin_url = db.Column(db.Text)
    portfolio_url = db.Column(db.Text)
    cv_path = db.Column(db.Text)
    rating = db.Column(db.Integer, default=0)
    score = db.Column(db.REAL, default=0)
    email_verified = db.Column(db.Integer, default=0)
    consent_at = db.Column(db.Text)
    notes = db.Column(db.Text)
    created_at = db.Column(db.Text, default=lambda: datetime.utcnow().isoformat())
    avatar = db.Column(db.String)
    
    __table_args__ = (db.UniqueConstraint('job_id', 'email', name='_job_email_uc'),)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}


class ApplicantFile(db.Model):
    __tablename__ = 'applicant_files'
    id = db.Column(db.Integer, primary_key=True)
    applicant_id = db.Column(db.Integer, db.ForeignKey('applicants.id', ondelete='CASCADE'), nullable=False)
    file_path = db.Column(db.Text, nullable=False)
    type = db.Column(db.Text, CheckConstraint("type IN ('cv','cover_letter','portfolio','other')"), default='other')
    uploaded_at = db.Column(db.Text, default=lambda: datetime.utcnow().isoformat())

class ApplicantNote(db.Model):
    __tablename__ = 'applicant_notes'
    id = db.Column(db.Integer, primary_key=True)
    applicant_id = db.Column(db.Integer, db.ForeignKey('applicants.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    note = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.Text, default=lambda: datetime.utcnow().isoformat())

class Interview(db.Model):
    __tablename__ = 'interviews'
    id = db.Column(db.Integer, primary_key=True)
    applicant_id = db.Column(db.Integer, db.ForeignKey('applicants.id', ondelete='CASCADE'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    title = db.Column(db.Text, default='Interview')
    start_datetime = db.Column(db.Text, nullable=False)
    end_datetime = db.Column(db.Text, nullable=False)
    location = db.Column(db.Text)
    video_link = db.Column(db.Text)
    interviewer_user_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    calendar_provider = db.Column(db.Text)
    provider_event_id = db.Column(db.Text)
    status = db.Column(db.Text, CheckConstraint("status IN ('Scheduled','Completed','Cancelled')"), default='Scheduled')
    created_at = db.Column(db.Text, default=lambda: datetime.utcnow().isoformat())

class Scorecard(db.Model):
    __tablename__ = 'scorecards'
    id = db.Column(db.Integer, primary_key=True)
    applicant_id = db.Column(db.Integer, db.ForeignKey('applicants.id', ondelete='CASCADE'), nullable=False)
    reviewer_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    criterion = db.Column(db.Text, nullable=False)
    weight = db.Column(db.REAL, default=1.0)
    score = db.Column(db.REAL, nullable=False)
    comments = db.Column(db.Text)
    created_at = db.Column(db.Text, default=lambda: datetime.utcnow().isoformat())

class Offer(db.Model):
    __tablename__ = 'offers'
    id = db.Column(db.Integer, primary_key=True)
    applicant_id = db.Column(db.Integer, db.ForeignKey('applicants.id', ondelete='CASCADE'), nullable=False)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    salary_offer = db.Column(db.REAL, nullable=False)
    currency = db.Column(db.Text, nullable=False)
    start_date = db.Column(db.Text, nullable=False)
    benefits_text = db.Column(db.Text)
    status = db.Column(db.Text, CheckConstraint("status IN ('Draft','Sent','Accepted','Declined','Withdrawn')"), default='Draft')
    offer_letter_path = db.Column(db.Text)
    created_at = db.Column(db.Text, default=lambda: datetime.utcnow().isoformat())
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
        if not user.employee_id:
            return jsonify({"message": "الحساب غير مربوط بموظف"}), 400
        
        data = request.get_json()
        new_leave_request = LeaveRequest(
            employee_id=user.employee_id,
            leave_type=data.get('leave_type'),
            start_date=data.get('start_date'),
            end_date=data.get('end_date'),
            notes=data.get('notes')
        )
        db.session.add(new_leave_request)
        db.session.commit()
        log_action("تقديم طلب إجازة", f"قدم الموظف {user.employee.full_name} طلب إجازة.", username=user.username, user_id=user.id)
        
        # Notify manager(s)
        managers = User.query.filter(User.role.in_(['Admin', 'HR', 'Manager'])).all()
        for manager in managers:
             if manager.id != user.id:
                create_notification(
                    recipient_user_id=manager.id,
                    title="طلب إجازة جديد",
                    message=f"قدم الموظف {user.employee.full_name} طلب إجازة جديد.",
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
        leave_request.status = 'Approved'
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

# --- File Uploads ---
def create_safe_folder_name(applicant_id, applicant_name):
    # Sanitize name
    safe_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', applicant_name)
    safe_name = re.sub(r'__+', '_', safe_name).strip('_')
    folder_name = f"{applicant_id}_{safe_name}"
    return folder_name

# --- Recruitment API ---
@app.route("/api/recruitment/jobs", methods=['GET', 'POST'])
@jwt_required()
def handle_recruitment_jobs():
    claims = get_jwt()
    username = claims.get('username')
    user_id = get_jwt_identity()

    if request.method == 'GET':
        jobs = Job.query.options(db.joinedload(Job.department)).order_by(Job.created_at.desc()).all()
        return jsonify({'jobs': [j.to_dict() for j in jobs]})

    if request.method == 'POST':
        data = request.get_json()
        
        # Stricter validation
        required_fields = ['title', 'dept_id', 'location', 'employment_type', 'openings']
        missing_fields = [field for field in required_fields if not data.get(field)]
        if missing_fields:
            return jsonify({'message': f"بيانات غير مكتملة، الحقول التالية مطلوبة: {', '.join(missing_fields)}"}), 422
        
        try:
            dept_id = int(data['dept_id'])
            openings = int(data['openings'])
            if openings < 1:
                 return jsonify({'message': 'عدد الشواغر يجب أن يكون 1 على الأقل.'}), 422
        except (ValueError, TypeError):
            return jsonify({'message': 'القسم وعدد الشواغر يجب أن يكونا أرقامًا صحيحة.'}), 422

        try:
            new_job = Job(
                title=data['title'],
                dept_id=dept_id,
                location=data['location'],
                employment_type=data['employment_type'],
                openings=openings,
                description=data.get('description'),
                seniority=data.get('seniority'),
                status=data.get('status', 'Open')
            )
            db.session.add(new_job)
            db.session.commit()
            log_action("إضافة وظيفة", f"تمت إضافة وظيفة جديدة: {new_job.title}", username=username, user_id=int(user_id))
            return jsonify(new_job.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error creating job: {e}")
            return jsonify({'message': 'خطأ داخلي أثناء إنشاء الوظيفة.', 'details': str(e)}), 500

@app.route("/api/recruitment/applicants", methods=['GET', 'POST'])
@jwt_required()
def handle_applicants():
    claims = get_jwt()
    username = claims.get('username')
    user_id = get_jwt_identity()
    
    if request.method == 'POST':
        if 'cv_file' not in request.files:
            app.logger.warning("Applicant submission without CV file.")
        
        data = request.form
        required_fields = ['job_id', 'full_name', 'email']
        if not all(field in data for field in required_fields):
            return jsonify({'message': 'بيانات ناقصة'}), 400
        
        # Check for duplicates
        existing = Applicant.query.filter_by(job_id=data['job_id'], email=data['email']).first()
        if existing:
            return jsonify({'message': 'هذا المتقدم موجود بالفعل في هذه الوظيفة'}), 409
            
        new_applicant = Applicant(
            job_id=data['job_id'],
            full_name=data['full_name'],
            email=data['email'],
            phone=data.get('phone'),
            stage='Applied',
            source=data.get('source', 'manual'),
            linkedin_url=data.get('linkedin_url'),
            portfolio_url=data.get('portfolio_url')
        )
        db.session.add(new_applicant)
        db.session.flush() # Flush to get the new_applicant.id

        cv_path = None
        if 'cv_file' in request.files:
            file = request.files['cv_file']
            if file and file.filename != '':
                # Create a safe folder name from applicant ID and name
                applicant_folder_name = create_safe_folder_name(new_applicant.id, new_applicant.full_name)
                # The folder for applicant CVs should be separate from employees
                applicant_upload_path = os.path.join(app.config['UPLOAD_FOLDER'], '..', 'applicants', applicant_folder_name)
                
                if not os.path.exists(applicant_upload_path):
                    os.makedirs(applicant_upload_path)

                filename = secure_filename(f"CV_v1_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf")
                file_path = os.path.join(applicant_upload_path, filename)
                file.save(file_path)
                
                # Store relative path for retrieval
                cv_path = os.path.join('..', 'applicants', applicant_folder_name, filename)

        new_applicant.cv_path = cv_path
        db.session.commit()
        
        log_action("إضافة متقدم", f"أضاف المستخدم {username} المتقدم {data['full_name']} إلى الوظيفة ID {data['job_id']}", username=username, user_id=int(user_id))
        return jsonify(new_applicant.to_dict()), 201

    # GET all applicants
    applicants = Applicant.query.order_by(Applicant.created_at.desc()).all()
    return jsonify({'applicants': [a.to_dict() for a in applicants]})

@app.route('/uploads/<path:filepath>')
@jwt_required()
def uploaded_file(filepath):
    # This is a basic protection. For production, consider more robust access control.
    # e.g., check if the user has rights to see this specific employee's documents.
    return send_from_directory(app.config['UPLOAD_FOLDER'], filepath)
    
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

@app.route("/api/attendance/history/<int:employee_id>", methods=['GET'])
@jwt_required()
def get_employee_attendance_history(employee_id):
    employee = Employee.query.options(db.joinedload(Employee.department), db.joinedload(Employee.job_title)).get_or_404(employee_id)
    
    # Fetch last 30 days of attendance
    thirty_days_ago = date.today() - timedelta(days=30)
    attendance_records = Attendance.query.filter(
        Attendance.employee_id == employee_id,
        Attendance.date >= thirty_days_ago
    ).order_by(Attendance.date.desc()).all()

    return jsonify({
        "employee": employee.to_dict(full=True),
        "attendance": [record.to_dict() for record in attendance_records]
    })


@app.route("/api/attendance/daily-log", methods=['GET'])
@jwt_required()
def get_daily_log():
    today = date.today()
    
    # KPIs
    present_count = Attendance.query.filter(Attendance.date == today, Attendance.status.in_(['Present', 'Late'])).count()
    late_count = Attendance.query.filter(Attendance.date == today, Attendance.status == 'Late').count()
    
    present_employee_ids = {a.employee_id for a in Attendance.query.filter(Attendance.date == today).all()}
    on_leave_employee_ids = {l.employee_id for l in LeaveRequest.query.filter(LeaveRequest.start_date <= today.isoformat(), LeaveRequest.end_date >= today.isoformat(), LeaveRequest.status == 'Approved').all()}
    
    active_employees = Employee.query.filter(
        Employee.status == 'Active',
        ~Employee.id.in_(list(present_employee_ids) + list(on_leave_employee_ids))
    )
    absent_employees = active_employees.all()
    absent_count = len(absent_employees)

    offline_devices_count = ZktDevice.query.filter_by(status='offline').count()

    kpis = {
        'present': present_count,
        'late': late_count,
        'absent': absent_count,
        'offline_devices': offline_devices_count
    }

    # Daily Log Table
    records = Attendance.query.options(db.joinedload(Attendance.employee)).filter(Attendance.date == today).all()
    all_daily_records = [r.to_dict() for r in records]

    for emp in absent_employees:
        all_daily_records.append({
            'id': f'absent-{emp.id}',
            'employee_id': emp.id,
            'employee_name': emp.full_name,
            'date': today.isoformat(),
            'check_in': None,
            'check_out': None,
            'status': 'Absent',
            'source': '-',
        })
        
    # Modal Lists (for KPI cards)
    present_employees_list = [
        {'id': emp.id, 'full_name': emp.full_name, 'department': {'name_ar': emp.department.name_ar if emp.department else None}} 
        for emp in Employee.query.join(Attendance).filter(Attendance.date == today, Attendance.status.in_(['Present', 'Late'])).all()
    ]
    late_employees_list = [
        {'id': emp.id, 'full_name': emp.full_name, 'department': {'name_ar': emp.department.name_ar if emp.department else None}} 
        for emp in Employee.query.join(Attendance).filter(Attendance.date == today, Attendance.status == 'Late').all()
    ]
    absent_employees_list = [
        {'id': emp.id, 'full_name': emp.full_name, 'department': {'name_ar': emp.department.name_ar if emp.department else None}}
        for emp in absent_employees
    ]
    offline_devices_list = [dev.to_dict() for dev in ZktDevice.query.filter_by(status='offline').all()]
    
    modal_lists = {
        'present': present_employees_list,
        'late': late_employees_list,
        'absent': absent_employees_list,
        'offline_devices': offline_devices_list
    }

    return jsonify({
        "kpis": kpis,
        "dailyLog": all_daily_records,
        "modalLists": modal_lists
    })


# --- ZKTeco Sync ---
def test_pyzk_connection(ip, port, timeout=2):
    zk = ZK(ip, port=port, timeout=timeout, force_udp=False)
    conn = None
    try:
        conn = zk.connect()
        serial_number = conn.get_serialnumber()
        return True, f"تم الاتصال بنجاح. الرقم التسلسلي: {serial_number}"
    except Exception as e:
        return False, f"فشل الاتصال: {e}"
    finally:
        if conn:
            conn.disconnect()

@app.route("/api/attendance/test-connection", methods=['POST'])
@jwt_required()
def test_connection_route():
    data = request.get_json()
    ip = data.get('ip')
    port = data.get('port', 4370)
    
    if not ip:
        return jsonify({"success": False, "message": "لم يتم توفير عنوان IP"}), 400
        
    try:
        success, message = test_pyzk_connection(ip, int(port))
        return jsonify({"success": success, "message": message})
    except Exception as e:
        app.logger.error(f"Unexpected error during ZK test: {e}")
        return jsonify({"success": False, "message": f"خطأ غير متوقع: {e}"}), 500

@app.route("/api/attendance/sync-all", methods=['POST'])
@jwt_required()
def sync_all_devices():
    devices = ZktDevice.query.all()
    total_new_logs = 0
    total_new_records = 0
    total_updated_records = 0
    errors = []
    
    for device in devices:
        conn = None
        zk = ZK(device.ip_address, port=4370, timeout=5, force_udp=False, ommit_ping=False)
        try:
            conn = zk.connect()
            device.status = 'online'
            db.session.commit()
            
            attendance_logs = conn.get_attendance()
            if not attendance_logs:
                continue

            # --- Step 1: Save raw logs to DeviceLog table ---
            latest_log_time = db.session.query(func.max(DeviceLog.log_datetime)).filter_by(device_id=device.id).scalar()
            
            new_raw_logs = 0
            for log in attendance_logs:
                if latest_log_time and log.timestamp <= latest_log_time:
                    continue
                
                try:
                    emp_id = int(log.user_id)
                except (ValueError, TypeError):
                    continue # Skip if user_id is not a valid integer
                
                new_log = DeviceLog(
                    device_id=device.id,
                    employee_id=emp_id,
                    log_datetime=log.timestamp,
                    log_type='punch', # Simplified
                    source='device',
                    raw_payload=str(log)
                )
                db.session.add(new_log)
                new_raw_logs += 1
            
            if new_raw_logs > 0:
                db.session.commit()
                total_new_logs += new_raw_logs

            # --- Step 2: Process daily punches into Attendance table ---
            daily_punches = defaultdict(list)
            for log in attendance_logs:
                try:
                    emp_id = int(log.user_id)
                    employee = Employee.query.get(emp_id)
                    if not employee:
                        continue 

                    log_date = log.timestamp.date()
                    daily_punches[(emp_id, log_date)].append(log.timestamp.time())
                except (ValueError, TypeError):
                    continue

            for (emp_id, log_date), punches in daily_punches.items():
                employee = Employee.query.get(emp_id)
                if not employee:
                    continue
                
                check_in_time = min(punches)
                check_out_time = max(punches) if len(punches) > 1 else None
                att_record = Attendance.query.filter_by(employee_id=emp_id, date=log_date).first()

                if att_record:
                    if att_record.check_in != check_in_time or att_record.check_out != check_out_time:
                        att_record.check_in = check_in_time
                        if check_out_time:
                            att_record.check_out = check_out_time
                        total_updated_records += 1
                else:
                    new_att = Attendance(
                        employee_id=emp_id,
                        date=log_date,
                        check_in=check_in_time,
                        check_out=check_out_time,
                        status='Present' # Simplified
                    )
                    db.session.add(new_att)
                    total_new_records += 1
            
            if total_new_records > 0 or total_updated_records > 0:
                 db.session.commit()
                 log_action("مزامنة ناجحة", f"جهاز {device.name}: {total_new_records} سجلات جديدة, {total_updated_records} سجلات محدثة.")

        except Exception as e:
            db.session.rollback()
            device.status = 'offline'
            db.session.commit()
            error_message = f"فشل الاتصال بجهاز {device.name} ({device.ip_address}): {e}"
            errors.append(error_message)
            log_action("فشل المزامنة", error_message)
        finally:
            if conn:
                try:
                    conn.disconnect()
                except Exception as e:
                    app.logger.error(f"Error during ZK disconnect for {device.name}: {e}")

    final_message = f"إجمالي السجلات الجديدة: {total_new_records}. إجمالي السجلات المحدثة: {total_updated_records}."
    
    if not errors and total_new_records == 0 and total_updated_records == 0:
        return jsonify({"message": "لا توجد سجلات جديدة أو تغييرات للمزامنة من أي جهاز.", "errors": []})
    
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

# --- Documents API ---
@app.route('/api/documents/overview', methods=['GET'])
@jwt_required()
def get_documents_overview():
    employees_query = Employee.query.options(
        db.joinedload(Employee.department), 
        db.joinedload(Employee.job_title)
    ).order_by(Employee.full_name)
    
    employees = employees_query.all()
    
    employees_with_compliance = []
    
    required_doc_types = DocumentType.query.filter_by(active=True, default_required=True).all()
    total_required_count = len(required_doc_types)

    for emp in employees:
        emp_data = emp.to_dict()
        
        # Simplified compliance calculation for now
        # TODO: Implement full rules-based compliance check
        
        # Get employee's existing documents
        existing_docs = EmployeeDocument.query.filter_by(employee_id=emp.id).all()
        existing_doc_type_ids = {doc.doc_type_id for doc in existing_docs}

        # Calculate missing docs
        missing_count = 0
        expiring_count = 0
        
        for req_doc in required_doc_types:
            if req_doc.id not in existing_doc_type_ids:
                missing_count += 1
            else:
                # Check for expiry if required
                if req_doc.requires_expiry:
                    emp_doc = next((doc for doc in existing_docs if doc.doc_type_id == req_doc.id), None)
                    if emp_doc and emp_doc.expiry_date:
                        try:
                            expiry = date.fromisoformat(emp_doc.expiry_date)
                            if expiry < date.today():
                                missing_count += 1 # Expired docs are considered missing for compliance
                            elif (expiry - date.today()).days <= 30:
                                expiring_count += 1
                        except (ValueError, TypeError):
                            pass # Ignore invalid dates

        
        compliant_count = total_required_count - missing_count
        compliance_percent = round((compliant_count / total_required_count) * 100) if total_required_count > 0 else 100
        
        # Get last update time
        last_update = db.session.query(func.max(EmployeeDocument.uploaded_at)).filter_by(employee_id=emp.id).scalar()

        emp_data['compliance_percent'] = compliance_percent
        emp_data['missing_docs_count'] = missing_count
        emp_data['expiring_docs_count'] = expiring_count
        emp_data['last_updated'] = last_update.isoformat() if last_update else "لم يحدث"
        
        employees_with_compliance.append(emp_data)

    return jsonify({'employees_compliance': employees_with_compliance})

@app.route('/api/documents/types', methods=['GET', 'POST'])
@jwt_required()
def handle_document_types():
    claims = get_jwt()
    if claims.get('role') not in ['Admin', 'HR']:
        return jsonify({"message": "صلاحيات غير كافية"}), 403

    if request.method == 'POST':
        data = request.get_json()
        if not data.get('code') or not data.get('title_ar') or not data.get('title_en'):
            return jsonify({'message': 'بيانات ناقصة'}), 400
        
        if DocumentType.query.filter_by(code=data['code']).first():
            return jsonify({'message': 'رمز المستند موجود بالفعل'}), 409

        new_doc_type = DocumentType(**data)
        db.session.add(new_doc_type)
        db.session.commit()
        log_action("إنشاء نوع مستند", f"تم إنشاء نوع مستند جديد: {data['title_ar']}", username=claims.get('username'), user_id=int(get_jwt_identity()))
        return jsonify(new_doc_type.to_dict()), 201

    doc_types = DocumentType.query.order_by(DocumentType.category, DocumentType.id).all()
    return jsonify({'document_types': [dt.to_dict() for dt in doc_types]})


@app.route('/api/documents/types/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def update_document_type(id):
    claims = get_jwt()
    if claims.get('role') not in ['Admin', 'HR']:
        return jsonify({"message": "صلاحيات غير كافية"}), 403
    
    doc_type = DocumentType.query.get_or_404(id)

    if request.method == 'PUT':
        data = request.get_json()
        for key, value in data.items():
            if hasattr(doc_type, key) and key != 'id':
                setattr(doc_type, key, value)
        db.session.commit()
        log_action("تحديث نوع مستند", f"تم تحديث إعدادات نوع المستند: {doc_type.title_ar}", username=claims.get('username'), user_id=int(get_jwt_identity()))
        return jsonify(doc_type.to_dict())

    if request.method == 'DELETE':
        log_action("حذف نوع مستند", f"تم حذف نوع المستند: {doc_type.title_ar}", username=claims.get('username'), user_id=int(get_jwt_identity()))
        db.session.delete(doc_type)
        db.session.commit()
        return jsonify({'message': 'تم حذف نوع المستند بنجاح'})

@app.route('/api/documents/employee/<int:employee_id>/checklist', methods=['GET'])
@jwt_required()
def get_employee_checklist(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    all_doc_types = DocumentType.query.filter_by(active=True).all()
    employee_docs = EmployeeDocument.query.filter_by(employee_id=employee_id).all()
    
    doc_status_map = {doc.doc_type_id: doc for doc in employee_docs}

    checklist = []
    for doc_type in all_doc_types:
        status_info = {
            "doc_type": doc_type.to_dict(),
            "status": "Missing",
            "file_path": None,
            "expiry_date": None,
            "note": None
        }
        
        # This is a simplified logic. Will be replaced with the complex SQL later.
        if doc_type.default_required:
            if doc_type.id in doc_status_map:
                emp_doc = doc_status_map[doc_type.id]
                status_info["status"] = emp_doc.status
                status_info["file_path"] = emp_doc.file_path
                status_info["expiry_date"] = emp_doc.expiry_date
                status_info["note"] = emp_doc.note
                
                if emp_doc.status not in ['Rejected', 'Expired'] and emp_doc.expiry_date:
                    try:
                        expiry = date.fromisoformat(emp_doc.expiry_date)
                        if expiry < date.today():
                            status_info["status"] = "Expired"
                        elif (expiry - date.today()).days <= 30:
                             status_info["status"] = "Expiring"
                    except (ValueError, TypeError):
                        pass # Ignore invalid date formats
            checklist.append(status_info)
            
    return jsonify({"checklist": checklist})


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

def seed_document_types():
    """Seeds the document_types table with default values."""
    with app.app_context():
        if DocumentType.query.first() is None:
            app.logger.info("Seeding document_types table...")
            seed_sql = """
            INSERT OR IGNORE INTO document_types
            (code, title_en, title_ar, category, default_required, requires_expiry, allowed_mime, max_size_mb, description, active)
            VALUES
            ('NID', 'National ID', 'بطاقة رقم قومي', 'basic', 1, 1, 'application/pdf,image/jpeg,image/png', 8, NULL, 1),
            ('BIRTH_CERT', 'Birth Certificate', 'شهادة ميلاد', 'basic', 1, 0, 'application/pdf,image/jpeg,image/png', 8, NULL, 1),
            ('PHOTO', 'Personal Photo', 'صورة شخصية', 'basic', 1, 0, 'image/jpeg,image/png', 5, NULL, 1),
            ('MILITARY', 'Military Status', 'الموقف من التجنيد', 'basic', 0, 0, 'application/pdf,image/jpeg,image/png', 8, NULL, 1),
            ('CRIMINAL', 'Criminal Record', 'فيش وتشبيه', 'basic', 1, 1, 'application/pdf,image/jpeg,image/png', 8, NULL, 1),
            ('HEALTH', 'Health Certificate', 'شهادة صحية/كشف طبي', 'basic', 0, 1, 'application/pdf,image/jpeg,image/png', 8, NULL, 1),
            ('DEGREE', 'Education Degree', 'شهادة المؤهل', 'basic', 1, 0, 'application/pdf,image/jpeg,image/png', 10, NULL, 1),
            ('WORK_CARD', 'Work Card', 'كعب عمل', 'basic', 1, 0, 'application/pdf,image/jpeg,image/png', 8, NULL, 1),
            ('SOCIAL_ID', 'Social Insurance Number', 'رقم التأمين الاجتماعي', 'basic', 1, 0, 'application/pdf,text/plain', 2, 'May be number proof', 1),
            ('EXPERIENCE', 'Experience Certificate', 'شهادات خبرة', 'additional', 0, 0, 'application/pdf,image/jpeg', 10, NULL, 1),
            ('TRAINING_CERT', 'Training Certificate', 'شهادة تدريب', 'additional', 0, 0, 'application/pdf,image/jpeg', 10, NULL, 1),
            ('DRIVING', 'Driving License', 'رخصة قيادة', 'additional', 0, 1, 'application/pdf,image/jpeg', 8, NULL, 1),
            ('INSURANCE_PRINT', 'Insurance Statement', 'برنت تأميني', 'additional', 0, 1, 'application/pdf,image/jpeg', 8, NULL, 1),
            ('CV', 'Curriculum Vitae (CV)', 'السيرة الذاتية', 'additional', 1, 0, 'application/pdf', 10, 'Imported on hire from Recruitment', 1);
            """
            db.session.execute(text(seed_sql))
            db.session.commit()
            app.logger.info("Document types seeded successfully.")


# --- App Context and DB Initialization ---
def init_db():
    with app.app_context():
        # This will create tables that don't exist yet, without dropping existing ones.
        app.logger.info("Ensuring all tables exist...")
        db.create_all()
        app.logger.info("Tables created or verified.")
        
        # Now, run migrations and seeding
        migrate_db()
        create_initial_admin_user()
        seed_document_types()
        app.logger.info("Database initialization complete.")


init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

    
