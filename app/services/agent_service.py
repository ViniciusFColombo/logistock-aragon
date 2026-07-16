import os
from openai import AsyncOpenAI
from sqlalchemy.orm import Session
from app.services.inventory_service import InventoryService
from app.repositories.inventory_repo import InventoryRepository
from app.services.ml_service import MLService

client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))

class AgentService:

    @staticmethod
    async def get_ai_recommendation(user_query: str, db: Session) -> str:
        try:
            runway_data = InventoryService.get_stock_runway_prediction(db)

            analytics_context = []
            
            if runway_data:
                for item in runway_data:
                    product_id = item['product_id']
                    sales_history = InventoryRepository.get_product_sales_history(product_id, db)
                    predicted_7_days = MLService.predict_next_days_sales(sales_history, days_to_predict=7)

                    analytics_context.append(
                        f"- Product: {item['product_name']} (ID: {product_id})\n"
                        f"  Current Stock: {item['current_stock']} units\n"
                        f"  Avg Sales/Day: {item['avg_sales_per_day']} units\n"
                        f"  Estimated Days Left: {item['estimated_days_left']} days\n"
                        f"  ML Demand Forecast (Next 7 Days): {predicted_7_days} units\n"
                        f"  Status: {item['status']}"
                    )

            dados_finais = "\n".join(analytics_context) if analytics_context else "No active products found in the database pipeline."

            system_prompt = f"""You are an expert Logistics AI Assistant for 'LogiStock Aragón', an intelligent e-commerce inventory system.
                Anonymized system context applied. You have access to real-time predictive analytics processed via Pandas AND advanced demand forecasting generated via Scikit-Learn (Linear Regression).

                CRITICAL DATABASE DATA:
                {dados_finais}

                CRITICAL INSTRUCTIONS:
                1. Analyze BOTH the sales velocity (Avg Sales/Day) and the ML Demand Forecast (Next 7 Days) to understand shopping trends.
                2. If a product is 'CRITICAL' or 'OUT_OF_STOCK', or if the 'ML Demand Forecast (Next 7 Days)' is higher than the 'Current Stock', YOU MUST CALCULATE THE SUGGESTED PURCHASE QUANTITY FOR THE NEXT 30 DAYS using this formula:
                Suggested = (Avg Sales/Day * 30) + ABS(Current Stock if negative).
                Adjust the suggestion if the ML trend indicates a sudden surge in demand.
                Round the final number up to the nearest integer.
                3. Answer the user's query professionally, providing a clear table or list with the exact number of units they need to buy based on your 30-day calculation and ML trends.
                4. DETECT the language of the user's query (e.g., English, Spanish, or Portuguese).
                5. STRICT LANGUAGE RULE: You MUST respond in the EXACT SAME language used by the user in their current query. If the query is in English, you MUST reply entirely in English. If it is in Spanish, reply in Spanish. Never mix them.
                6. NO EVASIVE ANSWERS: You have full access to the inventory data above. Never claim you lack access to data, history, or stock metrics. If asked about stock outputs, performance, or demand, extract the answers directly from the provided CRITICAL DATABASE DATA.
                """

            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_query}
                ],
                temperature=0.3 
            )
            
            return response.choices[0].message.content

        except Exception as e:
            return f"Error processing AI Agent request: {str(e)}"