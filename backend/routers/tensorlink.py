import os
import platform
import subprocess
import sys
import time

from fastapi import APIRouter, HTTPException
from tensorlink import UserNode

router = APIRouter(prefix="/api/tensorlink", tags=["tensorlink"])

tensorlink_status = {
    "connected": False,
    "node": None,
    "api_key": None
}

node = None


def launch_terminal(module_path):
    """Launch a terminal with platform-specific commands"""
    system = platform.system()
    
    if system == "Windows":
        subprocess.Popen(["start", "cmd", "/k", f"python -m {module_path}"], shell=True)

    elif system == "Darwin":  # macOS
        script = f"tell application \"Terminal\" to do script \"python -m {module_path}\""
        subprocess.Popen(["osascript", "-e", script])

    elif system == "Linux":
        # This might need adjustments based on the specific Linux desktop environment
        subprocess.Popen(["x-terminal-emulator", "-e", f"python -m {module_path}"])
        
    else:
        print(f"Unsupported platform: {system}")


@router.get("/connect")
async def connect_tensorlink():
    """Connect to Tensorlink service."""
    global tensorlink_status
    global node

    try:
        print("Launching Terminal")
        # Get the actual module name from the caller
        module_path = os.path.basename(__file__).replace('.py', '')
        launch_terminal(module_path)
        
        print("Launching Node...")
        node = UserNode(print_level=10)
        time.sleep(5)
        
    except Exception as e:
        return {"success": False, "message": f"Error connecting to Tensorlink: {e}"}
    
    tensorlink_status["connected"] = True
    tensorlink_status["node"] = node

    return {"success": True, "message": "Connected to Tensorlink."}


@router.post("/disconnect")
async def disconnect_tensorlink():
    """Disconnect Tensorlink node"""
    global tensorlink_status
    global node

    try:
        if node:
            node.cleanup()

        time.sleep(5)
    except Exception as e:
        return {"success": True, "message": f"Error while disconnecting from Tensorlink: {e}"}
    
    tensorlink_status["connected"] = False
    tensorlink_status["node"] = None

    return {"success": True, "message": "Disconnected from Tensorlink."}


@router.get("/status")
async def get_status():
    if tensorlink_status["node"] is None:
        return {"success": False, "message": "Could not get network status.", "connected": False}
    else:
        return {"success": True, "message": "Connected to Tensorlink.", "connected": True}


@router.get("/request")
async def request_job():
    pass


# Function to get tensorlink connection status
def get_tensorlink_status():
    return tensorlink_status
