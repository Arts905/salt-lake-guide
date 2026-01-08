from fastapi import FastAPI
import sys
import os

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello from Minimal Vercel App!"}

@app.get("/health")
def health():
    return {"status": "ok"}

# 暂时注释掉原有的复杂 import，先跑通最小闭环
# try:
#     from app.main import app
# except Exception as e:
#     print(f"CRITICAL ERROR during startup import: {e}")
#     import traceback
#     traceback.print_exc()
#     raise e
