import pandas as pd
import numpy as np
import pickle
import os
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix
)
 
# ── 1. Download required NLTK data ───────────────────────────
print("=" * 60)
print("  SENTIMENT ANALYSIS – MODEL TRAINING")
print("=" * 60)
print("\n[1/6] Downloading NLTK resources...")
 
nltk.download("stopwords",   quiet=True)
nltk.download("wordnet",     quiet=True)
nltk.download("punkt",       quiet=True)
nltk.download("omw-1.4",     quiet=True)
 
print("      ✓  NLTK resources ready.")
 
 
# ── 2. Load dataset ──────────────────────────────────────────
DATASET_PATH = os.path.join("dataset", "sentiment_dataset.csv")
 
print(f"\n[2/6] Loading dataset from '{DATASET_PATH}'...")
df = pd.read_csv(DATASET_PATH)
print(f"      ✓  Loaded {len(df)} records.")
print(f"      Distribution:\n{df['sentiment'].value_counts().to_string()}")
 
 
# ── 3. Text preprocessing ────────────────────────────────────
print("\n[3/6] Preprocessing text data...")
 
lemmatizer   = WordNetLemmatizer()
stop_words   = set(stopwords.words("english"))
 
# Keep negation words so they don't get stripped out
KEEP_WORDS = {"not", "no", "never", "nor", "neither", "without"}
stop_words -= KEEP_WORDS
 
 
def preprocess_text(text: str) -> str:
    """
    Clean and normalise raw text:
      • lower-case
      • remove URLs, HTML tags, special characters
      • tokenise
      • remove stopwords (but keep negations)
      • lemmatise
    """
    text = str(text).lower()
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)   # strip URLs
    text = re.sub(r"<[^>]+>", " ", text)                  # strip HTML
    text = re.sub(r"[^a-z\s]", " ", text)                 # keep letters only
    text = re.sub(r"\s+", " ", text).strip()               # collapse whitespace
 
    tokens = text.split()
    tokens = [lemmatizer.lemmatize(t) for t in tokens if t not in stop_words]
    return " ".join(tokens)
 
 
df["cleaned_text"] = df["text"].apply(preprocess_text)
print(f"      ✓  Preprocessing complete.")
 
 
# ── 4. Feature extraction with TF-IDF ───────────────────────
print("\n[4/6] Extracting TF-IDF features...")
 
vectorizer = TfidfVectorizer(
    max_features=10_000,
    ngram_range=(1, 2),       # unigrams + bigrams
    min_df=1,
    max_df=0.95,
    sublinear_tf=True         # apply log normalisation
)
 
X = vectorizer.fit_transform(df["cleaned_text"])
y = df["sentiment"]
 
print(f"      ✓  Feature matrix shape: {X.shape}")
 
 
# ── 5. Train / evaluate model ────────────────────────────────
print("\n[5/6] Training Logistic Regression classifier...")
 
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.20, random_state=42, stratify=y
)
 
model = MultinomialNB()
model.fit(X_train, y_train)
 
# Evaluation
y_pred   = model.predict(X_test)
accuracy = accuracy_score(y_test, y_pred)
 
print(f"      ✓  Training complete.")
print(f"\n      Test Accuracy : {accuracy * 100:.2f}%")
print(f"\n      Classification Report:")
print(classification_report(y_test, y_pred, zero_division=0))
 
 
# ── 6. Save artefacts ────────────────────────────────────────
print("[6/6] Saving model artefacts...")
 
with open("model.pkl", "wb") as f:
    pickle.dump(model, f)
 
with open("vectorizer.pkl", "wb") as f:
    pickle.dump(vectorizer, f)
 
print("      ✓  model.pkl      saved.")
print("      ✓  vectorizer.pkl saved.")
 
print("\n" + "=" * 60)
print("  Training finished – ready to run app.py!")
print("=" * 60 + "\n")