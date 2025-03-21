from typing import List, Optional

from pydantic import BaseModel


class HistoryItem(BaseModel):
    role: str
    content: str


class ChatSettings(BaseModel):
    modelName: str
    temperature: float
    maxTokens: int
    isTensorlinkConnected: bool


class ChatRequest(BaseModel):
    message: str
    history: List[HistoryItem]
    settings: ChatSettings


class FinetuneRequest(BaseModel):
    modelName: str
    chatHistory: List[str]
