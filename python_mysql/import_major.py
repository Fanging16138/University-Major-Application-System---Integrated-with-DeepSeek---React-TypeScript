import re
import mysql.connector

def connect_db():
    return mysql.connector.connect(
        host="localhost",
        user="root",          
        password="123456",    
        database="major"
    )

def parse_and_import_data(filename):
    db = connect_db()
    cursor = db.cursor()
    
    cursor.execute("TRUNCATE TABLE majors")
    cursor.execute("TRUNCATE TABLE major_subject")
    cursor.execute("TRUNCATE TABLE major_categories")
    
    current_category_code = None
    current_subject_code = None
    
    with open(filename, 'r', encoding='utf-8') as file:
        for line in file:
            line = line.strip()
            if not line:
                continue
                
            # 匹配专业大类
            category_match = re.match(r'^(\d{2})\s+([^\s]+)', line)
            if category_match:
                code, name = category_match.groups()
                current_category_code = code
                cursor.execute(
                    "INSERT INTO major_categories (code, name) VALUES (%s, %s)",
                    (code, name)
                )
                continue
                
            # 匹配专业类
            subject_match = re.match(r'^(\d{4})\s+([^\s]+)类', line)
            if subject_match:
                code, name = subject_match.groups()
                current_subject_code = code
                cursor.execute(
                    "INSERT INTO major_subject (code, name, category_code) VALUES (%s, %s, %s)",
                    (code, name, current_category_code)
                )
                continue
                
            # 修改后的专业匹配
            major_match = re.match(r'^(\d{6}(?:T|K|TK)?)\s+(.+?)(?=\s|$)', line)
            if major_match:
                code, name = major_match.groups()
                cursor.execute(
                    "INSERT INTO majors (code, name, subject_code) VALUES (%s, %s, %s)",
                    (code, name, current_subject_code)
                )
    
    db.commit()
    cursor.close()
    db.close()

if __name__ == "__main__":
    try:
        parse_and_import_data('major_list.txt')
        print("数据导入成功！")
    except Exception as e:
        print("导入出错:", str(e))