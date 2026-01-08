import sys
import os
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# 1. Ensure backend directory is in sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

# 2. Try to import the main app with robust fallback
try:
    from app.main import app
except BaseException as e:  # Catch SystemExit, KeyboardInterrupt, and everything else
    # 3. If import fails, create a dummy app to display the error
    print(f"CRITICAL ERROR during startup import: {e}")
    import traceback
    trace_str = traceback.format_exc()
    print(trace_str)
    
    app = FastAPI()
    
    @app.get("/{path:path}")
    def catch_all(path: str):
        return JSONResponse(
            status_code=500,
            content={
                "error": "Application Failed to Start",
                "message": str(e),
                "traceback": trace_str.split("\n")
            }
        )

# Vercel Serverless Function Entrypoint
# Vercel looks for a variable named `app`
