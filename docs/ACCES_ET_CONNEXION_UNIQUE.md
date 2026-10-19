# MAINTeX — accès, administration et connexion unique

MAINTeX est le shell de la plateforme. C’est le seul endroit où l’on se connecte.
Il décide qui peut ouvrir quelle application et quels modules, et transmet
l’identité aux applications intégrées (5S, ALPHAP, Meeting Management…).

## 1. Modèle de droits

Deux niveaux : l’**application**, puis les **modules** de l’application.

| Où | Valeurs possibles | Par défaut |
|---|---|---|
| Rôle → application | Autorisé · Refusé | Refusé |
| Rôle → module | Comme l’application · Autorisé · Refusé | Comme l’application |
| Personne → application ou module | Hérité · Autorisé · Refusé | Hérité (= le rôle) |

Règles :

1. Chaque personne a **un seul rôle**.
2. Une case réglée pour la personne **l’emporte toujours** sur le rôle, y compris « Refusé ».
3. Une application refusée refuse **tous** ses modules.
4. Un module non réglé suit son application : une application qui ajoute un module
   n’oblige pas à reprendre tous les rôles.

La zone Admin est elle-même une « application » (`maintex-admin`) soumise aux mêmes règles.
Les **administrateurs d’amorçage** (`MAINTEX_BOOTSTRAP_ADMINS`) y ont toujours accès,
pour qu’on ne puisse jamais perdre la main.

Garde-fous côté serveur :

- seules les adresses du domaine de l’entreprise (et les exceptions listées) peuvent être enregistrées ;
- un administrateur ne peut pas se retirer à lui-même l’accès à l’administration ;
- un rôle attribué ne peut pas être supprimé ;
- deux administrateurs qui modifient la même fiche en même temps : le second est prévenu (numéro de version) ;
- chaque modification est inscrite dans le **journal** (qui, quand, avant, après).

Le catalogue des applications et de leurs modules est dans `shared/access.js`.
Les identifiants de modules sont ceux que chaque application utilise déjà.

## 2. Configuration du serveur

Voir `.env.example`. Sur Cloud Run :

- **Stockage** : Firestore (mode natif), collections `maintex_roles`, `maintex_users`,
  `maintex_audit`, `maintex_meta`. Le compte de service du service Cloud Run doit avoir
  le rôle **Utilisateur Cloud Datastore** (`roles/datastore.user`). Aucune clé à gérer.
- **Secrets** (Secret Manager) : `MAINTEX_SESSION_SECRET`, `MAINTEX_SIGNING_KEY`.
- **Premier démarrage** : deux rôles sont créés (« Administrateur MAINTeX » et « Utilisateur »),
  et l’ancienne variable `MAINTEX_USERS_JSON` est reprise une seule fois.

## 3. Contrat d’intégration pour les applications

Les applications tournent à leur propre adresse (Cloud Run) et s’affichent dans
MAINTeX. Elles ne reçoivent pas le cookie de MAINTeX : l’identité leur est transmise
par un **jeton signé**.

### 3.1 Réception du jeton

MAINTeX charge l’application ainsi :

```
https://<application>/?maintexMode=embedded#maintex_token=<JWT>
```

Le jeton est dans le fragment (`#`) : il n’est jamais envoyé au serveur de
l’application par le navigateur, ni journalisé. L’application doit :

1. lire `location.hash`, extraire `maintex_token` ;
2. l’effacer immédiatement de la barre d’adresse : `history.replaceState(null, '', location.pathname + location.search)` ;
3. l’envoyer à **son propre serveur** (par exemple `POST /api/maintex/session`), qui le vérifie
   et ouvre sa propre session.

### 3.2 Vérification par le serveur de l’application

- Algorithme : **RS256** uniquement.
- Clé publique : `GET <MAINTeX>/.well-known/jwks.json` (à mettre en cache 5 minutes, recharger si `kid` inconnu).
- `iss` = adresse de MAINTeX (`MAINTEX_PUBLIC_URL`).
- `aud` = `maintex:<identifiant de l’application>` (`maintex:5s`, `maintex:alphap`, `maintex:meetings`).
- `exp` : 5 minutes. Le jeton sert uniquement à **ouvrir** la session de l’application.

Contenu utile :

```json
{
  "sub": "prenom.nom@aperam.com",
  "email": "prenom.nom@aperam.com",
  "name": "Prénom Nom",
  "role": "technicien",
  "roleLabel": "Technicien",
  "modules": ["cockpit", "lot9", "audits"]
}
```

`modules` est la liste **des seuls modules autorisés**. L’application masque les autres
dans son menu **et refuse leurs API côté serveur**.

Une implémentation de référence de la vérification (Node, sans dépendance) est
`verifyAppToken` dans `server/tokens.js`, testée dans `tests/server/service.test.js`.

### 3.3 Messages vers le shell

Depuis l’application (`window.parent.postMessage(message, '<adresse de MAINTeX>')`) :

| Message | Effet |
|---|---|
| `{ source: '<appId>', type: 'MAINTeX_REQUEST_HOME' }` | retour à l’accueil MAINTeX |
| `{ source: '<appId>', type: 'MAINTeX_REQUEST_TOKEN' }` | MAINTeX répond `{ type: 'MAINTeX_TOKEN', token }` ou `{ type: 'MAINTeX_TOKEN_ERROR', error }` |

MAINTeX n’accepte que les messages venant **exactement** de l’origine déclarée de
l’application, et ne répond qu’à cette origine. L’application doit faire de même
(vérifier `event.origin` = adresse de MAINTeX).

### 3.4 Transition

Tant qu’une application n’applique pas ce contrat, elle continue de fonctionner
avec son propre login : MAINTeX l’affiche avec un bandeau « connexion unique pas
encore active ».
