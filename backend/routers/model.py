import json
import os
import time
from typing import Any, Dict, List

import requests
import torch
from fastapi import APIRouter, HTTPException
from huggingface_hub import HfApi
from transformers import AutoModelForCausalLM, AutoTokenizer

https_serv = "https://smartnodes.ddns.net/tensorlink-api"
http_serv = "http://smartnodes.ddns.net/tensorlink-api"

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


def chat_with_model(_model, _tokenizer, question, max_length=256):
    input_text = question + _tokenizer.eos_token
    inputs = _tokenizer.encode(input_text, return_tensors="pt")
    
    # TODO: Concatenate chat history

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
    response = requests.get(f"{https_serv}/stats")
    models = [
        {"id": "Qwen/Qwen2.5-7B-Instruct", "name": "Qwen2.5-7B", "requires_tensorlink": True}
    ]

    # if response:
    #     models = response.get("models")

    return models
    