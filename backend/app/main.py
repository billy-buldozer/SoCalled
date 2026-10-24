
from fastapi import FastAPI

app = FastAPI(title="SoCalled API")


@app.get("/")
def home():
    return {
        "application": "SoCalled",
        "message": "Welcome to SoCalled!",
        "status": "running"
    }


@app.get("/api/health")
def health():
    return {"status": "ok"}
