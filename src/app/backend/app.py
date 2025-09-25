from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
import os
from datetime import datetime

# Initialize Flask App
app = Flask(__name__)
CORS(app) # Enable CORS for all routes

# Configure Database
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'hrms.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- Database Models ---

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
        if include_manager and self.manager:
            data['manager'] = {'full_name': self.manager.full_name}
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
    headcount = db.Column(db.Integer, default=0)
    parent_department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    job_titles = db.relationship('JobTitle', backref='department', lazy=True, cascade="all, delete-orphan")

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}

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
    
    department = db.relationship('Department', foreign_keys=[department_id], backref='employees', lazy=True)
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
              'full_name': self.employee.full_name,
              'avatar': self.employee.avatar
          }
      return data

class Job(db.Model):
    __tablename__ = 'jobs'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String, nullable=False)
    description = db.Column(db.String)
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id'))
    job_title_id = db.Column(db.Integer, db.ForeignKey('job_titles.id'))
    location_id = db.Column(db.Integer, db.ForeignKey('locations.id'))
    status = db.Column(db.String, default='Open')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    department = db.relationship('Department', backref='jobs', lazy=True)

    def to_dict(self):
        data = {c.name: getattr(self, c.name) for c in self.__table__.columns}
        if self.department:
            data['department_name_ar'] = self.department.name_ar
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
    user_id = db.Column(db.Integer) # No foreign key to avoid complexity
    action = db.Column(db.String, nullable=False)
    details = db.Column(db.String)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        # A simple username lookup. In a real app, this would be a relationship.
        username = 'نظام'
        if self.user_id:
            user = User.query.get(self.user_id)
            if user:
                username = user.username
        return {
            'id': self.id,
            'username': username,
            'action': self.action,
            'details': self.details,
            'timestamp': self.timestamp.isoformat()
        }
        
# --- API Routes ---

@app.route("/api")
def index():
    return jsonify({"message": "Python Flask backend for HRMS is running."})

# --- Employees API ---
@app.route("/api/employees", methods=['GET', 'POST'])
def handle_employees():
    if request.method == 'POST':
        data = request.get_json()
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
        return jsonify(new_employee.to_dict()), 201

    is_manager = request.args.get('is_manager')
    if is_manager == 'true':
        managers = Employee.query.filter(Employee.id.in_(db.session.query(Employee.manager_id).distinct())).all()
        return jsonify({"employees": [e.to_dict() for e in managers]})

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
            budget=data.get('budget'),
            description=data.get('description'),
        )
        db.session.add(new_dept)
        db.session.commit()
        return jsonify(new_dept.to_dict()), 201
    
    departments = Department.query.order_by(Department.created_at.desc()).all()
    job_titles = JobTitle.query.join(Department).order_by(JobTitle.created_at.desc()).all()

    return jsonify({
        "departments": [d.to_dict() for d in departments],
        "jobTitles": [jt.to_dict(include_department=True) for jt in job_titles]
    })
    
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
        return jsonify(new_jt.to_dict()), 201

    job_titles = JobTitle.query.all()
    return jsonify([jt.to_dict() for jt in job_titles])

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
            manager_id=int(data['manager_id']) if data.get('manager_id') else None
        )
        db.session.add(new_loc)
        db.session.commit()
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
        leave_request.approved_by = 1 # Placeholder for current user ID
        db.session.commit()
        return jsonify({"success": True, "message": "تمت الموافقة على طلب الإجازة."})
    elif action == 'reject':
        leave_request.status = 'Rejected'
        leave_request.approved_by = 1 # Placeholder
        leave_request.notes = data.get('notes', '')
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
        "text": f"{log.username or 'النظام'} قام بـ \"{log.action}\"",
        "time": log.timestamp.strftime('%Y-%m-%d %H:%M:%S')
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

# --- App Context ---
with app.app_context():
    # This will create the database file and tables if they don't exist
    db.create_all()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
