from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    HOST: str = ""
    PORT: str = ""

    CORS_ORIGINS: List[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    TENSORLINK_HTTPS_SERVER: str = "https://smartnodes.ddns.net/tensorlink-api"
    TENSORLINK_HTTP_SERVER: str = "http://smartnodes.ddns.net/tensorlink-api"
    
    DEFAULT_DEVICE: str = "cpu"
    DEFAULT_DTYPE: str = "float16"
    MODEL_CACHE_DIR: str = "./model_cache"

settings = Settings()
