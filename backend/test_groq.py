#!/usr/bin/env python
import os

from openai import OpenAI


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
    api_key = os.getenv('GROQ_API_KEY', '').strip()
    model = os.getenv('GROQ_MODEL', 'llama-3.1-8b-instant')
    base_url = os.getenv('GROQ_API_BASE', 'https://api.groq.com/openai/v1').rstrip('/')

    if not api_key:
        print("GROQ_API_KEY est manquante. Definis-la dans l'environnement avant le test.")
        raise SystemExit(1)

    print(f"Test de connexion a Groq sur {base_url} avec le modele {model}...")

    client = OpenAI(
        api_key=api_key,
        base_url=base_url,
        timeout=30.0,
    )

    completion = client.chat.completions.create(
        model=model,
        messages=[
            {
                'role': 'system',
                'content': "Tu es O+, un conseiller d'orientation universitaire et post-bac au Benin.",
            },
            {
                'role': 'user',
                'content': "Dis bonjour a un etudiant beninois en une phrase.",
            },
        ],
        max_tokens=80,
        temperature=0.4,
    )

    text = extract_output_text(completion) or getattr(completion.choices[0].message, 'content', '').strip()
    if not text:
        print("La reponse Groq ne contient aucun texte exploitable.")
        raise SystemExit(1)

    print("Succes. Reponse :")
    print(text)


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        print(f"Erreur pendant le test Groq : {exc}")
        raise SystemExit(1) from exc
