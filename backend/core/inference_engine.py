from typing import Any, Dict, List

import requests
from config.settings import settings
from core.chat_retriever import chat_retriever
from fastapi import HTTPException
from schema import ChatResponse


def load_chats():
    chat_retriever.load_chats()


def generate_prompt(query: str, max_tokens: int = 2000, min_similarity: float = 0.25) -> str:
    """
    Generate an augmented prompt with relevant chat history context.
    
    Args:
        query: User's query
        max_tokens: Maximum tokens to use for context
        min_similarity: Minimum similarity score to include a result
    
    Returns:
        Augmented prompt with context
    """
    # Search chat history for relevant information
    relevant_results = chat_retriever.search_relevant_history(query, k=5)
    
    if not relevant_results:
        # No context available, return simple prompt
        return f"USER QUERY: {query}"
    
    context_parts = []
    total_tokens = 0
    
    # Filter by similarity threshold and token budget
    for result in relevant_results:
        # Skip results below similarity threshold
        if result["similarity_score"] < min_similarity:
            continue
            
        content_tokens = result["token_count"]
        
        # Check if adding this chunk would exceed token limit
        if total_tokens + content_tokens <= max_tokens:
            # Format context with metadata for better understanding
            metadata = result.get("metadata", {})
            context_header = f"[Similarity: {result['similarity_score']:.3f}"
            
            # Add useful metadata if available
            if "conversation_id" in metadata:
                context_header += f" | Chat: {metadata['conversation_id']}"
            if "last_updated" in metadata:
                # Format timestamp more readably
                try:
                    from datetime import datetime
                    dt = datetime.fromisoformat(metadata['last_updated'].replace('Z', '+00:00'))
                    context_header += f" | Date: {dt.strftime('%Y-%m-%d')}"
                except:
                    pass
            
            context_header += "]\n"
            
            context_parts.append(f"{context_header}{result['content'].strip()}\n---")
            total_tokens += content_tokens
        else:
            # Token budget exceeded, stop adding context
            break
    
    # Build final prompt
    if context_parts:
        context = "\n".join(context_parts)
        prompt = f"""Answer the user query using your knowledge and the relevant chat history context below.

RELEVANT CHAT HISTORY:
{context}

USER QUERY: {query}"""
    else:
        # No relevant context found (all below similarity threshold or too large)
        prompt = f"USER QUERY: {query}"
    
    return prompt



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
