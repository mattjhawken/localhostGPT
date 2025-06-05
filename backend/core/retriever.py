import json
import os
from datetime import datetime
from typing import Dict, List, Optional

import numpy as np
import tiktoken
from config.prompts import contextualize_prompt
from core.query_classifier import QueryClassifier
from core.web_scraper import WebScraper
from langchain.embeddings.base import Embeddings
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from sentence_transformers import SentenceTransformer


class SentenceTransformerEmbeddings(Embeddings):
    """Wrapper to make SentenceTransformer compatible with LangChain."""
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = SentenceTransformer(model_name)
    
    def embed_documents(self, texts: List[str]) -> List[List[float]]:
        """Embed a list of documents."""
        embeddings = self.model.encode(texts, convert_to_tensor=False)
        return embeddings.tolist()
    
    def embed_query(self, text: str) -> List[float]:
        """Embed a single query."""
        embedding = self.model.encode([text], convert_to_tensor=False)
        return embedding[0].tolist()


class Retriever:
    def __init__(self, embedding_model: str = "all-MiniLM-L6-v2"):
        self.embeddings = SentenceTransformerEmbeddings(embedding_model)
        self.vectorstore = None
        self.text_splitter = RecursiveCharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=500,
            chunk_overlap=50
        )
        self.encoding = tiktoken.get_encoding("cl100k_base")

        user_dir = os.path.expanduser("~")
        self.chat_dir = os.path.join(user_dir, "localhostGPT")

        self.web_scraper = WebScraper()
        self.classifier = QueryClassifier()
    
    async def generate_intelligent_prompt(self, query: str, max_tokens: int = 2000, min_similarity: float = 0.25) -> tuple[str, Dict]:
        """
        Generate an intelligently augmented prompt using model-based classification.
        
        Returns:
            Tuple of (prompt, metadata)
        """
        # Use the model to classify the query
        classification = await self.classifier.classify_query(query)
        
        metadata = {
            "classification": classification,
            "sources_used": [],
            "token_usage": 0
        }
        
        context_parts = []
        total_tokens = 0

        # Get chat history if needed
        if classification['needs_chat_history']:
            chat_context = self._get_chat_context(query, max_tokens // 2 if classification['needs_web_search'] else max_tokens, min_similarity)
            if chat_context:
                context_parts.extend(chat_context["parts"])
                total_tokens += chat_context["tokens"]
                metadata["sources_used"].append("chat_history")
        
        # Get web search context if needed
        if classification['needs_web_search']:
            remaining_tokens = max_tokens - total_tokens
            web_context = await self._get_web_context(query, remaining_tokens)
            if web_context:
                context_parts.extend(web_context["parts"])
                total_tokens += web_context["tokens"]
                metadata["sources_used"].append("web_search")
        
        # Build final prompt
        if context_parts:
            context = "\n".join(context_parts)
            prompt = contextualize_prompt(context, query)
        else:
            prompt = f"USER QUERY: {query}"
        
        metadata["token_usage"] = total_tokens
        return prompt, metadata

    def _get_chat_context(self, query: str, max_tokens: int, min_similarity: float) -> Optional[Dict]:
        """Get relevant chat history context."""
        try:
            relevant_results = self.search_relevant_history(query, k=5)
            
            if not relevant_results:
                return None
            
            context_parts = []
            total_tokens = 0
            
            for result in relevant_results:
                if result["similarity_score"] < min_similarity:
                    continue
                
                content_tokens = result["token_count"]
                
                if total_tokens + content_tokens <= max_tokens:
                    metadata = result.get("metadata", {})
                    context_header = f"[CHAT HISTORY | Similarity: {result['similarity_score']:.3f}"
                    
                    if "conversation_id" in metadata:
                        context_header += f" | Chat: {metadata['conversation_id']}"
                    if "last_updated" in metadata:
                        try:
                            dt = datetime.fromisoformat(metadata['last_updated'].replace('Z', '+00:00'))
                            context_header += f" | Date: {dt.strftime('%Y-%m-%d')}"
                        except:
                            pass
                    
                    context_header += "]\n"
                    context_parts.append(f"{context_header}{result['content'].strip()}\n---")
                    total_tokens += content_tokens
                else:
                    break
            
            return {"parts": context_parts, "tokens": total_tokens} if context_parts else None
            
        except Exception as e:
            print(f"Error getting chat context: {e}")
            return None
    
    async def _get_web_context(self, query: str, max_tokens: int) -> Optional[Dict]:
        """Get relevant web search context."""
        try:
            search_results = self.web_scraper.search_duckduckgo(query, max_results=3)
            
            if not search_results:
                return None
            
            context_parts = []
            total_tokens = 0
            
            for result in search_results:
                # Try to get more content from the URL
                scraped_content = self.web_scraper.scrape_content(result['url'], max_chars=800)
                content = scraped_content if scraped_content else result['snippet']
                
                content_tokens = self.num_tokens_from_string(content)
                
                if total_tokens + content_tokens <= max_tokens:
                    context_header = f"[WEB SEARCH | Source: {result.get('source', 'web')} | URL: {result['url']}]\n"
                    context_part = f"{context_header}Title: {result['title']}\nContent: {content}\n---"
                    
                    context_parts.append(context_part)
                    total_tokens += content_tokens
                else:
                    break
            
            return {"parts": context_parts, "tokens": total_tokens} if context_parts else None
            
        except Exception as e:
            print(f"Error getting web context: {e}")
            return None

    def load_chats(self):
        documents = []

        for file in os.listdir(self.chat_dir):
            if file.endswith(".json"):
                file_path = os.path.join(self.chat_dir, file)
                with open(file_path, "r", encoding="utf-8") as f:
                    content = f.read()
                
                parsed_content = json.loads(content)
                
                conversation_text = ""
                messages = []
                
                for message in parsed_content:
                    if message.get("role", "system") != "system":
                        role = message.get("role", "unknown")
                        msg_content = message.get("content", "")
                        timestamp = message.get("timestamp", datetime.now().isoformat())
                        
                        messages.append(message)
                        
                        # Build conversation context
                        conversation_text += f"{role}: {msg_content}\n\n"

                if conversation_text.strip():
                    doc = Document(
                        page_content=conversation_text,
                        metadata={
                            "source_file": file,
                            "message_count": len(messages),
                            "last_updated": max([msg.get("timestamp") for msg in messages], default=datetime.now().isoformat()),
                            "conversation_id": file.replace(".json", "")
                        }
                    )

                    documents.append(doc)
        
        return documents
    
    def build_index(self):
        """Build the vector index from chat history."""
        print("Loading chat documents...")
        documents = self.load_chats()
        
        if not documents:
            print("No chat documents found to index.")
            return
        
        print(f"Splitting {len(documents)} documents...")
        splits = self.text_splitter.split_documents(documents)
        print(f"Created {len(splits)} chunks")
        
        # Create vector store with open source embeddings
        print("Building vector index...")
        self.vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=self.chat_dir
        )
        
        print(f"Index built successfully with {len(splits)} chunks!")
    
    def load_existing_index(self, persist_directory: str = "./chat_index_opensource"):
        """Load an existing vector index."""
        try:
            self.vectorstore = Chroma(
                persist_directory=persist_directory,
                embedding_function=self.embeddings
            )
            print("Existing open source index loaded successfully!")
        except Exception as e:
            print(f"Could not load existing index: {e}")
            print("Building new index...")
            self.build_index(persist_directory)
    
    def search_relevant_history(self, query: str, k: int = 3) -> List[Dict]:
        """Search for relevant chat history based on the query."""
        if not self.vectorstore:
            print("No index available. Building index first...")
            self.build_index()
        
        if not self.vectorstore:
            return []

        total_docs = self.vectorstore._collection.count()
        actual_k = min(k, total_docs)  # Don't request more than available
    
        # Retrieve relevant documents
        retriever = self.vectorstore.as_retriever(search_kwargs={"k": actual_k})
        relevant_docs = retriever.get_relevant_documents(query)
        
        # Remove duplicates based on content
        seen_content = set()
        unique_docs = []
        for doc in relevant_docs:
            content_hash = hash(doc.page_content)
            if content_hash not in seen_content:
                seen_content.add(content_hash)
                unique_docs.append(doc)

        results = []
        for doc in relevant_docs:
            # Calculate similarity score
            query_embedding = self.embeddings.embed_query(query)
            doc_embedding = self.embeddings.embed_query(doc.page_content)
            similarity = self.cosine_similarity(query_embedding, doc_embedding)
            
            results.append({
                "content": doc.page_content,
                "metadata": doc.metadata,
                "similarity_score": similarity,
                "token_count": self.num_tokens_from_string(doc.page_content)
            })
        
        # Sort by similarity score
        results.sort(key=lambda x: x["similarity_score"], reverse=True)
        return results
    
    def num_tokens_from_string(self, string: str) -> int:
        """Returns the number of tokens in a text string."""
        return len(self.encoding.encode(string))
    
    def cosine_similarity(self, vec1, vec2):
        """Calculate cosine similarity between two vectors."""
        dot_product = np.dot(vec1, vec2)
        norm_vec1 = np.linalg.norm(vec1)
        norm_vec2 = np.linalg.norm(vec2)
        return dot_product / (norm_vec1 * norm_vec2)

retriever = Retriever()
