from flask import Flask, request, jsonify
import cv2
import pytesseract
import os
import secrets
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  
# Set Tesseract Path
pytesseract.pytesseract.tesseract_cmd = r'/opt/homebrew/bin/tesseract'

@app.route("/upload", methods=["POST"])
def upload():
    if 'file' not in request.files:
        return jsonify({"error": "No file provided"}), 400

    f = request.files['file']
    filename, extension = f.filename.rsplit(".", 1)
    generated_filename = secrets.token_hex(10) + f".{extension}"
    file_location = os.path.join("/tmp", generated_filename)

    # Save uploaded file
    f.save(file_location)

    try:
        # Read and process image
        img = cv2.imread(file_location)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Perform OCR
        extracted_text = pytesseract.image_to_string(img).strip()
        print(extracted_text)
        return extracted_text  # Return only extracted text
    except Exception as e:
        return jsonify({"error": f"OCR Error: {str(e)}"}), 500
    finally:
        os.remove(file_location)

if __name__ == "__main__":
    app.run(debug=True,port=2000)
