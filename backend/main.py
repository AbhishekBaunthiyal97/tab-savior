from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import shutil
from pathlib import Path
from .services.ffmpeg_utils import convert_mp3_to_wav, convert_wav_to_mp3
from .services.demucs_service import DemucsService
import asyncio
from concurrent.futures import ThreadPoolExecutor
import logging
from typing import Dict
import time
from .services.task_manager import TaskManager
import sys
import gc
import torch
from .utils.timer import Timer, timed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MP3 Vocal/Instrument Separator")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

# Create necessary directories
UPLOAD_DIR = Path("uploads")
PROCESSED_DIR = Path("processed")
OUTPUT_DIR = Path("outputs")
FRONTEND_DIR = Path("frontend")

for dir_path in [UPLOAD_DIR, PROCESSED_DIR, OUTPUT_DIR]:
    dir_path.mkdir(exist_ok=True)

# Mount the frontend directory
app.mount("/static", StaticFiles(directory="frontend"), name="static")

demucs_service = DemucsService()
executor = ThreadPoolExecutor()
task_manager = TaskManager()

# Add these constants
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB limit
ALLOWED_MIME_TYPES = {'audio/mpeg', 'audio/mp3'}

@app.get("/", response_class=HTMLResponse)
async def read_root():
    html_file = FRONTEND_DIR / "index.html"
    if html_file.exists():
        return HTMLResponse(content=html_file.read_text(), status_code=200)
    return HTMLResponse(content="Frontend not found", status_code=404)

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Validate file size
        contents = await file.read()
        size = len(contents)
        
        if size > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail="File too large (max 50MB)")
        
        # Validate file type
        if not file.filename.lower().endswith('.mp3'):
            raise HTTPException(status_code=400, detail="Only MP3 files are allowed")
        
        # Ensure filename is safe
        safe_filename = ''.join(c for c in file.filename if c.isalnum() or c in '-._')
        if not safe_filename:
            raise HTTPException(status_code=400, detail="Invalid filename")
        
        file_path = UPLOAD_DIR / safe_filename
        
        # Write file
        with file_path.open("wb") as buffer:
            buffer.write(contents)
        
        return {"filename": safe_filename, "status": "uploaded"}
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        await file.close()

@app.post("/process/{filename}")
async def process_file(filename: str):
    input_path = UPLOAD_DIR / filename
    if not input_path.exists():
        logger.error(f"Input file not found: {input_path}")
        raise HTTPException(status_code=404, detail="File not found")
    
    task_id = filename
    asyncio.create_task(process_audio_background(filename))
    return {"task_id": task_id}

@app.get("/status/{task_id}")
async def get_status(task_id: str):
    status = task_manager.get_task_status(task_id)
    if not status:
        raise HTTPException(status_code=404, detail="Task not found")
    return status

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = OUTPUT_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

async def process_audio_background(filename: str):
    task_id = filename
    task_manager.create_task(task_id)
    timer = Timer().start()
    
    try:
        input_path = UPLOAD_DIR / filename
        wav_filename = filename.replace('.mp3', '.wav')
        wav_path = PROCESSED_DIR / wav_filename
        
        # Convert MP3 to WAV
        task_manager.update_status(task_id, "converting to wav", 10)
        with timed("MP3 to WAV conversion", timer):
            success = convert_mp3_to_wav(input_path, wav_path)
        
        if not success:
            task_manager.update_status(task_id, "error", 0, "Failed to convert MP3 to WAV")
            return
        
        # Process with Demucs
        task_manager.update_status(task_id, "separating audio", 30)
        try:
            with timed("Demucs processing", timer):
                timing_info = demucs_service.separate_track(wav_path, OUTPUT_DIR)  # Save directly to OUTPUT_DIR
        except Exception as e:
            logger.error(f"Error during separation: {str(e)}")
            task_manager.update_status(task_id, "error", 0, str(e))
            return
        
        # Get output files (WAV files)
        output_files = []
        for track in ['vocals', 'drums', 'bass', 'other']:
            wav_file = OUTPUT_DIR / f"{track}.wav"
            if wav_file.exists():
                new_name = f"{filename.replace('.mp3', f'_{track}.wav')}"
                wav_file.rename(OUTPUT_DIR / new_name)
                output_files.append(new_name)
        
        if not output_files:
            task_manager.update_status(task_id, "error", 0, "Failed to create output files")
            return
        
        total_time = timer.get_total_time()
        logger.info(f"Total process time: {total_time:.2f} seconds")
        
        task_manager.update_status(
            task_id, 
            "completed", 
            100, 
            files=output_files,
            timing={
                "total_time": total_time,
                "steps": timer.steps
            }
        )
        
    except Exception as e:
        logger.error(f"Error processing file {filename}: {str(e)}")
        task_manager.update_status(task_id, "error", 0, str(e))
    finally:
        # Cleanup temporary files
        try:
            if wav_path.exists():
                wav_path.unlink()
        except Exception as e:
            logger.error(f"Cleanup error: {str(e)}") 