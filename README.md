# Hindi Neural Text-to-Speech Web Application

A lightweight, clean web application built with **Python**, **Streamlit**, and **edge-tts** that converts Hindi text into natural-sounding speech and allows direct MP3 download.

## Features
- **Natural Indian Neural Voices**:
  - `hi-IN-MadhurNeural` (Indian Male) - Warm, clear, authoritative.
  - `hi-IN-SwaraNeural` (Indian Female) - Expressive, pleasant, melodic.
- **In-Memory Audio Processing**: Built using `io.BytesIO()`. No temporary audio files are stored or cluttered on disk.
- **Direct MP3 Playback & Download**: Listen directly in the browser using the HTML5 audio player and download with one click.
- **Pitch and Speed Fine-Tuning**: Real-time speaking rate (`-50%` to `+50%`) and pitch controls (`-50Hz` to `+50Hz`).
- **Preloaded Hindi Phrases**: Quick sample sentences for instant testing.
- **Zero API Keys & Zero Credentials**: Powered by Microsoft Edge's Neural TTS service with no paid tiers or quotas.

---

## 🚀 Quick Start (Local Setup)

### 1. Install Dependencies
Run the following pip install command in your terminal:

```bash
pip install streamlit edge-tts
```

### 2. Run the Application
Start the Streamlit development server:

```bash
streamlit run app.py
```

Open your browser at `http://localhost:8501`.
