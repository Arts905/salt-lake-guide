from app.db.session import SessionLocal
from app.db.models_attractions import Attraction

def check_attractions():
    db = SessionLocal()
    try:
        count = db.query(Attraction).count()
        print(f"Total Attractions: {count}")
        if count > 0:
            attractions = db.query(Attraction).all()
            for attr in attractions:
                print(f"ID: {attr.id}, Name: {attr.name}, Category: {attr.category}, Cover: {attr.cover_image}")
    except Exception as e:
        print(f"Error checking Attractions: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_attractions()