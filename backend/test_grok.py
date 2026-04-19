#!/usr/bin/env python
import os
import sys

from openai import OpenAI as XAIClient


def extract_output_text(response):
    output_text = getattr(response, 'output_text', None)
    if isinstance(output_text, str) and output_text.strip():
        return output_text.strip()

    chunks = []
    for item in getattr(response, 'output', []) or []:
        for content in getattr(item, 'content', []) or []:
            if getattr(content, 'type', None) == 'output_text' and getattr(content, 'text', None):
                chunks.append(content.text.strip())
    return "\n".join(chunks).strip()


def main():
    api_key = os.getenv('XAI_API_KEY', '').strip()
    model = os.getenv('XAI_MODEL', 'grok-3-mini')
    base_url = os.getenv('XAI_API_BASE', 'https://api.x.ai/v1').rstrip('/')

    if not api_key:
        print("XAI_API_KEY est manquante. Definis-la dans l'environnement avant le test.")
        raise SystemExit(1)

    print(f"Test de connexion a Grok sur {base_url} avec le modele {model}...")

    client = XAIClient(
        api_key=api_key,
        base_url=base_url,
        timeout=30.0,
    )

    response = client.responses.create(
        model=model,
        input=[
            {
                'role': 'system',
                'content': "Tu es O+, un conseiller d'orientation universitaire beninois.",
            },
            {
                'role': 'user',
                'content': "Dis bonjour a un etudiant beninois en une phrase.",
            },
        ],
        store=False,
    )

    text = extract_output_text(response)
    if not text:
        print("La reponse xAI ne contient aucun texte exploitable.")
        raise SystemExit(1)

    print("Succes. Reponse :")
    print(text)


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f"Erreur pendant le test Grok : {exc}")
        raise SystemExit(1) from exc
