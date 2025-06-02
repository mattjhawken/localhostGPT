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
        input_text = request.message
        model_name = request.settings.modelName
        temperature = request.settings.temperature
        
        current_mode = tensorlink_manager.get_mode()

        if current_mode == InferenceMode.API:
            response_data = await inference_engine.api_inference(
                model_name=model_name,
                message=request.message,
                temperature=request.settings.temperature,
                # max_new_tokens=request.settings.max_new_tokens
            )
            
            # Return in the format your frontend expects
            return response_data


        # external_response = requests.post(f"{https_serv}/generate", json=payload)
        
        # print(f"External API status: {external_response.status_code}")
        # print(f"External API response: {external_response.text}")
        
        # # Check if the external request was successful
        # if external_response.status_code != 200:
        #     raise HTTPException(
        #         status_code=500, 
        #         detail=f"External API error: {external_response.status_code}"
        #     )
        
        # # Extract JSON data from the response
        # try:
        #     response_data = external_response.json()
        # except requests.exceptions.JSONDecodeError:
        #     # If response isn't JSON, return the text
        #     response_data = {"response": external_response.text}
        
        # Return in the format your frontend expects
        return ChatResponse(response=response_data)

    except requests.RequestException as e:
        print(f"Network error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Network error: {str(e)}")
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
