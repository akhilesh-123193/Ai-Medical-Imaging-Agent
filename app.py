# app.py
import os
import io
import base64
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from PIL import Image

# Import API key from config.py
from config import GOOGLE_API_KEY

app = Flask(__name__)

# Configure Gemini API
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize the Gemini Vision model
model = genai.GenerativeModel('gemini-1.5-flash')

# --- Helper Function for Image Processing ---
def load_image_from_bytes(image_bytes):
    """
    Loads an image from bytes data.
    Args:
        image_bytes: Bytes object of the image.
    Returns:
        PIL.Image.Image object.
    """
    try:
        image = Image.open(io.BytesIO(image_bytes))
        # Ensure image is in RGB format if it's not (e.g., RGBA from PNGs)
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return image
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

def validate_image_file(file):
    """
    Validates uploaded image file.
    """
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    max_size = 10 * 1024 * 1024  # 10MB
    
    if not file or file.filename == '':
        return False, "No file selected"
    
    # Check file extension
    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if file_ext not in allowed_extensions:
        return False, f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
    
    # Check file size (approximate)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)  # Reset file pointer
    
    if file_size > max_size:
        return False, "File too large. Maximum size: 10MB"
    
    return True, "Valid"

# --- Flask Routes ---

@app.route('/')
def index():
    """Renders the main upload form."""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_medical_image():
    """
    Handles the image and text analysis request.
    """
    if 'medicalImage' not in request.files:
        return jsonify({"error": "No image file provided"}), 400

    image_file = request.files['medicalImage']
    patient_history = request.form.get('patientHistory', '').strip()
    referral_notes = request.form.get('referralNotes', '').strip()

    # Validate image file
    is_valid, validation_message = validate_image_file(image_file)
    if not is_valid:
        return jsonify({"error": validation_message}), 400

    try:
        image_bytes = image_file.read()
        image = load_image_from_bytes(image_bytes)

        if not image:
            return jsonify({"error": "Could not process image file"}), 400

        # --- Construct the Multimodal Prompt ---
        base_prompt = """You are a highly skilled medical imaging expert with extensive knowledge in radiology and diagnostic imaging. Analyze the medical image and structure your response as follows:

### 1. Image Type & Region
- Identify imaging modality (X-ray/MRI/CT/Ultrasound/etc.).
- Specify anatomical region and positioning.
- Evaluate image quality and technical adequacy.

### 2. Key Findings
- Highlight primary observations systematically.
- Identify potential abnormalities with detailed descriptions.
- Include measurements and densities where relevant.

### 3. Diagnostic Assessment
- Provide primary diagnosis with confidence level.
- List differential diagnoses ranked by likelihood.
- Support each diagnosis with observed evidence.
- Highlight critical/urgent findings.

### 4. Patient-Friendly Explanation
- Simplify findings in clear, non-technical language.
- Avoid medical jargon or provide easy definitions.
- Include relatable visual analogies.

### 5. Clinical Recommendations
- Suggest follow-up imaging or tests if needed.
- Recommend consultation with specialists.
- Provide general treatment considerations.

### 6. Visual Annotation Points & Clinical Importance (Textual Description)
- **Location 1:** [Describe the exact location of a key finding, e.g., 'Mid-shaft of the left femur']
    - **Clinical Importance:** [Explain the significance of this specific location, e.g., 'Common site for stress fractures in athletes, or typical location for primary bone tumors.']
- **Location 2:** [If applicable, describe another key location]
    - **Clinical Importance:** [Its significance]
- If no specific 'points' are obvious for visual annotation, state 'No specific discrete points for visual annotation.'

**IMPORTANT DISCLAIMER**: This analysis is for educational purposes only and should not replace professional medical diagnosis or treatment. Always consult with qualified healthcare professionals for medical decisions.

Ensure a structured and medically accurate response using clear markdown formatting."""

        # Add patient context if provided
        if patient_history or referral_notes:
            context_info = "\n\n### Additional Patient Information:\n"
            if patient_history:
                context_info += f"**Patient History**: {patient_history}\n"
            if referral_notes:
                context_info += f"**Referral Notes**: {referral_notes}\n"
            context_info += "\nPlease consider this information in your analysis.\n"
            base_prompt = context_info + base_prompt

        # Create prompt parts with image and text
        prompt_parts = [base_prompt, image]

        # Generate content using the Gemini model
        response = model.generate_content(prompt_parts)

        # Access the generated text
        ai_analysis_text = response.text

        return jsonify({
            "success": True,
            "aiAnalysis": ai_analysis_text,
            "imagePreview": base64.b64encode(image_bytes).decode('utf-8'),
            "patientHistory": patient_history,
            "referralNotes": referral_notes
        })

    except Exception as e:
        print(f"An error occurred: {e}")
        return jsonify({"error": f"An error occurred during analysis: {str(e)}"}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File too large"}), 413

if __name__ == '__main__':
    app.run(debug=True)  # debug=True is for development, set to False in production