import time
from threading import Thread

import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers.model import generate_mock_response
from routers.model import router as models_router
from schema import ChatRequest

# Mock database for storing fine-tuning status
fine_tuning_jobs = {}

tensorlink_status = {
    "connected": False,
    "node": None,
    "api_key": None
}

app = FastAPI()

# Include both routers
app.include_router(models_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Send message to the selected model."""    
    try:
        input_text = request.message
        model_name = request.settings.modelName
        temperature = request.settings.temperature
        history = request.history
        
        # Get mock response using the function from models module
        response = generate_mock_response(input_text, history, model_name, temperature, tensorlink_status)
        
        return {"response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/connect")
async def connect_tensorlink():
    """Connect to Tensorlink service."""
    global tensorlink_status

    try:
        if tensorlink_status.get("node") is None:
            print("Launching Node...")
            tensorlink_status["node"] = subprocess.Popen(["python3"])
        
    except Exception as e:
        return {"success": False, "message": f"Error connecting to Tensorlink: {e}"}
    
    return {"success": True, "message": "Connected to Tensorlink."}


@app.post("/api/disconnect")
async def disconnect_tensorlink():
    """Disconnect Tensorlink node"""
    global tensorlink_status
    global signal_handler

    try:
        signal_handler = -1

    except Exception as e:
        return {"success": True, "message": f"Error while disconnecting from Tensorlink: {e}"}

    return {"success": True, "message": "Disconnected from Tensorlink."}


@app.get("/api/status")
async def get_status():
    if tensorlink_status["node"] is None:
        return {"success": False, "message": "Could not get network status.", "connected": False}
    else:
        return {"success": True, "message": "Connected to Tensorlink.", "connected": True}


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5053)
