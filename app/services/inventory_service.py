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
                detail="SKU already registred"
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
        low_stock_count = InventoryRepository.count_low_stock(db, threshold=5)

        return {
            "total_products": total_products,
            "total_stock_items": total_stock_items,
            "total_inventory_value": round(total_inventory_value, 2),
            "low_stock_count": low_stock_count
        }
    
    @staticmethod
    def update_product(db: Session, product_id: int, product_data: schemas.ProductUpdate) -> models.Product:
        db_product = InventoryRepository.get_by_id(db, product_id)
        if not db_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # We converted the update scheme into a dictionary.
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
    def create_stock_transaction(db: Session, transaction: schemas.StockMovementCreate) -> models.StockMovement:
        db_product = InventoryRepository.get_by_id(db, transaction.product_id)
        if not db_product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Product not found"
            )
        
        # Business rule: Validate if there is sufficient stock for outbound (OUT) orders.
        if transaction.movement_type == models.MovementType.OUT:
            if db_product.stock_quantity < transaction.quantity:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Insufficient stock. Available: {db_product.stock_quantity}"
                )
            # Update the object in memory (the atomic transaction from the repository will save it)
            db_product.stock_quantity -= transaction.quantity
        else:
            db_product.stock_quantity += transaction.quantity

        return InventoryRepository.create_movement(
            db,
            transaction.product_id,
            transaction.quantity,
            transaction.movement_type
        )
    
    @staticmethod
    def get_stock_runway_prediction(db: Session) -> list:
        """
        Integrated Predictive Analytics: Calculates sales velocity (Pandas)
        and projects remaining inventory days in isolation.
        """
        products_list = InventoryRepository.list_products(db, limit=1000)
        movements_list = InventoryRepository.get_all_movements(db)

        if not products_list or not movements_list:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Missing data to perform analysis."
            )
        
        # We safely converted SQLAlchemy object lists into Pandas DataFrames.
        df_products = pd.DataFrame([p.__dict__ for p in products_list])
        df_movements = pd.DataFrame([m.__dict__ for m in movements_list])

        # Cleans up internal SQLAlchemy references that Pandas doesn't need.
        if '_sa_instance_state' in df_products.columns:
            df_products = df_products.drop(columns=['_sa_instance_state'])
        if '_sa_instance_state' in df_movements.columns:
            df_movements = df_movements.drop(columns=['_sa_instance_state'])

        # Secure temporal processing
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

        # Construction of the return payload
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