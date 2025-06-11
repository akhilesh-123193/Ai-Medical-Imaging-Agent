import os
import io
import base64
from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
from PIL import Image
from dotenv import load_dotenv

# Load environment variables from .env file (for local development)
load_dotenv()

# --- Configuration ---
# Get API key from environment variables (important for Vercel deployment too)
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')

if not GOOGLE_API_KEY:
    raise ValueError("GOOGLE_API_KEY not found in environment variables. Please set it in .env or your Vercel settings.")

app = Flask(__name__)
# Flask's secret key is recommended for session management, even if not explicitly used for user sessions.
# Get it from environment variable, provide a fallback for dev if needed, but use a strong one in prod.
app.secret_key = os.getenv('FLASK_SECRET_KEY', 'a_very_secret_key_for_dev_only_replace_in_prod')

# Configure Gemini API
genai.configure(api_key=GOOGLE_API_KEY)

# Initialize the Gemini Vision model
model = genai.GenerativeModel('gemini-1.5-flash')

# --- Helper Functions ---
def load_image_from_bytes(image_bytes):
    """Loads an image from bytes, converts to RGB if necessary."""
    try:
        image = Image.open(io.BytesIO(image_bytes))
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return image
    except Exception as e:
        print(f"Error loading image: {e}")
        return None

def validate_image_file(file):
    """Validates the uploaded image file (type and size)."""
    allowed_extensions = {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'}
    max_size = 10 * 1024 * 1024  # 10MB

    if not file or file.filename == '':
        return False, "No file selected."

    file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    if file_ext not in allowed_extensions:
        return False, f"Invalid file type. Allowed: {', '.join(allowed_extensions)}."

    # Check file size without loading entire file into memory (seek/tell)
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0) # Reset file pointer to the beginning

    if file_size > max_size:
        return False, "File too large. Maximum size: 10MB."

    return True, "Valid"

# --- Flask Routes ---

@app.route('/')
def index():
    """Renders the main application page."""
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_medical_image():
    """
    Handles the image and text analysis request.
    Receives an image file and optional patient context,
    sends to Gemini AI, and returns the analysis.
    """
    if 'medicalImage' not in request.files:
        return jsonify({"error": "No image file provided."}), 400

    image_file = request.files['medicalImage']
    patient_history = request.form.get('patientHistory', '').strip()
    referral_notes = request.form.get('referralNotes', '').strip()

    is_valid, validation_message = validate_image_file(image_file)
    if not is_valid:
        return jsonify({"error": validation_message}), 400

    try:
        image_bytes = image_file.read() # Read image into bytes
        image = load_image_from_bytes(image_bytes)

        if not image:
            return jsonify({"error": "Could not process image file."}), 400

        # Construct the prompt for Gemini AI
        base_prompt = """You are a highly skilled medical imaging expert with extensive knowledge in radiology, pathology, and clinical diagnostics. Your task is to provide a comprehensive analysis of the provided medical image.
Please structure your response clearly and concisely, focusing on clinical relevance and potential diagnostic implications.

Your analysis MUST include the following sections, using the exact headings:

### 1. Image Modality & Orientation
- Identify the modality (e.g., X-ray, CT, MRI, Ultrasound) and describe any visible orientation markers (e.g., 'R' for right).

### 2. Overall Assessment
- Provide a general overview of the image quality and any immediate significant findings.

### 3. Diagnostic Assessment
- Based on the image and provided context, what are the most likely diagnoses or conditions?
- List differential diagnoses in order of probability, if appropriate.
- Provide a brief rationale for each.

### 4. Key Visual Findings & Description
- Detail all significant visual abnormalities or features observed in the image.
- Describe their location, size, morphology, and characteristics.
- Use precise medical terminology.

### 5. Clinical Correlation
- How do the imaging findings correlate with the provided patient history and referral notes?
- Discuss any discrepancies or consistencies.

### 6. Visual Annotation Points & Clinical Importance (Textual Description)
- Describe specific, discrete points or regions in the image that are key to your findings.
- For each point, explain its clinical importance and what it suggests.
- Example:
    - **Location 1 (Upper Right Lung Field):** Diffuse reticular opacities.
    - **Clinical Importance:** Suggestive of interstitial lung disease or atypical pneumonia.

### 7. Recommendations & Next Steps
- Based on your analysis, what further imaging, laboratory tests, or clinical evaluations are recommended?
- Suggest potential management strategies or specialist consultations.

### 8. Disclaimer
- State clearly that this AI analysis is for informational purposes only and should not replace professional medical judgment or formal radiological interpretation.

---
"""

        # Add patient history and referral notes if provided
        if patient_history or referral_notes:
            context_info = "\n\n### Additional Patient Information:\n"
            if patient_history:
                context_info += f"**Patient History**: {patient_history}\n"
            if referral_notes:
                context_info += f"**Referral Notes**: {referral_notes}\n"
            context_info += "\nPlease consider this information in your analysis.\n"
            base_prompt = context_info + base_prompt

        prompt_parts = [base_prompt, image]

        # Generate content from Gemini AI
        response = model.generate_content(prompt_parts)

        ai_analysis_text = response.text

        # Return JSON response, including the base64 encoded image for preview
        return jsonify({
            "success": True,
            "aiAnalysis": ai_analysis_text,
            "imagePreview": base64.b64encode(image_bytes).decode('utf-8'), # Send image back for client-side preview
            "patientHistory": patient_history, # Also send back for history display
            "referralNotes": referral_notes    # Also send back for history display
        })

    except Exception as e:
        print(f"An error occurred: {e}")
        # Return a more detailed error for debugging if needed, but keep it general for users
        return jsonify({"error": f"An error occurred during analysis: {str(e)}"}), 500

# Error handler for large files (Flask's default limit)
@app.errorhandler(413)
def too_large(e):
    return jsonify({"error": "File too large. Maximum size is 10MB."}), 413

# This block is for local development only. Vercel will run the 'app' instance directly.
# Remove or comment out when deploying to Vercel.
# if __name__ == '__main__':
#     app.run(debug=True)