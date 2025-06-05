from typing import Any, Dict, List

import requests
from config.settings import settings
from fastapi import HTTPException
from schema import ChatResponse

from backend.core.retriever import retriever


class InferenceEngine:
    @staticmethod
    async def pytorch_inference(self):
        pass

    @staticmethod
    async def api_inference(
        model_name: str,
        message: str,
        temperature: float = 0.7,
        max_new_tokens: int = 256,
        max_context_tokens: int = 2000,
        min_similarity: float = 0.25
    ) -> Dict[str, Any]:        
        enhanced_message, retrieval_metadata = await retriever.generate_intelligent_prompt(
            message, max_context_tokens, min_similarity
        )
        
        # Log what sources were used for debugging/monitoring
        print(f"Model classification: {retrieval_metadata['classification']}")
        print(f"Sources used: {retrieval_metadata['sources_used']}")
        print(f"Context tokens used: {retrieval_metadata['token_usage']}")

        payload = {
            "hf_name": model_name,
            "message": enhanced_message,
            "max_length": max_new_tokens + len(enhanced_message),
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
