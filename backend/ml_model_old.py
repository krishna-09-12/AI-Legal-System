from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import joblib

def train_model():
    texts = [
        "theft of mobile phone",
        "hit and run accident",
        "online financial fraud",
        "physical assault and beating",
        "cheating in property deal"
    ]

    labels = [
        "IPC 379",
        "IPC 279",
        "IPC 420",
        "IPC 323",
        "IPC 420"
    ]

    vectorizer = TfidfVectorizer()
    X = vectorizer.fit_transform(texts)

    model = LogisticRegression()
    model.fit(X, labels)

    joblib.dump((model, vectorizer), "model.pkl")
    print("Model saved successfully")

if __name__ == "__main__":
    train_model()