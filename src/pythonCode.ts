export const PYTHON_SCRIPT_CONTENT = `"""
Hindi Text-to-Speech Web Application using Edge-TTS and Streamlit.
Converts Hindi text into natural-sounding neural speech and allows direct MP3 download.
All audio processing is done in-memory via io.BytesIO without temporary files.
"""

import asyncio
import io
import streamlit as st
import edge_tts

# ---------------------------------------------------------
# Page Configuration & Custom Styling
# ---------------------------------------------------------
st.set_page_config(
    page_title="Hindi Neural TTS | Edge-TTS",
    page_icon="🎙️",
    layout="centered",
    initial_sidebar_state="expanded",
)

# Custom responsive styling
st.markdown(
    """
    <style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 700;
        color: #e06a3b;
        margin-bottom: 0.2rem;
    }
    .sub-title {
        font-size: 1.05rem;
        color: #555555;
        margin-bottom: 1.5rem;
    }
    .stTextArea textarea {
        font-size: 1.15rem !important;
        line-height: 1.6 !important;
        font-family: 'Noto Sans Devanagari', -apple-system, BlinkMacSystemFont, sans-serif !important;
    }
    .voice-badge {
        display: inline-block;
        background-color: #fef3c7;
        color: #92400e;
        padding: 0.2rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.8rem;
        font-weight: 600;
        margin-left: 0.4rem;
    }
    .footer-note {
        text-align: center;
        color: #888888;
        font-size: 0.85rem;
        margin-top: 3rem;
        padding-top: 1rem;
        border-top: 1px solid #e5e7eb;
    }
    </style>
    """,
    unsafe_allow_html=True,
)

# ---------------------------------------------------------
# Voice Configurations
# ---------------------------------------------------------
VOICES = {
    "Male: Madhur (hi-IN-MadhurNeural)": {
        "id": "hi-IN-MadhurNeural",
        "gender": "Male",
        "desc": "Calm, natural Indian male voice suitable for narration, news, and reading.",
    },
    "Female: Swara (hi-IN-SwaraNeural)": {
        "id": "hi-IN-SwaraNeural",
        "gender": "Female",
        "desc": "Clear, expressive Indian female voice ideal for storytelling, presentations, and tutorials.",
    },
}

SAMPLE_PROMPTS = {
    "Select a sample phrase...": "",
    "नमस्ते और स्वागत": "नमस्ते! आपका हमारे इस ऑडियो स्टूडियो में हार्दिक स्वागत है। यह माइक्रोसॉफ्ट एज न्यूरल तकनीक से संचालित है।",
    "प्रेरणादायक विचार": "सफलता पहले से की गई तैयारी पर निर्भर करती है, और बिना ऐसी तैयारी के असफलता निश्चित है। निरंतर प्रयास ही जीत की कुंजी है।",
    "दैनिक मौसम व समाचार": "आज का मौसम अत्यंत सुहावना रहेगा। राजधानी में हल्की बारिश होने की संभावना जताई गई है। अपना छाता साथ रखना न भूलें।",
    "कहानी का अंश": "बहुत समय पहले की बात है, गंगा नदी के तट पर बसा एक सुंदर सा गाँव था। वहाँ के लोग आपस में बहुत प्रेम और सद्भाव से रहते थे।",
}

# ---------------------------------------------------------
# Core TTS Engine (In-Memory Streaming)
# ---------------------------------------------------------
async def synthesize_speech_in_memory(
    text: str, voice_id: str, rate_str: str = "+0%", pitch_str: str = "+0Hz"
) -> bytes:
    """
    Synthesize Hindi text using edge-tts directly into an in-memory byte buffer.
    No temporary files are created on disk.
    """
    communicate = edge_tts.Communicate(
        text=text,
        voice=voice_id,
        rate=rate_str,
        pitch=pitch_str,
    )

    audio_stream = io.BytesIO()
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_stream.write(chunk["data"])

    audio_stream.seek(0)
    return audio_stream.getvalue()


# ---------------------------------------------------------
# Main UI Layout
# ---------------------------------------------------------
st.markdown('<div class="main-title">🎙️ Hindi Neural Text-to-Speech</div>', unsafe_allow_html=True)
st.markdown(
    '<div class="sub-title">Convert Hindi text into lifelike natural speech powered by Microsoft Edge Neural Voices. 100% free, high fidelity, and processed purely in-memory.</div>',
    unsafe_allow_html=True,
)

# Sidebar controls
with st.sidebar:
    st.header("⚙️ Voice & Audio Settings")

    selected_voice_label = st.selectbox(
        "Choose Hindi Voice",
        options=list(VOICES.keys()),
        index=0,
        help="Select between natural male and female neural voices for Hindi.",
    )
    selected_voice_info = VOICES[selected_voice_label]
    st.info(f"**Selected:** \`{selected_voice_info['id']}\`\\n\\n{selected_voice_info['desc']}")

    st.markdown("---")
    st.subheader("Fine-Tuning")

    rate_slider = st.slider(
        "Speaking Rate (%)",
        min_value=-50,
        max_value=50,
        value=0,
        step=5,
        help="Adjust the speech pace. Default is 0%.",
    )
    rate_param = f"{'+' if rate_slider >= 0 else ''}{rate_slider}%"

    pitch_slider = st.slider(
        "Voice Pitch (Hz)",
        min_value=-50,
        max_value=50,
        value=0,
        step=5,
        help="Adjust voice pitch in Hertz. Default is 0Hz.",
    )
    pitch_param = f"{'+' if pitch_slider >= 0 else ''}{pitch_slider}Hz"

    st.markdown("---")
    st.caption("⚡ Powered by \`edge-tts\` & \`Streamlit\`")
    st.caption("🔒 Zero API keys required. No local files saved.")

# Sample phrase loader
sample_choice = st.selectbox(
    "💡 Quick Hindi Samples",
    options=list(SAMPLE_PROMPTS.keys()),
    index=0,
)

default_text = (
    SAMPLE_PROMPTS[sample_choice]
    if sample_choice != "Select a sample phrase..."
    else "नमस्ते! आप कैसे हैं? यह हिंदी टेक्स्ट टू स्पीच का एक परीक्षण है। आप यहाँ अपना कोई भी हिंदी वाक्य लिख सकते हैं।"
)

# Main Hindi Text Input
input_text = st.text_area(
    "Enter Hindi Text (हिंदी में टेक्स्ट लिखें):",
    value=default_text,
    height=180,
    placeholder="यहाँ देवनागरी लिपि या हिंदी में अपना संदेश लिखें...",
    help="Enter standard Hindi text. Accents and punctuation are supported.",
)

# Character & word count metrics
char_count = len(input_text.strip())
word_count = len(input_text.strip().split()) if input_text.strip() else 0

col1, col2 = st.columns([1, 1])
with col1:
    st.caption(f"📝 Characters: **{char_count}** | Words: **{word_count}**")

# Generation Action
st.write("")
generate_clicked = st.button("🚀 Convert to Speech (ऑडियो तैयार करें)", type="primary", use_container_width=True)

# Audio generation handling
if generate_clicked:
    clean_text = input_text.strip()

    if not clean_text:
        st.error("⚠️ कृपया कुछ हिंदी टेक्स्ट दर्ज करें (Please enter Hindi text before generating speech).")
    else:
        with st.spinner("⏳ Synthesizing natural neural speech in-memory..."):
            try:
                # Run the asynchronous edge_tts stream in the current event loop
                audio_bytes = asyncio.run(
                    synthesize_speech_in_memory(
                        text=clean_text,
                        voice_id=selected_voice_info["id"],
                        rate_str=rate_param,
                        pitch_str=pitch_param,
                    )
                )

                if not audio_bytes or len(audio_bytes) < 100:
                    st.error("❌ Audio stream returned empty data. Please verify your internet connection and try again.")
                else:
                    st.success("✅ Audio generated successfully!")

                    # In-browser audio player
                    st.subheader("🎧 Listen Now")
                    st.audio(audio_bytes, format="audio/mp3")

                    # Download button
                    sanitized_voice_name = "madhur" if "Madhur" in selected_voice_label else "swara"
                    file_name = f"hindi_speech_{sanitized_voice_name}.mp3"

                    st.download_button(
                        label="📥 Download MP3 (ऑडियो डाउनलोड करें)",
                        data=audio_bytes,
                        file_name=file_name,
                        mime="audio/mpeg",
                        use_container_width=True,
                    )

            except Exception as ex:
                st.error(f"❌ Network or Synthesis Error: {str(ex)}")
                st.info("Tip: Microsoft Edge TTS requires an active internet connection to contact neural voice servers.")

# Footer
st.markdown(
    """
    <div class="footer-note">
        Hindi Text-to-Speech Engine • Natural Indian Voices (hi-IN-MadhurNeural & hi-IN-SwaraNeural) • In-Memory Processing
    </div>
    """,
    unsafe_allow_html=True,
)
`;

export const PIP_COMMAND = "pip install streamlit edge-tts";
export const RUN_COMMAND = "streamlit run app.py";
