from sqlalchemy.orm import Session
from sqlalchemy import func, text
from typing import List, Optional
from app import models, schemas

class InventoryRepository:
    """
    Isolated data access layer for Inventory and Movements.
    Ensures data consistency by applying the ACID (Atomicity) 
    principle through automatic transaction management.
    """

    @staticmethod
    def get_by_id(db: Session, product_id: int) -> Optional[models.Product]:
        """Search for product by ID."""
        return db.query(models.Product).filter(models.Product.id == product_id).first()
    
    @staticmethod
    def get_by_sku(db: Session, sku: str) -> Optional[models.Product]:
        """Search for product by SKU."""
        return db.query(models.Product).filter(models.Product.sku == sku).first()
    
    @staticmethod
    def list_products(db: Session, skip: int = 0, limit: int = 10, search: Optional[str] = None) -> List[models.Product]:
        """"Lists products that support pagination and search by name."""
        query = db.query(models.Product)
        if search:
            query = query.filter(models.Product.name.contains(search))
        return query.offset(skip).limit(limit).all()
    
    @staticmethod
    def get_low_stock(db: Session, threshold: int) -> List[models.Product]:
        """Returns a list of products with low stock based on a specified limit."""
        return db.query(models.Product).filter(models.Product.stock_quantity <= threshold).all()
    
    @staticmethod
    def count_low_stock(db: Session, threshold: int = 5) -> int:
        """Counts the total quantity of products with stock at or below the limit."""
        return db.query(models.Product).filter(models.Product.stock_quantity <= threshold).count()
    
    @staticmethod
    def get_total_products_count(db: Session) -> int:
        """It counts the number of different products registered."""
        return db.query(models.Product).count()
    
    @staticmethod
    def get_total_stock_items(db: Session) -> int:
        """Add up the physical quantity of all items in stock."""
        return db.query(func.sum(models.Product.stock_quantity)).scalar() or 0
    
    @staticmethod
    def get_total_inventory_value(db: Session) -> float:
        """Calculates the total financial value of the current inventory (Price * Quantity)."""
        return db.query(func.sum(models.Product.price * models.Product.stock_quantity)).scalar() or 0.0
    
    @staticmethod
    def create_product(db: Session, product_data: schemas.ProductCreate) -> models.Product:
        new_product = models.Product(**product_data.model_dump())
        try:
            db.add(new_product)
            db.commit()
            db.refresh(new_product)
            return new_product
        except Exception as e:
            db.rollback()
            raise e
    
    @staticmethod
    def update_product(db: Session, db_product: models.Product, update_data: dict) -> models.Product:
        try:
            for key, value in update_data.items():
                setattr(db_product, key, value)
            db.commit()
            db.refresh(db_product)
            return db_product
        except Exception as e:
            db.rollback()
            raise e
    
    @staticmethod
    def delete_product(db: Session, db_product: models.Product) -> None:
        try:
            db.delete(db_product)
            db.commit()
        except Exception as e:
            db.rollback()
            raise e

    @staticmethod
    def create_movement(db: Session, product_id: int, user_id: int, quantity: int, movement_type: str) -> models.StockMovement:
        """Records a single stock movement (IN/OUT) with audit tracking in a transaction."""
        new_movement = models.StockMovement(
            product_id=product_id,
            user_id=user_id,
            quantity=quantity,
            movement_type=movement_type
        )
        
        try:
            db.add(new_movement)
            db.commit()
            db.refresh(new_movement)
            return new_movement
        except Exception as e:
            db.rollback()
            raise e
    
    @staticmethod
    def get_all_movements(db: Session, skip: int = 0, limit: Optional[int] = None) -> List[models.StockMovement]:
        """Searches the history of stock movements supporting pagination.
        If limit is None, returns all records to maintain compatibility with dashboard and tests.
        """
        query = db.query(models.StockMovement).order_by(models.StockMovement.created_at.desc())
        
        if skip > 0:
            query = query.offset(skip)
        if limit is not None:
            query = query.limit(limit)
            
        return query.all()
    
    @staticmethod
    def get_product_sales_history(product_id: int, db: Session):
        query = text("""
            SELECT quantity, created_at 
            FROM stock_movements 
            WHERE product_id = :product_id AND movement_type = 'OUT'
            ORDER BY created_at ASC
        """)
        return db.execute(query, {"product_id": product_id}).fetchall()