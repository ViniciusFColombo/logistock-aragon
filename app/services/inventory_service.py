import pandas as pd
from sqlalchemy.orm import Session
from datetime import datetime, timedelta, timezone
from fastapi import HTTPException, status
from typing import List, Optional
from app import models, schemas
from app.repositories.inventory_repo import InventoryRepository

class InventoryService:
    """
    Service Layer responsible for Business Rules, 
    Validations, and Predictive Intelligence (Pandas).
    """

    @staticmethod
    def create_product(db: Session, product_data: schemas.ProductCreate) -> models.Product:
        existing_product = InventoryRepository.get_by_sku(db, product_data.sku)
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SKU already registered"
            )
        return InventoryRepository.create_product(db, product_data)
    
    @staticmethod
    def list_products(db: Session, skip: int = 0, limit: int = 10, search: Optional[str] = None) -> List[models.Product]:
        return InventoryRepository.list_products(db, skip, limit, search)
    
    @staticmethod
    def get_product_by_id(db: Session, product_id: int) -> models.Product:
        product = InventoryRepository.get_by_id(db, product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        return product
    
    @staticmethod
    def get_product_by_sku(db: Session, sku: str) -> models.Product:
        product = InventoryRepository.get_by_sku(db, sku)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with SKU '{sku}' not found."
            )
        return product

    @staticmethod
    def get_low_stock(db: Session, threshold: int = 5) -> List[models.Product]:
        return InventoryRepository.get_low_stock(db, threshold)
    
    @staticmethod
    def get_dashboard_summary(db: Session) -> dict:
        total_products = InventoryRepository.get_total_products_count(db)
        total_stock_items = InventoryRepository.get_total_stock_items(db)
        total_inventory_value = InventoryRepository.get_total_inventory_value(db)
        
        low_stock_count = InventoryRepository.count_low_stock(db, threshold=15)

        movements = InventoryRepository.get_all_movements(db)
        
        inputs_month = 0
        outputs_month = 0
        estimated_revenue = 0.0
        
        thirty_days_ago = datetime.now(timezone.utc) - timedelta(days=30)
        cutoff_date = thirty_days_ago.replace(tzinfo=None)

        for m in movements:
            m_date = m.created_at
            if m_date is None:
                continue
            if m_date.tzinfo is not None:
                m_date = m_date.replace(tzinfo=None)
                
            # Filters only items from the last 30 days.
            if m_date > cutoff_date:
                
                m_type_str = str(m.movement_type.value if hasattr(m.movement_type, 'value') else m.movement_type).strip().upper()
                
                if m_type_str == "IN":
                    inputs_month += m.quantity
                    
                elif m_type_str == "OUT":
                    outputs_month += m.quantity
                    
                    if m.product_id:
                        from app import models
                        prod = db.query(models.Product).filter(models.Product.id == m.product_id).first()
                        if prod:
                            estimated_revenue += (m.quantity * float(prod.price))

        return {
            "total_products": total_products,
            "total_stock_items": total_stock_items,
            "total_inventory_value": round(total_inventory_value, 2),
            "low_stock_count": low_stock_count,
            "inputs_month": inputs_month,
            "outputs_month": outputs_month,
            "estimated_revenue": round(estimated_revenue, 2)
        }
    
    @staticmethod
    def update_product(db: Session, product_id: int, product_data: schemas.ProductUpdate) -> models.Product:
        db_product = InventoryRepository.get_by_id(db, product_id)
        if not db_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        update_dict = product_data.model_dump(exclude_unset=True)
        return InventoryRepository.update_product(db, db_product, update_dict)
    
    @staticmethod
    def delete_product(db: Session, product_id: int) -> None:
        db_product = InventoryRepository.get_by_id(db, product_id)
        if not db_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product not found"
            )
        InventoryRepository.delete_product(db, db_product)
        
    @staticmethod
    def create_stock_transaction(db: Session, transaction: schemas.StockMovementCreate, user_id: int) -> models.StockMovement:
        """Validates the inventory business rule and injects the logged-in employee's user_id."""
        db_product = InventoryRepository.get_by_id(db, transaction.product_id)
        if not db_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Business Rule: Prevent outflow (OUT) if there is insufficient stock.
        if transaction.movement_type == models.MovementType.OUT:
            if db_product.stock_quantity < transaction.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock. Available: {db_product.stock_quantity}"
                )
            db_product.stock_quantity -= transaction.quantity
        else:
            db_product.stock_quantity += transaction.quantity

        return InventoryRepository.create_movement(
            db=db,
            product_id=transaction.product_id,
            user_id=user_id, 
            quantity=transaction.quantity,
            movement_type=transaction.movement_type
        )
    
    @staticmethod
    def list_movements(db: Session, skip: int = 0, limit: int = 10) -> List[models.StockMovement]:
        """Business service to list movements with mandatory pagination limits."""
        return InventoryRepository.get_all_movements(db, skip=skip, limit=limit)

    @staticmethod
    def get_stock_runway_prediction(db: Session) -> list:
        products_list = InventoryRepository.list_products(db, limit=1000)
        movements_list = InventoryRepository.get_all_movements(db)

        if not products_list or not movements_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Missing data to perform analysis."
            )
        
        df_products = pd.DataFrame([p.__dict__ for p in products_list])
        df_movements = pd.DataFrame([m.__dict__ for m in movements_list])

        if '_sa_instance_state' in df_products.columns:
            df_products = df_products.drop(columns=['_sa_instance_state'])
        if '_sa_instance_state' in df_movements.columns:
            df_movements = df_movements.drop(columns=['_sa_instance_state'])

        df_movements['created_at'] = pd.to_datetime(df_movements['created_at'], utc=True)
        now_utc = datetime.now(timezone.utc)
        thirty_days_ago = now_utc - timedelta(days=30)

        recent_sales = df_movements[
            (df_movements['movement_type'] == models.MovementType.OUT) &
            (df_movements["created_at"] > thirty_days_ago)
        ]

        if recent_sales.empty:
            avg_sales_per_product = pd.Series(dtype=float)
        else:
            daily_avg = recent_sales.groupby(['product_id', recent_sales['created_at'].dt.date])['quantity'].sum()
            avg_sales_per_product = daily_avg.groupby('product_id').mean()

        predictions = []
        for _, product in df_products.iterrows():
            p_id = int(product['id'])    
            current_stock = int(product['stock_quantity'])
            avg_v = float(avg_sales_per_product.get(p_id, 0.0))

            status_stock = "OK"
            days_left = None

            if avg_v > 0:
                days_left = current_stock / avg_v
                if days_left <= 0:
                    status_stock = "OUT_OF_STOCK"
                    days_left = 0.0
                elif days_left <= 7:
                    status_stock = "CRITICAL"
            else:
                status_stock = "NO_SALES_DATA"

            predictions.append({
                "product_id": p_id,
                "product_name": product['name'],
                "current_stock": current_stock,
                "avg_sales_per_day": round(avg_v, 2),
                "estimated_days_left": round(days_left, 1) if days_left is not None else None,
                "status": status_stock
            })

        return predictions