import os
import re
import pickle
import nltk
import numpy as np
from flask import Flask, render_template, request, jsonify
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
 
# ── Download NLTK data (silent, in case train_model skipped) ─
nltk.download("stopwords", quiet=True)
nltk.download("wordnet",   quiet=True)
nltk.download("punkt",     quiet=True)
nltk.download("omw-1.4",   quiet=True)
 
# ── Initialise Flask ─────────────────────────────────────────
app = Flask(__name__)
 
# ── Load model artefacts ─────────────────────────────────────
MODEL_PATH      = "model.pkl"
VECTORIZER_PATH = "vectorizer.pkl"
 
def load_artefacts():
    """Load pickled model and vectorizer from disk."""
    if not os.path.exists(MODEL_PATH) or not os.path.exists(VECTORIZER_PATH):
        raise FileNotFoundError(
            "model.pkl or vectorizer.pkl not found. "
            "Please run: python train_model.py"
        )
    with open(MODEL_PATH,      "rb") as f:
        mdl = pickle.load(f)
    with open(VECTORIZER_PATH, "rb") as f:
        vec = pickle.load(f)
    return mdl, vec
 
try:
    model, vectorizer = load_artefacts()
    print("[✓] Model and vectorizer loaded successfully.")
except FileNotFoundError as e:
    model, vectorizer = None, None
    print(f"[!] WARNING: {e}")
 
# ── Text preprocessing (mirrors train_model.py) ──────────────
lemmatizer = WordNetLemmatizer()
stop_words  = set(stopwords.words("english"))
KEEP_WORDS  = {"not", "no", "never", "nor", "neither", "without"}
stop_words -= KEEP_WORDS
 
 
def preprocess_text(text: str) -> str:
    """Clean and normalise text before vectorisation."""
    text = str(text).lower()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)
    text = re.sub(r"<[^>]+>",               " ", text)
    text = re.sub(r"[^a-z\s]",              " ", text)
    text = re.sub(r"\s+",                   " ", text).strip()
 
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words]
    return " ".join(tokens)
 
 
# ── Sentiment metadata ────────────────────────────────────────
SENTIMENT_META = {
    "positive": {
        "emoji":   "😊",
        "color":   "green",
        "label":   "Positive",
        "message": "The text conveys a positive sentiment.",
    },
    "negative": {
        "emoji":   "😔",
        "color":   "red",
        "label":   "Negative",
        "message": "The text conveys a negative sentiment.",
    },
    "neutral": {
        "emoji":   "😐",
        "color":   "yellow",
        "label":   "Neutral",
        "message": "The text conveys a neutral sentiment.",
    },
}
 
 
# ── Routes ────────────────────────────────────────────────────
@app.route("/")
def index():
    """Serve the main HTML page."""
    return render_template("index.html")
 
 
@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts JSON: { "text": "..." }
    Returns JSON: {
        "sentiment": "positive|negative|neutral",
        "confidence": 0.0–100.0,
        "emoji": "...",
        "color": "...",
        "label": "...",
        "message": "..."
    }
    """
    # ── Validate model availability ───────────────────────────
    if model is None or vectorizer is None:
        return jsonify({
            "error": "Model not loaded. Run python train_model.py first."
        }), 503
 
    # ── Parse request body ────────────────────────────────────
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body."}), 400
 
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "Please provide non-empty text."}), 400
    if len(text) > 5_000:
        return jsonify({"error": "Text is too long (max 5 000 characters)."}), 400
 
    # ── Predict ───────────────────────────────────────────────
    cleaned      = preprocess_text(text)
    features     = vectorizer.transform([cleaned])
    sentiment    = model.predict(features)[0]
    proba        = model.predict_proba(features)[0]
    confidence   = float(np.max(proba)) * 100
 
    # Build per-class probability breakdown
    classes      = list(model.classes_)
    breakdown    = {cls: round(float(p) * 100, 1)
                    for cls, p in zip(classes, proba)}
 
    meta = SENTIMENT_META.get(sentiment, SENTIMENT_META["neutral"])
 
    return jsonify({
        "sentiment":  sentiment,
        "confidence": round(confidence, 1),
        "emoji":      meta["emoji"],
        "color":      meta["color"],
        "label":      meta["label"],
        "message":    meta["message"],
        "breakdown":  breakdown,
        "word_count": len(text.split()),
    })
 
 
@app.route("/health")
def health():
    """Simple health-check endpoint."""
    return jsonify({
        "status":       "ok",
        "model_loaded": model is not None,
    })
 
 
# ── Entry point ───────────────────────────────────────────────
if __name__ == "__main__":
    app.run(debug=True, port=5000)