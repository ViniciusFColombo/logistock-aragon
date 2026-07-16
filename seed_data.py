import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models, constants
from app.database import SessionLocal, engine

def generate_random_date_between(start_date: datetime, end_date: datetime) -> datetime:
    """Generates a random date and time between two specific dates."""
    delta = end_date - start_date
    int_delta = (delta.days * 24 * 60 * 60) + delta.seconds
    random_second = random.randrange(int_delta)
    return start_date + timedelta(seconds=random_second)

def seed():
    models.Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        any_user = db.query(models.User).first()
        
        if not any_user:
            print("Error: No users found in database! Create at least ONE user in Swagger first.")
            return

        products = db.query(models.Product).all()
        
        if not products:
            print("Create at least one product in Swagger before running the script!")
            return

        print(f"Generating historical data for {len(products)} products using User ID: {any_user.id}...")

        # Date: June 1 to August 31, 2026
        start_range = datetime(2026, 6, 1, 0, 0, 0)
        end_range = datetime(2026, 8, 31, 23, 59, 59)

        for product in products:
            product.stock_quantity = 0

            for i in range(100):
                date = generate_random_date_between(start_range, end_range)
                
                m_type = constants.MovementType.IN if random.random() < 0.3 else constants.MovementType.OUT
                qty = random.randint(1, 10)

                # Consistency rule to prevent negative inventory
                if m_type == constants.MovementType.IN:
                    product.stock_quantity += qty
                else:
                    if product.stock_quantity - qty < 0:
                        product.stock_quantity += qty
                        m_type = constants.MovementType.IN
                    else:
                        product.stock_quantity -= qty

                movement = models.StockMovement(
                    product_id=product.id,
                    user_id=any_user.id,
                    quantity=qty,
                    movement_type=m_type,
                    created_at=date
                )
                db.add(movement)
        
        db.commit()
        print("Success! Database populated with 100 movements between June 1st and August 31st, 2026.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()