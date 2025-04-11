import os
import json
import tempfile
import subprocess
import traceback
import re
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import speech_recognition as sr
from dotenv import load_dotenv
from datetime import datetime

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

def extract_entities(text, question_context):
    """Extract entities from recognized text based on question context"""
    entities = {}

    text = text.lower()
    question_context = question_context.lower()

    # Process based on question context
    # For full conversation mode, extract all entities at once
    if "full conversation" in question_context:
        # Extract all possible entities from the text

        # 1. Extract interest level
        positive_keywords = ["yes", "interested", "definitely", "absolutely", "sure", "of course", "certainly", "yeah", "yep", "positive"]
        negative_keywords = ["no", "not interested", "don't think", "cannot", "nope", "negative", "pass", "decline"]

        if any(word in text for word in positive_keywords):
            entities["interested"] = "Yes"
        elif any(word in text for word in negative_keywords):
            entities["interested"] = "No"
        else:
            # Look for sentiment indicators
            positive_phrases = ["sounds good", "like to", "would love", "great opportunity"]
            negative_phrases = ["not for me", "looking elsewhere", "other opportunities", "not at this time"]

            if any(phrase in text for phrase in positive_phrases):
                entities["interested"] = "Yes"
            elif any(phrase in text for phrase in negative_phrases):
                entities["interested"] = "No"

        # 2. Extract notice period
        notice_patterns = [
            r'(\d+)\s*(day|days|week|weeks|month|months)',  # e.g., "2 months", "30 days"
            r'(one|two|three|four|five|six)\s*(day|days|week|weeks|month|months)',  # e.g., "two weeks"
            r'(immediate|immediately)',  # Immediate joining
            r'(\d+)\s*to\s*(\d+)\s*(day|days|week|weeks|month|months)'  # e.g., "2 to 3 months"
        ]

        for pattern in notice_patterns:
            matches = re.findall(pattern, text)
            if matches:
                if pattern == r'(immediate|immediately)':
                    entities["notice_period"] = "Immediate"
                    break
                elif 'to' in pattern:
                    # Range pattern (e.g., "2 to 3 months")
                    start, end, unit = matches[0]
                    entities["notice_period"] = f"{start}-{end} {unit}"
                    break
                else:
                    # Standard pattern
                    number, unit = matches[0]

                    # Convert text numbers to digits if needed
                    number_map = {"one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6"}
                    if number.lower() in number_map:
                        number = number_map[number.lower()]

                    entities["notice_period"] = f"{number} {unit}"
                    break

        # 3. Extract CTC information
        ctc_patterns = [
            # Current CTC patterns
            r'current(?:\s*ctc)?\s*(?:is|of)?\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?',
            r'(?:i\s*(?:am|m)\s*(?:getting|earning|making))\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?',
            r'(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?\s*(?:per\s*annum|p\.?a\.?)?\s*(?:current|right now|at present)',

            # Expected CTC patterns
            r'expect(?:ed|ing)?(?:\s*ctc)?\s*(?:is|of)?\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?',
            r'looking\s*for\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?',
            r'(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?\s*(?:per\s*annum|p\.?a\.?)?\s*(?:expect|want|desired)'
        ]

        # Try to find current CTC
        for pattern in ctc_patterns[:3]:  # First 3 patterns are for current CTC
            matches = re.findall(pattern, text)
            if matches:
                value, unit = matches[0] if len(matches[0]) == 2 else (matches[0][0], '')
                entities["current_ctc"] = standardize_ctc_value(value, unit)
                break

        # Try to find expected CTC
        for pattern in ctc_patterns[3:]:  # Last 3 patterns are for expected CTC
            matches = re.findall(pattern, text)
            if matches:
                value, unit = matches[0] if len(matches[0]) == 2 else (matches[0][0], '')
                entities["expected_ctc"] = standardize_ctc_value(value, unit)
                break

        # If specific patterns don't match, try general approaches
        if "current_ctc" not in entities or "expected_ctc" not in entities:
            # Look for patterns like "X to Y" or "X and Y"
            range_pattern = r'(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lpa|k|L)?\s*(?:to|and)\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lpa|k|L)?'
            range_matches = re.findall(range_pattern, text)

            if range_matches:
                if "current_ctc" not in entities:
                    entities["current_ctc"] = standardize_ctc_value(range_matches[0][0], '')
                if "expected_ctc" not in entities:
                    entities["expected_ctc"] = standardize_ctc_value(range_matches[0][1], '')
            else:
                # Just find all numbers and make an educated guess
                all_numbers = re.findall(r'(\d+(?:\.\d+)?)', text)
                if len(all_numbers) >= 2:
                    if "current_ctc" not in entities:
                        entities["current_ctc"] = standardize_ctc_value(all_numbers[0], '')
                    if "expected_ctc" not in entities:
                        entities["expected_ctc"] = standardize_ctc_value(all_numbers[1], '')
                elif len(all_numbers) == 1 and "current_ctc" not in entities:
                    # If only one number, assume it's current CTC
                    entities["current_ctc"] = standardize_ctc_value(all_numbers[0], '')

        # 4. Extract availability information
        # Day patterns
        day_patterns = [
            r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
            r'\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b',
            r'\b(tomorrow|day after tomorrow|next week)\b',
            r'\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b'
        ]

        # Time patterns
        time_patterns = [
            r'\b(\d{1,2})\s*(?::|\.)\s*(\d{2})\s*(?:hours|hrs|h)?\b',  # 14:30, 2.30
            r'\b(\d{1,2})\s*(?::|\.)\s*(\d{2})\s*(am|pm)\b',  # 2:30 pm
            r'\b(\d{1,2})\s*(am|pm)\b',  # 2pm
            r'\b(morning|afternoon|evening)\b',  # morning, afternoon
            r'\b(\d{1,2})\s*o\'?clock\b'  # 2 o'clock
        ]

        # Extract days
        days = []
        for pattern in day_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                if pattern == r'\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b':
                    # Format date properly
                    for match in matches:
                        day, month = match
                        days.append(f"{day} {month}")
                else:
                    days.extend(matches)

        # Extract times
        times = []
        for pattern in time_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                if pattern == r'\b(morning|afternoon|evening)\b':
                    # Convert time of day to representative hours
                    time_map = {"morning": "9:00 AM", "afternoon": "2:00 PM", "evening": "6:00 PM"}
                    times.extend([time_map[m] for m in matches])
                elif pattern == r'\b(\d{1,2})\s*o\'?clock\b':
                    # Format o'clock times
                    for match in matches:
                        hour = match
                        # Assume AM for 8-11, PM for 12-7
                        ampm = "AM" if 8 <= int(hour) <= 11 else "PM"
                        times.append(f"{hour}:00 {ampm}")
                elif pattern == r'\b(\d{1,2})\s*(am|pm)\b':
                    # Format hour only times
                    for match in matches:
                        hour, ampm = match
                        times.append(f"{hour}:00 {ampm.upper()}")
                elif pattern == r'\b(\d{1,2})\s*(?::|\.)\s*(\d{2})\s*(am|pm)\b':
                    # Format standard times with AM/PM
                    for match in matches:
                        hour, minute, ampm = match
                        times.append(f"{hour}:{minute} {ampm.upper()}")
                else:
                    # Format 24-hour times
                    for match in matches:
                        hour, minute = match[0], match[1]
                        # Convert to 12-hour format
                        ampm = "AM" if int(hour) < 12 else "PM"
                        hour12 = str(int(hour) % 12)
                        hour12 = "12" if hour12 == "0" else hour12
                        times.append(f"{hour12}:{minute} {ampm}")

        # Combine into availability object
        availability = {}
        if days:
            availability["day"] = days[0]  # Take the first day mentioned
        if times:
            availability["time"] = times[0]  # Take the first time mentioned

        if availability:
            entities["availability"] = availability

    elif "interest" in question_context:
        # Enhanced notice period extraction with more patterns
        notice_patterns = [
            r'(\d+)\s*(day|days|week|weeks|month|months)',  # e.g., "2 months", "30 days"
            r'(one|two|three|four|five|six)\s*(day|days|week|weeks|month|months)',  # e.g., "two weeks"
            r'(immediate|immediately)',  # Immediate joining
            r'(\d+)\s*to\s*(\d+)\s*(day|days|week|weeks|month|months)'  # e.g., "2 to 3 months"
        ]

        # Try each pattern
        for pattern in notice_patterns:
            matches = re.findall(pattern, text)
            if matches:
                if pattern == r'(immediate|immediately)':
                    entities["notice_period"] = "Immediate"
                    break
                elif 'to' in pattern:
                    # Range pattern (e.g., "2 to 3 months")
                    start, end, unit = matches[0]
                    entities["notice_period"] = f"{start}-{end} {unit}"
                    break
                else:
                    # Standard pattern
                    number, unit = matches[0]

                    # Convert text numbers to digits if needed
                    number_map = {"one": "1", "two": "2", "three": "3", "four": "4", "five": "5", "six": "6"}
                    if number.lower() in number_map:
                        number = number_map[number.lower()]

                    entities["notice_period"] = f"{number} {unit}"
                    break

    elif "ctc" in question_context or "compensation" in question_context or "salary" in question_context:
        # Enhanced CTC extraction with currency and unit handling
        # Patterns for different formats
        ctc_patterns = [
            # Current CTC patterns
            r'current(?:\s*ctc)?\s*(?:is|of)?\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?',
            r'(?:i\s*(?:am|m)\s*(?:getting|earning|making))\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?',
            r'(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?\s*(?:per\s*annum|p\.?a\.?)?\s*(?:current|right now|at present)',

            # Expected CTC patterns
            r'expect(?:ed|ing)?(?:\s*ctc)?\s*(?:is|of)?\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?',
            r'looking\s*for\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?',
            r'(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(lakh|lakhs|lpa|k|L)?\s*(?:per\s*annum|p\.?a\.?)?\s*(?:expect|want|desired)'
        ]

        # Try to find current CTC
        current_ctc_found = False
        for i, pattern in enumerate(ctc_patterns[:3]):  # First 3 patterns are for current CTC
            matches = re.findall(pattern, text)
            if matches:
                value, unit = matches[0] if len(matches[0]) == 2 else (matches[0][0], '')
                entities["current_ctc"] = standardize_ctc_value(value, unit)
                current_ctc_found = True
                break

        # Try to find expected CTC
        expected_ctc_found = False
        for i, pattern in enumerate(ctc_patterns[3:]):  # Last 3 patterns are for expected CTC
            matches = re.findall(pattern, text)
            if matches:
                value, unit = matches[0] if len(matches[0]) == 2 else (matches[0][0], '')
                entities["expected_ctc"] = standardize_ctc_value(value, unit)
                expected_ctc_found = True
                break

        # If specific patterns don't match, try general approaches
        if not (current_ctc_found and expected_ctc_found):
            # Look for patterns like "X to Y" or "X and Y"
            range_pattern = r'(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lpa|k|L)?\s*(?:to|and)\s*(?:inr|rs|₹)?\s*(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lpa|k|L)?'
            range_matches = re.findall(range_pattern, text)

            if range_matches:
                if not current_ctc_found:
                    entities["current_ctc"] = standardize_ctc_value(range_matches[0][0], '')
                if not expected_ctc_found:
                    entities["expected_ctc"] = standardize_ctc_value(range_matches[0][1], '')
            else:
                # Just find all numbers and make an educated guess
                all_numbers = re.findall(r'(\d+(?:\.\d+)?)', text)
                if len(all_numbers) >= 2 and not (current_ctc_found or expected_ctc_found):
                    if not current_ctc_found:
                        entities["current_ctc"] = standardize_ctc_value(all_numbers[0], '')
                    if not expected_ctc_found:
                        entities["expected_ctc"] = standardize_ctc_value(all_numbers[1], '')
                elif len(all_numbers) == 1 and not current_ctc_found:
                    # If only one number, assume it's current CTC
                    entities["current_ctc"] = standardize_ctc_value(all_numbers[0], '')

    elif "available" in question_context or "interview" in question_context or "schedule" in question_context:
        # Enhanced date and time extraction
        # Day patterns
        day_patterns = [
            r'\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b',
            r'\b(mon|tue|tues|wed|thu|thur|thurs|fri|sat|sun)\b',
            r'\b(tomorrow|day after tomorrow|next week)\b',
            r'\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b'
        ]

        # Time patterns
        time_patterns = [
            r'\b(\d{1,2})\s*(?::|\.)\s*(\d{2})\s*(?:hours|hrs|h)?\b',  # 14:30, 2.30
            r'\b(\d{1,2})\s*(?::|\.)\s*(\d{2})\s*(am|pm)\b',  # 2:30 pm
            r'\b(\d{1,2})\s*(am|pm)\b',  # 2pm
            r'\b(morning|afternoon|evening)\b',  # morning, afternoon
            r'\b(\d{1,2})\s*o\'?clock\b'  # 2 o'clock
        ]

        # Extract days
        days = []
        for pattern in day_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                if pattern == r'\b(\d{1,2})(?:st|nd|rd|th)?\s*(?:of)?\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b':
                    # Format date properly
                    for match in matches:
                        day, month = match
                        days.append(f"{day} {month}")
                else:
                    days.extend(matches)

        # Extract times
        times = []
        for pattern in time_patterns:
            matches = re.findall(pattern, text.lower())
            if matches:
                if pattern == r'\b(morning|afternoon|evening)\b':
                    # Convert time of day to representative hours
                    time_map = {"morning": "9:00 AM", "afternoon": "2:00 PM", "evening": "6:00 PM"}
                    times.extend([time_map[m] for m in matches])
                elif pattern == r'\b(\d{1,2})\s*o\'?clock\b':
                    # Format o'clock times
                    for match in matches:
                        hour = match
                        # Assume AM for 8-11, PM for 12-7
                        ampm = "AM" if 8 <= int(hour) <= 11 else "PM"
                        times.append(f"{hour}:00 {ampm}")
                elif pattern == r'\b(\d{1,2})\s*(am|pm)\b':
                    # Format hour only times
                    for match in matches:
                        hour, ampm = match
                        times.append(f"{hour}:00 {ampm.upper()}")
                elif pattern == r'\b(\d{1,2})\s*(?::|\.)\s*(\d{2})\s*(am|pm)\b':
                    # Format standard times with AM/PM
                    for match in matches:
                        hour, minute, ampm = match
                        times.append(f"{hour}:{minute} {ampm.upper()}")
                else:
                    # Format 24-hour times
                    for match in matches:
                        hour, minute = match[0], match[1]
                        # Convert to 12-hour format
                        ampm = "AM" if int(hour) < 12 else "PM"
                        hour12 = str(int(hour) % 12)
                        hour12 = "12" if hour12 == "0" else hour12
                        times.append(f"{hour12}:{minute} {ampm}")

        # Combine into availability object
        availability = {}
        if days:
            availability["day"] = days[0]  # Take the first day mentioned
        if times:
            availability["time"] = times[0]  # Take the first time mentioned

        if availability:
            entities["availability"] = availability

    return entities

def standardize_ctc_value(value, unit):
    """Standardize CTC values to a consistent format"""
    try:
        value = float(value)

        # Apply unit multiplier if needed
        if unit and unit.lower() in ['lakh', 'lakhs', 'lpa', 'l']:
            # Convert to lakhs format
            return f"{value} LPA"
        elif unit and unit.lower() in ['k']:
            # Convert thousands to lakhs
            return f"{value/100} LPA"
        else:
            # Assume it's already in lakhs if no unit
            return f"{value} LPA"
    except ValueError:
        return value  # Return as is if conversion fails

@app.route('/process-speech', methods=['POST'])
def process_speech():
    """Process uploaded audio file, extract text and entities, and return results"""
    # Validate request
    if 'audio' not in request.files:
        print("No audio file in request")
        return jsonify({'error': 'No audio file provided'}), 400

    audio_file = request.files['audio']
    candidate_id = request.form.get('candidateId')
    question_context = request.form.get('questionContext', '')

    if not candidate_id:
        print("No candidate ID provided")
        return jsonify({'error': 'No candidate ID provided'}), 400

    print(f"Processing audio for candidate: {candidate_id}")
    print(f"Question context: {question_context}")
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

        # Extract entities
        entities = extract_entities(text, question_context)

        # Prepare payload for Node.js server
        node_url = 'http://localhost:3001/process-candidate-data'
        payload = {
            'candidateId': candidate_id,
            'text': text,
            'entities': entities,
            'processedAt': datetime.now().isoformat()
        }

        # Send to Node.js server
        print(f"Sending data to Node.js server: {node_url}")
        try:
            response = requests.post(node_url, json=payload, timeout=10)
            response.raise_for_status()
            print("Successfully sent data to Node.js server")
        except requests.exceptions.RequestException as e:
            print(f"Failed to send to Node.js server: {str(e)}")
            # Continue even if Node.js server is unavailable

        # Successful response
        return jsonify({
            'text': text,
            'entities': entities,
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

@app.route('/tts', methods=['POST'])
def text_to_speech():
    """Convert text to speech using the browser's built-in TTS or a fallback service"""
    data = request.json
    if not data or 'text' not in data:
        return jsonify({'error': 'No text provided'}), 400

    text = data['text']

    # For now, return a simple response - in a real implementation,
    # you would integrate with a TTS service or use pyttsx3
    return jsonify({
        'success': True,
        'message': 'Text-to-speech request received. Using browser TTS.'
    }), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'ffmpeg_available': ffmpeg_available,
        'date': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    print(f"Starting server on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)