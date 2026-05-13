import time
from fastapi import FastAPI
from .database import engine
from . import models
from .routes import inventory, auth

app= FastAPI(title="LogiStock Aragón - LogiStock Aragón - Inventory Management")

def create_tables():
    retries = 5
    while retries > 0:
        try:
            models.Base.metadata.create_all(bind=engine)
            print("Connection to the bank successfully established!")
            break
        except Exception as e:
            retries -= 1
            print(f"The bank is not ready yet... Trying again ({retries} attempts remaining)")
            time.sleep(5) 

create_tables()



app.include_router(auth.router)
app.include_router(inventory.router)

@app.get("/")
def home():
    return {"message": "Welcome to LogiStock Aragón Management System"}



