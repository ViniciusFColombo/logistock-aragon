import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL").replace("localhost", "db")
engine = create_engine(DATABASE_URL)

def run_predictive_analysis():
    print("--- Starting Predictive Analysis ---")
    try:
        df_movements = pd.read_sql("SELECT * FROM stock_movements", engine)
        df_products = pd.read_sql("SELECT * FROM products", engine)

        if df_movements.empty or df_products.empty:
            print("Missing data to perform analysis.")
            return

        df_movements['created_at'] = pd.to_datetime(df_movements['created_at'], utc=True)

        now_utc = datetime.now(timezone.utc)
        thirty_days_ago = now_utc - timedelta(days=30)
        
        recent_sales = df_movements[
            (df_movements['movement_type'] == 'OUT') & 
            (df_movements['created_at'] > thirty_days_ago)
        ]

        daily_avg = recent_sales.groupby(['product_id', recent_sales['created_at'].dt.date])['quantity'].sum()
        avg_sales_per_product = daily_avg.groupby('product_id').mean()

        print("\n--- Sales Velocity (Avg units/day) ---")
        if avg_sales_per_product.empty:
            print("No sales in the last 30 days.")
        else:
            print(avg_sales_per_product)

        print("\n--- Stock Runway Prediction ---")
        for _, product in df_products.iterrows():
            p_id = product['id']
            p_name = product['name']
            current_stock = product['stock_quantity']
            
            avg_v = avg_sales_per_product.get(p_id, 0)

            if avg_v > 0:
                days_left = current_stock / avg_v
                if days_left > 0:
                    print(f"Product: {p_name} | Stock: {current_stock} | Avg Sales: {avg_v:.2f}/day | Estimated Life: {days_left:.1f} days")
                else:
                    print(f"Product: {p_name} | Stock: {current_stock} | OUT OF STOCK - Restock immediately!")
            else:
                print(f"Product: {p_name} | No recent sales data.")

    except Exception as e:
        print(f"Error during prediction: {e}")

if __name__ == "__main__":
    run_predictive_analysis()