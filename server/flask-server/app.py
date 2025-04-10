import os
import json
import tempfile
import subprocess
import traceback
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import speech_recognition as sr
from dotenv import load_dotenv

# Initialize Flask app
load_dotenv()
app = Flask(__name__)
CORS(app)

# FFmpeg configuration
def configure_ffmpeg():
    """Configure FFmpeg path and verify it works"""
    try:
        # Check if FFmpeg is in PATH
        subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True, check=True)
        print("FFmpeg found in PATH")
        return True
    except (subprocess.SubprocessError, FileNotFoundError):
        # Add your custom FFmpeg path here
        ffmpeg_path = r"C:\Users\91878\Desktop\ffmpeg\bin"  # Modify this path as needed
        if os.path.exists(os.path.join(ffmpeg_path, 'ffmpeg.exe')):
            os.environ["PATH"] = os.pathsep.join([os.environ["PATH"], ffmpeg_path])
            try:
                subprocess.run(['ffmpeg', '-version'], capture_output=True, text=True, check=True)
                print(f"FFmpeg configured at: {ffmpeg_path}")
                return True
            except (subprocess.SubprocessError, FileNotFoundError):
                print(f"FFmpeg found at {ffmpeg_path} but failed to execute")
                return False
        print("WARNING: FFmpeg not found. Audio processing will fail.")
        return False

# Check FFmpeg availability at startup
ffmpeg_available = configure_ffmpeg()

def extract_text_from_audio(audio_path, output_wav_path):
    """Convert audio to WAV and extract text using speech recognition"""
    if not ffmpeg_available:
        raise Exception("FFmpeg not configured properly - please install FFmpeg")

    # Convert audio to WAV format
    try:
        subprocess.run([
            'ffmpeg',
            '-i', audio_path,
            '-ar', '16000',  # 16kHz sample rate
            '-ac', '1',      # Mono channel
            '-y',            # Overwrite output
            output_wav_path
        ], capture_output=True, text=True, check=True)
        print(f"Successfully converted audio to WAV: {output_wav_path}")
    except subprocess.SubprocessError as e:
        raise Exception(f"Audio conversion failed: {str(e.stderr) if hasattr(e, 'stderr') else str(e)}")

    # Perform speech recognition
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(output_wav_path) as source:
            audio_data = recognizer.record(source)
            text = recognizer.recognize_google(audio_data)
            print(f"Recognized text: {text}")
            return text.strip()
    except sr.UnknownValueError:
        print("Could not understand audio")
        return ""
    except sr.RequestError as e:
        raise Exception(f"Speech recognition API error: {str(e)}")

@app.route('/process-speech', methods=['POST'])
def process_speech():
    """Process uploaded audio file and send results to Node.js server"""
    # Validate request
    if 'audio' not in request.files:
        print("No audio file in request")
        return jsonify({'error': 'No audio file provided'}), 400
    
    audio_file = request.files['audio']
    candidate_id = request.form.get('candidateId')
    
    if not candidate_id:
        print("No candidate ID provided")
        return jsonify({'error': 'No candidate ID provided'}), 400

    print(f"Processing audio for candidate: {candidate_id}")
    print(f"Audio file: {audio_file.filename if audio_file.filename else 'blob'}")
    print(f"Content type: {audio_file.content_type}")

    # Create temporary files
    temp_dir = tempfile.gettempdir()
    input_path = os.path.join(temp_dir, f"input_{candidate_id}.webm")  # Assuming webm from browser
    wav_path = os.path.join(temp_dir, f"output_{candidate_id}.wav")
    
    try:
        # Save uploaded audio
        audio_file.save(input_path)
        print(f"Saved audio to: {input_path}")

        # Extract text
        text = extract_text_from_audio(input_path, wav_path)
        
        # Prepare payload for Node.js server
        node_url = 'http://localhost:3000/api/nodeserver/process-candidate-data'
        payload = {
            'candidateId': candidate_id,
            'text': text,
            'processedAt': '2025-04-10'  # Current date as per your requirement
        }
        
        # Send to Node.js server
        print(f"Sending data to Node.js server: {node_url}")
        try:
            response = requests.post(node_url, json=payload, timeout=10)
            response.raise_for_status()
            print("Successfully sent data to Node.js server")
        except requests.exceptions.RequestException as e:
            print(f"Failed to send to Node.js server: {str(e)}")
            return jsonify({
                'text': text,
                'candidateId': candidate_id,
                'warning': f'Failed to update Node.js server: {str(e)}'
            }), 200

        # Successful response
        return jsonify({
            'text': text,
            'candidateId': candidate_id,
            'status': 'processed'
        }), 200

    except Exception as e:
        print(f"Error processing audio: {str(e)}")
        traceback.print_exc()
        return jsonify({'error': f"Processing failed: {str(e)}"}), 500
    
    finally:
        # Clean up temporary files
        for path in [input_path, wav_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                    print(f"Cleaned up: {path}")
                except Exception as e:
                    print(f"Error cleaning up {path}: {str(e)}")

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'ffmpeg_available': ffmpeg_available,
        'date': '2025-04-10'
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    print(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)