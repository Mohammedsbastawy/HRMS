
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import logging
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from node_zklib import ZKLib

# Configure logging
logging.basicConfig(level=logging.INFO)

# Initialize Flask App
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configure Database & Secret Key
basedir = os.path.abspath(os.path.dirname(__file__))
db_path = os.path.join(basedir, 'hrms.db')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + db_path
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-fallback-secret-key-for-development')


db = SQLAlchemy(app)

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
    id = db.Column(db.Integer, primary_key=True)
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


    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'hire_date': self.hire_date,
            'status': self.status,
            'avatar': self.avatar,
            'department': {'name_ar': self.department.name_ar, 'name_en': self.department.name_en} if self.department else None,
            'jobTitle': {'title_ar': self.job_title.title_ar} if self.job_title else None
        }

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

class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.String)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    status = db.Column(db.String, default='Open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    department = db.relationship('Department', backref='jobs', lazy=True)

    def to_dict(self):
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if self.department:
            data['department_name_ar'] = self.department.name_ar
        if isinstance(data.get('created_at'), datetime):
            data['created_at'] = data['created_at'].isoformat()
        return data

class Applicant(db.Model):
    __tablename__ = 'applicants'
    id = db.Column(db.Integer, primary_key=True)
    job_id = db.Column(db.Integer, db.ForeignKey('jobs.id'), nullable=False)
    name = db.Column(db.String, nullable=False)
    email = db.Column(db.String, unique=True)
    phone = db.Column(db.String)
    cv_path = db.Column(db.String)
    stage = db.Column(db.String, default='Applied')
    applied_at = db.Column(db.DateTime, default=datetime.utcnow)
    notes = db.Column(db.String)
    avatar = db.Column(db.String)
    job = db.relationship('Job', backref='applicants', lazy=True)

    def to_dict(self):
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if self.job:
            data['job'] = {'title': self.job.title}
        if isinstance(data.get('applied_at'), datetime):
            data['applied_at'] = data['applied_at'].isoformat()
        return data
        
class PerformanceReview(db.Model):
    __tablename__ = 'performance_reviews'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    review_date = db.Column(db.String, nullable=False)
    score = db.Column(db.Float, nullable=False)
    reviewer_id = db.Column(db.Integer)
    comments = db_Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    employee = db.relationship('Employee', backref='performance_reviews', lazy=True)
    
    def to_dict(self):
      return {
          'id': self.id,
          'employee_id': self.employee_id,
          'employeeName': self.employee.full_name if self.employee else None,
          'review_date': self.review_date,
          'score': self.score,
          'comments': self.comments,
      }

class Payroll(db.Model):
    __tablename__ = 'payrolls'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    month = db.Column(db.String, nullable=False)
    year = db.Column(db.Integer, nullable=False)
    base_salary = db.Column(db.Float, nullable=False)
    overtime = db.Column(db.Float, default=0)
    deductions = db.Column(db.Float, default=0)
    tax = db.Column(db.Float, default=0)
    insurance = db.Column(db.Float, default=0)
    net_salary = db.Column(db.Float, nullable=False)
    generated_at = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String, default='Generated')
    employee = db.relationship('Employee', backref='payrolls', lazy=True)

    def to_dict(self):
      return {
          'id': self.id,
          'employeeName': self.employee.full_name if self.employee else None,
          'base_salary': self.base_salary,
          'overtime': self.overtime,
          'deductions': self.deductions,
          'net_salary': self.net_salary,
      }

class TrainingCourse(db.Model):
    __tablename__ = 'training_courses'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    provider = db.Column(db.String)
    start_date = db.Column(db.String)
    end_date = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
class TrainingRecord(db.Model):
    __tablename__ = 'training_records'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('training_courses.id'), nullable=False)
    status = db.Column(db.String, default='Enrolled')
    result = db.Column(db.String)
    completed_at = db.Column(db.String)
    employee = db.relationship('Employee', backref='training_records', lazy=True)
    course = db.relationship('TrainingCourse', backref='training_records', lazy=True)
    
    def to_dict(self):
      return {
          'id': self.id,
          'employee_id': self.employee_id,
          'status': self.status,
          'result': self.result,
          'employeeName': self.employee.full_name if self.employee else None,
          'courseTitle': self.course.title if self.course else None,
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

class ZktDevice(db.Model):
    __tablename__ = 'zkt_devices'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, nullable=False)
    ip_address = db.Column(db.String, nullable=False, unique=True)
    port = db.Column(db.Integer, default=4370)
    username = db.Column(db.String)
    password = db.Column(db.String)
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    location = db.relationship('Location', backref='zkt_devices', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'ip_address': self.ip_address,
            'port': self.port,
            'username': self.username,
            'password': self.password, # Note: Sending password to frontend is a security risk.
            'location_id': self.location_id,
            'location_name': self.location.name_ar if self.location else None
        }


# --- Utility Functions ---
def log_action(action, details, username="نظام", user_id=None):
    try:
        log = AuditLog(action=action, details=details, username=username, user_id=user_id)
        db.session.add(log)
        db.session.commit()
    except Exception as e:
        app.logger.error(f"Failed to log action: {e}")
        db.session.rollback()

def encode_auth_token(user_id, role):
    try:
        payload = {
            'exp': datetime.utcnow() + timedelta(days=1),
            'iat': datetime.utcnow(),
            'sub': user_id,
            'role': role
        }
        return jwt.encode(
            payload,
            app.config.get('SECRET_KEY'),
            algorithm='HS256'
        )
    except Exception as e:
        return e

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
        
        auth_token = encode_auth_token(user.id, user.role)
        response = jsonify({
            "message": "Login successful",
            "token": auth_token,
            "user": {
                "username": user.username,
                "role": user.role,
            }
        })
        # Set cookie
        response.set_cookie('authToken', auth_token, httponly=True, samesite='Lax', max_age=86400) # 1 day
        log_action("تسجيل دخول", f"نجح المستخدم {username} في تسجيل الدخول.", username=username, user_id=user.id)
        return response, 200

    log_action("محاولة تسجيل دخول فاشلة", f"محاولة فاشلة للدخول باسم المستخدم {username}.", username=username)
    return jsonify({"message": "اسم المستخدم أو كلمة المرور غير صحيحة"}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    response = jsonify({"message": "Successfully logged out"})
    response.set_cookie('authToken', '', expires=0) # Clear cookie
    return response

# --- Users API ---
@app.route("/api/users", methods=['GET', 'POST'])
def handle_users():
    # Simple token validation (can be improved with a decorator)
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({"message": "Missing or invalid token"}), 401
    
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
        log_action("إضافة مستخدم", f"تمت إضافة مستخدم جديد: {new_user.username}")
        return jsonify(new_user.to_dict()), 201

    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({"users": [u.to_dict() for u in users]})


# --- Employees API ---
@app.route("/api/employees", methods=['GET', 'POST'])
def handle_employees():
    if request.method == 'POST':
        data = request.get_json()
        if not data:
            return jsonify({"message": "No input data provided"}), 400
        try:
            new_employee = Employee(
                full_name=data['full_name'],
                email=data['email'],
                department_id=int(data['department_id']),
                job_title_id=int(data['job_title_id']),
                location_id=int(data['location_id']),
                hire_date=data['hire_date'],
                base_salary=float(data['base_salary']),
                manager_id=int(data['manager_id']) if data.get('manager_id') else None,
                status=data['status']
            )
            db.session.add(new_employee)
            db.session.commit()
            log_action("إضافة موظف", f"تمت إضافة موظف جديد: {new_employee.full_name}")
            return jsonify(new_employee.to_dict()), 201
        except Exception as e:
            db.session.rollback()
            app.logger.error(f"Error adding employee: {e}")
            return jsonify({"message": "حدث خطأ داخلي"}), 500

    is_manager = request.args.get('is_manager')
    if is_manager == 'true':
        managers = Employee.query.filter(Employee.id.in_(db.session.query(Employee.manager_id).distinct())).all()
        return jsonify({"employees": [{'id': e.id, 'full_name': e.full_name} for e in managers]})

    employees = Employee.query.order_by(Employee.created_at.desc()).all()
    return jsonify({"employees": [e.to_dict() for e in employees]})

# --- Departments API ---
@app.route("/api/departments", methods=['GET', 'POST'])
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

# --- Leaves API ---
@app.route("/api/leaves", methods=['GET'])
def get_leaves():
    leave_requests = LeaveRequest.query.order_by(LeaveRequest.created_at.desc()).all()
    return jsonify({"leaveRequests": [lr.to_dict() for lr in leave_requests]})

@app.route("/api/leaves/<int:id>", methods=['PATCH'])
def update_leave(id):
    leave_request = LeaveRequest.query.get_or_404(id)
    data = request.get_json()
    action = data.get('action')

    if leave_request.status != 'Pending':
        return jsonify({"success": False, "message": "لم يتم العثور على الطلب أو تمت معالجته بالفعل."}), 404

    if action == 'approve':
        leave_request.status = 'Approved'
        leave_request.approved_by = 1 # Placeholder
        details = f"تمت الموافقة على طلب الإجازة للموظف {leave_request.employee.full_name}"
        log_action("الموافقة على إجازة", details)
        db.session.commit()
        return jsonify({"success": True, "message": "تمت الموافقة على طلب الإجازة."})
    elif action == 'reject':
        leave_request.status = 'Rejected'
        leave_request.approved_by = 1 # Placeholder
        leave_request.notes = data.get('notes', '')
        details = f"تم رفض طلب الإجازة للموظف {leave_request.employee.full_name} بسبب: {leave_request.notes}"
        log_action("رفض إجازة", details)
        db.session.commit()
        return jsonify({"success": True, "message": "تم رفض طلب الإجازة."})
    else:
        return jsonify({"success": False, "message": "إجراء غير صالح"}), 400

# --- Dashboard API ---
@app.route("/api/dashboard", methods=['GET'])
def get_dashboard_data():
    employees = Employee.query.all()
    leave_requests = LeaveRequest.query.all()
    performance_reviews = PerformanceReview.query.all()
    jobs = Job.query.filter_by(status='Open').all()
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).limit(5).all()

    recent_activities = [{
        "text": f"{log.username or 'النظام'} قام بـ \"{log.action}\" - {log.details}",
        "time": f"منذ {int((datetime.utcnow() - log.timestamp).total_seconds() / 60)} دقائق"
    } for log in logs]

    return jsonify({
        "employees": [e.to_dict() for e in employees],
        "leaveRequests": [lr.to_dict() for lr in leave_requests],
        "performanceReviews": [pr.to_dict() for pr in performance_reviews],
        "jobs": [j.to_dict() for j in jobs],
        "recentActivities": recent_activities
    })

# --- Recruitment API ---
@app.route("/api/recruitment", methods=['GET'])
def get_recruitment_data():
    jobs = Job.query.order_by(Job.created_at.desc()).all()
    applicants = Applicant.query.all()
    return jsonify({
        "jobs": [j.to_dict() for j in jobs],
        "applicants": [a.to_dict() for a in applicants]
    })
    
# --- Other Read-only APIs ---
@app.route("/api/payrolls", methods=['GET'])
def get_payrolls():
    payrolls = Payroll.query.all()
    return jsonify({"payrolls": [p.to_dict() for p in payrolls]})
    
@app.route("/api/performance", methods=['GET'])
def get_performance():
    reviews = PerformanceReview.query.all()
    return jsonify({"performanceReviews": [r.to_dict() for r in reviews]})

@app.route("/api/training", methods=['GET'])
def get_training():
    records = TrainingRecord.query.all()
    employees = Employee.query.all()
    reviews = PerformanceReview.query.all()
    return jsonify({
        "trainingRecords": [r.to_dict() for r in records],
        "employees": [e.to_dict() for e in employees],
        "performanceReviews": [pr.to_dict() for pr in reviews]
    })
    
@app.route("/api/audit-log", methods=['GET'])
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    return jsonify({"auditLogs": [log.to_dict() for log in logs]})

# --- ZKTeco Devices API ---
@app.route('/api/zkt-devices', methods=['GET', 'POST'])
def handle_zkt_devices():
    if request.method == 'POST':
        data = request.get_json()
        if not data or not data.get('name') or not data.get('ip_address'):
            return jsonify({'message': 'بيانات غير مكتملة'}), 400
        
        existing_device = ZktDevice.query.filter_by(ip_address=data['ip_address']).first()
        if existing_device:
            return jsonify({'message': 'جهاز بنفس عنوان IP موجود بالفعل'}), 409

        new_device = ZktDevice(
            name=data['name'],
            ip_address=data['ip_address'],
            port=data.get('port', 4370),
            username=data.get('username'),
            password=data.get('password'),
            location_id=int(data['location_id']) if data.get('location_id') else None
        )
        db.session.add(new_device)
        db.session.commit()
        log_action("إضافة جهاز بصمة", f"تمت إضافة جهاز جديد: {new_device.name} ({new_device.ip_address})")
        return jsonify(new_device.to_dict()), 201

    devices = ZktDevice.query.options(db.joinedload(ZktDevice.location)).order_by(ZktDevice.name).all()
    return jsonify({'devices': [d.to_dict() for d in devices]})

@app.route('/api/zkt-devices/<int:id>', methods=['PUT', 'DELETE'])
def handle_zkt_device(id):
    device = ZktDevice.query.get_or_404(id)
    if request.method == 'PUT':
        data = request.get_json()
        device.name = data.get('name', device.name)
        device.ip_address = data.get('ip_address', device.ip_address)
        device.port = data.get('port', device.port)
        device.username = data.get('username', device.username)
        device.password = data.get('password', device.password)
        device.location_id = int(data['location_id']) if data.get('location_id') else None
        db.session.commit()
        log_action("تحديث جهاز بصمة", f"تم تحديث بيانات الجهاز: {device.name}")
        return jsonify(device.to_dict())
    
    if request.method == 'DELETE':
        log_action("حذف جهاز بصمة", f"تم حذف الجهاز: {device.name} ({device.ip_address})")
        db.session.delete(device)
        db.session.commit()
        return jsonify({'message': 'تم حذف الجهاز بنجاح'})

# --- ZKTeco Sync ---
async def test_zklib_connection(ip, port, timeout=2):
    zk = ZKLib(ip, port, timeout)
    try:
        await zk.createSocket()
        serial_number = await zk.getSerialNumber()
        return True, f"تم الاتصال بنجاح. الرقم التسلسلي: {serial_number.data}"
    except Exception as e:
        return False, f"فشل الاتصال: {e}"
    finally:
        if zk.is_connect:
            await zk.disconnect()

@app.route("/api/attendance/test-connection", methods=['POST'])
def test_connection_route():
    data = request.get_json()
    ip = data.get('ip')
    port = data.get('port', 4370)
    
    if not ip:
        return jsonify({"success": False, "message": "لم يتم توفير عنوان IP"}), 400
        
    try:
        import asyncio
        success, message = asyncio.run(test_zklib_connection(ip, port))
        return jsonify({"success": success, "message": message})
    except Exception as e:
        return jsonify({"success": False, "message": f"خطأ غير متوقع: {e}"}), 500


@app.route("/api/attendance/sync-all", methods=['POST'])
def sync_all_devices():
    devices = ZktDevice.query.all()
    all_records = []
    errors = []
    
    for device in devices:
        try:
            zk = ZKLib(device.ip_address, device.port, 5000)
            zk.connect()
            zk.enableDevice()
            
            attendance = zk.getAttendance()
            if attendance:
                all_records.extend(attendance)
                # You might want to save these to the DB here
            
            zk.disableDevice()
            zk.disconnect()
            log_action("مزامنة ناجحة", f"تم سحب {len(attendance)} سجلات من جهاز {device.name}")
        except Exception as e:
            errors.append(f"فشل الاتصال بجهاز {device.name} ({device.ip_address}): {e}")
            log_action("فشل المزامنة", f"فشل الاتصال بجهاز {device.name} ({device.ip_address})")
            
    if not errors and not all_records:
         return jsonify({"message": "لا توجد سجلات جديدة للمزامنة من أي جهاز.", "total_records": 0, "errors": []})
    
    if errors:
        return jsonify({"message": f"تمت المزامنة مع بعض المشاكل. إجمالي السجلات: {len(all_records)}", "total_records": len(all_records), "errors": errors}), 207 # Multi-Status
        
    return jsonify({"message": f"تمت مزامنة {len(all_records)} سجلات بنجاح من {len(devices)} أجهزة.", "total_records": len(all_records), "errors": []})


def create_initial_admin_user():
    with app.app_context():
        # Check if any user exists
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

# --- App Context and DB Initialization ---
def init_db():
    with app.app_context():
        if not os.path.exists(db_path):
            app.logger.info("Database not found, creating it...")
            try:
                db.create_all()
                app.logger.info("Database and tables created successfully.")
            except Exception as e:
                app.logger.error(f"Error creating database: {e}")
        else:
            app.logger.info("Database already exists.")
            db.create_all() # Ensure all tables exist
        
        create_initial_admin_user()


init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

    