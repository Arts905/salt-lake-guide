from fastapi import FastAPI
import sys
import os

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from Minimal Vercel App (Final Check)!"}

@app.get("/health")
def health():
    return {"status": "ok"}

# 暂时屏蔽所有业务逻辑，只保留最基础的 FastAPI
# 以验证环境是否彻底打通
# try:
#     from app.main import app
# except Exception as e:
#     ...
