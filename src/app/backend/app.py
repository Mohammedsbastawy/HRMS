
from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime, timedelta
import logging
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, get_jwt_identity, jwt_required, JWTManager
from zk import ZK, const

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
app.config["JWT_SECRET_KEY"] = os.environ.get('SECRET_KEY', "super-secret-key-change-it") # Change this in your production environment

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

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

class Attendance(db.Model):
    __tablename__ = 'attendance'
    id = db.Column(db.Integer, primary_key=True)
    employee_uid = db.Column(db.String, nullable=False) # UID from ZKTeco device
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id'), nullable=True) # Link to our employee table
    timestamp = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.Integer, nullable=False) # Status code from device
    punch = db.Column(db.Integer, nullable=False) # Punch type from device
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    employee = db.relationship('Employee', backref='attendance_logs')
    
    def to_dict(self):
        return {
            'id': self.id,
            'employee_id': self.employee_id,
            'employeeName': self.employee.full_name if self.employee else f'UID: {self.employee_uid}',
            'employeeAvatar': self.employee.avatar if self.employee else None,
            'date': self.timestamp.strftime('%Y-%m-%d'),
            'check_in': self.timestamp.strftime('%H:%M:%S') if self.punch == const.PUNCH_IN else None,
            'check_out': self.timestamp.strftime('%H:%M:%S') if self.punch == const.PUNCH_OUT else None,
            'status': 'Present' # Simplified status
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
    comments = db.Column(db.String)
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
    deductions = dbColumn(db.Float, default=0)
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
    description = db.Column(db.Text)
    start_date = db.Column(db.String)
    end_date = db.Column(db.String)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
      return {
        'id': self.id,
        'title': self.title,
        'provider': self.provider,
        'description': self.description,
        'start_date': self.start_date,
        'end_date': self.end_date,
        'participant_count': TrainingRecord.query.filter_by(course_id=self.id).count()
      }

class TrainingRecord(db.Model):
    __tablename__ = 'training_records'
    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False)
    course_id = db.Column(db.Integer, db.ForeignKey('training_courses.id', ondelete='CASCADE'), nullable=False)
    status = db.Column(db.String, default='Enrolled') # Enrolled, In Progress, Completed, Failed
    result = db.Column(db.String)
    completed_at = db.Column(db.String)
    
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
                'department': self.employee.department.to_dict() if self.employee.department else None
            } if self.employee else None,
            'course': self.course.to_dict() if self.course else None,
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
            'password': self.password,
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
        
        access_token = create_access_token(identity={'username': user.username, 'role': user.role})
        response = jsonify({
            "message": "Login successful",
            "token": access_token,
            "user": {
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
    # With JWT, logout is handled on the client-side by deleting the token
    response = jsonify({"message": "Successfully logged out"})
    return response

# --- Users API ---
@app.route("/api/users", methods=['GET', 'POST'])
@jwt_required()
def handle_users():
    current_user_identity = get_jwt_identity()
    # You might want to add role-based access control here
    # For example: if current_user_identity['role'] != 'Admin': return jsonify(...), 403

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
        log_action("إضافة مستخدم", f"تمت إضافة مستخدم جديد: {new_user.username}", username=current_user_identity['username'])
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

# --- Leaves API ---
@app.route("/api/leaves", methods=['GET'])
@jwt_required()
def get_leaves():
    leave_requests = LeaveRequest.query.order_by(LeaveRequest.created_at.desc()).all()
    return jsonify({"leaveRequests": [lr.to_dict() for lr in leave_requests]})

@app.route("/api/leaves/<int:id>", methods=['PATCH'])
@jwt_required()
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
@jwt_required()
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
@jwt_required()
def get_recruitment_data():
    jobs = Job.query.order_by(Job.created_at.desc()).all()
    applicants = Applicant.query.all()
    return jsonify({
        "jobs": [j.to_dict() for j in jobs],
        "applicants": [a.to_dict() for a in applicants]
    })
    
# --- Other Read-only APIs ---
@app.route("/api/payrolls", methods=['GET'])
@jwt_required()
def get_payrolls():
    payrolls = Payroll.query.all()
    return jsonify({"payrolls": [p.to_dict() for p in payrolls]})
    
@app.route("/api/performance", methods=['GET'])
@jwt_required()
def get_performance():
    reviews = PerformanceReview.query.all()
    return jsonify({"performanceReviews": [r.to_dict() for r in reviews]})

@app.route("/api/audit-log", methods=['GET'])
@jwt_required()
def get_audit_logs():
    logs = AuditLog.query.order_by(AuditLog.timestamp.desc()).all()
    return jsonify({"auditLogs": [log.to_dict() for log in logs]})

@app.route("/api/attendance", methods=['GET'])
@jwt_required()
def get_attendance():
    # This is a simplified version. A real implementation would aggregate punches.
    attendance_records = Attendance.query.order_by(Attendance.timestamp.desc()).limit(50).all()
    return jsonify({"attendance": [att.to_dict() for att in attendance_records]})

# --- Training Courses API ---
@app.route('/api/training-courses', methods=['GET', 'POST'])
@jwt_required()
def handle_training_courses():
    if request.method == 'POST':
        data = request.get_json()
        new_course = TrainingCourse(
            title=data['title'],
            provider=data.get('provider'),
            description=data.get('description'),
            start_date=data.get('start_date') or None,
            end_date=data.get('end_date') or None
        )
        db.session.add(new_course)
        db.session.commit()
        log_action("إضافة دورة تدريبية", f"تمت إضافة دورة: {new_course.title}")
        return jsonify(new_course.to_dict()), 201

    courses = TrainingCourse.query.order_by(TrainingCourse.created_at.desc()).all()
    return jsonify({'courses': [c.to_dict() for c in courses]})

@app.route('/api/training-courses/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def handle_training_course(id):
    course = TrainingCourse.query.get_or_404(id)
    if request.method == 'PUT':
        data = request.get_json()
        course.title = data.get('title', course.title)
        course.provider = data.get('provider', course.provider)
        course.description = data.get('description', course.description)
        course.start_date = data.get('start_date', course.start_date)
        course.end_date = data.get('end_date', course.end_date)
        db.session.commit()
        log_action("تحديث دورة تدريبية", f"تم تحديث دورة: {course.title}")
        return jsonify(course.to_dict())
    
    if request.method == 'DELETE':
        log_action("حذف دورة تدريبية", f"تم حذف دورة: {course.title}")
        db.session.delete(course)
        db.session.commit()
        return jsonify({'message': 'تم حذف الدورة بنجاح'})

# --- Training Records API ---
@approute('/api/training-records', methods=['GET', 'POST'])
@jwt_required()
def handle_training_records():
    if request.method == 'POST':
        data = request.get_json()
        course_id = data.get('course_id')
        employee_ids = data.get('employee_ids', [])

        if not course_id or not employee_ids:
            return jsonify({'message': 'بيانات غير مكتملة'}), 400

        for emp_id in employee_ids:
            existing = TrainingRecord.query.filter_by(employee_id=emp_id, course_id=course_id).first()
            if not existing:
                record = TrainingRecord(employee_id=emp_id, course_id=course_id, status='Enrolled')
                db.session.add(record)
        
        db.session.commit()
        log_action("تسجيل موظفين بدورة", f"تم تسجيل {len(employee_ids)} موظفين في الدورة ID: {course_id}")
        return jsonify({'message': 'تم تسجيل الموظفين بنجاح'}), 201

    course_id = request.args.get('course_id')
    if course_id:
        records = TrainingRecord.query.filter_by(course_id=course_id).options(db.joinedload(TrainingRecord.employee).joinedload(Employee.department)).all()
        return jsonify({'records': [r.to_dict() for r in records]})
    
    return jsonify({'message': 'Please provide a course_id'}), 400

@app.route('/api/training-records/<int:id>', methods=['PUT', 'DELETE'])
@jwt_required()
def handle_training_record(id):
    record = TrainingRecord.query.get_or_404(id)
    if request.method == 'PUT':
        data = request.get_json()
        record.status = data.get('status', record.status)
        record.result = data.get('result', record.result)
        if record.status in ['Completed', 'Failed']:
            record.completed_at = datetime.utcnow().isoformat()
        db.session.commit()
        log_action("تحديث سجل تدريب", f"تم تحديث حالة الموظف ID: {record.employee_id} في الدورة ID: {record.course_id}")
        return jsonify(record.to_dict())

    if request.method == 'DELETE':
        log_action("حذف مشارك من دورة", f"تم حذف الموظف ID: {record.employee_id} من الدورة ID: {record.course_id}")
        db.session.delete(record)
        db.session.commit()
        return jsonify({'message': 'تم حذف المشارك بنجاح'})

# --- ZKTeco Devices API ---
@app.route('/api/zkt-devices', methods=['GET', 'POST'])
@jwt_required()
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
@jwt_required()
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
        success, message = test_pyzk_connection(ip, port)
        return jsonify({"success": success, "message": message})
    except Exception as e:
        app.logger.error(f"Unexpected error during ZK test: {e}")
        return jsonify({"success": False, "message": f"خطأ غير متوقع: {e}"}), 500


@app.route("/api/attendance/sync-all", methods=['POST'])
@jwt_required()
def sync_all_devices():
    devices = ZktDevice.query.all()
    total_new_records = 0
    errors = []
    
    for device in devices:
        conn = None
        zk = ZK(device.ip_address, port=device.port, timeout=5, force_udp=False, ommit_ping=True)
        try:
            conn = zk.connect()
            conn.disable_device()
            
            attendance_logs = conn.get_attendance()
            if not attendance_logs:
                continue

            new_records_count = 0
            for att_log in attendance_logs:
                exists = Attendance.query.filter_by(employee_uid=att_log.user_id, timestamp=att_log.timestamp).first()
                if not exists:
                    punch_value = att_log.punch if hasattr(att_log, 'punch') else 0 
                    new_att = Attendance(
                        employee_uid=str(att_log.user_id),
                        timestamp=att_log.timestamp,
                        status=att_log.status,
                        punch=punch_value,
                    )
                    db.session.add(new_att)
                    new_records_count += 1
            
            if new_records_count > 0:
                db.session.commit()
                total_new_records += new_records_count
                log_action("مزامنة ناجحة", f"تم سحب {new_records_count} سجلات جديدة من جهاز {device.name}")
        except Exception as e:
            db.session.rollback()
            error_message = f"فشل الاتصال بجهاز {device.name} ({device.ip_address}): {e}"
            errors.append(error_message)
            log_action("فشل المزامنة", error_message)
        finally:
            if conn:
                try:
                    conn.enable_device()
                    conn.disconnect()
                except Exception as e:
                    app.logger.error(f"Error during ZK disconnect/enable for {device.name}: {e}")

    if not errors and total_new_records == 0:
        return jsonify({"message": "لا توجد سجلات جديدة للمزامنة من أي جهاز.", "total_records": 0, "errors": []})
    
    if errors:
        return jsonify({"message": f"تمت المزامنة مع بعض المشاكل. إجمالي السجلات الجديدة: {total_new_records}", "total_records": total_new_records, "errors": errors}), 207
        
    return jsonify({"message": f"تمت مزامنة {total_new_records} سجلات جديدة بنجاح من {len(devices)} أجهزة.", "total_records": total_new_records, "errors": []})


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
            # This ensures that any new tables are created if they don't exist
            db.create_all()
        
        create_initial_admin_user()


init_db()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

    