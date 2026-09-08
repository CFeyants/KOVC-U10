# ⚽ KOVC Sterrebeek U10 — teamapp

Application web (en **néerlandais**, pensée pour le téléphone) pour l'équipe U10
du [KOVC Sterrebeek](https://www.kovcsterrebeek.be/) : calendrier, absences,
sélection, buts et passes décisives, et quelques trucs pour l'ambiance du club.

Même stack que *Missions en famille* : **Next.js 15 + Upstash Redis**, déployable
sur Vercel en quelques minutes.

---

## 👨‍👩‍👧 Pour les parents

| Écran | Ce qu'on y fait |
|---|---|
| **Kalender** | Le prochain match/entraînement en grand : heure, heure de rendez-vous, adresse, **bouton Route** (Google Maps) et **bouton Agenda**. La météo du jour du match s'affiche automatiquement (Open-Meteo, sans clé). |
| **Détail d'un match** | Se désinscrire en un tap (« Kan niet ») avec une raison facultative, voir qui est là, la sélection, la corvée fruits/lavage, le covoiturage et le résultat. |
| **Ploeg** | Chaque parent choisit son enfant une fois (stocké sur le téléphone) ; ensuite les boutons d'absence sont partout. On peut donner un « pluim » (bravo) par jour à un joueur. |
| **Klassement** | Buts, assists, joueur du match, présence, pluims. |
| **Prikbord** | Les messages des entraîneurs + les infos pratiques. |

**Tout le monde est présent par défaut** — on ne signale que les absences.

### Mettre les matchs dans l'agenda

Deux façons, toutes deux dans le bouton **In agenda** :

- **Un seul événement** → Google Agenda (formulaire pré-rempli) ou fichier `.ics`
  pour iPhone/Outlook.
- **Toute la saison** → abonnement `webcal://…/api/ics`. L'agenda du téléphone se
  met à jour tout seul quand l'entraîneur change quelque chose (annulation,
  heure, terrain). C'est l'option à recommander aux parents.

Variantes du flux : `/api/ics?only=matches` (matchs seuls) et
`/api/ics?only=trainings`.

---

## 🧑‍🏫 Pour les entraîneurs (mode coach)

Roue dentée en haut à droite → **code PIN**. Par défaut **`1933`**
(modifiable via `NEXT_PUBLIC_COACH_PIN`). Une fois débloqué :

- **Sélection** : on tape sur les visages, les absents sont grisés
  automatiquement ; bouton « tout le monde qui est là » et **partage WhatsApp**
  de la sélection (heure, lieu, liste).
- **Résultat** : score, puis « Doelpunt toevoegen » → on tape le buteur, puis le
  passeur (ou « pas d'assist ». Confettis inclus).
- **Speler van de match** ⭐ et un petit mot du coach.
- **Marquer aan/afwezig** n'importe quel joueur (si un parent oublie).
- **Annuler** un entraînement ou un match, avec un message.
- **Beurtrol** : qui apporte les fruits, qui lave les maillots — réparti
  automatiquement par rotation, modifiable.
- **Gérer les joueurs** (ajout, numéro, suppression) et **ajouter une date**
  (match amical, fête de Noël, entraînement supplémentaire).
- **Prikbord** : poster un message, l'épingler.

---

## 📅 Données de départ

- **14 matchs** de la saison 2026-2027 (*Gewestelijk U10 AS*), repris de
  [foot24.be](https://www.foot24.be/fr/clubs/kovc-sterrebeek/u10-2213), avec le
  terrain et l'adresse complète de chaque déplacement.
- **Entraînements** générés automatiquement : lundi 17:00–18:30 et mercredi
  15:30–17:00, du 24/08/2026 au 31/05/2027, **hors vacances scolaires**.
- **13 joueurs** : Boris, Bastien, Mats, Lewis, Elisa, Theo, Nico, Alexandre,
  Conall, Loïc, Basile, Raphael, Alexander.

Tout cela se modifie ensuite depuis l'app. Les données de départ vivent dans
[`lib/seed.js`](lib/seed.js) — c'est là qu'on colle la nouvelle saison en août.

> ⚠️ L'adresse du terrain de *Koninklijke FFF Haren* (match du 5/09) n'était pas
> publiée sur foot24 ; à corriger dans `lib/seed.js` ou depuis l'app.

---

## 💻 Lancer en local

```bash
npm install
npm run dev
```

Puis <http://localhost:3000>. **Sans Upstash configuré, l'app tourne quand même
en local** : les données restent en mémoire du serveur de dev (elles disparaissent
au redémarrage). En production, l'absence de configuration reste une erreur
visible — pour ne pas perdre une saison sans s'en rendre compte.

Pour tester avec la vraie base, crée un `.env.local` (voir `.env.example`) :

```bash
UPSTASH_REDIS_REST_URL="https://xxxxx.upstash.io"
UPSTASH_REDIS_REST_TOKEN="xxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_COACH_PIN="1933"
```

---

## ☁️ Déployer sur Vercel

1. **Pousser sur GitHub**
   ```bash
   git remote add origin https://github.com/<ton-compte>/KovcU10.git
   git push -u origin main
   ```
2. **Vercel → Add New… → Project** → importer le dépôt (Next.js détecté tout seul).
3. **Storage → Create Database → Upstash for Redis**, connecter au projet :
   Vercel injecte `UPSTASH_REDIS_REST_URL` et `UPSTASH_REDIS_REST_TOKEN`.
4. **Settings → Environment Variables** → `NEXT_PUBLIC_COACH_PIN` = ton code.
5. **Redeploy**.

Ensuite : partager le lien dans le groupe WhatsApp des parents, avec la consigne
« ajouter à l'écran d'accueil » (l'app est une PWA, icône du blason incluse).

> Toutes les personnes qui ont le lien voient et modifient les mêmes données.
> Le code PIN protège seulement le mode coach. Garde l'URL dans le groupe de
> l'équipe.

---

## 📂 Structure

```
app/
  layout.jsx              → police, métadonnées, manifest
  page.jsx                → coquille : en-tête, 4 onglets, feuilles modales
  globals.css             → tokens de design (marine #333366 / jaune #dddd00)
  components/
    ui.jsx                → Card, Button, Sheet, avatars, confettis, toasts
    AgendaTab.jsx         → prochain rendez-vous + liste
    EventSheet.jsx        → tout le détail d'un match/entraînement
    TeamTab.jsx           → effectif, choix de son enfant, pluims
    StatsTab.jsx          → classements
    BoardTab.jsx          → prikbord + infos pratiques
    PlayerSheet.jsx       → la saison d'un joueur
    CoachPanel.jsx        → code PIN + outils entraîneur
    AddToCalendar.jsx     → Google / .ics / abonnement
  api/
    state/route.js        → lecture-écriture du bloc JSON dans Redis
    ics/route.js          → flux iCal de la saison
lib/
  seed.js                 → joueurs, calendrier, horaires, vacances
  model.js                → agenda dérivé, stats, beurtrol
  calendar.js             → génération .ics, liens Google, itinéraires
  format.js               → dates en néerlandais
  weather.js              → prévision Open-Meteo
  useClub.js              → état partagé + préférences locales
public/
  crest.png, icon-*.png   → blason extrait du bandeau du site du club
```

## 🎨 Design

Marine `#333366` et jaune `#dddd00` — les couleurs du club, reprises de sa
feuille de style. Thème sombre assumé (lisible en plein soleil du samedi matin),
navigation par le pouce en bas, animations courtes qui respectent
`prefers-reduced-motion`.
