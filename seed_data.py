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

        # Date: July 1 to September 30, 2026
        start_range = datetime(2026, 7, 1, 0, 0, 0)
        end_range = datetime(2026, 9, 30, 23, 59, 59)

        total_movements_created = 0

        for product in products:
            product.stock_quantity = 0

            # Generate 20 timestamps per product and sort them chronologically
            dates = [generate_random_date_between(start_range, end_range) for _ in range(20)]
            dates.sort()

            for i, date in enumerate(dates):
                # RULE: First movement MUST be IN to establish initial stock
                if i == 0:
                    m_type = constants.MovementType.IN
                    qty = random.randint(15, 30)
                else:
                    # 40% chance of IN, 60% chance of OUT
                    m_type = constants.MovementType.IN if random.random() < 0.4 else constants.MovementType.OUT
                    qty = random.randint(1, 8)

                # Consistency check: convert OUT to IN if stock would drop below zero
                if m_type == constants.MovementType.OUT and (product.stock_quantity - qty < 0):
                    m_type = constants.MovementType.IN

                # Update virtual stock balance
                if m_type == constants.MovementType.IN:
                    product.stock_quantity += qty
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
                total_movements_created += 1

        db.commit()
        print(f"Success! Database populated with {total_movements_created} movements between July 1st and September 30th, 2026.")
    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()