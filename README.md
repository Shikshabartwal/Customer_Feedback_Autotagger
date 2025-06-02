# Customer_Feedback_Autotagger
This is  web application that automatically classifies customer feedback into predefined tags using a machine learning model (Logistic Regression with TF-IDF). It includes data analysis, model training, a Flask backend API, and a simple HTML/CSS/JavaScript frontend.

1. Clone the Repo

```bash
git clone https://github.com/your-shiksha/customer-feedback-auto-tagger.git
cd customer-feedback-auto-tagger

cd backend
pip install -r requirements.txt
python app.py

cd frontend
python -m http.server 8000
