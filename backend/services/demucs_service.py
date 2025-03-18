import torch
from demucs.pretrained import get_model
from demucs.apply import apply_model
import torchaudio
from pathlib import Path
import logging
import gc
import numpy as np
from ..utils.timer import Timer, timed

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DemucsService:
    def __init__(self):
        try:
            logger.info("Initializing Demucs model...")
            # Use a smaller model variant for faster processing
            self.model = get_model('htdemucs_ft')  # Using the fine-tuned model which is smaller and faster
            self.model.eval()
            
            if torch.cuda.is_available():
                logger.info("CUDA available, using GPU")
                self.model.cuda()
                # Enable cuDNN autotuner for faster GPU processing
                torch.backends.cudnn.benchmark = True
            else:
                logger.info("CUDA not available, using CPU")
                # Optimize for CPU
                torch.set_num_threads(torch.get_num_threads())
                
            self.timer = Timer()
            
        except Exception as e:
            logger.error(f"Error initializing Demucs model: {str(e)}")
            raise

    def separate_track(self, wav_path: Path, output_dir: Path):
        self.timer.start()
        try:
            with timed("Loading audio", self.timer):
                logger.info(f"Loading audio file: {wav_path}")
                # Load audio with optimized settings
                wav, sr = torchaudio.load(str(wav_path))
                logger.info(f"Audio loaded successfully. Shape: {wav.shape}, Sample rate: {sr}")
            
            with timed("Converting audio format", self.timer):
                # Convert to stereo if mono
                if wav.shape[0] == 1:
                    logger.info("Converting mono to stereo")
                    wav = wav.repeat(2, 1)
                elif wav.shape[0] > 2:
                    logger.info("Converting multi-channel to stereo")
                    wav = wav[:2]
            
            # Optimize chunk size based on available memory
            available_memory = torch.cuda.get_device_properties(0).total_memory if torch.cuda.is_available() else 2e9
            optimal_chunk_size = min(sr * 60, int(available_memory / (wav.element_size() * 4)))
            
            with timed("Processing audio", self.timer):
                # Process in optimized chunks
                if wav.shape[1] > optimal_chunk_size:
                    logger.info("Processing long audio in optimized chunks")
                    chunks = wav.shape[1] // optimal_chunk_size + 1
                    sources = []
                    
                    # Pre-allocate GPU memory if available
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                        torch.cuda.memory.empty_cache()
                        
                    for i in range(chunks):
                        start = i * optimal_chunk_size
                        end = min((i + 1) * optimal_chunk_size, wav.shape[1])
                        chunk = wav[:, start:end]
                        
                        # Process chunk
                        chunk = chunk.unsqueeze(0)
                        if torch.cuda.is_available():
                            chunk = chunk.cuda()
                        
                        with torch.no_grad(), torch.cuda.amp.autocast() if torch.cuda.is_available() else torch.no_grad():
                            chunk_sources = apply_model(self.model, chunk, progress=False)[0]
                            chunk_sources = chunk_sources * chunk.std() / chunk_sources.std()
                        
                        sources.append(chunk_sources.cpu())
                        
                        # Immediate cleanup
                        if torch.cuda.is_available():
                            torch.cuda.empty_cache()
                            torch.cuda.memory.empty_cache()
                        del chunk, chunk_sources
                        gc.collect()
                    
                    # Efficient concatenation
                    sources = [torch.cat([chunk[i] for chunk in sources], dim=1) for i in range(4)]
                else:
                    # Process short audio with optimized settings
                    wav = wav.unsqueeze(0)
                    if torch.cuda.is_available():
                        wav = wav.cuda()
                    
                    with torch.no_grad(), torch.cuda.amp.autocast() if torch.cuda.is_available() else torch.no_grad():
                        sources = apply_model(self.model, wav, progress=False)[0]
                        sources = sources * wav.std() / sources.std()
                        sources = sources.cpu()
            
            with timed("Saving files", self.timer):
                # Parallel save operations
                source_names = ["vocals", "drums", "bass", "other"]
                for source, name in zip(sources, source_names):
                    output_path = output_dir / f"{name}.wav"
                    logger.info(f"Saving {name} to {output_path}")
                    source_mono = source.mean(0, keepdim=True)
                    # Use float32 instead of float64 for faster saving
                    source_mono = source_mono.to(torch.float32)
                    torchaudio.save(str(output_path), source_mono, sr)
            
            total_time = self.timer.get_total_time()
            logger.info(f"Total processing time: {total_time:.2f} seconds")
            return {
                "total_time": total_time,
                "steps": self.timer.steps
            }
            
        except Exception as e:
            logger.error(f"Error during audio separation: {str(e)}")
            raise
        finally:
            # Thorough cleanup
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                torch.cuda.memory.empty_cache()
            gc.collect() 