def classification_prompt(query: str) -> str:
    """Prompt for generating structured output with classifications of the retrieval promps types to include."""
    return f'''
Analyze the user query below and determine what external or contextual information is needed to answer it accurately. Consider:

- Does it require real-time or current information from the internet (e.g., news, weather, recent events)?
- Does it rely on context from previous user conversations or stored personal data?
- Is it a general knowledge question that can be answered without additional context?

Respond ONLY with the following JSON format (no explanation or extra text):

{{
  "needs_web_search": true/false,
  "needs_chat_history": true/false
}}
Query: "{query}"
'''


def contextualize_prompt(context: str, query: str) -> str:
    return f"""
Answer the user query using your knowledge and the relevant context below.
RELEVANT CONTEXT: {context}
USER QUERY: {query}"""
