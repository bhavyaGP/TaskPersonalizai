from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import spacy
import re
from dotenv import load_dotenv
import pyttsx3
import speech_recognition as sr
import tempfile
import io
import requests
import subprocess
from pydub import AudioSegment

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize spaCy
nlp = spacy.load("en_core_web_sm")

# Initialize pyttsx3
engine = pyttsx3.init()

def extract_entities(text):
    doc = nlp(text)
    entities = {
        "notice_period": None,
        "current_ctc": None,
        "expected_ctc": None,
        "availability": None
    }
    
    # Extract notice period
    notice_pattern = r'(\d+)\s*(?:month|months|week|weeks|day|days)'
    notice_match = re.search(notice_pattern, text.lower())
    if notice_match:
        entities["notice_period"] = int(notice_match.group(1))
    
    # Extract CTC values
    ctc_pattern = r'(\d+(?:\.\d+)?)\s*(?:lakh|lacs|lac|L|LPA)'
    ctc_matches = re.findall(ctc_pattern, text.lower())
    if len(ctc_matches) >= 2:
        entities["current_ctc"] = float(ctc_matches[0])
        entities["expected_ctc"] = float(ctc_matches[1])
    
    # Extract availability
    availability_keywords = ["available", "free", "can do", "would like"]
    for keyword in availability_keywords:
        if keyword in text.lower():
            entities["availability"] = True
            break
    
    return entities

@app.route('/process-speech', methods=['POST'])
def process_speech():
    if 'audio' not in request.files:
        print("No audio file found in request")
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    candidate_id = request.form.get('candidateId')
    
    print(f"Received audio file for candidate {candidate_id}")
    print(f"Audio file details:")
    print(f"- Filename: {audio_file.filename if audio_file.filename else 'blob'}")
    print(f"- Content type: {audio_file.content_type}")
    
    # Save the audio file temporarily with correct extension
    suffix = '.webm'  # WebM files with Opus codec
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp_audio:
        temp_path = temp_audio.name
        audio_file.save(temp_path)
        print(f"Saved audio file to: {temp_path}")
    
    try:
        # Convert WebM to WAV using pydub
        print("Converting WebM to WAV...")
        # Ensure FFmpeg is available for WebM/Opus conversion
        wav_path = temp_path.replace('.webm', '.wav')
        
        try:
            # Try using pydub for conversion
            audio = AudioSegment.from_file(temp_path)  # Let pydub detect format
            audio.export(wav_path, format="wav")
            print(f"Converted to WAV using pydub: {wav_path}")
        except Exception as e:
            print(f"Error converting with pydub: {str(e)}")
            # If pydub fails, try direct FFmpeg (if available)
            try:
                command = [
                    'ffmpeg',
                    '-i', temp_path,
                    '-ar', '16000',  # 16kHz sample rate for better speech recognition
                    '-ac', '1',      # Mono channel
                    '-y',            # Overwrite output file
                    wav_path
                ]
                subprocess.run(command, check=True)
                print(f"Converted to WAV using FFmpeg: {wav_path}")
            except Exception as ffmpeg_error:
                print(f"Error converting with FFmpeg: {str(ffmpeg_error)}")
                return jsonify({'error': 'Failed to convert audio format'}), 500
        
        # Process the audio file with SpeechRecognition
        print("Processing audio with SpeechRecognition...")
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            try:
                print("Attempting speech recognition...")
                text = recognizer.recognize_google(audio_data)
                print(f"Recognized text: {text}")
            except sr.UnknownValueError:
                print("Could not understand audio")
                text = ""
                return jsonify({'error': 'Could not understand audio'}), 400
            except sr.RequestError as e:
                print(f"Speech recognition API error: {str(e)}")
                return jsonify({'error': 'API unavailable'}), 500
        
        # Extract entities
        print("Extracting entities from text...")
        entities = extract_entities(text)
        print(f"Extracted entities: {entities}")
        
        # Send data to Node.js server to update database (with error handling)
        try:
            print("Sending data to Node.js server...")
            node_response = requests.post(
                'http://localhost:3001/process-candidate-data',
                json={
                    'candidateId': candidate_id,
                    'entities': entities,
                    'text': text.strip()
                },
                timeout=5  # Add timeout to prevent hanging
            )
            if node_response.status_code != 200:
                print(f"Error updating database: {node_response.text}")
            else:
                print("Successfully updated database")
        except requests.exceptions.RequestException as e:
            print(f"Error connecting to Node.js server: {str(e)}")
            # Continue processing even if Node.js server is unreachable
        
        return jsonify({
            'text': text.strip(),
            'entities': entities
        })
        
    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        import traceback
        traceback.print_exc()  # Print full traceback for debugging
        return jsonify({'error': f'Failed to process audio: {str(e)}'}), 500
        
    finally:
        # Clean up
        print("Cleaning up temporary files...")
        if 'temp_path' in locals() and os.path.exists(temp_path):
            os.remove(temp_path)
            print(f"Removed {temp_path}")
        if 'wav_path' in locals() and os.path.exists(wav_path):
            os.remove(wav_path)
            print(f"Removed {wav_path}")

@app.route('/tts', methods=['POST'])
def text_to_speech():
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    text = data['text']
    
    # Create a bytes buffer
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_output:
        output_path = temp_output.name
    
    # Generate speech with pyttsx3
    engine.save_to_file(text, output_path)
    engine.runAndWait()
    
    # Read the generated audio file
    with open(output_path, 'rb') as f:
        audio_data = f.read()
    
    # Clean up
    os.remove(output_path)
    
    return audio_data, 200, {
        'Content-Type': 'audio/wav',
        'Content-Disposition': 'attachment; filename=speech.wav'
    }

# Alternative TTS implementation using gTTS (Google Text-to-Speech)
@app.route('/gtts', methods=['POST'])
def google_tts():
    from gtts import gTTS
    import io
    
    data = request.get_json()
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400
    
    text = data['text']
    
    # Generate speech with gTTS
    tts = gTTS(text=text, lang='en')
    
    # Save to a temporary file
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_output:
        output_path = temp_output.name
        tts.save(output_path)
    
    # Read the generated audio file
    with open(output_path, 'rb') as f:
        audio_data = f.read()
    
    # Clean up
    os.remove(output_path)
    
    return audio_data, 200, {
        'Content-Type': 'audio/mp3',
        'Content-Disposition': 'attachment; filename=speech.mp3'
    }

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port)