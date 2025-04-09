from config import Config
import mysql.connector
from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, MajorCategory, MajorSubject, Major
from openai import OpenAI
import json

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    CORS(app)
    db.init_app(app)
    
    with app.app_context():
        db.create_all()

    # 初始化 DeepSeek 客户端
    client = OpenAI(
        api_key=Config.DEEPSEEK_API_KEY,
        base_url=Config.DEEPSEEK_BASE_URL
    )

    # 数据库连接
    def get_db_connection():
        return mysql.connector.connect(
            host=Config.DB_HOST,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            database=Config.DB_NAME
        )

    def read_major_list():
        """读取专业目录文件并解析成字典"""
        major_dict = {}  # 存储专业信息
        current_category = ""
        current_subject = ""
        
        try:
            with open('major_list.txt', 'r', encoding='utf-8') as file:
                for line in file:
                    line = line.strip()
                    if not line:
                        continue
                    
                    parts = line.split()
                    code = parts[0]
                    name = ' '.join(parts[1:])
                    
                    if len(code) == 2:
                        # 门类，如 "01 哲学"
                        current_category = name
                    elif len(code) == 4:
                        # 学科，如 "0101 哲学类"
                        current_subject = name
                    elif len(code) >= 6:
                        # 专业，如 "010101 哲学"
                        major_dict[code] = {
                            'code': code,
                            'name': name,
                            'category': current_category,
                            'subject': current_subject
                        }
        except Exception as e:
            print(f"读取专业目录文件出错: {e}")
            return {}
        
        return major_dict

    def find_similar_majors(major_code, major_dict):
        """根据专业代码找到相似专业"""
        try:
            target_major = major_dict.get(major_code)
            if not target_major:
                return []
            
            # 获取同一学科门类的专业
            same_subject_majors = [
                {'name': info['name'], 'code': code}
                for code, info in major_dict.items()
                if info['subject'] == target_major['subject'] 
                and code != major_code
                and len(code) >= 6  # 确保只返回专业，不返回类别
            ]
            
            # 如果同一学科的专业不足5个，则从同一门类中选择
            if len(same_subject_majors) < 5:
                other_majors = [
                    {'name': info['name'], 'code': code}
                    for code, info in major_dict.items()
                    if info['category'] == target_major['category'] 
                    and info['subject'] != target_major['subject']
                    and code != major_code
                    and len(code) >= 6  # 确保只返回专业，不返回类别
                ]
                same_subject_majors.extend(other_majors)
            
            # 返回最多5个相似专业
            return same_subject_majors[:5]
        except Exception as e:
            print(f"查找相似专业时出错: {e}")
            return []

    def generate_major_info(major_code):
        """使用 AI 生成专业信息，并从专业目录中获取准确信息"""
        try:
            # 读取专业目录
            major_dict = read_major_list()
            
            # 验证专业代码是否存在
            if major_code not in major_dict:
                print(f"专业代码 {major_code} 不存在")
                return None
                
            # 获取专业基本信息
            major_info = major_dict[major_code]
            
            # 获取相似专业
            similar_majors = find_similar_majors(major_code, major_dict)
            
            # 构建提示词
            prompt = f"""请你作为一个专业的高等教育顾问，为{major_info['name']}专业生成详细信息。
            请严格按照以下格式返回 JSON 数据，确保courses数组包含恰好10个课程：
            {{
                "courses": ["主要课程1", "主要课程2", ...(恰好10个课程)],
                "careerProspects": "就业前景描述(200字以内，不要包含小标题)",
                "qa": [
                    {{"question": "常见问题1", "answer": "答案1(150字以内，不需要小标题)"}},
                    {{"question": "常见问题2", "answer": "答案2(150字以内，不需要小标题)"}},
                    {{"question": "常见问题3", "answer": "答案3(150字以内，不需要小标题)"}}
                ]
            }}
            请确保信息准确、专业，并符合最新的教育部专业目录标准。
            所有内容必须是中文，不要包含英文。"""

            max_retries = 3
            for attempt in range(max_retries):
                try:
                    # 调用 AI 接口
                    response = client.chat.completions.create(
                        model="deepseek-ai/deepseek-r1",
                        messages=[
                            {"role": "system", "content": "你是一个专业的高等教育顾问。"},
                            {"role": "user", "content": prompt}
                        ],
                        temperature=0.3,
                        max_tokens=2000
                    )

                    # 解析 AI 返回的 JSON 数据
                    ai_result = json.loads(response.choices[0].message.content)
                    
                    # 验证数据格式和内容
                    if not isinstance(ai_result, dict):
                        raise ValueError("AI返回的不是有效的JSON对象")
                    
                    required_fields = ['courses', 'careerProspects', 'qa']
                    for field in required_fields:
                        if field not in ai_result:
                            raise ValueError(f"缺少必要字段: {field}")
                    
                    if not isinstance(ai_result['courses'], list) or len(ai_result['courses']) != 10:
                        raise ValueError("课程列表必须包含恰好10个课程")
                    
                    if not isinstance(ai_result['qa'], list) or len(ai_result['qa']) != 3:
                        raise ValueError("问答列表必须包含恰好3个问答对")
                    
                    # 验证字符串长度
                    if len(ai_result['careerProspects']) > 400:  # 200字约等于400字符
                        raise ValueError("就业前景描述超过200字限制")
                    
                    for qa_item in ai_result['qa']:
                        if len(qa_item['answer']) > 300:  # 150字约等于300字符
                            raise ValueError("问答答案超过150字限制")
                    
                    # 组合最终结果
                    result = {
                        'code': major_info['code'],
                        'name': major_info['name'],
                        'category': major_info['category'],
                        'subject': major_info['subject'],
                        'courses': ai_result['courses'],
                        'similarMajors': similar_majors,
                        'careerProspects': ai_result['careerProspects'],
                        'qa': ai_result['qa']
                    }
                    
                    return result

                except json.JSONDecodeError:
                    print(f"AI返回的内容不是有效的JSON格式，第{attempt + 1}次尝试")
                    if attempt == max_retries - 1:
                        raise
                    continue
                except ValueError as e:
                    print(f"数据验证失败: {str(e)}，第{attempt + 1}次尝试")
                    if attempt == max_retries - 1:
                        raise
                    continue

        except Exception as e:
            print(f"生成专业信息时出错: {e}")
            return None

    def save_major_info(major_info, conn, cursor):
        """保存专业信息到数据库（仅用于首次保存）"""
        try:
            # 插入主记录
            cursor.execute("""
                INSERT INTO detail_majors (detail_id, name, category, subject, career_prospects)
                VALUES (%s, %s, %s, %s, %s)
            """, (
                major_info['code'],
                major_info['name'],
                major_info['category'],
                major_info['subject'],
                major_info['careerProspects']
            ))

            # 插入课程
            for course in major_info['courses']:
                cursor.execute("""
                    INSERT INTO detail_courses (detail_id, course_name)
                    VALUES (%s, %s)
                """, (major_info['code'], course))

            # 插入相似专业
            for similar in major_info['similarMajors']:
                cursor.execute("""
                    INSERT INTO detail_similar (detail_id, similar_major_name, similar_major_code)
                    VALUES (%s, %s, %s)
                """, (major_info['code'], similar['name'], similar['code']))

            # 插入问答
            for qa in major_info['qa']:
                cursor.execute("""
                    INSERT INTO detail_qa (detail_id, question, answer)
                    VALUES (%s, %s, %s)
                """, (major_info['code'], qa['question'], qa['answer']))

            # 提交事务
            conn.commit()
            print(f"专业 {major_info['code']} 信息保存成功！")

        except Exception as e:
            print(f"保存专业信息时出错: {e}")
            conn.rollback()
            raise e

    @app.route('/api/majors/hierarchy', methods=['GET'])
    def get_majors_hierarchy():
        categories = MajorCategory.query.all()
        result = []
        for category in categories:
            category_data = {
                'code': category.code,
                'name': category.name,
                'subjects': []
            }
            
            for subject in category.subjects:
                subject_data = {
                    'code': subject.code,
                    'name': subject.name,
                    'majors': []
                }
                
                for major in subject.majors:
                    major_data = {
                        'code': major.code,
                        'name': major.name
                    }
                    subject_data['majors'].append(major_data)
                    
                category_data['subjects'].append(subject_data)
                
            result.append(category_data)
            
        return jsonify(result)

    @app.route('/api/major/<major_code>', methods=['GET'])
    def get_major(major_code):
        try:
            conn = get_db_connection()
            cursor = conn.cursor(dictionary=True)

            try:
                # 首先检查数据库中是否已有该专业信息
                cursor.execute("""
                    SELECT m.*, 
                           GROUP_CONCAT(DISTINCT c.course_name) as courses,
                           GROUP_CONCAT(DISTINCT CONCAT_WS('|', s.similar_major_name, s.similar_major_code)) as similar_majors,
                           GROUP_CONCAT(DISTINCT CONCAT_WS('|', q.question, q.answer)) as qa_pairs
                    FROM detail_majors m
                    LEFT JOIN detail_courses c ON m.detail_id = c.detail_id
                    LEFT JOIN detail_similar s ON m.detail_id = s.detail_id
                    LEFT JOIN detail_qa q ON m.detail_id = q.detail_id
                    WHERE m.detail_id = %s
                    GROUP BY m.detail_id
                """, (major_code,))
                
                major = cursor.fetchone()

                if major:
                    # 如果数据库中已有数据，直接处理并返回
                    courses = major['courses'].split(',') if major['courses'] else []
                    similar_majors = []
                    if major['similar_majors']:
                        for similar in major['similar_majors'].split(','):
                            name, code = similar.split('|')
                            similar_majors.append({'name': name, 'code': code})
                    
                    qa = []
                    if major['qa_pairs']:
                        for qa_pair in major['qa_pairs'].split(','):
                            question, answer = qa_pair.split('|')
                            qa.append({'question': question, 'answer': answer})

                    # 组装返回数据
                    result = {
                        'code': major['detail_id'],
                        'name': major['name'],
                        'category': major['category'],
                        'subject': major['subject'],
                        'careerProspects': major['career_prospects'],
                        'courses': courses,
                        'similarMajors': similar_majors,
                        'qa': qa
                    }

                    return jsonify(result)
                else:
                    # 如果数据库中没有，则调用 AI 生成数据
                    major_info = generate_major_info(major_code)
                    if major_info:
                        # 保存到数据库
                        save_major_info(major_info, conn, cursor)
                        return jsonify(major_info)
                    else:
                        return jsonify({'error': '无法获取专业信息'}), 404

            except Exception as e:
                print(f"获取专业信息时出错: {e}")
                return jsonify({'error': '获取专业信息失败'}), 500

            finally:
                cursor.close()
                conn.close()

        except Exception as e:
            print(f"数据库连接失败: {e}")
            return jsonify({'error': '数据库连接失败'}), 500

    @app.route('/api/majors/search', methods=['GET'])
    def search_majors():
        query = request.args.get('q', '')
        if not query:
            return jsonify([])
            
        majors = Major.query.filter(Major.name.like(f'%{query}%')).all()
        return jsonify([{
            'code': major.code,
            'name': major.name,
            'subject': {
                'code': major.subject.code,
                'name': major.subject.name,
                'category': {
                    'code': major.subject.category.code,
                    'name': major.subject.category.name
                }
            }
        } for major in majors])

    @app.route('/api/major/qa', methods=['POST'])
    def major_qa():
        try:
            data = request.get_json()
            major_name = data.get('major_name')
            question = data.get('question')

            if not major_name or not question:
                return jsonify({
                    'error': '缺少专业名称或问题'
                }), 400

            # 构建系统提示和用户问题
            messages = [
                {
                    "role": "system", 
                    "content": f"你是一个专业的高等教育顾问，专门解答关于{major_name}专业的问题。请尽量在300字以内提供准确、专业的回答, 贴近最近几年的情况。不需要小标题,直接回答问题。"
                },
                {
                    "role": "user", 
                    "content": question
                }
            ]

            # 调用 DeepSeek API
            response = client.chat.completions.create(
                model="deepseek-ai/deepseek-r1",
                messages=messages,
                temperature=0.3,
                max_tokens=800  # 减少最大token数以确保回答不会太长
            )

            # 获取回答并处理
            answer = response.choices[0].message.content.strip()
            # 如果回答以"<think>"开头，去掉思考部分
            if "<think>" in answer:
                answer = answer.split("</think>")[-1].strip()

            # 返回 AI 的回答
            return jsonify({
                'answer': answer,
                'major': major_name,
                'question': question
            })

        except Exception as e:
            print("错误详情:", str(e))
            return jsonify({
                'error': f'调用 AI 接口时出错: {str(e)}'
            }), 500

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True)
