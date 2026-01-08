from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

app = FastAPI(title="盐湖景观实时监测系统")

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件
static_dir = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_dir):
    os.makedirs(static_dir)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

@app.get("/health")
def health_check():
    return {"status": "ok", "version": "1.0.0 (Minimal Mode)"}

from fastapi.responses import FileResponse

@app.get("/")
def read_root():
    # 优先返回静态首页
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Salt Lake System is Running! (No index.html found)"}

from app.db.session import engine, Base
from app.db.init_data import init_sample_attractions
from app.db.models_poi import PointOfInterest
from app.tasks.scheduler import start_scheduler
from app.api.routes import attractions, recommend, weather, predictions, community, user, subscriptions, sensors

# 启动时初始化
@app.on_event("startup")
def on_startup():
    print("Startup: Begin")
    
    # 检查是否在 Vercel 环境
    is_vercel = os.environ.get("VERCEL")
    print(f"Startup: Is Vercel? {is_vercel}")
    
    # 在 Vercel 环境中，通常不建议在启动时做繁重的数据库操作
    # 但如果是 Serverless SQL 数据库，可以保留
    # FIX: Vercel 启动超时优化 - 如果是 Vercel，跳过繁重的建表和初始化
    if not is_vercel:
        print("Startup: Creating Tables...")
        Base.metadata.create_all(bind=engine)
        print("Startup: Tables Created")
    else:
        print("Startup: Vercel detected, skipping heavy table creation to avoid timeout.")
        # 尝试仅创建必要的表，或者完全跳过（取决于是否连接了外部数据库）
        # 如果是 SQLite in-memory，不建表会导致查询报错，所以必须建，但要快
        try:
             Base.metadata.create_all(bind=engine)
        except Exception as e:
             print(f"Startup: Create Tables Error (ignored): {e}")

    # 启动调度器 (非 Vercel 环境)
    if not is_vercel:
        print("Startup: Starting Scheduler...")
        start_scheduler()
    
    # 初始化数据 (可选)
    # 在 Vercel 上，每次冷启动都是空的数据库，所以需要初始化
    # 但要注意并发启动时不要冲突（SQLite会锁）
    if not is_vercel:
        print("Startup: Initing Data...")
        try:
            init_sample_attractions()
        except Exception as e:
            print(f"Startup: Init Data Error (ignored): {e}")
    else:
        print("Startup: Vercel detected, skipping data init to save time.")
    
    print("Startup: Done")

# 注册路由
app.include_router(attractions.router, prefix="/api/attractions", tags=["Attractions"])
app.include_router(recommend.router, prefix="/api/recommend", tags=["Recommend"])
app.include_router(weather.router, prefix="/api/weather", tags=["Weather"])
app.include_router(predictions.router, prefix="/api/prediction", tags=["Prediction"])
app.include_router(community.router, prefix="/api/community", tags=["Community"])
app.include_router(user.router, prefix="/api/user", tags=["User"])
app.include_router(subscriptions.router, prefix="/api/subscriptions", tags=["Subscriptions"])
app.include_router(sensors.router, prefix="/api/sensors", tags=["Sensors"])
