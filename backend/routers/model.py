import json
import os
import time
from typing import Any, Dict, List

import torch
from fastapi import APIRouter, HTTPException
from huggingface_hub import HfApi
from transformers import AutoModelForCausalLM, AutoTokenizer

# Create router for model endpoints
router = APIRouter(prefix="/api/models", tags=["models"])

# Model cache to avoid reloading
model_cache = {}


def load_model(model_name: str):
    """Load a model from Hugging Face Hub."""
    if model_name in model_cache:
        return model_cache[model_name]
    
    try:
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        model = AutoModelForCausalLM.from_pretrained(model_name).to("cuda" if torch.cuda.is_available() else "cpu")
        model_cache[model_name] = (tokenizer, model)
        return tokenizer, model
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error loading model: {e}")


def fetch_popular_models(limit: int = 7) -> List[Dict[str, Any]]:
    """
    Fetch popular text generation models from Hugging Face Hub.
    
    Args:
        limit: Number of models to fetch
        
    Returns:
        List of model dictionaries with id, name, and requirements
    """
    # api = HfApi()
    
    # # Path for caching results
    # cache_file = os.path.join(os.path.dirname(__file__), "cached_models.json")
    # cache_valid_hours = 24  # Refresh cache after this many hours
    
    # # Check if we have a recent cache
    # try:
    #     if os.path.exists(cache_file):
    #         stat = os.stat(cache_file)
    #         cache_age_hours = (time.time() - stat.st_mtime) / 3600
            
    #         if cache_age_hours < cache_valid_hours:
    #             with open(cache_file, 'r') as f:
    #                 return json.load(f)
    # except Exception as e:
    #     print(f"Cache reading error: {e}")
    
    # try:
    #     # Filter for text generation models with good download counts
    #     models = api.list_models(
    #         task="text-generation",
    #         sort="downloads",
    #         direction=-1,  # Descending order
    #         limit=30  # Get more than needed to filter
    #     )
        
    #     # Transform to our format and filter for more capable models
    #     result = []
    #     for model in models:
    #         # Skip tiny models and specialized ones
    #         if any(x in model.modelId.lower() for x in ['small', 'tiny', 'mini', 'distil']):
    #             continue
                
    #         # Determine if the model is large enough to require Tensorlink
    #         requires_tensorlink = False
    #         model_id = model.modelId.lower()
            
    #         # Check model size clues in the name
    #         if any(x in model_id for x in ['large', '70b', '40b', '34b', '33b', '20b', '13b']):
    #             requires_tensorlink = True
            
    #         result.append({
    #             "id": model.modelId,
    #             "name": model.modelId.split('/')[-1].replace('-', ' ').title(),
    #             "requires_tensorlink": requires_tensorlink
    #         })
            
    #         if len(result) >= limit:
    #             break
        
    #     # Cache the results
    #     try:
    #         with open(cache_file, 'w') as f:
    #             json.dump(result, f)
    #     except Exception as e:
    #         print(f"Cache writing error: {e}")
            
    #     return result
        
    # except Exception as e:
    #     print(f"Error fetching models from Hugging Face: {e}")
        
    #     # Fallback to hardcoded models if API fails
    return [
        {"id": "microsoft/DialoGPT-small", "name": "DialoGPT (small)", "requires_tensorlink": False},
        {"id": "microsoft/DialoGPT-medium", "name": "DialoGPT (medium)", "requires_tensorlink": False},
        {"id": "nyxene-labs/Nyxene-v2-11B", "name": "Nyxene v2 11B", "requires_tensorlink": True},
        {"id": "mistralai/Mistral-Large-2", "name": "Mistral Large 2", "requires_tensorlink": True},
        {"id": "microsoft/Phi-3-mini-4k", "name": "Phi-3 Mini", "requires_tensorlink": True},
        {"id": "google/gemma-7b", "name": "Gemma 7B", "requires_tensorlink": True},
        {"id": "meta-llama/Llama-3-8B", "name": "Llama 3 8B", "requires_tensorlink": True}
    ]


def generate_mock_response(message, history, model_name, temperature, tensorlink_status):
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


def chat_with_model(_model, _tokenizer, question, max_length=256):
    input_text = question + _tokenizer.eos_token
    inputs = _tokenizer.encode(input_text, return_tensors="pt")
    # Concatenate chat history here...

    with torch.no_grad():
        outputs = _model.generate(
            inputs,
            max_length=max_length,
            num_return_sequences=1,
            temperature=0.7,
            pad_token_id=_tokenizer.eos_token_id
        )

    return _tokenizer.decode(outputs[0], skip_special_tokens=True)


# Router endpoint for getting available models
@router.get("")
async def get_models():
    """Return available models based on Tensorlink connection status."""
    return fetch_popular_models()
