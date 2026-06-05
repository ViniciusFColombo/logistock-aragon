import pandas as pd
from sklearn.linear_model import LinearRegression

class MLService:
    
    @staticmethod
    def prepare_forecasting_data(sales_history) -> pd.DataFrame:
        """
        Responsibility: Receives the raw historical data from the database, cleans the data, and applies Feature Engineering with Pandas.
        """
        if not sales_history or len(sales_history) < 3:
            return pd.DataFrame()
            
        df = pd.DataFrame(sales_history, columns=['quantity', 'created_at'])
        df['created_at'] = pd.to_datetime(df['created_at'])
        
        df['day_of_week'] = df['created_at'].dt.dayofweek
        df['day_of_month'] = df['created_at'].dt.day
        df['month'] = df['created_at'].dt.month
        df['is_weekend'] = df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)
        
        return df[['quantity', 'day_of_week', 'day_of_month', 'month', 'is_weekend']]

    @staticmethod
    def predict_next_days_sales(sales_history, days_to_predict: int = 7) -> float:
        """
        Responsibility: Trains the Machine Learning model in real time
        with the provided history and projects the total sales for the next X days.
        """
        df = MLService.prepare_forecasting_data(sales_history)
        
        if df.empty:
            return 0.0

        # SEPARATION: X are the predictor attributes (Features), y is the (target / Quantity)
        X = df[['day_of_week', 'day_of_month', 'month', 'is_weekend']]
        y = df['quantity']

        # TRAINING: Instantiate and train the mathematical brain with historical data.
        model = LinearRegression()
        model.fit(X, y)

        # Create future dates starting from "today" (simulated by the last recorded sale)
        last_date = pd.Timestamp.now()
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=days_to_predict)
        
        # Create a DataFrame identical to the training data so that the model can read the future.
        future_df = pd.DataFrame()
        future_df['day_of_week'] = future_dates.dayofweek
        future_df['day_of_month'] = future_dates.day
        future_df['month'] = future_dates.month
        future_df['is_weekend'] = future_df['day_of_week'].apply(lambda x: 1 if x >= 5 else 0)

        predictions = model.predict(future_df)

        total_predicted_sales = sum(predictions)
        return round(max(0.0, total_predicted_sales), 2)