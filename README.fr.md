[English](README.md) · [简体中文](README.zh-CN.md) · [繁體中文](README.zh-TW.md) · **Français** · [Русский](README.ru.md) · [日本語](README.ja.md) · [Tiếng Việt](README.vi.md)

# MX-Desktop-Sharing-NEXT

Partage de bureau basé sur LiveKit. L'idée directrice : **un nœud par salle, une URL de diffusion par personne**.

- **Les salles sont liées à un nœud LiveKit.** Vous choisissez à la création quel jeu d'identifiants LiveKit une salle utilise, et c'est sur ce nœud que se consomment son trafic média et son quota gratuit.
- **Les utilisateurs ordinaires apportent leur propre nœud.** Chacun connecte son project LiveKit Cloud, consomme son propre quota et ne concurrence personne.
- **Un nœud intégré en secours.** Un administrateur peut promouvoir n'importe quel nœud en « intégré » pour que tout le site le partage, avec des interrupteurs pour savoir si les utilisateurs ordinaires peuvent l'utiliser et un plafond sur son nombre de salles.
- **L'autorisation se joue au niveau du protocole.** Pas dans la table des membres → pas de jeton → pas de connexion à la salle → aucun abonnement à une piste. Ce n'est pas du filtrage côté client.
- **OBS passe par du WHIP direct.** `enableTranscoding: false`, donc les 60 minutes de transcodage mensuelles ne sont jamais entamées.
- **« Diffusion OBS » est un vrai interrupteur.** Le propriétaire peut fermer l'entrée WHIP de la salle d'un clic : ce qui diffuse est coupé immédiatement et toutes les URL déjà distribuées sont annulées. Le partage depuis le navigateur est une route distincte et n'est pas affecté.
- **Deux variables d'environnement suffisent à le faire tourner.** Le compte admin est créé automatiquement, la clé de chiffrement est provisionnée automatiquement, et LiveKit se configure dans l'interface web.

Pour déployer ce site sur Vercel, voir [DEPLOY.md](DEPLOY.md).

## Démarrage rapide

Vous n'avez besoin que de deux variables d'environnement. Copiez `.env.example` vers `.env.local`
(Next **ne lit pas** `.env.example` lui-même — modifier ce fichier n'a aucun effet) et renseignez ces
deux valeurs :

```bash
DATABASE_URL=postgresql://...@ep-xxx-pooler.../neondb?sslmode=require
ADMIN_PASSWORD=choisissez-votre-mot-de-passe
```

**Les guillemets sont optionnels** — avec ou sans, le résultat analysé est identique. La seule
exception est une valeur contenant `#` : sans guillemets elle est silencieusement tronquée comme un
commentaire, alors mettez-en dans ce cas. `ADMIN_PASSWORD` doit être non vide ; le laisser à `""`
compte comme non défini et le compte admin ne sera pas créé.

Ensuite créez les tables et lancez :

```bash
npm install
npm run db:migrate
npm run dev
```

`db:migrate` lit les fichiers de migration sous `drizzle/` et crée 12 tables. Il lit les mêmes fichiers
d'environnement que l'application (`.env.local` prime sur `.env`). **Vous ne lancez pas cela à la main
pour un déploiement Vercel** — l'étape de migration est déjà câblée dans le build : configurez
`DATABASE_URL` et poussez le code ; voir [DEPLOY.md](DEPLOY.md) pour les détails.

Ouvrez `http://localhost:3000` et connectez-vous avec `admin@localhost` et le mot de passe ci-dessus —
**le compte admin est créé au premier démarrage, et il n'y a pas d'assistant d'installation**.

Une fois connecté, allez dans « Nœuds LiveKit » dans le panneau latéral → « Connecter un nœud » et
configurez un nœud LiveKit (comment obtenir les identifiants : section suivante). LiveKit n'occupe
aucune variable d'environnement.

Autres commandes : `npm test` (137 assertions), `npm run typecheck`, `npm run build`.
`build` lance d'abord la migration de la base (ignorée si `DATABASE_URL` n'est pas défini) ; pour
compiler sans toucher à la base, utilisez `npm run build:only`.

### La connexion échoue ?

**Ouvrez d'abord `/api/health`** — il rapporte l'état de chaque étape, ne demande pas de connexion, et
va beaucoup plus vite que de deviner à partir d'une trace d'erreur.

```bash
curl -s http://localhost:3000/api/health | python -m json.tool
```

Les cinq points, dans l'ordre : `DATABASE_URL` est-il défini → la base est-elle joignable →
**les 12 tables ont-elles été créées** → `ADMIN_PASSWORD` est-il défini → le bootstrap de démarrage
est-il passé. Les points suivants sont ignorés tant qu'un précédent échoue, donc vous n'avez jamais
qu'à corriger le premier en rouge.

L'endpoint de connexion sépare les codes de statut par cause :

| Réponse | Signification |
| --- | --- |
| `503 not_configured` | Base injoignable, tables absentes, ou `DATABASE_URL` non défini |
| `503 admin_not_configured` | La base répond, mais `ADMIN_PASSWORD` est vide donc le compte admin n'a jamais été créé |
| `401 invalid_credentials` | Le compte existe, le mot de passe est faux |
| `429 rate_limited` | 8 échecs pour la même adresse en 15 minutes (30 depuis la même IP) |

Le cas le plus facile à mal diagnostiquer : **les tables n'ont pas été créées**. Le symptôme est que
`database` affiche « Connecté » alors que tout endpoint touchant une table échoue — parce que se
connecter et créer les tables sont deux choses différentes. Le point `tables` de `/api/health` liste
exactement celles qui manquent. Au déploiement le build les crée automatiquement ; en local, rattrapez
avec `npm run db:migrate`.

Vous avez lancé `db:migrate` et les tables ne sont toujours pas là ? Vérifiez que
`drizzle/meta/_journal.json` existe. Quand drizzle-kit ne le trouve pas, il **n'échoue pas** : il en
crée discrètement un vide et ne fait rien. `tests/migrations.test.mts` garde précisément ce cas. Si
cela vous arrive, `npm run db:push` peut contourner les fichiers de migration et créer les tables
directement depuis `schema.ts`.

### Variables d'environnement

| Variable | Requise | Défaut / notes |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Chaîne de connexion Neon |
| `ADMIN_PASSWORD` | ✅ | Doit être non vide. Changez cette valeur et redémarrez pour changer le mot de passe |
| `ADMIN_EMAIL` | | `admin@localhost` |
| `CREDENTIAL_ENCRYPTION_KEY` | | Générée au premier démarrage et stockée en base si non définie (voir la discussion du compromis dans [DEPLOY.md](DEPLOY.md#关于自动生成的加密密钥)) |
| `NEXT_PUBLIC_APP_URL` | | Déduite des en-têtes de la requête si non définie |
| `CRON_SECRET` | | Protège l'endpoint de nettoyage planifié |

### Garder le site pour ses proches (fermer les inscriptions)

**Administration → « Paramètres du site » → désactivez « Autoriser les inscriptions ».** L'interrupteur
vit dans la table `app_config` (clé `registration_enabled`), n'occupe aucune variable d'environnement et
s'applique immédiatement sans redéploiement. Quand la clé est absente le défaut est **ouvert** — mettre
à jour un déploiement existant n'enferme jamais personne dehors par surprise.

Le point crucial : **il y a trois façons de créer un compte, et en fermer une signifie les fermer
toutes les trois**, sinon vous n'avez rien fermé :

| Entrée | Comportement une fois fermée |
| --- | --- |
| E-mail + mot de passe | `POST /api/auth/register` renvoie directement `403 registration_closed` |
| GitHub / Google | Les comptes déjà liés se connectent comme d'habitude ; quiconque n'est pas lié et dont l'adresse n'existe pas ici est rejeté à l'étape de création de compte |
| Code par e-mail | Idem — les comptes existants se connectent comme d'habitude, les nouvelles adresses ne créent plus de compte |

Le contrôle n'est donc pas écrit à l'entrée de trois routes ; il est rassemblé dans
`assertRegistrationOpen()` dans `src/lib/site-settings.ts` et appelé par **les deux seuls endroits qui
insèrent réellement dans users** (les deux fonctions resolve de `src/lib/accounts.ts`, plus la route
register). La connexion externe et celle par code e-mail sont en réalité « se connecter si le compte
existe, sinon en créer un » ; seule la seconde moitié doit être bloquée, et la première doit continuer
de fonctionner.

Deux choix de placement délibérés :

- **Le chemin par code e-mail est bloqué *après* la vérification, pas *avant* l'envoi.** L'endpoint
  d'envoi renvoie la même réponse selon que l'adresse est ou non en base (sinon il devient un endpoint
  d'énumération d'utilisateurs) ; bloquer à cette étape détruirait cette propriété.
- **Dans la route register, le blocage précède la vérification humaine.** Un jeton Turnstile est à
  usage unique ; le brûler sur une requête vouée au refus obligerait l'utilisateur à se re-vérifier
  juste pour lire « les inscriptions sont désactivées sur ce site ».

L'onglet « S'inscrire » de la page de connexion disparaît en conséquence, remplacé par une ligne
« les inscriptions sont désactivées sur ce site — les comptes existants peuvent toujours se connecter »
— mais ce n'est qu'une indication. Repasser à `true` le `registrationEnabled` reçu par le front ne
franchit toujours pas le contrôle serveur.


---

# Déployer un nœud LiveKit

Ce site n'embarque aucun serveur média. Chaque salle doit être liée à un nœud LiveKit, et un nœud peut
venir de deux endroits.

**La conclusion d'abord** : presque tout le monde devrait choisir l'option une. L'option deux ne vaut le
coup que si vous avez déjà un serveur et acceptez de déployer le service Ingress en plus.

| | Option 1 · LiveKit Cloud | Option 2 · Auto-hébergé |
| --- | --- | --- |
| Temps | Environ 3 minutes | Une demi-journée et plus |
| Coût | Plan Build gratuit, sans carte | Serveur + bande passante |
| Diffusion OBS (Ingress) | **Fonctionne d'emblée** | **Nécessite de déployer Ingress + Redis séparément** |
| Quota | Plafonds stricts (chiffres à la fin) | Limité seulement par votre bande passante |
| Domaine / certificat nécessaire | Non | Oui, un certificat signé par une CA ; l'auto-signé ne marche pas |

## Option 1 · LiveKit Cloud (recommandé)

### 1. S'inscrire et créer un project

Ouvrez [cloud.livekit.io](https://cloud.livekit.io) et inscrivez-vous. Le plan **Build** gratuit ne
demande pas de carte.

Créez un project avec le nom que vous voulez. Une fois créé vous obtenez une URL de la forme
`wss://xxx.livekit.cloud` — c'est la première des valeurs qu'il vous faudra.

### 2. Créer une API Key

Dans le project, allez dans **Settings → Keys → nouvelle API Key**, ce qui vous donne :

- `API Key` (de la forme `APIxxxxxxxx`)
- `API Secret`

> **L'API Secret n'est affiché qu'une fois.** Fermez la boîte de dialogue et il est perdu. Copiez-le
> tout de suite. Le perdre n'est pas fatal : supprimez cette clé dans la console LiveKit, créez-en une
> nouvelle, puis revenez ici et utilisez « Changer les clés » pour la mettre à jour.

### 3. Le connecter ici

Connectez-vous → panneau latéral **« Nœuds LiveKit » → « Connecter un nœud »**, et renseignez trois
valeurs :

| Champ | Ce qu'on y met |
| --- | --- |
| Nom du nœud | N'importe quoi, c'est pour vous seul |
| URL LiveKit | `wss://xxx.livekit.cloud` |
| API Key | La clé de l'étape précédente |
| API Secret | Le secret de l'étape précédente |

Enregistrez. **Ce site effectue un véritable contrôle contre l'API LiveKit avec ces identifiants, et
les mauvais ne sont jamais stockés.** Le contrôle fait deux choses :

- `listRooms` — vérifie que l'URL et les identifiants sont bons. **Un échec refuse l'enregistrement.**
- `listIngress` — vérifie si des URL de diffusion OBS peuvent être créées. **Un échec ne fait que
  dégrader, jamais bloquer** (la salle fonctionne toujours pour le partage navigateur, elle ne peut
  simplement pas fournir d'URL WHIP).

Le résultat est enregistré dans les `capabilities` du nœud, et chaque ligne de la page « Nœuds LiveKit »
indique si Ingress est disponible. Vous pouvez appuyer sur « Vérifier » pour retester à tout moment.

### 4. Configurer le webhook (recommandé)

Ça marche sans ; vous n'aurez simplement pas d'enregistrement serveur des connexions/déconnexions (le
front voit toujours la vidéo et le nombre de personnes en temps réel, car cela vient des événements du
SDK LiveKit et ne dépend pas du webhook).

La page « Nœuds LiveKit » affiche une URL de webhook **propre à chacun de vos nœuds**, de la forme :

```
https://votre-site/api/webhooks/livekit/<nodeId>
```

Copiez-la dans la console LiveKit → ce project → **Settings → Webhooks**.

> Pourquoi l'URL diffère par nœud : la signature d'un webhook est calculée avec l'API key/secret de
> l'expéditeur. Dans un montage multi-nœuds, il faut savoir *depuis l'URL* quel nœud l'a envoyé avant de
> pouvoir choisir la bonne clé pour vérifier. C'est à cela que sert le `nodeId` dans le chemin.

### 5. Vérifier en créant une salle

Retournez sur la page « Salles » et créez une salle en choisissant le nœud que vous venez de connecter.
Une fois à l'intérieur :

- Le bouton « Partager depuis le navigateur » → diffuse sans installer OBS
- Le panneau « URL de diffusion OBS » → appuyez sur « Générer l'URL de diffusion » pour obtenir un
  Server + un Bearer Token
- L'interrupteur « Diffusion OBS » en haut du même panneau → quand le propriétaire le coupe, la salle
  cesse d'accepter les flux WHIP

## Option 2 · LiveKit auto-hébergé

### ⚠️ À lire d'abord, sinon vous travaillerez pour rien

**Un `livekit-server` auto-hébergé n'inclut pas Ingress.** Ingress est un service distinct qui parle à
livekit-server via Redis. Ce qui veut dire :

- Uniquement **partager l'écran depuis un navigateur** → pas besoin d'Ingress, un livekit-server suffit
- Vouloir **diffuser en OBS/WHIP** → vous devez en plus déployer le service Ingress + Redis, et
  configurer `whip_base_url` côté livekit-server pour le viser

Ce site détecte l'Ingress indisponible lors du contrôle et indique clairement dans l'interface de la
salle qu'« aucune URL de diffusion OBS ne peut être émise ».

### En lancer un pour le développement local

```bash
livekit-server --dev --bind 0.0.0.0
```

Installation : macOS `brew install livekit` ; Linux `curl -sSL https://get.livekit.io | bash` ;
Windows, téléchargez depuis les GitHub Releases.

Le mode `--dev` utilise les identifiants fixes **`devkey` / `secret`** et ne convient qu'en local. Pour
le connecter ici, utilisez `ws://localhost:7880` comme URL (la validation d'URL de ce site accepte
`ws://` précisément pour l'auto-hébergement et les réseaux internes).

### Déploiement en production

Il existe un générateur de configuration officiel, bien plus économe que d'écrire la config à la main :

```bash
docker pull livekit/generate
docker run --rm -it -v$PWD:/output livekit/generate
```

Il produit un répertoire pour le domaine que vous saisissez, contenant `docker-compose.yaml`,
`livekit.yaml`, `caddy.yaml`, `redis.conf` et un script de démarrage.

Les entrées clés de `livekit.yaml` :

```yaml
port: 7880
log_level: info
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: true      # découvre la vraie IP publique via STUN en environnement cloud
redis:
  address: redis:6379        # fortement recommandé en production
keys:
  APIyourkey: your_secret_here   # simplement une correspondance key: secret
turn:
  enabled: true
  domain: turn.example.com   # doit correspondre au certificat
  tls_port: 443              # utilisez 443 quand il n'y a pas de répartiteur de charge devant
```

`keys:` est vraiment une simple table de correspondance ; il n'y a pas de commande de génération dédiée
— fabriquez vous-même un secret suffisamment aléatoire :

```bash
openssl rand -base64 32
```

Ports à ouvrir :

| Port | Protocole | Usage |
| --- | --- | --- |
| 7880 | TCP | Signalisation (mettez une terminaison HTTPS/TLS devant) |
| 7881 | TCP | Repli TCP pour le média WebRTC |
| 50000–60000 | UDP | Média WebRTC |
| 3478 ou 5349 | TCP | TURN intégré over TLS (mettez 443 quand il n'y a pas de LB) |
| 443 | UDP | TURN/UDP optionnel, pour percer les pare-feu stricts |
| 6789 | TCP | Métriques Prometheus optionnelles |

Deux pièges faciles :

- **Un certificat signé par une CA est obligatoire** ; l'auto-signé ne marche pas. Le point de
  terminaison ressemble à `wss://livekit.example.com`.
- **Utilisez le host networking sous Docker**, pas des mappages bridge port par port, sinon la plage de
  ports média casse.

### Déployer Ingress (nécessaire seulement pour la diffusion OBS)

- Un service distinct ; **son adresse Redis doit être la même que celle utilisée par livekit-server**
- **≥ 4 CPU / 4 Go de RAM** recommandés par instance
- Ports : RTMP `1935/TCP`, WHIP `8080/TCP`, WHIP over UDP `7885/UDP`
- Clés de configuration : `api_key`, `api_secret`, `ws_url`, `redis`
  (ou les variables d'environnement `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` / `LIVEKIT_WS_URL`)
- **Il faut aussi définir `whip_base_url` côté livekit-server** (ajoutez `rtmp_base_url` si vous voulez
  aussi RTMP), sinon le serveur ne peut pas produire d'URL d'ingress
- Plusieurs instances demandent un répartiteur de charge : LB TCP pour RTMP, proxy inverse HTTP pour WHIP

La bonne nouvelle : **le WHIP direct (bypass transcoding) consomme très peu de CPU** — la formulation
officielle est « a WHIP session with transcoding bypassed consumes minimal resources ». Ce site utilise
le mode direct par défaut (`enableTranscoding: false`), donc une machine Ingress auto-hébergée est bien
moins sollicitée qu'on ne le croit. Ce qui mange vraiment du CPU, c'est le RTMP et le WHIP avec
transcodage activé, et cela croît linéairement avec la résolution et le nombre de couches.

## Configurer OBS

Une fois l'URL de diffusion en main :

1. OBS → Paramètres → Stream → **Service : `WHIP`**
2. **Server** = le Server du panneau
3. **Bearer Token** = le Bearer Token du panneau (le nom WHIP de la clé de flux)

Si aucune URL ne peut être générée, ou si le flux se fait couper, vérifiez d'abord si le propriétaire a
désactivé l'interrupteur « Diffusion OBS » en haut du panneau.

Le WHIP direct n'a pas de simulcast côté serveur. Pour plusieurs niveaux de qualité, vous devez
l'activer vous-même dans **OBS 32.1.0+** (1 à 4 couches sont prises en charge).

## FAQ sur la connexion des nœuds

| Symptôme | Cause / solution |
| --- | --- |
| URL saisie en `https://` | Rien à changer ; ce site convertit automatiquement en `wss://` et retire aussi les chemins superflus et le slash final |
| L'enregistrement dit « connexion impossible ou identifiants invalides » | La sonde `listRooms` a échoué. Vérifiez que l'URL appartient à ce project, que key/secret forment une paire, et que le secret a été copié en entier |
| Ingress affiche « — » / indisponible | Cloud : Ingress n'est pas activé sur le project, ou la concurrence Ingress est saturée (le palier gratuit n'en autorise que 2). Auto-hébergé : Ingress n'est pas déployé, ou `whip_base_url` n'est pas défini |
| Ces identifiants sont déjà connectés | Le même utilisateur + la même URL + la même key ne peuvent être connectés qu'une fois ; retrouvez l'entrée existante dans la liste |
| Toutes les requêtes échouent d'un coup | Le palier gratuit est épuisé. **Dépasser échoue franchement et n'est jamais facturé** — attendez le mois suivant ou changez de nœud |
| Secret perdu | Recréez la key dans la console LiveKit, revenez ici et utilisez « Changer les clés » (les nouveaux identifiants sont vérifiés avant toute écriture) |

---

## Architecture

```
Navigateur ──── Next.js on Vercel ──── Neon Postgres
  │          (auth / salles / membres / signature des jetons)
  │                 │
  │ WebRTC          │ server SDK (avec les identifiants du nœud propre à la salle)
  │ partage/vue     ▼
  └────────► Nœud LiveKit A / B / C …        ← plan média ; une salle vit sur exactement un nœud
                    ▲
                    │ WHIP (direct, sans transcodage)
                  OBS
```

**Les deux routes de diffusion sont séparées.** Le « Partager mon écran » du navigateur ne traverse
Next.js qu'une fois pour obtenir un jeton, après quoi la vidéo **se connecte droit à LiveKit**
(`getDisplayMedia` → WebRTC), sans toucher ni Vercel ni Ingress ; la route OBS exige qu'un ingress soit
d'abord créé sur le serveur, et ensuite OBS pousse du WHIP vers LiveKit. L'interrupteur « Diffusion
OBS » ne ferme donc que la seconde — coupez-le, le partage navigateur continue de fonctionner.

| Chemin | Rôle |
| --- | --- |
| `src/db/schema.ts` | 12 tables. `livekit_nodes` est le cœur de toute l'architecture |
| `src/lib/livekit.ts` | Nœud → client SDK, signature des jetons, création d'ingress WHIP, contrôle des identifiants |
| `src/lib/nodes.ts` | Sélection du nœud et décision « qui peut utiliser quel nœud » |
| `src/lib/rooms.ts` | Contrôle d'appartenance (`requireMember` / `requireRoomOwner`) |
| `src/lib/invites.ts` | Émission des liens d'invitation et utilisation atomique |
| `src/lib/crypto.ts` | Chiffrement AES-256-GCM des identifiants |
| `src/lib/site-settings.ts` | Politique au niveau du site (actuellement juste « autoriser les inscriptions »), y compris le garde de création de compte |
| `src/lib/app-config.ts` | Lecture/écriture de la table KV globale `app_config` |
| `src/lib/brand.ts` | Nom du site / société / ligne de copyright, écrits une seule fois pour tout le site |
| `src/i18n/` | Sept catalogues de langue plus la résolution de la langue (cookie → Accept-Language → anglais) |
| `src/lib/bootstrap.ts` | Bootstrap au démarrage : créer l'admin, provisionner la clé. Paresseux et idempotent |
| `src/app/api/rooms/[code]/token/route.ts` | Là où converge l'autorisation |
| `src/app/api/rooms/[code]/route.ts` | Détail de la salle, le verrou OBS (PATCH), fermeture d'une salle |
| `src/app/api/webhooks/livekit/[nodeId]/route.ts` | Détection de présence, signature vérifiée par nœud |
| `src/app/api/health/route.ts` | Diagnostic de configuration, le point d'entrée du dépannage |

## Interface

Son propre design system, sans dépendance à un framework UI et sans Tailwind —
juste des propriétés personnalisées CSS et une fine couche de primitives React.

| Chemin | Rôle |
| --- | --- |
| `src/styles/tokens.css` | Toutes les variables de design (`--mx-*`). Le clair vit sur `:root`, le sombre sur `[data-theme="dark"]` |
| `src/styles/base.css` | Reset + utilitaires typographiques |
| `src/styles/components.css` | Styles des primitives (boutons, formulaires, cartes, tableaux, modales…) |
| `src/styles/shell.css` | Coquille applicative : barre du haut, panneau latéral, barre d'état, sélecteur de langue |
| `src/styles/pages.css` | Compositions au niveau page : page de connexion, tuiles de stats, scène vidéo |
| `src/styles/landing.css` | La page d'accueil (`/`). La seule page tournée vers l'extérieur ; voir plus bas |
| `src/ui/` | Primitives React ; elles ne consomment que des tokens et n'écrivent jamais une couleur ou une taille en dur |
| `src/components/AppShell.tsx` | Barre du haut + panneau latéral repliable + zone principale + barre d'état ; sous 1024px le panneau devient un tiroir |
| `src/components/LanguageSwitcher.tsx` | Le menu de langue, immédiatement à gauche du sélecteur de thème |
| `src/components/BrandMark.tsx` | La marque (cube isométrique + signal montant) ; voir plus bas |
| `src/lib/theme.ts` | Persistance du thème (système / clair / sombre) + le script anti-flash |

Quatre compromis délibérés :

- **Le thème est arrêté avant le premier rendu.** `themeBootstrapScript` est inliné dans `<head>` et
  pose `data-theme` sur `<html>` avant tout affichage, donc il n'y a jamais de flash de blanc.
- **Le thème suit le système par défaut.** La valeur stockée est une *préférence*
  (`system` / `light` / `dark`), et seul `data-theme` sur `<html>` porte une couleur résolue — les deux
  doivent rester distincts, sinon « suivre le système » n'a nulle part où exister.
- **La scène vidéo est sombre en permanence.** `--mx-stage-bg` est presque noir dans les deux thèmes —
  un cadre clair autour de la vidéo change la façon dont on lit la vidéo elle-même.
- **La page d'accueil porte sa propre échelle typographique.** `landing.css` déclare en tête un petit
  ensemble de `--land-*` (tailles du hero, rythme des sections), parce que `--mx-font-size-display` fait
  30px — bien pour un titre de page, beaucoup trop petit pour un hero. Couleur, rayon et ombre passent
  toujours tous par `--mx-*`.

### Langues

L'interface est livrée en **chinois simplifié, chinois traditionnel, anglais, français, russe, japonais
et vietnamien**. Trois décisions qui valent d'être connues :

- **La langue est résolue côté serveur** : le cookie `mxds.lang` (un choix explicite) →
  `Accept-Language` (c'est-à-dire suivre le système) → l'anglais en dernier recours. Il faut que ce soit
  le serveur, parce que `<html lang>` et la première image rendue doivent déjà être justes — lire
  `navigator.language` côté client ferait clignoter la mauvaise langue à chaque chargement.
- **Chaque catalogue est vérifié par le type contre celui en anglais.** `src/i18n/messages/en.ts` définit
  l'ensemble des clés ; les six autres sont déclarés comme `Messages`, si bien qu'une clé manquante ou
  mal orthographiée fait échouer `npm run typecheck` au lieu d'afficher une clé brute dans l'interface.
  Les substitutions s'écrivent `{name}` ; l'emphase en ligne se note `**gras**` / `` `code` `` et est
  rendue par `<RichText>` — ainsi aucun balisage ne se glisse dans les catalogues et les traducteurs ne
  touchent jamais au JSX.
- **Les messages d'erreur de l'API sont des clés, pas de la prose.** Les handlers de route lèvent des
  clés comme `api.node.duplicate`, et l'enveloppe `route()` (`src/lib/api-route.ts`) traduit une seule
  fois, dans la langue de la requête qui a causé l'erreur. Idem pour les messages de validation zod, ce
  qui laisse `src/lib/validation.ts` être un module de données pur, sans dépendance.

Le sélecteur de langue est immédiatement à gauche du sélecteur de thème, aussi bien dans la barre du haut
de la coquille applicative que dans celle de la page d'accueil. Sur téléphone, la barre d'accueil le
masque : là, le rôle de la barre est la marque, le nom du projet et le lien GitHub (voir plus bas), et la
page de connexion garde son propre sélecteur dans un coin pour qu'une langue système non reconnue ne soit
jamais une impasse.

### La page d'accueil

`/` est une page qui parle du projet, pas un routeur : barre du haut + hero + routes de diffusion +
mise au point sur le palier gratuit + fonctions + démarrage rapide + annonce de l'appli bureau + Q&R +
CTA de clôture. Connecté, le CTA devient « Ouvrir la console » ; sinon « Connexion / Inscription ».

**Elle doit s'ouvrir même quand la base n'est pas configurée** — c'est précisément le moment où on a le
plus besoin de la lire. Un échec de `currentUser()` est donc avalé et la page se rend comme déconnectée
(`src/app/page.tsx`) plutôt que de laisser la page d'accueil renvoyer 500 avec tout le reste.

La Q&R utilise `<details>` natif plutôt qu'un accordéon fait main : la page est un composant serveur,
elle doit se déplier sans JS, et le navigateur fait déjà correctement le clavier et le lecteur d'écran.

**La barre du haut abandonne des éléments par priorité, pas à un point de rupture fixe.** Le nom du
projet fait 23 caractères, mais « Connexion / Inscription » est presque deux fois plus large en français
qu'en chinois : n'importe quel point de rupture codé en dur couperait trop tôt ou trop tard dans certaines
langues. `src/components/LandingBarFit.tsx` mesure : quand la barre ne peut pas tout contenir, le
sélecteur de thème et le CTA de connexion partent **ensemble**, ce qui garantit que la marque, le nom
complet du projet et le lien GitHub restent. Sur un ordinateur, rien n'est jamais abandonné.

La section sur l'appli bureau parle de `MX-Desktop-Sharing-APP` (messagerie auto-hébergée, chiffrée de
bout en bout + partage d'écran). **Pas une ligne n'en a été écrite**, donc toute cette section est
formulée avec « envisager » et « avoir l'intention de » et porte un badge « au stade du concept » —
l'écrire comme un fait accompli sur une page d'accueil ne serait qu'une fausse promesse. Les deux CTA
pointent vers les issues et les discussions de ce dépôt ; le projet n'a ni adresse e-mail ni formulaire
de contact séparés.

### La marque

Un cube isométrique (le nœud LiveKit auquel une salle est liée) avec un coin soulevé au-dessus (le flux
qui part). Les deux formes partagent la même pente isométrique 2:1, si bien que les deux bras du coin
soulevé sont exactement parallèles aux arêtes du dessus du cube.

`src/components/BrandMark.tsx` est la source unique de vérité ; les trois faces tirent leurs couleurs de
`--mx-mark-{top,right,left,signal}`, définies par thème — utiliser l'opacité pour l'ombre et la lumière
inverserait l'éclairage sur fond sombre. `public/` contient aussi des fichiers autonomes :
`logo-mark.svg` (fond clair), `logo-mark-dark.svg`, `logo-tile.svg` (avec une plaque, pour les favicons /
icônes d'application), `logo-glyph.svg` (monochrome) et `logo-lockup.svg` (composition horizontale).


## Modèle d'autorisation

`requireMember` doit passer avant qu'un jeton soit signé. Le grant qui en sort est :

```ts
{ roomJoin: true, room: <le code de cette salle>, canSubscribe: true, canPublish: <selon le rôle> }
```

`room` ne peut contenir qu'un seul nom de salle, donc ce jeton ne peut physiquement pas servir à
s'abonner à une autre salle. Il n'accorde ni `roomCreate` ni `roomAdmin` ni `roomList` — les salles sont
créées par le serveur.

Retirer quelqu'un demande trois choses à la fois, sinon le retrait fuit (tout est implémenté) : supprimer
la ligne de membre (plus aucun jeton ne peut être signé), `RemoveParticipant` (couper la connexion
courante, car un jeton déjà émis reste valide jusqu'à expiration), et supprimer son ingress (sinon son
OBS peut continuer à pousser dans la salle).

L'interrupteur « Diffusion OBS », c'est la même histoire — retourner un drapeau en base ne ferme rien,
parce que cette clé de flux est toujours valide côté LiveKit. Donc à la fermeture, deux choses arrivent à
chaque ingress vivant de la salle : `DeleteIngress` (supprimer la ressource, pour qu'une ancienne clé ne
puisse plus se connecter) et `RemoveParticipant` (éjecter le participant `obs:` pour que tout le monde
cesse immédiatement de recevoir sa vidéo — la doc ne dit pas si DeleteIngress met aussi fin à une session
en cours, et ça ne vaut pas le pari) ; ensuite la ligne est marquée révoquée, et enfin le drapeau est
écrit pour bloquer les nouvelles demandes de génération. Le coût est que chacun doit générer une nouvelle
URL après réouverture : LiveKit a bien une fermeture douce qui conserve la clé,
`UpdateIngress(enabled=false)`, mais l'`updateIngress` du SDK serveur JS n'expose pas `enabled` (il
reconstruit la requête à partir d'une liste de champs figée et jette tout le reste), donc s'en servir
supposerait d'assembler une requête Twirp à la main. Mieux vaut faire changer une clé une fois que livrer
un interrupteur qui « a l'air coupé sans l'être ».

## Combien de temps dure le palier gratuit

C'est toute la raison pour laquelle les utilisateurs apportent leur propre nœud. Le plan Build gratuit de
LiveKit Cloud est compté par **project** ; dépasser échoue franchement et n'est jamais facturé, et
plusieurs projects gratuits sur un même compte **partagent** l'enveloppe :

- 5 000 minutes-participant WebRTC
- 50 Go de bande passante sortante
- 100 participants simultanés, 2 Ingress / Egress simultanés chacun
- 60 minutes de transcodage (**c'est exactement pourquoi WHIP et non RTMP** — l'entrée RTMP transcode
  toujours, ce qui ne fait qu'une heure par mois)

Le point clé : les participants ingress / egress **ne comptent pas** dans les minutes de connexion, donc
seuls les spectateurs en consomment.

Calculé par débit spectateur (les 50 Go de sortie sont le goulot principal) :

| Débit de diffusion | Trafic par minute-spectateur | Minutes-spectateur sur 50 Go | En heures-spectateur |
| --- | --- | --- | --- |
| 4 Mbps (1080p haut débit) | 30 Mo | 1 667 | ≈ 28 h |
| 2,5 Mbps (1080p standard) | 18,75 Mo | 2 667 | ≈ 44 h |
| 1,5 Mbps (720p) | 11,25 Mo | 4 444 | ≈ 74 h |
| 0,8 Mbps | 6 Mo | 5 000 (atteint le plafond de minutes) | ≈ 83 h |

**Environ 1,33 Mbps est la ligne de partage** : au-dessus, les 50 Go de bande passante s'épuisent en
premier ; en dessous, ce sont les 5 000 minutes.

Traduit en « combien de temps puis-je réellement tenir une réunion » — divisez les heures-spectateur par
le nombre de spectateurs :

- 1 qui partage + 1 qui regarde, 1080p : environ **44 heures/mois**
- 1 qui partage + 3 qui regardent, 1080p : environ **15 heures/mois**
- 1 qui partage + 9 qui regardent, 1080p : environ **5 heures/mois**

Conclusion : un seul project gratuit est une **enveloppe de test, pas une enveloppe de production**. C'est
pourquoi ce projet fait des nœuds un citoyen de première classe — chaque utilisateur connecte son propre
project LiveKit Cloud, et l'enveloppe passe de « une pour le propriétaire du site » à « une chacun ». Le
nœud intégré n'est là qu'en secours, alors pensez à lui fixer `maxRooms`.

## Limitations connues

- Le WHIP direct n'a **pas de simulcast côté serveur** ; il faut activer plusieurs couches soi-même dans
  OBS 32.1.0+.
- Diffuser depuis OBS avec un LiveKit auto-hébergé demande de déployer Ingress + Redis séparément (voir
  l'option deux plus haut).
- Il n'y a pas d'outil de rotation de clé : dès que `CREDENTIAL_ENCRYPTION_KEY` est remplacée, tous les
  identifiants de nœud stockés deviennent indéchiffrables.
- Il n'y a pas de tableau de bord de quota ; il faut estimer depuis le tableau ci-dessus.

Le raisonnement derrière les compromis et le reste de la liste de tâches sont dans [TASKS.md](TASKS.md).

## Références

- [Quotas et limites LiveKit](https://docs.livekit.io/cloud/quotas-and-limits/)
- [Tarifs LiveKit](https://livekit.io/pricing)
- [Auto-hébergement](https://docs.livekit.io/transport/self-hosting/deployment/) · [Exécution locale](https://docs.livekit.io/home/self-hosting/local/) · [Ingress](https://docs.livekit.io/home/self-hosting/ingress/)
