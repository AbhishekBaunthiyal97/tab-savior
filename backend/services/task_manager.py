import asyncio
from typing import Dict, Optional, Callable
import logging

logger = logging.getLogger(__name__)

class TaskManager:
    def __init__(self):
        self.tasks: Dict[str, dict] = {}
        
    def create_task(self, task_id: str) -> None:
        self.tasks[task_id] = {
            "status": "initializing",
            "progress": 0,
            "error": None,
            "files": [],
            "timing": None
        }
    
    def update_status(self, task_id: str, status: str, progress: int = None, error: str = None, files: list = None, timing: dict = None) -> None:
        if task_id in self.tasks:
            if status:
                self.tasks[task_id]["status"] = status
            if progress is not None:
                self.tasks[task_id]["progress"] = progress
            if error:
                self.tasks[task_id]["error"] = error
            if files:
                self.tasks[task_id]["files"] = files
            if timing:
                self.tasks[task_id]["timing"] = timing
    
    def get_task_status(self, task_id: str) -> Optional[dict]:
        return self.tasks.get(task_id)
    
    def remove_task(self, task_id: str) -> None:
        if task_id in self.tasks:
            del self.tasks[task_id] 