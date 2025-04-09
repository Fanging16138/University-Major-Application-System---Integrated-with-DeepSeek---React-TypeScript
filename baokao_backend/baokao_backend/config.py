from dotenv import load_dotenv
import os

# 加载 .env 文件
load_dotenv()

class Config:
    # SQLAlchemy 配置
    SQLALCHEMY_DATABASE_URI = os.getenv('SQLALCHEMY_DATABASE_URI')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # NVIDIA DeepSeek API 配置
    DEEPSEEK_API_KEY = os.getenv('DEEPSEEK_API_KEY')
    DEEPSEEK_BASE_URL = os.getenv('DEEPSEEK_BASE_URL', 'https://integrate.api.nvidia.com/v1')

    # 打印配置信息用于调试
    print("API Key:", DEEPSEEK_API_KEY)
    print("Base URL:", DEEPSEEK_BASE_URL)

    # 数据库配置
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_USER = os.getenv('DB_USER', 'root')
    DB_PASSWORD = os.getenv('DB_PASSWORD', '123456')
    DB_NAME = os.getenv('DB_NAME', 'major')

    # 其他配置项
    TEMPERATURE = 0.3
    MODEL_NAME = "deepseek-ai/deepseek-r1"
