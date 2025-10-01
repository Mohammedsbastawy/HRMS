
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
from sqlalchemy.exc import IntegrityError

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
    employee_code = db.Column(db.String, unique=True, nullable=True)
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
    probation_end_date = db.Column(db.String, nullable=True)
    manager_id = db.Column(db.Integer, db.ForeignKey('employees.id'))
    base_salary = db.Column(db.Float)
    allowances = db.Column(db.Float)
    bank_account_number = db.Column(db.String)
    tax_number = db.Column(db.String)
    social_insurance_number = db.Column(db.String)
    status = db.Column(db.String, default='PendingOnboarding')
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
            if self.manager:
                data['manager'] = {'full_name': self.manager.full_name}
        return data

# --- Attendance & Timesheets Models ---

class WorkSchedule(db.Model):
    __tablename__ = 'work_schedules'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    description = db.Column(db.Text)
    weekly_off_days = db.Column(db.String) # JSON array
    active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    days = db.relationship('WorkScheduleDay', backref='schedule', lazy='dynamic', cascade="all, delete-orphan")

    def to_dict(self, include_days=False):
        d = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if isinstance(d.get('created_at'), datetime):
            d['created_at'] = d['created_at'].isoformat()
        if include_days:
            d['days'] = [day.to_dict() for day in self.days.all()]
        return d
        
class WorkScheduleDay(db.Model):
    __tablename__ = 'work_schedule_days'
    id = db.Column(db.Integer, primary_key=True)
    schedule_id = db.Column(db.Integer, db.ForeignKey('work_schedules.id', ondelete='CASCADE'), nullable=False)
    weekday = db.Column(db.String, nullable=False) # e.g., 'Sat', 'Sun'
    enabled = db.Column(db.Boolean, default=True)
    start_time = db.Column(db.Time)
    end_time = db.Column(db.Time)
    break_start = db.Column(db.Time)
    break_end = db.Column(db.Time)
    
    db.UniqueConstraint('schedule_id', 'weekday')

    def to_dict(self):
        d = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        for key in ['start_time', 'end_time', 'break_start', 'break_end']:
            if isinstance(d.get(key), time):
                d[key] = d[key].strftime('%H:%M') if d[key] else None
        return d

class EmployeeWorkSchedule(db.Model):
    __tablename__ = 'employee_work_schedules'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    schedule_id = db.Column(db.Integer, db.ForeignKey('work_schedules.id', ondelete='CASCADE'), nullable=False)
    effective_from = db.Column(db.String, nullable=False)
    effective_to = db.Column(db.String)
    
    db.UniqueConstraint('employee_id', 'schedule_id', 'effective_from')

class Shift(db.Model):
    __tablename__ = 'shifts'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    code = db.Column(db.String, unique=True)
    type = db.Column(db.String, default='fixed') # fixed, flex, night, split
    start_time = db.Column(db.Time) # Nullable for flex/split
    end_time = db.Column(db.Time)   # Nullable for flex/split
    total_hours = db.Column(db.Float) # For flex shifts
    break_minutes = db.Column(db.Integer, default=0)
    grace_in = db.Column(db.Integer, default=0)
    grace_out = db.Column(db.Integer, default=0)
    active = db.Column(db.Boolean, default=True)

    periods = db.relationship('ShiftPeriod', backref='shift', lazy='dynamic', cascade="all, delete-orphan")

    def to_dict(self, include_periods=False):
        d = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if isinstance(d.get('start_time'), time):
            d['start_time'] = d['start_time'].isoformat() if d['start_time'] else None
        if isinstance(d.get('end_time'), time):
            d['end_time'] = d['end_time'].isoformat() if d['end_time'] else None
        if include_periods:
            d['periods'] = [p.to_dict() for p in self.periods]
        return d

class ShiftPeriod(db.Model):
    __tablename__ = 'shift_periods'
    id = db.Column(db.Integer, primary_key=True)
    shift_id = db.Column(db.Integer, db.ForeignKey('shifts.id', ondelete='CASCADE'), nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)

    def to_dict(self):
        return {
            'id': self.id,
            'start_time': self.start_time.isoformat() if self.start_time else None,
            'end_time': self.end_time.isoformat() if self.end_time else None
        }

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
    late_minutes = db.Column(db.Integer)
    early_leave_minutes = db.Column(db.Integer)
    overtime_minutes = db.Column(db.Integer)
    notes = db.Column(db.Text)
    source = db.Column(db.String, default='device') # device, manual, system
    
    employee = db.relationship('Employee', backref='attendance_records')

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns if not c.name.startswith('_')}

# --- Roster Models ---
class RotationPattern(db.Model):
    __tablename__ = 'rotation_patterns'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    cycle_days = db.Column(db.Integer, nullable=False)
    active = db.Column(db.Boolean, default=True)

class RotationPatternLine(db.Model):
    __tablename__ = 'rotation_pattern_lines'
    id = db.Column(db.Integer, primary_key=True)
    pattern_id = db.Column(db.Integer, db.ForeignKey('rotation_patterns.id', ondelete='CASCADE'), nullable=False)
    day_index = db.Column(db.Integer, nullable=False)
    shift_id = db.Column(db.Integer, db.ForeignKey('shifts.id'))
    required_headcount = db.Column(db.Integer)

class RosterPeriod(db.Model):
    __tablename__ = 'roster_periods'
    id = db.Column(db.Integer, primary_key=True)
    start_date = db.Column(db.String, nullable=False)
    end_date = db.Column(db.String, nullable=False)
    scope = db.Column(db.String, default='company')
    scope_id = db.Column(db.Integer)
    status = db.Column(db.String, default='Draft') # Draft, Published, Locked
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    locked_at = db.Column(db.DateTime)

class RosterSlot(db.Model):
    __tablename__ = 'roster_slots'
    id = db.Column(db.Integer, primary_key=True)
    period_id = db.Column(db.Integer, db.ForeignKey('roster_periods.id', ondelete='CASCADE'), nullable=False)
    date = db.Column(db.String, nullable=False)
    shift_id = db.Column(db.Integer, db.ForeignKey('shifts.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    source = db.Column(db.String, default='manual') # manual, rotation, copy, import, auto
    status = db.Column(db.String, default='Draft') # Draft, Published, Changed, Cancelled
    note = db.Column(db.Text)
    
    db.UniqueConstraint('period_id', 'date', 'employee_id')

class ShiftAllowance(db.Model):
    __tablename__ = 'shift_allowances'
    id = db.Column(db.Integer, primary_key=True)
    shift_id = db.Column(db.Integer, db.ForeignKey('shifts.id', ondelete='CASCADE'), nullable=False)
    allowance_amount = db.Column(db.Float, default=0)
    apply_when = db.Column(db.String, default='worked') # scheduled, worked

# --- End of Attendance Models ---


class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    leave_type = db.Column(db.String, nullable=False)
    start_date = db.Column(db.String, nullable=False)
    end_date = db.Column(db.String, nullable=False)
    part_day = db.Column(db.String, default='none')
    hours_count = db.Column(db.Float)
    days_count = db.Column(db.Float)
    reason = db.Column(db.String)
    status = db.Column(db.String, default='Pending') # Pending, Approved, Rejected, PendingManager, ManagerApproved
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
    close_reason = db.Column(db.Text)
    
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
            'applicants_count': self.applicants.count(),
            'close_reason': self.close_reason
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
    
    # New optional fields
    linkedin_url = db.Column(db.String)
    portfolio_url = db.Column(db.String)
    years_experience = db.Column(db.Integer)
    current_title = db.Column(db.String)
    current_company = db.Column(db.String)
    expected_salary = db.Column(db.Float)

    __table_args__ = (db.UniqueConstraint('job_id', 'email', name='_job_email_uc'),)

    def to_dict(self):
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if self.job:
            data['job'] = {'title': self.job.title}
        return data

class DocumentType(db.Model):
    __tablename__ = 'document_types'
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String, unique=True, nullable=False)
    title_ar = db.Column(db.String, nullable=False)
    title_en = db.Column(db.String, nullable=False)
    description = db.Column(db.Text)
    category = db.Column(db.String, default='additional') # basic, additional
    default_required = db.Column(db.Boolean, default=False)
    requires_expiry = db.Column(db.Boolean, default=False)
    allowed_mime = db.Column(db.String, default='application/pdf,image/jpeg,image/png')
    max_size_mb = db.Column(db.Integer, default=10)
    active = db.Column(db.Boolean, default=True)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

class EmployeeDocument(db.Model):
    __tablename__ = 'employee_documents'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    doc_type_id = db.Column(db.Integer, db.ForeignKey('document_types.id'), nullable=False)
    file_path = db.Column(db.String, nullable=False)
    file_name = db.Column(db.String)
    mime_type = db.Column(db.String)
    expiry_date = db.Column(db.String)
    status = db.Column(db.String, default='Uploaded') # Uploaded, Verified, Rejected, Expired
    note = db.Column(db.String)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    doc_type = db.relationship('DocumentType')
    employee = db.relationship('Employee', backref='documents')

# --- Onboarding Models ---
class OnboardingRecord(db.Model):
    __tablename__ = 'onboarding_records'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    applicant_id = db.Column(db.Integer, db.ForeignKey('applicants.id'), nullable=True)
    assigned_hr_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    expected_start_date = db.Column(db.String)
    status = db.Column(db.String, default='Draft') # Draft, InProgress, Completed, Cancelled
    step = db.Column(db.String) # current wizard step
    checklist_json = db.Column(db.Text)
    missing_docs_count = db.Column(db.Integer, default=0)
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EmployeeEvent(db.Model):
    __tablename__ = 'employee_events'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    event = db.Column(db.String, nullable=False) # 'HIRED','ONBOARDING_ASSIGNED', etc.
    data_json = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'))

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
        employee_data = user.employee.to_dict(full=True)

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
                status=data.get('status', 'PendingOnboarding')
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

    # --- GET employees (active/managers) ---
    query = Employee.query
    
    is_manager = request.args.get('is_manager')
    if is_manager == 'true':
        # Find employees who are managers of other employees
        manager_ids = db.session.query(Employee.manager_id).distinct()
        query = query.filter(Employee.id.in_([mid[0] for mid in manager_ids if mid[0] is not None]))
        exclude_id = request.args.get('exclude_id')
        if exclude_id:
            query = query.filter(Employee.id != exclude_id)
        employees = query.all()
        return jsonify({"employees": [{'id': e.id, 'full_name': e.full_name} for e in employees]})

    query = query.filter(Employee.status == 'Active')
    employees = query.order_by(Employee.created_at.desc()).all()
    return jsonify({"employees": [e.to_dict() for e in employees]})

@app.route("/api/employees/all", methods=['GET'])
@jwt_required()
def handle_all_employees():
    employees = Employee.query.order_by(Employee.created_at.desc()).all()
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

@app.route("/api/employees/<int:id>/profile", methods=['GET'])
@jwt_required()
def get_employee_profile(id):
    employee = Employee.query.options(
        db.joinedload(Employee.department),
        db.joinedload(Employee.job_title),
        db.joinedload(Employee.manager)
    ).get_or_404(id)

    leaves = LeaveRequest.query.filter_by(employee_id=id).order_by(LeaveRequest.start_date.desc()).all()
    attendance_records = Attendance.query.filter_by(employee_id=id).order_by(Attendance.date.desc()).limit(30).all()
    
    # Simplified stats. This would be more complex with policies.
    stats = {
        "total_present": Attendance.query.filter_by(employee_id=id, status='Present').count(),
        "total_late": Attendance.query.filter_by(employee_id=id, status='Late').count(),
        "total_absent": Attendance.query.filter_by(employee_id=id, status='Absent').count(),
        "annual_leave_balance": 21 - LeaveRequest.query.filter_by(employee_id=id, leave_type='Annual', status='Approved').count() # Placeholder logic
    }

    return jsonify({
        "employee": employee.to_dict(full=True),
        "leaves": [l.to_dict() for l in leaves],
        "attendance": [a.to_dict() for a in attendance_records],
        "stats": stats
    })


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
            part_day=data.get('part_day', 'none'),
            hours_count=data.get('hours_count'),
            notes=data.get('notes'),
            reason=data.get('notes'), # Use notes for reason as well
            status='Pending' # Always starts as pending now
        )
        db.session.add(new_leave_request)
        db.session.commit()
        
        employee_of_leave = Employee.query.get(employee_id_to_use)
        log_action("تقديم طلب إجازة", f"تم تقديم طلب إجازة للموظف {employee_of_leave.full_name}", username=user.username, user_id=user.id)
        
        # Notify manager(s)
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
@app.route("/api/recruitment/jobs", methods=['GET', 'POST'])
@jwt_required()
def handle_recruitment_jobs():
    if request.method == 'POST':
        data = request.get_json()
        new_job = Job(
            title=data['title'],
            dept_id=int(data['dept_id']),
            description=data.get('description'),
            location=data.get('location'),
            employment_type=data.get('employment_type', 'full-time'),
            seniority=data.get('seniority'),
            openings=int(data.get('openings', 1)),
            status=data.get('status', 'Open')
        )
        db.session.add(new_job)
        db.session.commit()
        log_action("إضافة وظيفة", f"تمت إضافة وظيفة شاغرة: {new_job.title}")
        return jsonify(new_job.to_dict()), 201
    
    status_filter = request.args.get('status')
    query = Job.query.options(db.joinedload(Job.department)).order_by(Job.created_at.desc())
    
    if status_filter:
        query = query.filter(Job.status == status_filter)

    jobs = query.all()
    return jsonify({'jobs': [j.to_dict() for j in jobs]})


@app.route("/api/recruitment/jobs/<int:id>/status", methods=['PUT'])
@jwt_required()
def update_job_status(id):
    job = Job.query.get_or_404(id)
    data = request.get_json()
    new_status = data.get('status')
    
    if new_status not in ['Open', 'On-Hold', 'Closed']:
        return jsonify({'message': 'حالة غير صالحة'}), 400

    job.status = new_status
    if new_status == 'Closed':
        job.close_reason = data.get('close_reason', 'تم الإغلاق يدويًا')

    db.session.commit()
    log_action("تحديث حالة الوظيفة", f"تم تغيير حالة الوظيفة {job.title} إلى {new_status}")
    return jsonify(job.to_dict())

@app.route("/api/recruitment/applicants", methods=['GET', 'POST'])
@jwt_required()
def handle_applicants():
    if request.method == 'POST':
        try:
            if 'full_name' not in request.form or 'email' not in request.form:
                return jsonify({'message': 'الاسم والبريد الإلكتروني مطلوبان'}), 400
            
            email = request.form['email']
            if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
                return jsonify({'message': 'صيغة البريد الإلكتروني غير صالحة'}), 400
            
            years_experience_val = request.form.get('years_experience')
            expected_salary_val = request.form.get('expected_salary')

            new_applicant = Applicant(
                job_id=request.form['job_id'],
                full_name=request.form['full_name'],
                email=email,
                phone=request.form.get('phone'),
                source=request.form.get('source', 'manual'),
                years_experience=int(years_experience_val) if years_experience_val else None,
                current_title=request.form.get('current_title'),
                current_company=request.form.get('current_company'),
                expected_salary=float(expected_salary_val) if expected_salary_val else None,
                linkedin_url=request.form.get('linkedin_url'),
                portfolio_url=request.form.get('portfolio_url')
            )

            if 'cv_file' in request.files:
                file = request.files['cv_file']
                if file.filename != '':
                    filename = secure_filename(file.filename)
                    job_upload_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'applicants', str(new_applicant.job_id))
                    os.makedirs(job_upload_folder, exist_ok=True)
                    
                    unique_filename = f"{new_applicant.full_name.replace(' ', '_')}_{filename}"
                    file_path = os.path.join(job_upload_folder, unique_filename)
                    
                    file.save(file_path)
                    new_applicant.cv_path = os.path.join('applicants', str(new_applicant.job_id), unique_filename)


            db.session.add(new_applicant)
            db.session.commit()
            log_action("إضافة متقدم", f"تمت إضافة متقدم جديد: {new_applicant.full_name} للوظيفة ID {new_applicant.job_id}")
            return jsonify(new_applicant.to_dict()), 201

        except IntegrityError as e:
            db.session.rollback()
            app.logger.error(f"Integrity error adding applicant: {e}")
            return jsonify({"message": "هذا المتقدم مسجل بالفعل في هذه الوظيفة."}), 409
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error adding applicant: {e}")
            return jsonify({"message": f"حدث خطأ غير متوقع: {str(e)}"}), 500

    stage_filter = request.args.get('stage')
    query = Applicant.query.options(db.joinedload(Applicant.job)).order_by(Applicant.created_at.desc())
    if stage_filter:
        query = query.filter(Applicant.stage == stage_filter)

    applicants = query.all()
    return jsonify({'applicants': [a.to_dict() for a in applicants]})


@app.route("/api/recruitment/applicants/<int:id>", methods=['PUT', 'DELETE'])
@jwt_required()
def handle_applicant(id):
    applicant = Applicant.query.get_or_404(id)

    if request.method == 'PUT':
        data = request.form.to_dict()
        for key, value in data.items():
            if hasattr(applicant, key):
                setattr(applicant, key, value)
        
        if 'cv_file' in request.files:
            file = request.files['cv_file']
            if file.filename != '':
                filename = secure_filename(file.filename)
                job_upload_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'applicants', str(applicant.job_id))
                os.makedirs(job_upload_folder, exist_ok=True)
                unique_filename = f"{applicant.full_name.replace(' ', '_')}_{filename}"
                file_path = os.path.join(job_upload_folder, unique_filename)
                file.save(file_path)
                applicant.cv_path = os.path.join('applicants', str(applicant.job_id), unique_filename)

        db.session.commit()
        log_action("تحديث متقدم", f"تم تحديث بيانات المتقدم: {applicant.full_name}")
        return jsonify(applicant.to_dict())

    if request.method == 'DELETE':
        if applicant.cv_path:
            try:
                full_path = os.path.abspath(os.path.join(app.config['UPLOAD_FOLDER'], applicant.cv_path))
                if full_path.startswith(os.path.abspath(app.config['UPLOAD_FOLDER'])):
                    os.remove(full_path)
            except OSError as e:
                app.logger.error(f"Error deleting file {applicant.cv_path}: {e}")

        log_action("حذف متقدم", f"تم حذف المتقدم: {applicant.full_name}")
        db.session.delete(applicant)
        db.session.commit()
        return jsonify({'message': 'Applicant deleted successfully'})

@app.route("/api/recruitment/applicants/<int:id>/stage", methods=['PUT'])
@jwt_required()
def move_applicant_stage(id):
    applicant = Applicant.query.get_or_404(id)
    data = request.get_json()
    new_stage = data.get('stage')
    
    if new_stage not in ['Applied', 'Screening', 'Interview', 'Offer', 'Hired', 'Rejected']:
        return jsonify({'message': 'مرحلة غير صالحة'}), 400

    applicant.stage = new_stage
    db.session.commit()
    log_action("تغيير مرحلة متقدم", f"تم نقل المتقدم {applicant.full_name} إلى مرحلة {new_stage}")
    return jsonify(applicant.to_dict())

@app.route('/api/recruitment/applicants/<int:id>/hire', methods=['POST'])
@jwt_required()
def hire_applicant(id):
    applicant = Applicant.query.get_or_404(id)
    
    if applicant.stage == 'Hired':
        return jsonify({'message': 'المتقدم تم توظيفه بالفعل'}), 409

    if Employee.query.filter_by(email=applicant.email).first():
        return jsonify({'message': 'يوجد موظف بنفس البريد الإلكتروني بالفعل'}), 409
    
    job = Job.query.get_or_404(applicant.job_id)

    try:
        job_title = JobTitle.query.filter(JobTitle.title_ar.ilike(f'%{job.title}%'), JobTitle.department_id == job.dept_id).first()
        job_title_id = job_title.id if job_title else None

        new_employee = Employee(
            full_name=applicant.full_name,
            email=applicant.email,
            phone=applicant.phone,
            department_id=job.dept_id,
            job_title_id=job_title_id,
            status='PendingOnboarding'
        )
        db.session.add(new_employee)
        db.session.flush()

        onboarding_record = OnboardingRecord(
            employee_id=new_employee.id,
            applicant_id=applicant.id,
            status='Draft'
        )
        db.session.add(onboarding_record)

        applicant.stage = 'Hired'
        job.hires_count = (job.hires_count or 0) + 1
        if job.hires_count >= job.openings:
            job.status = 'Closed'
            job.close_reason = 'تم ملء جميع الشواغر'

        if applicant.cv_path:
            doc_type_cv = DocumentType.query.filter_by(code='CV').first()
            if doc_type_cv:
                emp_doc = EmployeeDocument(
                    employee_id=new_employee.id,
                    doc_type_id=doc_type_cv.id,
                    file_path=applicant.cv_path,
                    file_name=os.path.basename(applicant.cv_path),
                    status='Uploaded'
                )
                db.session.add(emp_doc)
        
        event = EmployeeEvent(employee_id=new_employee.id, event='HIRED', created_by=int(get_jwt_identity()))
        db.session.add(event)
        
        db.session.commit()
        
        log_action("توظيف متقدم", f"تم توظيف المتقدم {applicant.full_name} وبدء عملية التأهيل.", username=get_jwt().get('username'))
        return jsonify({'message': 'تم توظيف المتقدم بنجاح', 'employee_id': new_employee.id, 'onboarding_id': onboarding_record.id}), 201

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error hiring applicant: {e}")
        return jsonify({'message': 'حدث خطأ أثناء عملية التوظيف'}), 500


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
@app.route('/api/shifts', methods=['GET', 'POST'])
@jwt_required()
def handle_shifts():
    if request.method == 'POST':
        data = request.get_json()
        
        shift_data = {
            'name': data['name'],
            'code': data.get('code'),
            'type': data['type'],
            'break_minutes': data.get('break_minutes', 0),
            'grace_in': data.get('grace_in', 0),
            'grace_out': data.get('grace_out', 0),
            'active': data.get('active', True)
        }

        if data['type'] == 'flex':
            shift_data['total_hours'] = data.get('total_hours')
        elif data['type'] in ['fixed', 'night']:
            shift_data['start_time'] = datetime.strptime(data['start_time'], '%H:%M').time() if data.get('start_time') else None
            shift_data['end_time'] = datetime.strptime(data['end_time'], '%H:%M').time() if data.get('end_time') else None
        
        new_shift = Shift(**shift_data)
        db.session.add(new_shift)
        
        if data['type'] == 'split' and 'periods' in data:
            db.session.flush() # to get the new_shift.id
            for period_data in data['periods']:
                if period_data.get('start_time') and period_data.get('end_time'):
                    new_period = ShiftPeriod(
                        shift_id=new_shift.id,
                        start_time=datetime.strptime(period_data['start_time'], '%H:%M').time(),
                        end_time=datetime.strptime(period_data['end_time'], '%H:%M').time()
                    )
                    db.session.add(new_period)

        db.session.commit()
        return jsonify(new_shift.to_dict(include_periods=True)), 201

    shifts = Shift.query.all()
    return jsonify({"shifts": [s.to_dict() for s in shifts]})

@app.route('/api/shifts/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def handle_shift(id):
    shift = Shift.query.options(db.joinedload(Shift.periods)).get_or_404(id)
    
    if request.method == 'GET':
        return jsonify(shift.to_dict(include_periods=True))

    if request.method == 'PUT':
        data = request.get_json()
        
        shift.name = data.get('name', shift.name)
        shift.code = data.get('code', shift.code)
        shift.type = data.get('type', shift.type)
        shift.break_minutes = data.get('break_minutes', shift.break_minutes)
        shift.grace_in = data.get('grace_in', shift.grace_in)
        shift.grace_out = data.get('grace_out', shift.grace_out)
        shift.active = data.get('active', shift.active)

        if shift.type == 'flex':
            shift.total_hours = data.get('total_hours')
            shift.start_time = None
            shift.end_time = None
        elif shift.type in ['fixed', 'night']:
            shift.start_time = datetime.strptime(data['start_time'], '%H:%M').time() if data.get('start_time') else None
            shift.end_time = datetime.strptime(data['end_time'], '%H:%M').time() if data.get('end_time') else None
            shift.total_hours = None
        
        if shift.type == 'split':
            shift.start_time = None
            shift.end_time = None
            shift.total_hours = None
            # Simple delete and recreate for periods
            ShiftPeriod.query.filter_by(shift_id=id).delete()
            if 'periods' in data:
                for period_data in data['periods']:
                    if period_data.get('start_time') and period_data.get('end_time'):
                        new_period = ShiftPeriod(
                            shift_id=id,
                            start_time=datetime.strptime(period_data['start_time'], '%H:%M').time(),
                            end_time=datetime.strptime(period_data['end_time'], '%H:%M').time()
                        )
                        db.session.add(new_period)

        db.session.commit()
        return jsonify(shift.to_dict(include_periods=True))

    if request.method == 'DELETE':
        db.session.delete(shift)
        db.session.commit()
        return jsonify({'message': 'Shift deleted successfully'})


@app.route("/api/attendance", methods=['GET'])
@jwt_required()
def get_attendance():
    attendance_records = Attendance.query.options(db.joinedload(Attendance.employee)).order_by(Attendance.date.desc(), Attendance.check_in.desc()).all()
    return jsonify({"attendance": [record.to_dict() for record in attendance_records]})

@app.route('/api/attendance/history/<int:employee_id>', methods=['GET'])
@jwt_required()
def get_employee_attendance_history(employee_id):
    employee = Employee.query.options(
        db.joinedload(Employee.department),
        db.joinedload(Employee.job_title)
    ).get_or_404(employee_id)
    
    # Get last 30 days of attendance
    attendance = Attendance.query.filter_by(employee_id=employee_id).order_by(Attendance.date.desc()).limit(30).all()
    
    return jsonify({
        'employee': employee.to_dict(full=True),
        'attendance': [a.to_dict() for a in attendance]
    })


@app.route("/api/attendance/daily-log", methods=['GET'])
@jwt_required()
def get_daily_log():
    today_str = date.today().isoformat()
    
    # Subquery for employees present today
    present_employee_ids_sq = db.session.query(Attendance.employee_id).filter(Attendance.date == today_str).subquery()
    
    # Subquery for employees on leave today
    on_leave_employee_ids_sq = db.session.query(LeaveRequest.employee_id).filter(
        LeaveRequest.start_date <= today_str, 
        LeaveRequest.end_date >= today_str, 
        LeaveRequest.status.in_(['Approved', 'HRApproved'])
    ).subquery()

    # Employees who are neither present nor on leave are absent
    absent_employees = Employee.query.filter(
        Employee.status == 'Active',
        ~Employee.id.in_(present_employee_ids_sq),
        ~Employee.id.in_(on_leave_employee_ids_sq)
    ).options(db.joinedload(Employee.department)).all()

    # KPI counts
    present_count = db.session.query(present_employee_ids_sq).count()
    late_count = Attendance.query.filter(Attendance.date == today_str, Attendance.status == 'Late').count()
    absent_count = len(absent_employees)
    offline_devices_count = ZktDevice.query.filter(ZktDevice.status != 'online').count()

    kpis = {
        'present': present_count,
        'late': late_count,
        'absent': absent_count,
        'offline_devices': offline_devices_count
    }

    # Detailed daily log table
    daily_log_records = Attendance.query.options(db.joinedload(Attendance.employee)).filter(Attendance.date == today_str).all()
    
    # Add absent employees to the log for a complete view
    for emp in absent_employees:
        daily_log_records.append(Attendance(
            id=f"absent_{emp.id}",
            employee_id=emp.id,
            employee=emp,
            date=today_str,
            check_in=None,
            check_out=None,
            status='Absent'
        ))

    # Modal lists
    present_employees = Employee.query.filter(Employee.id.in_(present_employee_ids_sq)).options(db.joinedload(Employee.department)).all()
    late_employees_ids = {a.employee_id for a in Attendance.query.filter(Attendance.date == today_str, Attendance.status == 'Late')}
    late_employees = Employee.query.filter(Employee.id.in_(late_employees_ids)).options(db.joinedload(Employee.department)).all()
    offline_devices = ZktDevice.query.filter(ZktDevice.status != 'online').all()

    modal_lists = {
        'present': [emp.to_dict() for emp in present_employees],
        'late': [emp.to_dict() for emp in late_employees],
        'absent': [emp.to_dict() for emp in absent_employees],
        'offline_devices': [dev.to_dict() for dev in offline_devices]
    }
    
    # Add employee name to each record for easy display
    final_log = []
    for record in daily_log_records:
        rec_dict = record.to_dict()
        rec_dict['employee_name'] = record.employee.full_name if record.employee else 'Unknown'
        final_log.append(rec_dict)

    return jsonify({
        "kpis": kpis,
        "dailyLog": final_log,
        "modalLists": modal_lists
    })


@app.route("/api/attendance/test-connection", methods=['POST'])
@jwt_required()
def test_device_connection():
    data = request.get_json()
    ip = data.get('ip')
    port = data.get('port', 4370)
    
    if not ip:
        return jsonify({"success": False, "message": "عنوان IP مطلوب."}), 400
        
    conn = None
    zk = ZK(ip, port=port, timeout=5)
    try:
        conn = zk.connect()
        conn.disable_device()
        conn.enable_device()
        return jsonify({"success": True, "message": "تم الاتصال بالجهاز بنجاح!"})
    except Exception as e:
        return jsonify({"success": False, "message": f"فشل الاتصال: {e}"}), 500
    finally:
        if conn:
            conn.disconnect()

# --- ZKTeco Devices API ---
@app.route('/api/zkt-devices', methods=['GET', 'POST'])
@jwt_required()
def manage_zkt_devices():
    if request.method == 'POST':
        data = request.get_json()
        new_device = ZktDevice(
            name=data['name'],
            ip_address=data['ip_address'],
            location_id=data.get('location_id')
        )
        db.session.add(new_device)
        db.session.commit()
        return jsonify(new_device.to_dict()), 201

    devices = ZktDevice.query.options(db.joinedload(ZktDevice.location)).all()
    return jsonify({'devices': [d.to_dict() for d in devices]})


@app.route('/api/zkt-devices/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def handle_zkt_device(id):
    device = ZktDevice.query.get_or_404(id)
    if request.method == 'PUT':
        data = request.get_json()
        device.name = data.get('name', device.name)
        device.ip_address = data.get('ip_address', device.ip_address)
        device.location_id = data.get('location_id', device.location_id)
        db.session.commit()
        return jsonify(device.to_dict())

    if request.method == 'DELETE':
        db.session.delete(device)
        db.session.commit()
        return jsonify({'message': 'Device deleted'})


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


# --- Documents API ---
@app.route('/api/documents/types', methods=['GET', 'POST'])
@jwt_required()
def handle_document_types():
    if request.method == 'POST':
        data = request.get_json()
        new_type = DocumentType(**data)
        db.session.add(new_type)
        db.session.commit()
        return jsonify(new_type.to_dict()), 201
    
    types = DocumentType.query.all()
    return jsonify({'document_types': [t.to_dict() for t in types]})


@app.route('/api/documents/types/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def handle_document_type(id):
    doc_type = DocumentType.query.get_or_404(id)
    if request.method == 'PUT':
        data = request.get_json()
        for key, value in data.items():
            if hasattr(doc_type, key) and key != 'id':
                setattr(doc_type, key, value)
        db.session.commit()
        return jsonify(doc_type.to_dict())
    if request.method == 'DELETE':
        db.session.delete(doc_type)
        db.session.commit()
        return jsonify({'message': 'Document type deleted successfully'})


@app.route('/api/documents/employee/<int:employee_id>/checklist', methods=['GET'])
@jwt_required()
def get_employee_checklist(employee_id):
    employee = Employee.query.get_or_404(employee_id)
    doc_types = DocumentType.query.filter_by(active=True).all()
    employee_docs = EmployeeDocument.query.filter_by(employee_id=employee_id).all()
    
    docs_map = {doc.doc_type_id: doc for doc in employee_docs}
    
    checklist = []
    for dt in doc_types:
        item = {
            'doc_type': dt.to_dict(),
            'file_path': None,
            'file_name': None,
            'mime_type': None,
            'expiry_date': None,
            'note': None,
            'status': 'Missing'
        }
        if dt.id in docs_map:
            doc = docs_map[dt.id]
            item.update({
                'file_path': doc.file_path,
                'file_name': doc.file_name,
                'mime_type': doc.mime_type,
                'expiry_date': doc.expiry_date,
                'note': doc.note,
                'status': doc.status or 'Uploaded'
            })
        checklist.append(item)
        
    return jsonify({'checklist': checklist})


@app.route('/api/documents/employee/<int:employee_id>/upload', methods=['POST'])
@jwt_required()
def upload_employee_document(employee_id):
    if 'file' not in request.files:
        return jsonify({'message': 'No file part'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    
    doc_type_id = request.form.get('doc_type_id')
    doc_type = DocumentType.query.get(doc_type_id)
    if not doc_type:
        return jsonify({'message': 'Invalid document type'}), 400

    filename = secure_filename(file.filename)
    
    # Create a subdirectory for the employee if it doesn't exist
    employee_upload_folder = os.path.join(app.config['UPLOAD_FOLDER'], 'employees', str(employee_id))
    os.makedirs(employee_upload_folder, exist_ok=True)
    
    file_path = os.path.join(employee_upload_folder, filename)
    file.save(file_path)
    
    # Use a relative path for the database
    db_file_path = os.path.join('employees', str(employee_id), filename)

    # Check if a document of this type already exists for the employee
    existing_doc = EmployeeDocument.query.filter_by(employee_id=employee_id, doc_type_id=doc_type_id).first()
    
    if existing_doc:
        # Update existing document
        existing_doc.file_path = db_file_path
        existing_doc.file_name = filename
        existing_doc.mime_type = file.mimetype
        existing_doc.expiry_date = request.form.get('expiry_date') or None
        existing_doc.status = 'Uploaded' # Reset status on new upload
        existing_doc.uploaded_at = datetime.utcnow()
    else:
        # Create new document record
        new_doc = EmployeeDocument(
            employee_id=employee_id,
            doc_type_id=doc_type_id,
            file_path=db_file_path,
            file_name=filename,
            mime_type=file.mimetype,
            expiry_date=request.form.get('expiry_date') or None,
            status='Uploaded'
        )
        db.session.add(new_doc)
        
    db.session.commit()
    
    return jsonify({'message': 'File uploaded successfully', 'path': db_file_path}), 201


@app.route('/api/uploads/<path:filepath>')
@jwt_required()
def serve_uploaded_file(filepath):
    # This is a basic security measure. In a real app, you'd check
    # if the current user has permission to see this file.
    
    # Clean up path to prevent directory traversal
    filepath = filepath.replace('../', '')
    
    # Determine the base directory (e.g., 'applicants', 'employees')
    parts = filepath.split('/')
    if not parts:
        return jsonify({"message": "Invalid file path"}), 400
    
    base_dir = parts[0]
    # Reconstruct path relative to the specific upload folder
    safe_path = os.path.join(app.config['UPLOAD_FOLDER'], base_dir, *parts[1:])
    
    # Further security: ensure the resolved path is within the UPLOAD_FOLDER
    if not os.path.abspath(safe_path).startswith(os.path.abspath(app.config['UPLOAD_FOLDER'])):
        return jsonify({"message": "Forbidden"}), 403

    if not os.path.exists(safe_path):
        # Fallback for old paths that might have '..'
        fallback_path = os.path.join(app.config['UPLOAD_FOLDER'], *filepath.split('/'))
        if os.path.exists(fallback_path) and os.path.abspath(fallback_path).startswith(os.path.abspath(app.config['UPLOAD_FOLDER'])):
            directory = os.path.dirname(fallback_path)
            filename = os.path.basename(fallback_path)
            return send_from_directory(directory, filename)
        return jsonify({"message": "File not found"}), 404

    directory = os.path.dirname(safe_path)
    filename = os.path.basename(safe_path)
    return send_from_directory(directory, filename)

@app.route('/api/documents/overview', methods=['GET'])
@jwt_required()
def get_documents_overview():
    employees = Employee.query.filter_by(status='Active').all()
    doc_types = DocumentType.query.filter_by(active=True, default_required=True).all()
    
    required_doc_count = len(doc_types)
    overview = []
    
    for emp in employees:
        uploaded_docs = EmployeeDocument.query.filter_by(employee_id=emp.id).count()
        expiring_docs_count = 0 # Placeholder for now
        last_updated_doc = EmployeeDocument.query.filter_by(employee_id=emp.id).order_by(EmployeeDocument.uploaded_at.desc()).first()

        compliance_percent = (uploaded_docs / required_doc_count * 100) if required_doc_count > 0 else 100
        
        overview.append({
            **emp.to_dict(),
            'compliance_percent': round(compliance_percent),
            'missing_docs_count': max(0, required_doc_count - uploaded_docs),
            'expiring_docs_count': expiring_docs_count,
            'last_updated': last_updated_doc.uploaded_at.isoformat() if last_updated_doc else "لم يحدث"
        })
        
    return jsonify({'employees_compliance': overview})


# --- Reports API ---
@app.route("/api/reports", methods=['GET'])
@jwt_required()
def get_reports_data():
    active_employees_count = Employee.query.filter_by(status='Active').count()
    on_leave_today_count = 0 # Placeholder
    open_positions_count = Job.query.filter_by(status='Open').count()
    avg_performance_score = db.session.query(func.avg(PerformanceReview.score)).scalar() or 0

    employees_by_dept_raw = db.session.query(Department.name_ar, func.count(Employee.id)).join(Employee).group_by(Department.name_ar).all()
    leaves_by_type_raw = db.session.query(LeaveRequest.leave_type, func.count(LeaveRequest.id)).group_by(LeaveRequest.leave_type).all()
    
    all_employees = Employee.query.options(
        db.joinedload(Employee.department),
        db.joinedload(Employee.job_title)
    ).all()
    
    report_data = {
        'kpis': [
            {'title': 'إجمالي الموظفين النشطين', 'value': active_employees_count, 'icon': 'Users'},
            {'title': 'في إجازة اليوم', 'value': on_leave_today_count, 'icon': 'CalendarClock'},
            {'title': 'الوظائف الشاغرة', 'value': open_positions_count, 'icon': 'Briefcase'},
            {'title': 'متوسط تقييم الأداء', 'value': round(avg_performance_score, 2), 'icon': 'Star'},
        ],
        'employeesByDept': [{'name': name, 'value': count} for name, count in employees_by_dept_raw],
        'leavesByType': [{'name': type, 'value': count} for type, count in leaves_by_type_raw],
        'employees': [emp.to_dict() for emp in all_employees]
    }
    return jsonify(report_data)


# --- Work Schedules API ---

@app.route('/api/work-schedules', methods=['GET', 'POST'])
@jwt_required()
def handle_work_schedules():
    if request.method == 'POST':
        data = request.get_json()
        # You might want to add validation here
        new_schedule = WorkSchedule(
            name=data['name'],
            description=data.get('description'),
            weekly_off_days=data.get('weekly_off_days') # Expecting a JSON string
        )
        db.session.add(new_schedule)
        db.session.commit()
        log_action("إضافة جدول عمل", f"تمت إضافة جدول عمل جديد: {new_schedule.name}")
        return jsonify(new_schedule.to_dict()), 201

    schedules = WorkSchedule.query.order_by(WorkSchedule.name).all()
    return jsonify([s.to_dict() for s in schedules])


@app.route('/api/work-schedules/<int:id>', methods=['GET', 'PUT', 'DELETE'])
@jwt_required()
def handle_work_schedule(id):
    schedule = WorkSchedule.query.get_or_404(id)

    if request.method == 'GET':
        return jsonify(schedule.to_dict(include_days=True))

    if request.method == 'PUT':
        data = request.get_json()
        schedule.name = data.get('name', schedule.name)
        schedule.description = data.get('description', schedule.description)
        schedule.weekly_off_days = data.get('weekly_off_days', schedule.weekly_off_days)
        schedule.active = data.get('active', schedule.active)
        
        # Handle days
        if 'days' in data:
            # Simple delete and recreate for days
            WorkScheduleDay.query.filter_by(schedule_id=id).delete()
            for day_data in data['days']:
                if not day_data.get('weekday'): continue
                
                day_entry = WorkScheduleDay(
                    schedule_id=id,
                    weekday=day_data['weekday'],
                    enabled=day_data.get('enabled', False),
                    start_time=datetime.strptime(day_data['start_time'], '%H:%M').time() if day_data.get('start_time') else None,
                    end_time=datetime.strptime(day_data['end_time'], '%H:%M').time() if day_data.get('end_time') else None,
                    break_start=datetime.strptime(day_data['break_start'], '%H:%M').time() if day_data.get('break_start') else None,
                    break_end=datetime.strptime(day_data['break_end'], '%H:%M').time() if day_data.get('break_end') else None,
                )
                db.session.add(day_entry)

        db.session.commit()
        log_action("تحديث جدول عمل", f"تم تحديث جدول العمل: {schedule.name}")
        return jsonify(schedule.to_dict(include_days=True))

    if request.method == 'DELETE':
        schedule.active = False # Soft delete
        # db.session.delete(schedule) # Hard delete
        db.session.commit()
        log_action("حذف جدول عمل", f"تم حذف جدول العمل: {schedule.name}")
        return jsonify({'message': 'Work schedule deleted successfully'})



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

    