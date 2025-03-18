import time
from contextlib import contextmanager
import logging

logger = logging.getLogger(__name__)

class Timer:
    def __init__(self):
        self.start_time = None
        self.steps = {}
        
    def start(self):
        self.start_time = time.time()
        self.steps = {}
        return self
        
    def log_step(self, step_name: str):
        current_time = time.time()
        elapsed = current_time - self.start_time
        self.steps[step_name] = elapsed
        logger.info(f"Step '{step_name}' completed at {elapsed:.2f} seconds")
        
    def get_total_time(self):
        if not self.start_time:
            return 0
        return time.time() - self.start_time
    
    def get_step_time(self, step_name: str):
        if step_name not in self.steps:
            return 0
        previous_step = 0
        for step, time_stamp in self.steps.items():
            if step == step_name:
                return time_stamp - previous_step
            previous_step = time_stamp
        return 0

@contextmanager
def timed(description: str, timer: Timer = None):
    start = time.time()
    yield
    elapsed = time.time() - start
    if timer:
        timer.log_step(description)
    logger.info(f"{description} took {elapsed:.2f} seconds") 