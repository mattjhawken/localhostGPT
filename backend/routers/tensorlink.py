from core.tensorlink_manager import tensorlink_manager
from fastapi import APIRouter, HTTPException

router = APIRouter(tags=["tensorlink"])

@router.get("/connect")
async def connect():
    """Connect to Tensorlink"""
    return await tensorlink_manager.connect()

@router.get("/disconnect")
async def disconnect():
    return await tensorlink_manager.disconnect()
