from flask import Flask, request, jsonify
from flask_cors import CORS
from textblob import TextBlob
import joblib
import re
import string
import nltk
import os
import csv
from datetime import datetime
import pandas as pd

# NLTK setup
nltk.download('stopwords')
nltk.download('wordnet')
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

app = Flask(__name__)
CORS(app)

# Load models and tools
model = joblib.load('model.pkl')
mlb = joblib.load('mlb.pkl')
vectorizer = joblib.load('vectorizer.pkl')

lemmatizer = WordNetLemmatizer()
stop_words = set(stopwords.words('english'))
DATA_PATH = os.path.join('data', 'reviews.csv')

# Clean text function
def clean_text(text):
    text = text.lower()
    text = re.sub(f"[{re.escape(string.punctuation)}]", "", text)
    tokens = [lemmatizer.lemmatize(w) for w in text.split() if w not in stop_words]
    return " ".join(tokens)

# Predict route
@app.route('/predict', methods=['POST'])
def predict():
    data = request.json
    if not data or 'review' not in data:
        return jsonify({'error': 'Invalid input'}), 400

    review = data['review']
    cleaned = clean_text(review)
    transformed = vectorizer.transform([cleaned])
    pred = model.predict(transformed)
    tags = [tag for tag, val in zip(mlb.classes_, pred[0]) if val == 1]

    # Sentiment analysis
    blob = TextBlob(review)
    polarity = blob.sentiment.polarity
    if polarity > 0.2:
        sentiment = "positive"
    elif polarity < -0.2:
        sentiment = "negative"
    else:
        sentiment = "neutral"

    score = len(tags) / len(mlb.classes_) if mlb.classes_.size else 0

    # Store in CSV
    os.makedirs('data', exist_ok=True)
    with open(DATA_PATH, 'a', newline='', encoding='utf-8') as file:
        writer = csv.writer(file)
        if file.tell() == 0:
            writer.writerow(['timestamp', 'feedback', 'tags', 'sentiment', 'score'])
        writer.writerow([datetime.now().isoformat(), review, ', '.join(tags), sentiment, round(score, 2)])

    return jsonify({
        'tags': tags,
        'sentiment': sentiment,
        'score': round(score, 2)
    })

# Analytics route
@app.route('/analytics', methods=['GET'])
def analytics():
    if not os.path.exists(DATA_PATH):
        return jsonify({'error': 'No data available'}), 404

    df = pd.read_csv(DATA_PATH)

    from collections import Counter
    tag_counts = Counter(tag for row in df['tags'].dropna() for tag in row.split(', '))
    sentiment_counts = df['sentiment'].value_counts().to_dict()

    return jsonify({
        'tag_counts': dict(tag_counts),
        'sentiment_counts': sentiment_counts
    })

if __name__ == '__main__':
    app.run(debug=True)
