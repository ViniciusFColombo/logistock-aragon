from fastapi import FastAPI
from .database import engine
from . import models
from .routes import inventory, auth

models.Base.metadata.create_all(bind=engine)

app= FastAPI(title="LogiStock Aragón - LogiStock Aragón - Inventory Management")

app.include_router(auth.router)
app.include_router(inventory.router)

@app.get("/")
def home():
    return {"message": "Welcome to LogiStock Aragón Management System"}



