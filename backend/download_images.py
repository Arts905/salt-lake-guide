import os
import requests
import hashlib

# 映射关系：景点名称 -> 图片URL
# 这里使用 Unsplash 的随机图片作为示例
IMAGE_URLS = {
    "盐湖湿地公园": "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800",
    "22号堤埝": "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800",
    "落日红堤": "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800",
    "鸟类观测点1": "https://images.unsplash.com/photo-1452570053594-1b985d6ea890?w=800",
    "野生大豆观测点": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800",
    "色彩之境": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "天空之境": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800",
    "项链池": "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800",
    "湿地芦苇荡": "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=800",
    "天鹅湖": "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800",
    "硝花池": "https://images.unsplash.com/photo-1433086966358-54859d0ed716?w=800",
    "鸟类观测点2": "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800",
    "盐湖博物馆": "https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=800",
    "日落大道": "https://images.unsplash.com/photo-1495616811223-4d98c6e9d869?w=800", # Added missing item
    "运城盐湖·主景区": "https://images.unsplash.com/photo-1508197149814-0cc02a8b7f82?w=800", # Added missing item
    "运城盐湖·五彩盐湖": "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800", # Added missing item
}

def download_images():
    # 确保目录存在
    base_dir = os.path.join("app", "static", "attractions")
    os.makedirs(base_dir, exist_ok=True)
    
    print(f"Start downloading {len(IMAGE_URLS)} images to {base_dir}...")
    
    mapping = {}
    
    for name, url in IMAGE_URLS.items():
        # 生成唯一文件名
        hash_name = hashlib.md5(name.encode()).hexdigest()
        filename = f"{hash_name}.jpg"
        filepath = os.path.join(base_dir, filename)
        
        print(f"Downloading {name}...")
        try:
            # Check if exists (skip if exists to save time, or force download if corrupted)
            if not os.path.exists(filepath):
                 resp = requests.get(url, timeout=10)
                 if resp.status_code == 200:
                     with open(filepath, "wb") as f:
                         f.write(resp.content)
                     print(f"  - Downloaded: {filename}")
                 else:
                     print(f"  - Failed: {resp.status_code}")
            else:
                 print(f"  - Exists: {filename}")
        except Exception as e:
            print(f"  - Error: {e}")
            
        # 记录映射路径
        mapping[name] = f"/static/attractions/{filename}"

    print("\nComplete! Here is the new mapping dict for ui_templates.py:")
    print("="*50)
    for k, v in mapping.items():
        print(f'        "{k}": "{v}",')
    print("="*50)

if __name__ == "__main__":
    download_images()