#!/usr/bin/env python
import os
from openai import OpenAI

# Ta clé API (à régénérer car elle a été exposée)
API_KEY = "xai-ta-nouvelle-cle-ici"

print("🔍 Test de connexion à Grok...")

client = OpenAI(
    api_key=API_KEY,
    base_url="https://api.x.ai/v1",
)

try:
    response = client.chat.completions.create(
        model="grok-beta",
        messages=[
            {"role": "user", "content": "Dis bonjour à un étudiant béninois en une phrase"}
        ],
        max_tokens=100,
    )
    print("✅ Succès! Réponse:", response.choices[0].message.content)
except Exception as e:
    print("❌ Erreur:", e)