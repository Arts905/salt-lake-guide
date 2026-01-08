import shutil
import os

files_to_sync = [
    (r"c:\Users\ARTS\Desktop\盐湖检测系统\rn-expo\app\index.tsx", r"C:\Users\ARTS\Documents\yanhu-rn\app\index.tsx"),
    (r"c:\Users\ARTS\Desktop\盐湖检测系统\rn-expo\app\lake-detail.tsx", r"C:\Users\ARTS\Documents\yanhu-rn\app\lake-detail.tsx"),
    (r"c:\Users\ARTS\Desktop\盐湖检测系统\rn-expo\lib\config.ts", r"C:\Users\ARTS\Documents\yanhu-rn\lib\config.ts"),
    (r"c:\Users\ARTS\Desktop\盐湖检测系统\rn-expo\lib\api.ts", r"C:\Users\ARTS\Documents\yanhu-rn\lib\api.ts"),
]

for src, dst in files_to_sync:
    try:
        print(f"Copying {src} to {dst}...")
        shutil.copy2(src, dst)
        print("Success!")
    except Exception as e:
        print(f"Error copying {src}: {e}")
