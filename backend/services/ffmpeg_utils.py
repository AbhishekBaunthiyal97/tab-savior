import subprocess
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

def convert_mp3_to_wav(input_path: Path, output_path: Path) -> bool:
    try:
        logger.info(f"Converting MP3 to WAV: {input_path} -> {output_path}")
        command = [
            'ffmpeg', '-i', str(input_path),
            '-acodec', 'pcm_s16le',
            '-ar', '44100',
            '-ac', '2',
            str(output_path),
            '-y'  # Overwrite output file if it exists
        ]
        
        process = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if process.returncode != 0:
            logger.error(f"FFmpeg error: {process.stderr}")
            return False
            
        logger.info("MP3 to WAV conversion successful")
        return True
        
    except Exception as e:
        logger.error(f"Unexpected error during MP3 to WAV conversion: {str(e)}")
        return False

def convert_wav_to_mp3(input_path: Path, output_path: Path) -> bool:
    try:
        logger.info(f"Converting WAV to MP3: {input_path} -> {output_path}")
        command = [
            'ffmpeg', '-i', str(input_path),
            '-codec:a', 'libmp3lame',
            '-qscale:a', '2',
            str(output_path),
            '-y'  # Overwrite output file if it exists
        ]
        
        process = subprocess.run(
            command,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True
        )
        
        if process.returncode != 0:
            logger.error(f"FFmpeg error: {process.stderr}")
            return False
            
        logger.info("WAV to MP3 conversion successful")
        return True
        
    except Exception as e:
        logger.error(f"Unexpected error during WAV to MP3 conversion: {str(e)}")
        return False 