import json
import os
import time
from typing import Any, Dict, List, Optional

import uvicorn
from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from models.models import AVAILABLE_MODELS

# from tensorlink import UserNode

# Mock database for storing fine-tuning status
fine_tuning_jobs = {}

# Mock Tensorlink connection status
tensorlink_status = {
    "connected": False,
    "node": None,
    "api_key": None
}


app = FastAPI()
node = None

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    # allow_origins=["http://127.0.0.1:5173"],
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest:
    message: str
    history: Optional[List[str]] = []
    settings: Dict[str, Optional[float]] = {}


class FinetuneRequest:
    modelName: str
    chatHistory: List[str]


def generate_mock_response(message, history, model_name, temperature):
    """Generate a mock response based on the input"""
    responses = [
        f"This is a response from the {model_name} model (Temperature: {temperature}).",
        "I understand your message. In a real implementation, I would provide a more relevant response.",
        "Thank you for your input. I'm currently simulating responses as this is a development environment.",
        f"Using {model_name} model. Your message was processed successfully.",
        "I'm analyzing your request. In production, this would connect to the actual LLM API."
    ]
    
    # Add some contextual awareness
    if "hello" in message.lower() or "hi" in message.lower():
        return f"Hello! I'm your AI assistant using the {model_name} model. How can I help you today?"
    
    if "help" in message.lower():
        return "I'm here to help! In the full implementation, I would provide assistance based on your specific query."
    
    if "tensorlink" in message.lower():
        status = "connected" if tensorlink_status["connected"] else "not connected"
        return f"Tensorlink is currently {status}. " + (
            "Enhanced model capabilities are available." if tensorlink_status["connected"] 
            else "Connect Tensorlink to access more advanced models."
        )
    
    import random
    return random.choice(responses)


@app.get("/api/tensorlink/connect")
async def connect_tensorlink():
    """Connect to Tensorlink service."""
    try:
        # node = UserNode()
        node = None
        time.sleep(10)
    except Exception as e:
        return {"success": False, "message": f"Error connecting to Tensorlink: {e}"}
    
    tensorlink_status["connected"] = True
    tensorlink_status["node"] = node

    return {"success": True, "message": "Connected to Tensorlink."}


@app.post("/api/tensorlink/disconnect")
async def disconnect_tensorlink():
    """Disconnect Tensorlink node"""
    try:
        # node.cleanup()
        time.sleep(10)
    except Exception as e:
        return {"success": True, "message": f"Error while disconnecting from Tensorlink: {e}"}
    
    tensorlink_status["connected"] = False
    tensorlink_status["node"] = None

    return {"success": True, "message": "Disconnected from Tensorlink."}


@app.get("/api/models")
async def get_models():
    """Return available models based on Tensorlink connection status."""
    if tensorlink_status["connected"]:
        return AVAILABLE_MODELS
    return [model for model in AVAILABLE_MODELS if not model["requires_tensorlink"]]


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5000)
