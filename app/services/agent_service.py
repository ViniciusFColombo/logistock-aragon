import os
from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from app.services.inventory_service import InventoryService

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class AgentService:

    @staticmethod
    async def get_ai_recommendation(user_query: str, db: Session) -> str:
        try:
            runway_data = InventoryService.get_stock_runway_prediction(db)
            low_stock_data = InventoryService.get_low_stock(db, threshold=5)

            analytics_context = []
            for item in runway_data:
                analytics_context.append(
                    f"Product: {item['product_name']} (ID: {item['product_id']}) | "
                    f"Current Stock: {item['current_stock']} units | "
                    f"Avg Sales/Day: {item['avg_sales_per_day']} units | "
                    f"Estimated Days Left: {item['estimated_days_left']} days | "
                    f"Status: {item['status']}"
                )

            system_prompt = f"""
            You are an expert Logistics AI Assistant for 'LogiStock Aragón', an intelligent e-commerce inventory system.
            You have access to real-time predictive analytics processed via Pandas.

            PREDICTIVE INVENTORY DATA (METRICS & SALES VELOCITY):
            {chr(10).join(analytics_context)}

            CRITICAL INSTRUCTIONS:
            1. Analyze the sales velocity (Avg Sales/Day) and Estimated Days Left carefully.
            2. If a product is 'CRITICAL' or 'OUT_OF_STOCK', YOU MUST CALCULATE THE SUGGESTED PURCHASE QUANTITY FOR THE NEXT 30 DAYS using this formula:
               Suggested = (Avg Sales/Day * 30) + ABS(Current Stock if negative).
               Round the final number up to the nearest integer.
            3. Answer the user's query professionally, providing a clear table or list with the exact number of units they need to buy based on your 30-day calculation.
            4. DETECT the language of the user's query (e.g., English, Spanish, or Portuguese).
            5. YOU MUST RESPOND IN THE SAME LANGUAGE USED BY THE USER. If they ask in Spanish, reply in Spanish.
            """

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ],
                temperature=0.7
            )
            
            return response.choices[0].message.content

        except Exception as e:
            return f"Error processing AI Agent request: {str(e)}"