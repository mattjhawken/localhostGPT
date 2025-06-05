import requests
from core.inference_engine import inference_engine
from core.tensorlink_manager import tensorlink_manager
from fastapi import APIRouter, HTTPException
from schema import ChatRequest, ChatResponse, InferenceMode

https_serv = "https://smartnodes.ddns.net/tensorlink-api"
http_serv = "http://smartnodes.ddns.net/tensorlink-api"

router = APIRouter(tags=["chat"])

@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Send message to the selected model."""    
    try:
        message = request.message
        model_name = request.settings.modelName
        temperature = request.settings.temperature
        
        current_mode = tensorlink_manager.get_mode()

        if current_mode == InferenceMode.API:
            response_data = await inference_engine.api_inference(
                model_name=model_name,
                message=message,
                temperature=request.temperature,
                # max_new_tokens=request.settings.max_new_tokens
            )
            
            return response_data

        # return ChatResponse(response=response_data)

    except requests.RequestException as e:
        print(f"Network error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
