# 创建一个测试文件 test_mysql.py
import mysql.connector

try:
    connection = mysql.connector.connect(
        host="localhost",
        user="mysql80",          # 替换为您的MySQL用户名
        password="123456"     # 替换为您的MySQL密码
    )
    print("MySQL连接成功!")
    connection.close()
except Exception as e:
    print("连接出错:", str(e))