import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firebase():
    # Ensure the Firebase service account key file "serviceAccountKey.json" is in the backend folder.
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    return db

db = initialize_firebase()
