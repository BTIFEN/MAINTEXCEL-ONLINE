# Intégration 5S dans MAINTeX — architecture sur un domaine

## État vérifié (17/10/2026)

- `BTIFEN/MAINTEXCEL-ONLINE` : frontend React/Vite, serveur Express (`server.js`) qui sert uniquement `dist/`.
- `BTIFEN/5s-digital-management` : application React/Vite **avec backend Node/Express**, routes `/api/*`, Firebase Authentication et Firestore.
- MAINTeX possède une tuile 5S et un composant `ExternalModuleFrame`, mais cela ne suffit pas à exécuter le backend.
- Cette branche prépare un chemin relatif `/5s/` et la navigation retour. Elle **ne déploie pas 5S**.

## Objectif

L'unique adresse publique est `https://maintexcel.online`. Le module 5S est affiché dans MAINTeX et desservi depuis `https://maintexcel.online/5s/` sans service Cloud Run additionnel.

## Conditions bloquantes à vérifier avant publication

1. Identifier le fournisseur et le mode de déploiement réel de `maintexcel.online` et confirmer le support Node.js long-running / reverse proxy. GitHub seul ne fait pas tourner Express.
2. Vérifier que l'utilisateur possède l'accès au runtime et à la configuration serveur du domaine.
3. Vérifier l'authentification Firebase, la configuration des domaines autorisés et l'identité serveur Firestore. Ne jamais transporter de clés privées dans le frontend.
4. Faire un inventaire de toutes les routes `/api` et des appels absolus `/assets`, `/__/auth`, etc. L'intégration en sous-chemin nécessite des préfixes cohérents côté build Vite, navigateur, backend et service worker.
5. Valider l'absence de collision de cookies, d'en-têtes CSP / frame-ancestors et de service workers entre MAINTeX et 5S.
6. Prévoir sauvegarde et plan de retour arrière avant bascule.

## Deux architectures d'hébergement possibles sans Cloud Run additionnel

**A. Une même machine avec proxy local (migration minimale).**
- MAINTeX sur le serveur frontal.
- 5S sur un process Node.js séparé *sur le même hébergement*, lié à l'interface loopback ; le reverse proxy fait correspondre `/5s/*` et les API dédiées à 5S.
- Les routes applicatives et assets sont adaptés et testés pour le sous-chemin.
- Attention : « une adresse publique » ne veut pas nécessairement dire « un seul processus serveur ».

**B. Un seul processus Express (intégration plus profonde).**
- Porter les routeurs backend 5S dans le serveur MAINTeX sous un espace de noms (`/api/5s/*`).
- Compiler l'interface 5S sous `/5s/`, isoler les assets et interdire tout fallback HTML pour les erreurs API.
- Respecter la séquence d'initialisation, les secrets, la persistance et toutes les vérifications d'autorisation de 5S.
- Plus de travail, mais véritable monolithe applicatif.

## Tests de recette avant fusion

- Accueil MAINTeX, menu « Excellence Terrain > 5S » et tuile « 5S ».
- Chargement `/5s/` et refresh direct sur un écran interne.
- Accès utilisateur authentifié ; refus 401/403 et restrictions D4.
- API audits, zones, actions, KPI, rapports PDF, photos et IA, sans données inventées.
- Test d'écriture isolé et traçabilité ; aucun test destructif en production.
- Retour à MAINTeX, desktop et mobile.
- Non-régression des autres modules et des fichiers statiques.
- Contrôle réseau : aucune API 5S ne reçoit `index.html` à la place de JSON.

## Limitations de cette branche

Le chemin `/5s/` pointe actuellement sur un emplacement qui **nécessite une configuration serveur**. Sans cela, le module ne peut pas fonctionner. Ne pas fusionner avant validation de l'hébergement, compilation, tests et recette.
