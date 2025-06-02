import requests
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers import chat, model, tensorlink

https_serv = "https://smartnodes.ddns.net/tensorlink-api"
http_serv = "http://smartnodes.ddns.net/tensorlink-api"

# Mock database for storing fine-tuning status
fine_tuning_jobs = {}

tensorlink_status = {
    "connected": False,
    "node": None,
    "api_key": None
}

app = FastAPI(
    title="localhostGPT Backend"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api", tags=["chat"])
app.include_router(model.router, prefix="/api", tags=["models"])
app.include_router(tensorlink.router, prefix="/api", tags=["tensorlink"])


@app.get("/api/status")
async def get_status():
    if tensorlink_status["node"] is None:
        return {"success": False, "message": "Could not get network status.", "connected": False}
    else:
        return {"success": True, "message": "Connected to Tensorlink.", "connected": True}
    
@app.get("/api/stats")
async def get_network_stats():
    try:
        response = requests.get(f"{https_serv}/stats")
        try:
            data = response.json()
            print(data)
        except ValueError:
            data = response.text

        return {"status_code": response.status_code, "data": data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5053)
