# ORIENTA+

Plateforme d'orientation universitaire pour les bacheliers beninois.

ORIENTA+ combine :
- un backend Django REST pour les donnees, suggestions et endpoints admin,
- un frontend React/Vite pour l'experience utilisateur,
- une integration xAI/Grok pour le chatbot O+.

## Stack technique

| Couche | Technologie |
| --- | --- |
| Backend | Django 4.2, Django REST Framework, SimpleJWT |
| Base de donnees | PostgreSQL |
| Frontend | React 18, Vite, Tailwind CSS |
| IA | xAI Grok via SDK OpenAI-compatible |

## Structure du projet

```text
orienta_plus/
|-- backend/
|   |-- orienta_backend/      # Settings Django, urls, wsgi
|   |-- orienta/              # Models, serializers, views, algo, chatbot
|   |-- .env.example
|   |-- manage.py
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |-- pages/
|   |   `-- api/
|   |-- .env.example
|   `-- package.json
|-- scripts/
`-- README.md
```

## Fonctions principales

- Simulation d'orientation selon la serie et les notes.
- Consultation des filieres, universites et seuils.
- Espace admin securise par JWT.
- Chatbot O+ branche sur Grok avec fallback hors ligne si xAI est indisponible.
- Envoi des resultats par email ou WhatsApp selon la configuration.

## Installation

### 1. Prerequis

- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 2. Base de donnees

```sql
CREATE DATABASE orienta;
CREATE USER orienta_user WITH PASSWORD 'change-me';
GRANT ALL PRIVILEGES ON DATABASE orienta TO orienta_user;
```

### 3. Backend Django

```bash
cd backend

python -m venv .venv
```

Activation de l'environnement :

```bash
# Windows PowerShell
.venv\Scripts\Activate.ps1

# macOS / Linux
source .venv/bin/activate
```

Installation et configuration :

```bash
pip install -r requirements.txt
```

Copie du fichier d'environnement :

```bash
# Windows PowerShell
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Variables minimales a renseigner dans `backend/.env` :

```env
DB_NAME=orienta
DB_USER=orienta_user
DB_PASSWORD=change-me
DB_HOST=localhost
DB_PORT=5432

XAI_API_KEY=xai-votre-cle-ici
XAI_API_BASE=https://api.x.ai/v1
XAI_MODEL=grok-3-mini
```

Lancement :

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

### 4. Frontend React

```bash
cd frontend
npm install
```

Copie du fichier d'environnement :

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# macOS / Linux
cp .env.example .env.local
```

Puis lancer le front :

```bash
npm run dev
```

Par defaut, `VITE_API_URL` peut rester vide en developpement si le proxy Vite est utilise.

## Integration IA Grok

L'integration du chatbot utilise maintenant une configuration xAI coherente sur tout le projet :

- `XAI_API_KEY` pour la cle API.
- `XAI_API_BASE` pour l'endpoint xAI, par defaut `https://api.x.ai/v1`.
- `XAI_MODEL` pour choisir le modele, par defaut `grok-3-mini`.
- `XAI_USE_RESPONSES_API=True` pour privilegier la Responses API.
- fallback automatique vers `chat.completions` si necessaire.
- fallback hors ligne si la cle manque ou si xAI est temporairement indisponible.

Le service central du chatbot se trouve dans `backend/orienta/grok_service.py`.

Pour tester rapidement la connexion a Grok :

```bash
cd backend
python test_grok.py
```

Ce script lit directement `XAI_API_KEY`, `XAI_API_BASE` et `XAI_MODEL` depuis l'environnement.

## Jeux de donnees

Depuis la racine du projet :

```bash
python scripts/insert_example_data.py
```

Le script insere les series, matieres, universites, filieres et seuils d'exemple utilises par l'application.

## Endpoints utiles

- `POST /api/suggerer/` : simulation d'orientation.
- `POST /api/chatbot/` : conversation avec O+.
- `POST /api/envoyer-resultats/` : partage des resultats.
- `GET /api/stats/` : statistiques dashboard admin.
- `POST /api/token/` et `POST /api/token/refresh/` : authentification admin.

## Espace admin

URLs principales en local :

- Front public : `http://localhost:5173/`
- Login admin : `http://localhost:5173/admin/login`
- Dashboard admin : `http://localhost:5173/admin/`

Utiliser le compte cree avec `python manage.py createsuperuser`.

## Deploiement

Variables backend minimales a definir en production :

```env
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=votre-domaine
CORS_ALLOWED_ORIGINS=https://votre-frontend.app
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
DB_HOST=...
DB_PORT=5432
XAI_API_KEY=xai-votre-cle
XAI_API_BASE=https://api.x.ai/v1
XAI_MODEL=grok-3-mini
```

Build frontend :

```bash
cd frontend
npm run build
```

## Ressources

- Ministere de l'Enseignement Superieur et de la Recherche Scientifique : https://www.mesrs.bj
- ANIP Benin : https://www.anipbenin.bj
- Documentation xAI : https://docs.x.ai
