import time
import os
from fastapi import FastAPI
from .database import engine
from . import models
from .routes import inventory, auth, agent
from fastapi.middleware.cors import CORSMiddleware

app= FastAPI(title="LogiStock Aragón - LogiStock Aragón - Inventory Management")

raw_origins = os.getenv("ALLOWED_ORIGINS")

# We convert the string into a list by splitting it at the commas
# (This allows you to add multiple sites in the future, e.g., site1.com,site2.com)
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,            # Allows only requests coming from our frontend.
    allow_credentials=True,           # Allows sending of authentication cookies/tokens.
    allow_methods=["*"],              # Allows all HTTP methods (POST, GET, PUT, DELETE).
    allow_headers=["*"],              # Allows all custom HTTP headers.
)

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
app.include_router(agent.router)

@app.get("/")
def home():
    return {"message": "Welcome to LogiStock Aragón Management System"}



