from typing import Any, Dict

from schema import InferenceMode
from tensorlink import UserNode
from tensorlink.ml.module import DistributedModel


class TensorlinkManager():
    def __init__(self):
        self.status = {
            "connected": True,
            "node": None,
            "distributed_models": {},
            "inference_mode": InferenceMode.API
        }
    
    async def connect(self) -> Dict[str, Any]:
        """Connect to Tensorlink"""
        try:
            if not self.status.get("connected"):
                print("Launching Tensorlink Node...")
                # node = UserNode()
                node = True
                if node:
                    self.status["connected"] = True
                    self.status["node"] = node
                    return {"success": True, "message": "Connected to Tensorlink."}
        except Exception as e:
            return {"success": False, "message": f"Error connecting to Tensorlink: {e}"}
        
        return {"success": True, "message": "Already connected to Tensorlink"}

    async def disconnect(self) -> Dict[str, Any]:
        """Disconnect from Tensorlink and cleanup resources."""
        try:
            if self.status.get("connected"):
                node = self.status.get("node")
                if node:
                    node.cleanup()
                
                # Cleanup distributed models
                for model in self.status["distributed_models"].values():
                    if hasattr(model, 'cleanup'):
                        try:
                            model.cleanup()
                        except Exception as e:
                            print(f"Error cleaning up model: {e}")
                
                self.status["distributed_models"].clear()
                self.status["connected"] = False
                
            return {"success": True, "message": "Disconnected from Tensorlink"}
        except Exception as e:
            return {"success": False, "message": f"Error disconnecting: {e}"}

    # def get_model(self, model_name: str, device: str = None, dtype=None) -> DistributedModel:
    #     device = device or settings.DEFAULT_DEVICE

    def get_mode(self) -> InferenceMode:
        return self.status.get("inference_mode")
    
    def set_mode(self, mode: InferenceMode):
        self.status["inference_mode"] = mode

tensorlink_manager = TensorlinkManager()
