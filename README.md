#   MediScan AI: AI-Powered Medical Imaging Agent </i>
<p align="center">
</p>

## ✨ Overview

MediScan AI is a cutting-edge web application designed to empower healthcare professionals with rapid and insightful medical image analysis using artificial intelligence. At its core, MediScan AI leverages the advanced capabilities of **Google Gemini AI** to interpret various medical scans (e.g., X-rays, MRI, CT scans, Ultrasound), providing detailed textual descriptions and preliminary diagnostic assessments.

This platform offers a straightforward and efficient user experience, allowing users to upload images and receive immediate AI-driven insights. For convenience, a history of analyses is maintained client-side in the user's browser during their session.

## 🚀 Features

*   **AI-Powered Medical Image Analysis**: Upload diverse medical images (X-rays, MRI, CT scans, Ultrasound) and receive comprehensive AI-generated textual analyses.
*   **Intuitive User Interface**: A clean, responsive, and user-friendly design ensures a smooth and efficient workflow.
*   **Client-Side Session History**: Temporarily saves your analysis history directly in your browser's local storage, allowing easy revisiting of recent scans during your session.
*   **Detailed Analysis Display**: Presents the uploaded image, patient context (history, referral notes), and the AI's structured interpretation in a clear, side-by-side format.

## 🌟 Technologies Used

### Frontend:

*   **HTML5**: Provides the structural foundation of the web pages.
*   **CSS3**: Handles the aesthetic styling and responsive design for various devices.
*   **JavaScript**: Powers client-side interactivity, form handling, and dynamic content updates.

### Backend:

*   **Python 3**: The primary programming language for server-side logic.
*   **Flask**: A lightweight and powerful Python web framework facilitating rapid development.
*   **Google Gemini API**: The backbone for advanced AI image recognition and natural language generation.
*   **python-dotenv**: Used for secure and convenient management of environment variables (like API keys) during development.
*   **Pillow (PIL Fork)**: Essential for robust image processing, including opening, converting, and manipulating image files.
*   **Base64**: Employed for efficient encoding and decoding of image data for web transfer.
*   **JSON**: The standard format for data interchange between the frontend and backend API.

## ⚙️ Installation & Setup

To get MediScan AI running on your local machine, follow these steps:

### Prerequisites

*   Python 3.8 or higher
*   `pip` (Python package installer, usually comes with Python)
*   `Git`

### 1. Clone the Repository

Start by cloning the project repository from GitHub:

```bash
git clone https://github.com/akhilesh-123193/Ai-Medical-Imaging-Agent.git
cd Ai-Medical-Imaging-Agent
```

### 2. Create a Virtual Environment

It is highly recommended to use a virtual environment to isolate project dependencies:

```bash
python -m venv venv
# On Windows:
# .\venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

Install all necessary Python packages listed in `requirements.txt`:

```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables

Create a file named `.env` in the root directory of your project (where `app.py` is located). This file will store your sensitive API key. **Crucially, do NOT commit this file to your public Git repository!**

```ini
GOOGLE_API_KEY="YOUR_GEMINI_API_KEY_HERE"
```

*   Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual Google Gemini API key obtained from the [Google Cloud Console](https://console.cloud.google.com/vertex-ai).

**Important**: Ensure `.env` is explicitly listed in your `.gitignore` file to prevent accidental version control.

### 5. Run the Application

Once everything is set up, you can launch the Flask application:

```bash
flask run
```

The application will typically be accessible in your web browser at [http://127.0.0.1:5000/](http://127.0.0.1:5000/).



## Screenshots

![Screenshot from 2025-06-11 17-36-01](https://github.com/user-attachments/assets/bdfa5ea7-358c-44a7-94e5-7440ee622e4a)                    ![Screenshot from 2025-06-11 17-29-36](https://github.com/user-attachments/assets/85b99b4b-0c4a-4d6d-beac-183575ee3284)                                                                        



## 🤝 Contributing

We welcome contributions to enhance MediScan AI! If you have suggestions for improvements, new features, or bug fixes, please consider:

1.  **Forking** the repository.
2.  Creating a new branch (`git checkout -b feature/your-feature-name`).
3.  Making your changes, ensuring code quality and any existing functionality.
4.  Commit your changes with a descriptive message (`git commit -m 'Add new feature X'` or `'Fix bug Y'`).
5.  Push your branch to your forked repository (`git push origin feature/your-feature-name`).
6.  Opening a **Pull Request** to the main repository.


## 📜 License

This project is distributed under the MIT License. See the [LICENSE](LICENSE) file in the repository for more details.

## 📧 Contact

Akhilesh Phadnis - akhilesh135910@gmail.com

Project Link: [https://github.com/akhilesh-123193/Ai-Medical-Imaging-Agent](https://github.com/akhilesh-123193/Ai-Medical-Imaging-Agent)
