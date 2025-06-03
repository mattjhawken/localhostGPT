import json
from typing import Dict

import requests
from config.settings import settings


class QueryClassifier:
    """Uses your existing model API to classify queries intelligently."""
    
    def __init__(self, model_name: str = "Qwen/Qwen2.5-7B-Instruct"):
        self.model_name = model_name
    
    async def classify_query(self, query: str) -> Dict[str, bool]:
        """
        Use the model to determine what information sources are needed.
        
        Returns:
            Dict with 'needs_web_search' and 'needs_chat_history' booleans
        """
        classification_prompt = f"""Analyze this user query and determine what information sources are needed. Consider:
- Does this need current/real-time information from the internet? (news, weather, stock prices, recent events, etc.)
- Does this reference previous conversations or personal context, or some unkown context that is likely buildling up off prior conversation?
- Is this a general knowledge question that doesn't need additional context?
Respond with only this JSON format: {{"needs_web_search": true/false, "needs_chat_history": true/false}}

Query: "{query}"
"""

        try:
            # Use your existing API call structure
            payload = {
                "hf_name": self.model_name,
                "message": classification_prompt,
                "max_length": 200,
                "max_new_tokens": 50,
                "temperature": 0.1,
                "do_sample": True,
                "num_beams": 2,
                "history": []
            }

            response = requests.post(f"{settings.TENSORLINK_HTTPS_SERVER}/generate", json=payload)
            
            if response.status_code == 200:
                response_data = response.json()
                # Extract the response text
                response_text = response_data.get('response', '').strip()
                
                # Try to parse JSON from the response
                try:
                    # Look for JSON in the response
                    import re
                    json_match = re.search(r'\{.*?\}', response_text, re.DOTALL)
                    if json_match:
                        classification = json.loads(json_match.group())
                        return {
                            'needs_web_search': classification.get('needs_web_search', False),
                            'needs_chat_history': classification.get('needs_chat_history', False)
                        }
                except json.JSONDecodeError:
                    pass
                
                # Fallback: simple keyword detection if JSON parsing fails
                return self._fallback_classification(query, response_text)
            
        except Exception as e:
            print(f"Classification error: {e}")
        
        # Final fallback to simple rule-based classification
        return self._fallback_classification(query)
    
    def _fallback_classification(self, query: str, model_response: str = "") -> Dict[str, bool]:
        """Fallback classification using simple rules."""
        query_lower = query.lower()
        response_lower = model_response.lower()
        
        # Check for web search indicators
        web_keywords = ['current', 'latest', 'recent', 'today', 'news', 'weather', 'price', 'stock']
        needs_web = any(keyword in query_lower for keyword in web_keywords) or 'web' in response_lower
        
        # Check for chat history indicators
        history_keywords = ['we discussed', 'you said', 'earlier', 'previous', 'remember', 'mentioned']
        needs_history = any(keyword in query_lower for keyword in history_keywords) or 'history' in response_lower
        
        return {
            'needs_web_search': needs_web,
            'needs_chat_history': needs_history
        }
