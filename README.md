# ORIENTA+ 🎓
## Plateforme d'orientation universitaire pour les bacheliers béninois

---

## 🚀 Stack technique

| Couche      | Technologie                                    |
|-------------|------------------------------------------------|
| Backend     | Django 4.2 + DRF + SimpleJWT                 |
| Base de données | PostgreSQL                                |
| Frontend    | React 18 + Vite + Tailwind CSS               |
| IA          | Xai (chatbot conseiller)       |
| Fonts       | Syne (display) + Plus Jakarta Sans (body)     |

---

## 📁 Structure du projet

```
orienta_plus/
├── backend/
│   ├── orienta_backend/     # Config Django
│   │   ├── settings.py
│   │   └── urls.py
│   ├── orienta/             # App principale
│   │   ├── models.py        # Modèles de données
│   │   ├── views.py         # API REST + chatbot IA
│   │   ├── serializers.py
│   │   ├── urls.py
│   │   ├── algo.py          # Algorithme de suggestion
│   │   └── admin.py
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── EspaceEtudiant.jsx  ← Page principale (animation + formulaire)
│   │   │   ├── UniversitesPage.jsx ← Répertoire universités Bénin
│   │   │   ├── FilieresPage.jsx    ← Filières + débouchés + métiers
│   │   │   └── admin/
│   │   │       ├── AdminLogin.jsx  ← Login admin séparé
│   │   │       ├── AdminLayout.jsx ← Layout sidebar
│   │   │       ├── AdminDashboard.jsx
│   │   │       ├── GestionSeries.jsx
│   │   │       ├── GestionMatieres.jsx
│   │   │       ├── GestionUniversites.jsx
│   │   │       ├── GestionFilieres.jsx
│   │   │       └── GestionSeuils.jsx
│   │   ├── components/
│   │   │   ├── AnimationIntro.jsx  ← Animation cinématique 8s
│   │   │   ├── ChatbotIA.jsx       ← Chatbot GPT-4o mini
│   │   │   ├── Navbar.jsx
│   │   │   ├── etudiant/
│   │   │   │   ├── FormulaireNotes.jsx
│   │   │   │   ├── BarreCompatibilite.jsx
│   │   │   │   ├── ResultatCarte.jsx
│   │   │   │   └── ModalDetailFiliere.jsx
│   │   │   └── admin/
│   │   │       └── CRUDTable.jsx
│   │   └── api/
│   │       └── client.js    ← Axios + helpers API
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── scripts/
    └── insert_example_data.py  ← Données réelles béninoises
```

---

## ⚙️ Installation

### 1. Prérequis
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+

### 2. Base de données PostgreSQL
```sql
CREATE DATABASE orienta_db;
CREATE USER orienta_user WITH PASSWORD '';
GRANT ALL PRIVILEGES ON DATABASE orienta_db TO orienta_user;
```

### 3. Backend Django
```bash
cd backend

# Créer l'environnement virtuel
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env et renseigner DB_PASSWORD, XAI_API_KEY, etc.

# Migrations
python manage.py makemigrations
python manage.py migrate

# Créer le superadmin
python manage.py createsuperuser

# Lancer le serveur
python manage.py runserver
```

### 4. Insérer les données réelles (universités béninoises)
```bash
# Depuis la racine du projet
python scripts/insert_example_data.py
```
Cela insère automatiquement :
- 22 séries de bac (A1, B, C, D, E, F1, F2, F3, G1, G2...)
- 26 matières avec coefficients
- 103 universités béninoises (UAC, UNSTIM, EPAC, FSS, ENEAM, UP, UATM, UCAO, etc.)
- 13 filières avec débouchés et salaires
- ~22 seuils d'admission configurés

### 5. Frontend React
```bash
cd frontend

# Installer les dépendances
npm install

# Copier les variables d'environnement
cp .env.example .env.local

# Lancer le serveur de dev
npm run dev
```

---
## 🔐 Espace Admin

L'espace admin est **complètement séparé** de la plateforme publique :

| URL publique | URL admin |
|---|---|
| `http://localhost:5173/` | `http://localhost:5173/admin/login` |
| `http://localhost:5173/universites` | `http://localhost:5173/admin/` |
| `http://localhost:5173/filieres` | `http://localhost:5173/admin/seuils` |

### Connexion admin
- Utiliser les identifiants créés avec `python manage.py createsuperuser`
- Token JWT valable 8h, refresh 7 jours

---

## 📊 Algorithme de suggestion

Pour chaque filière compatible avec la série :
1. On prend ses 3 matières prioritaires
2. Moyenne = (note1 + note2 + note3) / 3
3. Comparaison avec les seuils de chaque université :
   - `>= seuil_bourse` → 80–100% — 🏆 Bourse complète (vert)
   - `>= seuil_demi_bourse` → 50–79% — 🎓 Demi-bourse (bleu)
   - `>= seuil_minimum` → 20–49% — 📚 Admission payante (orange)
   - Sinon → 0% — Non admissible (rouge)
4. Résultats triés par compatibilité décroissante

---

## 🌐 Déploiement (Railway / Render)

### Backend
```bash
# Ajouter ces variables d'environnement dans Railway/Render :
SECRET_KEY=...
DEBUG=False
ALLOWED_HOSTS=votre-domaine.railway.app
DATABASE_URL=postgresql://...  # Fourni automatiquement par Railway
XAI KEY =sk-...
CORS_ALLOWED_ORIGINS=https://votre-frontend.vercel.app
```

### Frontend
```bash
cd frontend
npm run build
# Déployer le dossier dist/ sur Vercel, Netlify, etc.
```

---

## 📞 Contacts & ressources

- Universités béninoises : https://www.mesrs.bj
- Bourses nationales (ANIP) : https://www.anipbenin.bj
- Support technique : contact@orienta.bj

---

