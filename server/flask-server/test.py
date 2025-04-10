import requests
import json
import os
import pyaudio
import wave
import time
from pydub import AudioSegment
from pydub.playback import play

# API endpoint configuration
BASE_URL = "http://127.0.0.1:5000"
PROCESS_SPEECH_URL = f"{BASE_URL}/process-speech"
TTS_URL = f"{BASE_URL}/tts"
GTTS_URL = f"{BASE_URL}/gtts"

def record_audio(filename="test_recording.wav", seconds=5):
    """Record audio from microphone for testing speech recognition"""
    print(f"Recording for {seconds} seconds...")
    
    # Audio parameters
    CHUNK = 1024
    FORMAT = pyaudio.paInt16
    CHANNELS = 1
    RATE = 16000
    
    p = pyaudio.PyAudio()
    
    stream = p.open(format=FORMAT,
                    channels=CHANNELS,
                    rate=RATE,
                    input=True,
                    frames_per_buffer=CHUNK)
    
    frames = []
    
    for i in range(0, int(RATE / CHUNK * seconds)):
        data = stream.read(CHUNK)
        frames.append(data)
    
    print("Recording finished.")
    
    stream.stop_stream()
    stream.close()
    p.terminate()
    
    wf = wave.open(filename, 'wb')
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT))
    wf.setframerate(RATE)
    wf.writeframes(b''.join(frames))
    wf.close()
    
    return filename

def test_speech_to_text(audio_file=None):
    """Test the speech recognition endpoint"""
    if audio_file is None:
        audio_file = record_audio()
    
    print(f"Testing speech recognition with file: {audio_file}")
    
    with open(audio_file, 'rb') as f:
        files = {'audio': (os.path.basename(audio_file), f, 'audio/wav')}
        response = requests.post(PROCESS_SPEECH_URL, files=files)
    
    if response.status_code == 200:
        result = response.json()
        print("\nSpeech Recognition Results:")
        print(f"Recognized Text: {result['text']}")
        print("Extracted Entities:")
        for entity, value in result['entities'].items():
            print(f"  - {entity}: {value}")
        return result
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

def test_text_to_speech(text="Hello, this is a test of the text to speech system.", use_gtts=False):
    """Test the text-to-speech endpoint"""
    url = GTTS_URL if use_gtts else TTS_URL
    tts_type = "Google TTS" if use_gtts else "pyttsx3"
    
    print(f"\nTesting {tts_type} with text: '{text}'")
    
    payload = {"text": text}
    headers = {"Content-Type": "application/json"}
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        # Save the audio response
        extension = "mp3" if use_gtts else "wav"
        output_file = f"test_output.{extension}"
        
        with open(output_file, 'wb') as f:
            f.write(response.content)
        
        print(f"Audio saved to {output_file}")
        
        # Play the audio
        print("Playing audio...")
        audio = AudioSegment.from_file(output_file)
        play(audio)
        
        return output_file
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

def run_full_test():
    """Run a complete test cycle"""
    print("===== SPEECH PROCESSING API TEST =====")
    
    # Test 1: Speech-to-Text
    print("\n----- TEST 1: SPEECH-TO-TEXT -----")
    speech_result = test_speech_to_text()
    
    if speech_result:
        # Test 2: Text-to-Speech with pyttsx3
        print("\n----- TEST 2: TEXT-TO-SPEECH (pyttsx3) -----")
        original_text = speech_result['text']
        test_text_to_speech(original_text)
        
        # Test 3: Text-to-Speech with Google TTS
        print("\n----- TEST 3: TEXT-TO-SPEECH (Google TTS) -----")
        test_text_to_speech(original_text, use_gtts=True)
    
    # Test 4: Manual Text-to-Speech Test
    print("\n----- TEST 4: MANUAL TEXT-TO-SPEECH TEST -----")
    sample_text = "My notice period is 2 months. My current CTC is 8.5 lakh and I'm expecting 12 lakh. I am available for interview next week."
    test_text_to_speech(sample_text)
    test_text_to_speech(sample_text, use_gtts=True)
    
    print("\n===== TEST COMPLETE =====")

if __name__ == "__main__":
    # Ask user what to test
    print("Speech Processing API Test Client")
    print("1. Run full test suite")
    print("2. Test speech recognition only")
    print("3. Test pyttsx3 text-to-speech only")
    print("4. Test Google TTS only")
    
    choice = input("Enter your choice (1-4): ")
    
    if choice == "1":
        run_full_test()
    elif choice == "2":
        test_speech_to_text()
    elif choice == "3":
        text = input("Enter text for speech synthesis: ")
        test_text_to_speech(text)
    elif choice == "4":
        text = input("Enter text for speech synthesis: ")
        test_text_to_speech(text, use_gtts=True)
    else:
        print("Invalid choice!")