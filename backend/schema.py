from enum import Enum
from typing import Any, List, Optional

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
    settings: ChatSettings


class ChatResponse(BaseModel):
    response: Any


class FinetuneRequest(BaseModel):
    modelName: str
    chatHistory: List[str]


class InferenceMode(str, Enum):
    API = "api"
    PYTORCH = "pytorch"
