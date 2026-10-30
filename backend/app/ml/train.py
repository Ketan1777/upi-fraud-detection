import os
import sys
import pandas as pd
import numpy as np

# Ensure path resolution
BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../"))
DATASET_PATH = os.path.join(BASE_DIR, "dataset/transactions.csv")
MODEL_DIR = os.path.join(BASE_DIR, "ml_models")
MODEL_OUTPUT_PATH = os.path.join(MODEL_DIR, "fraud_model.pkl")


def train():
    print("=" * 60)
    print("UPI Fraud Detection AI Engine - Model Training Pipeline")
    print("=" * 60)

    # Check if dataset exists, if not generate it
    if not os.path.exists(DATASET_PATH):
        print(f"Dataset not found at {DATASET_PATH}. Generating synthetic dataset...")
        sys.path.append(BASE_DIR)
        from dataset.generate_dataset import generate_dataset
        generate_dataset(1500)

    print(f"Loading transaction dataset from: {DATASET_PATH}")
    df = pd.read_csv(DATASET_PATH)
    print(f"Total Transactions: {len(df)}")
    print(f"Legitimate Transactions: {(df['fraud_label'] == 0).sum()}")
    print(f"Fraudulent Transactions: {(df['fraud_label'] == 1).sum()}")

    # Feature definitions
    feature_cols = [
        "amount",
        "hour_of_day",
        "txns_last_5m",
        "amt_to_avg_ratio",
        "is_new_receiver",
        "receiver_fan_in_1h",
        "is_emulator",
        "seconds_since_last",
    ]

    X = df[feature_cols]
    y = df["fraud_label"]

    try:
        from sklearn.model_selection import train_test_split
        from sklearn.ensemble import RandomForestClassifier, IsolationForest
        from sklearn.metrics import classification_report, roc_auc_score
        import joblib

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.25, random_state=42, stratify=y
        )

        print("\nTraining Random Forest Classifier...")
        rf = RandomForestClassifier(
            n_estimators=100,
            max_depth=8,
            class_weight="balanced",
            random_state=42,
            n_jobs=-1
        )
        rf.fit(X_train, y_train)

        # Isolation Forest for zero-day / unseen outlier detection
        print("Fitting Isolation Forest Anomaly Detector...")
        iso_forest = IsolationForest(
            n_estimators=100,
            contamination=0.15,
            random_state=42
        )
        iso_forest.fit(X_train[y_train == 0])

        # Evaluate Random Forest
        y_pred = rf.predict(X_test)
        y_prob = rf.predict_proba(X_test)[:, 1]

        auc = roc_auc_score(y_test, y_prob)
        print("\n" + "-" * 50)
        print("Model Performance Evaluation:")
        print("-" * 50)
        print(f"ROC-AUC Score: {auc:.4f}")
        print("\nClassification Report:")
        print(classification_report(y_test, y_pred, target_names=["SAFE", "FRAUD"]))

        # Feature importances
        importances = pd.Series(rf.feature_importances_, index=feature_cols).sort_values(ascending=False)
        print("Feature Importance Ranking:")
        for feat, val in importances.items():
            print(f"  - {feat:20s}: {val:.4f}")

        # Save model
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(rf, MODEL_OUTPUT_PATH)
        print(f"\n[SUCCESS] Model artifact saved to: {MODEL_OUTPUT_PATH}")

    except ImportError:
        print("[Notice] scikit-learn or joblib not installed in current environment.")
        print("The backend includes a fully functional calibrated fallback engine.")


if __name__ == "__main__":
    train()
