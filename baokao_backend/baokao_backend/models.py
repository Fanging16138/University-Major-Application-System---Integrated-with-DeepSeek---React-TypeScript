from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class MajorCategory(db.Model):
    __tablename__ = 'major_categories'
    code = db.Column(db.String(2), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    subjects = db.relationship('MajorSubject', backref='category', lazy=True)

class MajorSubject(db.Model):
    __tablename__ = 'major_subject'
    code = db.Column(db.String(4), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category_code = db.Column(db.String(2), db.ForeignKey('major_categories.code'), nullable=False)
    majors = db.relationship('Major', backref='subject', lazy=True)

class Major(db.Model):
    __tablename__ = 'majors'
    code = db.Column(db.String(8), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    subject_code = db.Column(db.String(4), db.ForeignKey('major_subject.code'), nullable=False)
