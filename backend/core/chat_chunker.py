import hashlib
import re
from collections import defaultdict
from datetime import datetime
from typing import Dict, List


class ChatChunker:
    """Advanced chat history chunking for better context understanding"""
    
    def __init__(self, max_chunk_size: int = 2000, overlap_size: int = 200):
        self.max_chunk_size = max_chunk_size
        self.overlap_size = overlap_size
    
    def temporal_chunking(self, chats: List[List[Dict]], time_window_hours: int = 24) -> List[Dict]:
        """Chunk conversations by time windows"""
        chunks = []
        
        for chat in chats:
            if not chat:
                continue
                
            # Group messages by time windows
            time_groups = defaultdict(list)
            
            for message in chat:
                # Assume timestamp exists or use file modification time
                timestamp = message.get('timestamp', datetime.now().isoformat())
                dt = datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                
                # Create time window key (rounded to nearest time_window_hours)
                window_key = dt.replace(minute=0, second=0, microsecond=0)
                window_key = window_key.replace(hour=(window_key.hour // time_window_hours) * time_window_hours)
                
                time_groups[window_key].append(message)
            
            # Create chunks from time groups
            for window, messages in time_groups.items():
                chunk_text = self._messages_to_text(messages)
                chunks.append({
                    'type': 'temporal',
                    'window_start': window.isoformat(),
                    'message_count': len(messages),
                    'content': chunk_text,
                    'summary': self._extract_topics(messages)
                })
        
        return chunks
    
    def topic_based_chunking(self, chats: List[List[Dict]]) -> List[Dict]:
        """Chunk by conversation topics"""
        chunks = []
        
        for chat in chats:
            if not chat:
                continue
            
            # Detect topic boundaries (simple heuristic)
            topics = []
            current_topic = []
            
            for i, message in enumerate(chat):
                current_topic.append(message)
                
                # Topic boundary detection heuristics
                if self._is_topic_boundary(message, chat[i+1:i+2]):
                    if current_topic:
                        topic_summary = self._extract_main_topic(current_topic)
                        chunks.append({
                            'type': 'topic',
                            'topic': topic_summary,
                            'message_count': len(current_topic),
                            'content': self._messages_to_text(current_topic),
                            'keywords': self._extract_keywords(current_topic)
                        })
                        current_topic = []
            
            # Handle remaining messages
            if current_topic:
                topic_summary = self._extract_main_topic(current_topic)
                chunks.append({
                    'type': 'topic',
                    'topic': topic_summary,
                    'message_count': len(current_topic),
                    'content': self._messages_to_text(current_topic),
                    'keywords': self._extract_keywords(current_topic)
                })
        
        return chunks
    
    def sliding_window_chunking(self, chats: List[List[Dict]]) -> List[Dict]:
        """
        Create overlapping windows - maintains context continuity
        """
        chunks = []
        
        for chat_idx, chat in enumerate(chats):
            if not chat:
                continue
            
            full_text = self._messages_to_text(chat)
            
            # Split into sliding windows
            start = 0
            chunk_id = 0
            
            while start < len(full_text):
                end = min(start + self.max_chunk_size, len(full_text))
                chunk_text = full_text[start:end]
                
                chunks.append({
                    'type': 'sliding_window',
                    'chat_id': chat_idx,
                    'chunk_id': chunk_id,
                    'content': chunk_text,
                    'char_start': start,
                    'char_end': end,
                    'overlap_with_next': min(self.overlap_size, len(full_text) - end)
                })
                
                # Move start position (with overlap)
                start = max(start + self.max_chunk_size - self.overlap_size, end)
                chunk_id += 1
        
        return chunks
    
    def conversation_turn_chunking(self, chats: List[List[Dict]], turns_per_chunk: int = 10) -> List[Dict]:
        """
        Chunk by conversation turns
        """
        chunks = []
        
        for chat_idx, chat in enumerate(chats):
            if not chat:
                continue
            
            # Group messages into turns (user-assistant pairs)
            turns = []
            current_turn = []
            
            for message in chat:
                current_turn.append(message)
                
                # End turn when we see a complete user-assistant exchange
                if (len(current_turn) >= 2 and 
                    current_turn[-2].get('role') == 'user' and 
                    current_turn[-1].get('role') == 'assistant'):
                    turns.append(current_turn)
                    current_turn = []
            
            # Handle remaining messages
            if current_turn:
                turns.append(current_turn)
            
            # Create chunks from turns
            for i in range(0, len(turns), turns_per_chunk):
                chunk_turns = turns[i:i + turns_per_chunk]
                flat_messages = [msg for turn in chunk_turns for msg in turn]
                
                chunks.append({
                    'type': 'conversation_turns',
                    'chat_id': chat_idx,
                    'turn_range': f"{i}-{min(i + turns_per_chunk - 1, len(turns) - 1)}",
                    'turn_count': len(chunk_turns),
                    'content': self._messages_to_text(flat_messages),
                    'user_questions': self._extract_questions(flat_messages)
                })
        
        return chunks
    
    def semantic_chunking(self, chats: List[List[Dict]]) -> List[Dict]:
        """
        Chunk by semantic similarity
        """
        chunks = []
        
        for chat_idx, chat in enumerate(chats):
            if not chat:
                continue
            
            # Simple semantic grouping based on keyword similarity
            message_groups = []
            current_group = []
            
            for message in chat:
                if not current_group:
                    current_group.append(message)
                    continue
                
                # Check semantic similarity (simplified)
                if self._are_semantically_similar(current_group, message):
                    current_group.append(message)
                else:
                    if current_group:
                        message_groups.append(current_group)
                    current_group = [message]
            
            if current_group:
                message_groups.append(current_group)
            
            # Create chunks from semantic groups
            for group_idx, group in enumerate(message_groups):
                chunks.append({
                    'type': 'semantic',
                    'chat_id': chat_idx,
                    'group_id': group_idx,
                    'content': self._messages_to_text(group),
                    'semantic_signature': self._get_semantic_signature(group),
                    'message_count': len(group)
                })
        
        return chunks
    
    def user_intent_chunking(self, chats: List[List[Dict]]) -> List[Dict]:
        """
        Chunk by user intent patterns
        """
        chunks = []
        intent_patterns = {
            'question': r'\?|how|what|when|where|why|who|can you|could you',
            'request': r'please|can you|could you|would you|help me',
            'code': r'```|function|class|import|def |return |print\(',
            'explanation': r'explain|describe|tell me about|what is',
            'problem': r'error|issue|problem|not working|broken|help'
        }
        
        for chat_idx, chat in enumerate(chats):
            if not chat:
                continue
            
            intent_groups = defaultdict(list)
            
            for message in chat:
                content = message.get('content', '').lower()
                detected_intents = []
                
                for intent, pattern in intent_patterns.items():
                    if re.search(pattern, content, re.IGNORECASE):
                        detected_intents.append(intent)
                
                # Use primary intent or 'general' if none detected
                primary_intent = detected_intents[0] if detected_intents else 'general'
                intent_groups[primary_intent].append(message)
            
            # Create chunks by intent
            for intent, messages in intent_groups.items():
                if messages:
                    chunks.append({
                        'type': 'user_intent',
                        'chat_id': chat_idx,
                        'intent': intent,
                        'content': self._messages_to_text(messages),
                        'message_count': len(messages),
                        'intent_strength': len([msg for msg in messages if msg.get('role') == 'user'])
                    })
        
        return chunks

    def _messages_to_text(self, messages: List[Dict]) -> str:
        """Convert messages to text format"""
        text_parts = []
        for msg in messages:
            role = msg.get('role', 'unknown')
            content = msg.get('content', '')
            text_parts.append(f"[{role.upper()}]: {content}")
        return "\n\n".join(text_parts)
    
    def _is_topic_boundary(self, current_msg: Dict, next_msgs: List[Dict]) -> bool:
        """Simple heuristic to detect topic boundaries"""
        if not next_msgs:
            return True
        
        current_content = current_msg.get('content', '').lower()
        next_content = next_msgs[0].get('content', '').lower()
        
        # Topic shift indicators
        shift_indicators = ['by the way', 'also', 'different question', 'new topic', 'changing subject']
        
        return any(indicator in next_content for indicator in shift_indicators)
    
    def _extract_main_topic(self, messages: List[Dict]) -> str:
        """Extract main topic from message group"""
        all_content = " ".join([msg.get('content', '') for msg in messages])
        # Simple topic extraction (you might want to use NLP libraries here)
        words = re.findall(r'\w+', all_content.lower())
        word_freq = defaultdict(int)
        
        # Skip common words
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'you', 'i', 'me', 'my', 'your', 'this', 'that', 'it', 'can', 'could', 'would', 'should'}
        
        for word in words:
            if len(word) > 3 and word not in common_words:
                word_freq[word] += 1
        
        if word_freq:
            return max(word_freq.items(), key=lambda x: x[1])[0]
        return "general_discussion"
    
    def _extract_keywords(self, messages: List[Dict]) -> List[str]:
        """Extract keywords from messages"""
        all_content = " ".join([msg.get('content', '') for msg in messages])
        words = re.findall(r'\w+', all_content.lower())
        word_freq = defaultdict(int)
        
        common_words = {'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'}
        
        for word in words:
            if len(word) > 3 and word not in common_words:
                word_freq[word] += 1
        
        # Return top 5 keywords
        return [word for word, _ in sorted(word_freq.items(), key=lambda x: x[1], reverse=True)[:5]]
    
    def _extract_topics(self, messages: List[Dict]) -> List[str]:
        """Extract discussion topics"""
        return self._extract_keywords(messages)[:3]  # Top 3 topics
    
    def _extract_questions(self, messages: List[Dict]) -> List[str]:
        """Extract user questions"""
        questions = []
        for msg in messages:
            if msg.get('role') == 'user':
                content = msg.get('content', '')
                if '?' in content:
                    questions.append(content[:100] + "..." if len(content) > 100 else content)
        return questions
    
    def _are_semantically_similar(self, group: List[Dict], message: Dict) -> bool:
        """Simple semantic similarity check"""
        group_keywords = set(self._extract_keywords(group))
        message_keywords = set(self._extract_keywords([message]))
        
        if not group_keywords or not message_keywords:
            return False
        
        # Jaccard similarity
        intersection = len(group_keywords & message_keywords)
        union = len(group_keywords | message_keywords)
        
        return (intersection / union) > 0.3 if union > 0 else False
    
    def _get_semantic_signature(self, messages: List[Dict]) -> str:
        """Create a semantic signature for the message group"""
        keywords = self._extract_keywords(messages)
        return hashlib.md5("|".join(sorted(keywords)).encode()).hexdigest()[:8]
