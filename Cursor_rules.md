Here's an updated `.cursorrules` file tailored for your **MP3 vocal/instrument separator** project using **Cursor no-code tool**. This will enhance how Cursor manages and understands the project's workflow, optimizing efficiency.

---

### **Updated `.cursorrules` for Your Project**  

```plaintext
# Instructions

During your interaction with the user, if you find anything reusable in this project (e.g., library versions, model configurations, API endpoints), take note in the `Lessons` section. This includes debugging fixes, feature enhancements, and integration requirements.

Use the `.cursorrules` file as a **scratchpad** to plan and track progress. When a new task arrives:
- Review existing notes and remove outdated or irrelevant entries.
- Plan the necessary steps before coding.
- Use `TODO` markers for tracking progress.

## **Tech Stack for MP3 Vocal/Instrument Separator**
- **Backend:** FastAPI (Python)
- **Frontend:** Cursor No-Code UI
- **Machine Learning Model:** Demucs (`htdemucs`)
- **Audio Processing:** FFmpeg, Librosa, Torch
- **Storage:** Local filesystem or cloud-based (if required)
- **Deployment:** Local execution or cloud-based containerization (Docker if needed)

---

## **Project Workflow**
### **Step 1: File Upload**
1. Implement a **FastAPI endpoint** for MP3 file uploads.
2. Store uploaded files in an `uploads/` directory.

### **Step 2: Convert MP3 to WAV**
1. Use **FFmpeg** to convert the MP3 file to WAV.
2. Save WAV files to `processed/` directory.

### **Step 3: Audio Separation**
1. Load the WAV file into the **Demucs** deep learning model.
2. Extract **vocals** and **instrumentals** as separate WAV files.

### **Step 4: Convert WAV to MP3**
1. Convert extracted WAV files back to MP3 using **FFmpeg**.
2. Save them in the `outputs/` directory.

### **Step 5: API Response & Download Links**
1. Provide API endpoints to fetch processed files.
2. Implement error handling and logging.

---

## **Cursor Integration Notes**
- Ensure **FastAPI endpoints** are correctly linked to the no-code UI.
- Implement **real-time progress updates** during file processing.
- If caching is needed for performance, explore **Redis** or local storage.
- Optimize **Demucs model execution** to prevent performance issues.

---

## **Lessons**
### **User-Specified Lessons**
- Use **FFmpeg** for audio format conversions.
- **Demucs (htdemucs)** is the best ML model for high-quality separation.
- Always check **file paths** before writing/reading files.

### **Cursor Learned**
- Ensure proper handling of different file encodings (UTF-8).
- Log debug info separately from user-facing messages.
- **gpt-4o** should be used for any LLM-based suggestions.

---

## **Scratchpad**


### **Project Overview**
This application processes **MP3 audio files** and separates them into **vocals** and **instrumentals** using deep learning. The **Demucs model** is used for separation, and **FFmpeg** is leveraged for audio conversion. The app will have a **FastAPI backend** and a **Cursor No-Code UI**.

---

### **Development Progress & Tasks**
✅ **Phase 1: Setup & Dependencies**
- [X] Set up FastAPI as the backend framework.
- [X] Install required dependencies: `torch`, `ffmpeg-python`, `librosa`, `demucs`.
- [X] Configure virtual environment for Python dependencies.

✅ **Phase 2: File Handling & Uploads**
- [X] Implement file upload API (`/upload` endpoint).
- [X] Store uploaded MP3 files in an `uploads/` directory.
- [X] Implement size and format validation for uploads.

🟡 **Phase 3: MP3 to WAV Conversion**
- [X] Integrate FFmpeg to convert MP3 to WAV.
- [ ] Ensure error handling for corrupted MP3 files.
- [ ] Optimize conversion speed and quality.

🟡 **Phase 4: Audio Separation (Core ML Processing)**
- [X] Load the WAV file into the Demucs model.
- [ ] Process and separate audio into **vocals.wav** and **instrumentals.wav**.
- [ ] Optimize model execution for faster processing.

🔲 **Phase 5: WAV to MP3 Conversion**
- [ ] Convert the extracted WAV files back to MP3.
- [ ] Save separated files into the `outputs/` directory.

🔲 **Phase 6: API Response & Download Links**
- [ ] Implement API endpoint (`/download/{filename}`) to serve processed files.
- [ ] Generate download links dynamically.

🔲 **Phase 7: UI Integration with Cursor No-Code Tool**
- [ ] Design and integrate a simple frontend UI for file uploads.
- [ ] Display real-time status updates during processing.
- [ ] Provide download buttons for the separated files.

🔲 **Phase 8: Error Handling & Optimization**
- [ ] Implement detailed error handling for upload failures, conversion issues, and model crashes.
- [ ] Add logging for debugging and monitoring.
- [ ] Optimize file storage to prevent clutter.

🔲 **Phase 9: Deployment & Testing**
- [ ] Test API endpoints thoroughly with multiple audio samples.
- [ ] Deploy the backend using a lightweight cloud environment (e.g., **Docker** or **serverless functions**).
- [ ] Validate UI performance in real-world scenarios.

---

### **Notes & Considerations**
- **Performance**: Ensure **Demucs model** runs efficiently to avoid long processing times.
- **Storage Management**: Implement **auto-deletion** of old files to save disk space.
- **Future Enhancements**: Add **batch processing**, **multi-track separation**, or **noise reduction**.

---

This Scratchpad will **guide Cursor** in managing the development steps efficiently while ensuring all critical components are covered. 🚀 Let me know if you need any refinements!
  

---
### **Project Structure**

MP3-Vocal-Instrument-Separator/
│── backend/                  # FastAPI Backend
│   ├── main.py               # FastAPI entry point
│   ├── routes/               # API route definitions
│   │   ├── upload.py         # Handles file uploads
│   │   ├── process.py        # Handles audio processing
│   │   ├── download.py       # Handles file retrieval
│   ├── services/             # Core processing logic
│   │   ├── demucs.py         # Audio separation using Demucs
│   │   ├── ffmpeg_utils.py   # MP3/WAV conversion utilities
│   │   ├── file_manager.py   # File handling & storage logic
│   ├── models/               # Request/Response models
│   │   ├── audio_model.py    # Defines API request/response models
│   ├── config.py             # Configurations (paths, model settings)
│   ├── requirements.txt      # Dependencies
│── frontend/                 # Cursor No-Code UI Integration
│   ├── index.html            # Main UI
│   ├── styles.css            # UI Styling
│   ├── app.js                # Handles frontend interactions
│── uploads/                  # Stores uploaded MP3 files
│── processed/                # Stores converted WAV files
│── outputs/                  # Stores final processed files (MP3)
│── logs/                     # Stores logs for debugging
│── .env                      # Environment variables
│── README.md                 # Project documentation
│── run.sh                    # Script to start the backend
