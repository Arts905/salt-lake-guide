import sys
import os

# 增加错误捕获，防止 import 阶段崩溃导致无日志
try:
    from app.main import app
except Exception as e:
    print(f"CRITICAL ERROR during startup import: {e}")
    import traceback
    traceback.print_exc()
    raise e

# Vercel Serverless Function Entrypoint
# Vercel looks for a variable named `app` or handles the WSGI/ASGI interface automatically
# when using the @vercel/python runtime (implied by file extension).
