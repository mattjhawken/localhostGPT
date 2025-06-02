import json
import os
from typing import Any, Dict, List

import markdown
import requests
from config.settings import settings
from fastapi import HTTPException
from schema import ChatResponse


def load_chats():
    home_dir = os.path.expanduser("~")
    chat_dir = os.path.join(home_dir, "localhostGPT")

    if not os.path.exists(chat_dir):
        return []
    
    chats = []
    for file in os.listdir(chat_dir):
        if file.endswith(".json"):
            file_path = os.path.join(chat_dir, file)

            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                parsed_data = json.loads(content)
                
                messages = []
                for message in parsed_data:
                    if message.get("role", "system") != "system":
                        messages.append(message)

                chats.append(messages)

            except Exception as e:
                print(f"Error loading chat file {file}: {e}")
                continue 
    
    return chats


def embed_chats():
    chats = load_chats()
    all_chunks = []


class InferenceEngine:
    @staticmethod
    async def pytorch_inference(self):
        pass

    @staticmethod
    async def api_inference(
        model_name: str,
        message: str,
        temperature: float = 0.7,
        max_new_tokens: int = 256
    ) -> Dict[str, Any]:        
        # history = load_chats()
        # print(history)

        payload = {
            "hf_name": model_name,
            "message": message,
            "max_length": max_new_tokens + len(message),
            "max_new_tokens": max_new_tokens,
            "temperature": temperature,
            "do_sample": True,
            "num_beams": 4,
            "history": []
        }

        response = requests.post(f"{settings.TENSORLINK_HTTPS_SERVER}/generate", json=payload)

        if response.status_code != 200:
            raise HTTPException(
                status_code=500, 
                detail=f"API Error: {response.status_code}"
            )
        
        try:
            response_data = response.json()
        except requests.exceptions.JSONDecodeError:
            response_data = {"response": response_data.text}
        
        return ChatResponse(response=response_data)
            
inference_engine = InferenceEngine()
