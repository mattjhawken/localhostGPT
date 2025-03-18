import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from routers.model import generate_mock_response
from routers.model import router as models_router
from routers.tensorlink import get_tensorlink_status
from routers.tensorlink import router as tensorlink_router
from schema import ChatRequest

# Mock database for storing fine-tuning status
fine_tuning_jobs = {}

app = FastAPI()

# Include both routers
app.include_router(tensorlink_router)
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
        tensorlink_status = get_tensorlink_status()
        response = generate_mock_response(input_text, history, model_name, temperature, tensorlink_status)
        
        return {"response": response}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=5053)
