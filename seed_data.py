import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app import models, constants
from app.database import SessionLocal, engine

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

        for product in products:
            product.stock_quantity = 0

            for i in range(40):
                days_ago = random.randint(1, 90)
                date = datetime.now() - timedelta(days=days_ago)
                
                m_type = constants.MovementType.IN if random.random() < 0.3 else constants.MovementType.OUT
                qty = random.randint(1, 10)

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
        print("Success! Database populated with historical data.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()