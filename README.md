# ORIENTA+

Plateforme d'orientation universitaire pour les bacheliers beninois.

ORIENTA+ combine :
- un backend Django REST pour les donnees, suggestions et endpoints admin,
- un frontend React/Vite pour l'experience utilisateur,
- une integration Groq pour le chatbot O+.

## Stack technique

| Couche | Technologie |
| --- | --- |
| Backend | Django 4.2, Django REST Framework, SimpleJWT |
| Base de donnees | PostgreSQL |
| Frontend | React 18, Vite, Tailwind CSS |
| IA | Groq |

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
- Chatbot O+ branche sur Groq avec fallback hors ligne si le service IA est indisponible.
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

GROQ_API_KEY=gsk_votre_cle_ici
GROQ_API_BASE=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.1-8b-instant
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

## Integration IA Groq

L'integration du chatbot utilise maintenant une configuration Groq coherente sur tout le projet :

- `GROQ_API_KEY` pour la cle API.
- `GROQ_API_BASE` pour l'endpoint Groq.
- `GROQ_MODEL` pour choisir le modele, par defaut `llama-3.1-8b-instant`.
- `GROQ_USE_RESPONSES_API=False` par defaut, avec fallback vers `chat.completions`.
- fallback automatique vers `chat.completions` si necessaire.
- fallback hors ligne si la cle manque ou si Groq est temporairement indisponible.

Le service central du chatbot se trouve dans `backend/orienta/groq_service.py`.

Pour tester rapidement la connexion a Groq :

```bash
cd backend
python test_groq.py
```

Ce script lit directement `GROQ_API_KEY`, `GROQ_API_BASE` et `GROQ_MODEL` depuis l'environnement.

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

## Deploiement (Railway + Render)

### 1) Backend sur Railway (Django API)

Creer un nouveau projet Railway relie a ce repo, puis configurer le service backend :

- Root directory : `backend`
- Build command : `pip install -r requirements.txt && python manage.py collectstatic --noinput`
- Start command : `gunicorn orienta_backend.wsgi:application --bind 0.0.0.0:$PORT`

Ajouter une base PostgreSQL dans Railway et definir les variables backend :

```env
SECRET_KEY=...valeur-secrete...
DEBUG=False
ALLOWED_HOSTS=votre-backend.up.railway.app
CORS_ALLOWED_ORIGINS=https://votre-frontend.onrender.com

# Recommande sur Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}

# IA
GROQ_API_KEY=gsk_votre_cle
GROQ_API_BASE=https://api.groq.com/openai/v1
GROQ_MODEL=llama-3.1-8b-instant
```

Note : `DATABASE_URL` est supporte directement, sinon les variables `DB_*` restent possibles.

### 2) Frontend sur Render (React/Vite)

Creer un service **Static Site** sur Render :

- Root directory : `frontend`
- Build command : `npm install && npm run build`
- Publish directory : `dist`

Variables d'environnement Render :

```env
VITE_API_URL=https://votre-backend.up.railway.app/api
```

### 3) Verification apres deploiement

- Tester `https://votre-backend.up.railway.app/api/` (endpoint API accessible)
- Ouvrir le frontend Render et verifier la connexion admin + chatbot
- Si erreur CORS, verifier `CORS_ALLOWED_ORIGINS` et l'URL exacte Render

## Ressources

- Ministere de l'Enseignement Superieur et de la Recherche Scientifique : https://www.mesrs.bj
- ANIP Benin : https://www.anipbenin.bj
- Documentation Groq : https://console.groq.com/docs
