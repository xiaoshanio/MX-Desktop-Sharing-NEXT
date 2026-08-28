/**
 * Français.
 *
 * L'ensemble des clés est défini par ./en (type `Messages`) : une clé manquante ou mal
 * orthographiée échoue au `npm run typecheck` au lieu d'afficher une clé brute.
 * Les `{name}` sont remplacés par t(key, vars) ; `**gras**`, `*italique*` et
 * `` `code` `` sont rendus par <RichText>.
 */

import type { Messages } from "./types";

const fr: Messages = {
  /* ============================================================
     Brand
     ============================================================ */
  "brand.tagline": "Un nœud par salle, une URL de diffusion par personne",
  "brand.subtitle": "LiveKit multi-nœuds",

  /* ============================================================
     Shared verbs and labels
     ============================================================ */
  "common.cancel": "Annuler",
  "common.confirm": "OK",
  "common.save": "Enregistrer",
  "common.saving": "Enregistrement…",
  "common.delete": "Supprimer",
  "common.refresh": "Actualiser",
  "common.working": "Traitement…",
  "common.loading": "Chargement",
  "common.loadingEllipsis": "Chargement…",
  "common.close": "Fermer",
  "common.gotIt": "Compris",
  "common.errorTitle": "Une erreur est survenue",
  "common.copied": "Copié",
  "common.copy": "Copier {label}",
  "common.reveal": "Afficher {label}",
  "common.hide": "Masquer {label}",
  "common.copyPlain": "Copier",
  "common.revealPlain": "Afficher",
  "common.hidePlain": "Masquer",
  "common.notifications": "Notifications",
  "common.dismissNotification": "Fermer la notification",
  "common.retry": "Réessayer",
  "common.unlimited": "Illimité",
  "common.never": "Jamais",
  "common.system": "Système",
  "common.dash": "—",

  /* ============================================================
     Theme + language switchers
     ============================================================ */
  "theme.label": "Thème",
  "theme.system": "Suivre le système",
  "theme.light": "Clair",
  "theme.dark": "Sombre",
  "theme.nextSystem": "Thème sombre — passer au thème du système",
  "theme.nextLight": "Thème du système — passer au thème clair",
  "theme.nextDark": "Thème clair — passer au thème sombre",
  "lang.label": "Langue",
  "lang.change": "Changer de langue",

  /* ============================================================
     App shell
     ============================================================ */
  "shell.openNav": "Ouvrir la navigation",
  "shell.closeNav": "Fermer la navigation",
  "shell.mainNav": "Navigation principale",
  "shell.workspace": "Espace de travail",
  "shell.expandSidebar": "Déplier le panneau latéral",
  "shell.collapseSidebar": "Replier le panneau latéral",
  "shell.back": "Retour",
  "shell.online": "Connecté",
  "shell.offline": "Hors ligne",
  "shell.nav.rooms": "Salles",
  "shell.nav.nodes": "Nœuds LiveKit",
  "shell.nav.me": "Profil",
  "shell.nav.admin": "Administration",
  "shell.role.admin": "Admin",
  "shell.role.user": "Utilisateur",
  "shell.menu.profile": "Profil",
  "shell.menu.admin": "Administration",
  "shell.menu.logout": "Se déconnecter",
  "shell.menu.loggingOut": "Déconnexion…",
  /* ============================================================
     Role / health labels (lib/labels.ts)
     ============================================================ */
  "label.role.owner": "Propriétaire",
  "label.role.publisher": "Peut diffuser",
  "label.role.viewer": "Lecture seule",
  "label.health.unknown": "Non vérifié",
  "label.health.ok": "Opérationnel",
  "label.health.bad": "En échec",

  /* ============================================================
     Sign in / sign up
     ============================================================ */
  "auth.subtitle":
    "Un nœud par salle, une URL de diffusion par personne. Envoyez votre écran aux membres de la salle depuis OBS ou directement depuis le navigateur.",
  "auth.home": "Retour à l'accueil",
  "auth.tabs": "Connexion ou inscription",
  "auth.signIn": "Se connecter",
  "auth.signUp": "S'inscrire",
  "auth.closed":
    "Les inscriptions sont désactivées sur ce site — les comptes existants peuvent toujours se connecter.",
  "auth.oauthContinue": "Continuer avec {provider}",
  "auth.orEmail": "ou par e-mail",
  "auth.methods": "Méthode de connexion",
  "auth.methodPassword": "Mot de passe",
  "auth.methodCode": "Code par e-mail",
  "auth.email": "E-mail",
  "auth.displayName": "Nom affiché",
  "auth.displayNameHint": "Le nom visible dans la liste des membres d'une salle.",
  "auth.password": "Mot de passe",
  "auth.code": "Code par e-mail",
  "auth.codePlaceholder": "6 chiffres",
  "auth.resendIn": "Renvoyer ({seconds} s)",
  "auth.resend": "Rien reçu ? Renvoyer",
  "auth.submitBusy": "Traitement…",
  "auth.submitRegister": "Créer le compte",
  "auth.submitVerify": "Vérifier et se connecter",
  "auth.submitSendCode": "Envoyer le code",
  "auth.submitLogin": "Se connecter",
  "auth.codeSent": "Code envoyé à {email}. Il est valable 10 minutes.",
  "auth.oauthFailedTitle": "Échec de la connexion externe",
  "auth.footRegister":
    "L'inscription vous donne votre propre espace de travail et vos propres nœuds LiveKit.",
  "auth.footLogin":
    "Vous avez reçu un lien d'invitation ? Ouvrez-le, connectez-vous et vous rejoindrez la salle automatiquement.",
  /* ============================================================
     Invite landing page
     ============================================================ */
  "join.working": "Connexion à la salle",
  "join.workingBody": "Vérification du lien d'invitation — ce ne sera pas long.",
  "join.failed": "Impossible de rejoindre",
  "join.failedBody": "Ce lien d'invitation n'a pas pu être utilisé.",
  "join.checking": "Vérification du lien d'invitation…",
  "join.failedHint":
    "Le lien a peut-être expiré, été révoqué ou atteint sa limite d'utilisations. Demandez-en un nouveau au propriétaire de la salle.",
  "join.backToConsole": "Retour à la console",

  /* ============================================================
     Turnstile (human verification)
     ============================================================ */
  "turnstile.blocked":
    "Impossible de charger le script de vérification depuis challenges.cloudflare.com. Le réseau le bloque peut-être, ou un bloqueur de publicités s'interpose.",
  "turnstile.noInit":
    "Le script de vérification s'est chargé mais n'a pas pu s'initialiser. Rechargez la page.",
  "turnstile.renderFailed": "Échec de l'affichage de la vérification humaine : {message}",
  "turnstile.initFailed":
    "Échec de l'initialisation de la vérification humaine. Rechargez la page.",
  "turnstile.initFailedCode":
    "Échec de l'initialisation de la vérification humaine (erreur {code}).",
  "turnstile.badDomain":
    "Cette Site Key n'est pas autorisée sur {hostname} (erreur {code}). Dans Cloudflare → Turnstile → paramètres de ce site, ajoutez {hostname} aux Domains ; ajoutez localhost séparément pour le développement local.",
  "turnstile.badKey":
    "Site Key invalide (erreur {code}). Vérifiez que vous avez collé la Site Key et non la Secret Key — on les confond facilement.",
  "turnstile.badBrowser":
    "Ce navigateur n'est pas pris en charge (erreur {code}). Essayez une version récente de Chrome, Edge ou Firefox.",
  "turnstile.timeout": "Vérification expirée (erreur {code}). Réessayez.",
  "turnstile.execFailed":
    "L'exécution de la vérification humaine a échoué (erreur {code}). Un rechargement de la page suffit généralement ; si cela persiste, le problème est côté Cloudflare.",
  "turnstile.staleScript":
    "api.js est obsolète (erreur {code}). Videz le cache du navigateur et réessayez.",
  /* ============================================================
     Client-side error humanising (lib/error-text.ts)
     ============================================================ */
  "err.signalConnection":
    "Impossible de joindre le serveur média de la salle. Vérifiez le réseau, ou que ce nœud LiveKit est toujours actif.",
  "err.disconnected": "La connexion à la salle a été perdue. Reconnexion…",
  "err.roomFull": "La salle est pleine.",
  "err.badToken":
    "Le jeton d'accès est invalide ou expiré. Recharger la page en émet un nouveau.",
  "err.permissionDenied": "Vous n'avez pas la permission de faire cela.",
  "err.serverUnavailable": "Le serveur média est momentanément indisponible. Réessayez sous peu.",
  "err.quota": "Ce nœud LiveKit a épuisé son quota.",
  "err.screenShareDenied":
    "Le navigateur a refusé le partage d'écran. Autorisez-le dans les permissions du site, à côté de la barre d'adresse.",
  "err.noCaptureDevice":
    "Aucun périphérique de capture disponible, ou un autre programme le monopolise.",
  "err.unsupportedBrowser":
    "Ce navigateur ne prend pas en charge cette fonction. Essayez Chrome ou Edge.",
  "err.network": "La requête réseau a échoué. Vérifiez votre connexion.",
  "err.aborted": "La requête a été interrompue.",
  "err.timeout": "La requête a expiré. Réessayez sous peu.",
  "err.cors":
    "La source vidéo n'autorise pas les lectures cross-origin depuis ce site (CORS). Activez-le sur le serveur qui héberge la vidéo.",
  "err.range":
    "La source vidéo ne prend pas en charge les requêtes Range : impossible de lire pendant le téléchargement.",
  "err.codec":
    "Le navigateur ne sait pas décoder ce format. La vidéo doit être en H.264/HEVC, l'audio en AAC/FLAC/Opus.",
  "err.unknown": "L'opération a échoué pour une raison inconnue.",
  "err.httpFailed": "Requête échouée (HTTP {status})",
  /* ============================================================
     Dashboard (room list)
     ============================================================ */
  "dash.loading": "Chargement des salles…",
  "dash.heading": "Salles",
  "dash.refreshed": "Actualisé",
  "dash.stat.rooms": "Salles : {count}",
  "dash.stat.active": "Actives : {count}",
  "dash.stat.online": "En ligne : {count}",
  "dash.stat.nodes": "Nœuds utilisables : {count}",
  "dash.title": "Vos salles",
  "dash.subtitle":
    "Cliquez sur une carte pour entrer. Chaque salle est liée à un seul nœud LiveKit, et son trafic média ne passe que par ce nœud.",
  "dash.create": "Nouvelle salle",
  "dash.empty.title": "Aucune salle pour l'instant",
  "dash.empty.action": "Créer votre première salle",
  "dash.empty.body":
    "Créez une salle et vous obtenez votre propre URL de diffusion OBS — ou partagez simplement votre écran depuis le navigateur. Si quelqu'un vous a donné un code de salle, utilisez le champ de recherche ci-dessus.",
  "dash.created": "Salle créée",
  "dash.find.placeholder": "Saisissez un code de salle, ou cherchez dans vos salles",
  "dash.find.label": "Saisir un code de salle ou chercher une salle",
  "dash.find.clear": "Effacer",
  "dash.find.noMatch":
    "Aucune salle correspondante. Un code de salle fait 10 caractères en minuscules et chiffres — vérifiez la saisie.",
  "dash.find.node": "Nœud {name}",
  "dash.find.closed": "Fermée",
  "dash.find.direct": "Aller directement à",
  "dash.find.directHint":
    "Ce n'est pas une salle que vous avez rejointe — vous n'y entrerez que si vous y avez été invité.",
  "dash.card.active": "Active",
  "dash.card.closed": "Fermée",
  "dash.card.copyCode": "Copier le code de la salle",
  "dash.card.codeCopied": "Code de salle copié",
  "dash.card.clipboardBlocked":
    "Le navigateur a bloqué l'accès au presse-papiers — sélectionnez le texte et copiez-le à la main.",
  "dash.card.online": "{online}/{total} en ligne",
  "dash.card.node": "Nœud {name}",
  "dash.card.nodeBuiltin": " (intégré)",
  "dash.card.enter": "Entrer",
  "dash.new.title": "Créer une salle",
  "dash.new.busy": "Création…",
  "dash.new.name": "Nom de la salle",
  "dash.new.namePlaceholder": "Démo hebdomadaire",
  "dash.new.node": "Quel nœud utiliser",
  "dash.new.nodeBuiltin": "{name} (intégré · quota partagé)",
  "dash.new.nodeMine": "{name} (le mien)",
  "dash.new.nodeNoIngress": " · pas de diffusion OBS",
  "dash.new.nodeNew": "+ Connecter un nouveau jeu d'identifiants LiveKit…",
  "dash.new.hintNoIngress":
    "L'Ingress de ce nœud est indisponible : la salle n'offrira pas d'URL de diffusion OBS. Le partage depuis le navigateur fonctionne toujours.",
  "dash.new.hintFixed": "Le nœud d'une salle ne peut plus être changé après sa création.",
  "dash.new.noNodesTitle": "Aucun nœud utilisable",
  "dash.new.noNodesBody":
    "Choisissez « Connecter un nouveau jeu d'identifiants LiveKit » ci-dessus, ou ajoutez-en un d'abord depuis la page des nœuds LiveKit.",
  /* ============================================================
     LiveKit credential fields (shared by "add node" and "create room")
     ============================================================ */
  "node.needCreds": "Il vous faut une URL LiveKit / API Key / API Secret",
  "node.guideHide": "Masquer le guide",
  "node.guideShow": "Je n'en ai pas — comment faire ?",
  "node.guide.title": "Ouvrir un nœud LiveKit Cloud gratuit en trois minutes",
  "node.guide.step1a": "Ouvrez",
  "node.guide.step1b":
    "et inscrivez-vous. Le plan gratuit Build ne demande pas de carte bancaire.",
  "node.guide.step2":
    "Créez un project, avec le nom que vous voulez. Vous obtiendrez une URL `wss://xxx.livekit.cloud`.",
  "node.guide.step3":
    "Allez dans Settings → Keys → créez une API Key. Vous obtiendrez une `API Key` et un `API Secret`. Le secret n'est affiché qu'une fois — copiez-le tout de suite.",
  "node.guide.step4":
    "Renseignez ces trois valeurs ci-dessous. Avant d'enregistrer, ce site appelle réellement l'API LiveKit pour les vérifier ; les valeurs incorrectes ne sont jamais stockées.",
  "node.guide.note":
    "Pourquoi apporter votre propre nœud : le quota gratuit est compté par project (environ 5 000 minutes-participant WebRTC + 50 Go de sortie par mois ; au-delà, les requêtes échouent simplement et rien n'est facturé). Avec votre propre nœud, vous consommez votre quota et ne concurrencez personne.",
  "node.field.name": "Nom du nœud",
  "node.field.namePlaceholder": "Mon LiveKit",
  "node.field.nameHint": "Pour vous seul — appelez-le comme vous voulez.",
  "node.field.url": "URL LiveKit",
  "node.field.urlHint":
    "Coller une URL en https:// convient aussi — elle est convertie en wss:// pour vous.",
  "node.field.secretHint": "Chiffré au repos ; aucune API ne le renvoie jamais.",

  /* ============================================================
     LiveKit nodes page
     ============================================================ */
  "nodes.loading": "Chargement des nœuds…",
  "nodes.heading": "Nœuds LiveKit",
  "nodes.stat.total": "Nœuds : {count}",
  "nodes.stat.mine": "À moi : {count}",
  "nodes.stat.healthy": "Opérationnels : {count}",
  "nodes.subtitle":
    "Connectez vos propres identifiants LiveKit et vos salles consomment votre quota gratuit au lieu de se disputer celui d'un autre.",
  "nodes.add": "Connecter un nœud",
  "nodes.empty.title": "Aucun nœud pour l'instant",
  "nodes.empty.action": "Connecter mon premier nœud",
  "nodes.empty.body":
    "Le plan gratuit Build de LiveKit Cloud ne demande pas de carte bancaire et prend trois minutes. À l'enregistrement, ce site appelle réellement l'API pour vérifier les identifiants — les mauvais ne sont jamais stockés.",
  "nodes.badge.builtin": "Intégré",
  "nodes.badge.mine": "À moi",
  "nodes.badge.theirs": "À quelqu'un d'autre",
  "nodes.badge.disabled": "Désactivé",
  "nodes.ingressOk": "Ingress disponible",
  "nodes.ingressBad": "Ingress indisponible",
  "nodes.check": "Vérifier",
  "nodes.checking": "Vérification…",
  "nodes.rotate": "Changer les clés",
  "nodes.delete": "Supprimer le nœud",
  "nodes.webhookHint":
    "Dans la console LiveKit, allez dans Settings → Webhooks et collez l'URL ci-dessous. La présence des membres est mise à jour par ce biais.",
  "nodes.webhookLabel": "URL du webhook",
  "nodes.saved": "Nœud enregistré — identifiants vérifiés.",
  "nodes.rotated":
    "Clés de « {name} » mises à jour ; les nouveaux identifiants ont passé la vérification.",
  "nodes.deleteTitle": "Supprimer le nœud",
  "nodes.deleteBody":
    "Supprimer « {name} » ? Ses salles actives doivent d'abord être fermées, sinon la suppression est refusée.",
  "nodes.add.title": "Connecter mon nœud LiveKit",
  "nodes.add.busy": "Vérification et enregistrement…",
  "nodes.add.submit": "Enregistrer le nœud",
  "nodes.rotate.title": "Mettre à jour les clés de « {name} »",
  "nodes.rotate.busy": "Vérification et mise à jour…",
  "nodes.rotate.submit": "Mettre à jour les clés",
  "nodes.rotate.note":
    "Les nouveaux identifiants sont testés sur l'API LiveKit avant toute écriture. En cas d'échec, rien ne change et les anciennes clés continuent de fonctionner.",
  "nodes.rotate.newKey": "Nouvelle API Key",
  "nodes.rotate.newSecret": "Nouveau API Secret",
  /* ============================================================
     Profile page
     ============================================================ */
  "me.loading": "Chargement de votre profil…",
  "me.heading": "Profil",
  "me.subtitle":
    "Ceci modifie la carte de membre que les autres voient à gauche de la zone vidéo.",
  "me.preview.title": "Aperçu de la carte",
  "me.preview.desc":
    "Voilà comment vous apparaissez aux autres une fois dans une salle. Sans bannière chargée, la couleur attribuée à votre compte est utilisée.",
  "me.preview.you": "Vous",
  "me.avatar.title": "Avatar",
  "me.avatar.desc":
    "Affiché carré et recadré en cercle. Le navigateur le réduit à 256 px avant l'envoi.",
  "me.avatar.current": "Avatar actuel",
  "me.banner.title": "Bannière de la carte",
  "me.banner.desc": "Le bandeau en haut de la carte. Réduit à 960×540 et recadré au centre.",
  "me.pick": "Choisir une image",
  "me.uploading": "Envoi…",
  "me.reset": "Rétablir par défaut",
  "me.avatarSaved": "Avatar mis à jour",
  "me.bannerSaved": "Bannière mise à jour",
  "me.avatarReset": "Avatar rétabli par défaut.",
  "me.bannerReset": "Bannière rétablie à la couleur par défaut.",
  "me.accent.title": "Couleur de la carte",
  "me.accent.desc":
    "Utilisée quand aucune bannière n'est définie. Une teinte est attribuée à votre compte par défaut.",
  "me.accent.saved": "Couleur mise à jour.",
  "me.accent.iris": "Iris",
  "me.accent.azure": "Azur",
  "me.accent.teal": "Sarcelle",
  "me.accent.lime": "Citron vert",
  "me.accent.amber": "Ambre",
  "me.accent.rose": "Rose",
  "me.accent.magenta": "Magenta",
  "me.accent.slate": "Ardoise",
  "me.account.title": "Compte",
  "me.account.desc": "Votre nom affiché apparaît dans les listes de membres et sur votre carte.",
  "me.account.nameSaved": "Nom affiché mis à jour.",
  "me.account.emailVerified": "E-mail vérifié",
  "me.account.emailUnverified": "E-mail non vérifié",
  "me.account.hasPassword": "Mot de passe défini",
  "me.account.noPassword": "Connexion externe / code e-mail uniquement",
  "me.tour.title": "Astuce de prise en main",
  "me.tour.desc":
    "L'astuce « où est mon URL de diffusion » affichée la première fois que vous entrez dans une salle.",
  "me.tour.reset": "Afficher l'astuce à nouveau",
  "me.tour.done":
    "Réinitialisé — l'astuce s'affichera une fois de plus à votre prochaine entrée dans une salle",
  /* ============================================================
     Admin — shell, nodes, users
     ============================================================ */
  "admin.loading": "Chargement des données du site…",
  "admin.heading": "Administration",
  "admin.stat.nodes": "Nœuds : {count}",
  "admin.stat.users": "Utilisateurs : {count}",
  "admin.stat.admins": "Admins : {count}",
  "admin.subtitle": "Tous les nœuds et utilisateurs du site. Réservé aux administrateurs.",
  "admin.tabs": "Sections d'administration",
  "admin.tab.nodes": "Nœuds",
  "admin.tab.users": "Utilisateurs",
  "admin.tab.services": "Services externes",
  "admin.tab.site": "Paramètres du site",
  "admin.promote.title": "Définir comme nœud intégré",
  "admin.promote.confirm": "Définir comme intégré",
  "admin.promote.body":
    "Définir « {name} » comme nœud intégré du site ? Le nœud intégré actuel redevient un nœud ordinaire, et tous les utilisateurs sans identifiants propres utiliseront désormais celui-ci.",
  "admin.nodes.emptyTitle": "Aucun nœud pour l'instant",
  "admin.nodes.emptyBody":
    "Ajoutez-en un depuis la page des nœuds LiveKit avec « Connecter un nœud », puis revenez le définir comme nœud intégré du site.",
  "admin.nodes.title": "Nœuds",
  "admin.nodes.desc":
    "Le nœud intégré est celui partagé par tout le site — les utilisateurs peuvent créer des salles sans apporter d'identifiants, et c'est son quota qui paie. N'importe quel nœud peut être promu ; il n'y en a jamais qu'un.",
  "admin.nodes.col.node": "Nœud",
  "admin.nodes.col.kind": "Type",
  "admin.nodes.col.activeRooms": "Salles actives",
  "admin.nodes.col.enabled": "Activé",
  "admin.nodes.col.public": "Public",
  "admin.nodes.col.maxRooms": "Limite de salles",
  "admin.nodes.checkFailed": "Vérification échouée",
  "admin.nodes.kindBuiltin": "Intégré",
  "admin.nodes.kindUser": "Utilisateur",
  "admin.nodes.enableAria": "Activer {name}",
  "admin.nodes.publicAria": "Rendre {name} public",
  "admin.nodes.maxRoomsAria": "Limite de salles pour {name}",
  "admin.nodes.maxRoomsPlaceholder": "Illimité",
  "admin.nodes.makeBuiltin": "Définir comme intégré",
  "admin.users.title": "Utilisateurs",
  "admin.users.desc":
    "Un compte désactivé ne peut plus recevoir de jeton, donc il n'entre plus dans aucune salle.",
  "admin.users.col.user": "Utilisateur",
  "admin.users.col.role": "Rôle",
  "admin.users.col.status": "État",
  "admin.users.me": "Moi",
  "admin.users.admin": "Admin",
  "admin.users.user": "Utilisateur",
  "admin.users.disabled": "Désactivé",
  "admin.users.ok": "Actif",
  "admin.users.demote": "Rétrograder en utilisateur",
  "admin.users.promote": "Nommer admin",
  "admin.users.enable": "Activer",
  "admin.users.disable": "Désactiver",
  /* ============================================================
     Admin — site settings
     ============================================================ */
  "site.loading": "Chargement des paramètres du site…",
  "site.openTitle": "Les inscriptions sont ouvertes",
  "site.closedTitle":
    "Les inscriptions sont fermées — les comptes existants peuvent toujours se connecter",
  "site.openBody":
    "N'importe qui peut créer un compte : e-mail + mot de passe, une première connexion GitHub / Google, ou une première connexion par code e-mail. Ces trois voies créent un compte sur le champ.",
  "site.closedBody":
    "Les trois voies de création de compte sont bloquées et renvoient « les inscriptions sont désactivées sur ce site ». Les comptes existants ne sont pas affectés et peuvent toujours utiliser mot de passe, connexion externe et codes e-mail. Notez que les liens d'invitation exigent aussi un compte au préalable — rouvrez cet interrupteur pour laisser entrer de nouvelles personnes.",
  "site.card.title": "Inscriptions",
  "site.card.desc":
    "Contrôle si des inconnus peuvent créer un compte ici. Appliqué côté serveur (avant l'émission d'une session), pas en masquant un bouton.",
  "site.switch.label": "Autoriser les inscriptions",
  "site.switch.hint":
    "Désactivé : l'API d'inscription refuse d'emblée ; la connexion externe n'accepte que les comptes déjà liés et rejette les autres sur le champ ; la connexion par code e-mail se comporte pareil — les comptes existants passent, les nouvelles adresses n'en créent plus.",
  "site.opened": "Les inscriptions sont maintenant ouvertes.",
  "site.closed": "Les inscriptions sont maintenant fermées.",

  /* ============================================================
     Admin — third-party services
     ============================================================ */
  "svc.loading": "Chargement des paramètres des services externes…",
  "svc.bannerTitle":
    "Les secrets sont chiffrés en base de données, pas dans les variables d'environnement",
  "svc.bannerBody":
    "Ces secrets sont chiffrés en AES-256-GCM dans `service_credentials`, et la clé maîtresse peut vivre hors de la base (`CREDENTIAL_ENCRYPTION_KEY`) — un dump complet de la base reste indéchiffrable. Aucune API ne renvoie un secret en clair ; ce que vous voyez ci-dessous est un masque. Les changements prennent effet immédiatement, sans redéploiement.",
  "svc.notConfigured": "Non configuré",
  "svc.enabled": "Activé",
  "svc.disabled": "Désactivé",
  "svc.callbackLabel": "URL de rappel (collez-la exactement dans la console du fournisseur)",
  "svc.callbackShort": "URL de rappel",
  "svc.callbackHint":
    "Se tromper ici est la cause la plus fréquente d'échec de la connexion externe — le fournisseur rejette la demande d'autorisation d'emblée.",
  "svc.secretCurrent": "{hint} Actuel : {mask}. Laissez vide pour le conserver.",
  "svc.secretKeepPlaceholder": "Vide = conserver l'actuel",
  "svc.fromName": "Nom d'expéditeur affiché (optionnel)",
  "svc.fromNameHint": "Le nom que voient les destinataires, par ex. « {app} ».",
  "svc.enableLabel": "Activé",
  "svc.enableHintTurnstile":
    "Désactivé, la page de connexion ne demande plus de vérification humaine.",
  "svc.enableHintResend":
    "Désactivé, la page de connexion ne propose plus le « code par e-mail ».",
  "svc.enableHintOauth": "Désactivé, la page de connexion n'affiche plus ce bouton.",
  "svc.saveChanges": "Enregistrer les modifications",
  "svc.removeConfig": "Supprimer la configuration",
  "svc.savedToast": "{title} enregistré.",
  "svc.removedToast": "{title} supprimé.",
  "svc.removeTitle": "Supprimer la configuration {title}",
  "svc.removeBodyTurnstile":
    "Après suppression, la connexion, l'inscription et l'envoi de code ne demandent plus de vérification humaine. Continuer ?",
  "svc.removeBodyResend":
    "Après suppression, la connexion par code e-mail cesse de fonctionner et les codes déjà envoyés ne peuvent plus être vérifiés. Continuer ?",
  "svc.removeBodyOauth":
    "Après suppression, ce bouton de connexion externe disparaît. Quiconque s'était lié par ce biais sans jamais définir de mot de passe sera bloqué dehors — assurez-vous qu'ils ont un autre moyen d'entrer.",
  /* ============================================================
     Admin — the four service forms
     ============================================================ */
  "svc.github.title": "Connexion GitHub",
  "svc.github.desc": "GitHub → Settings → Developer settings → OAuth Apps → New OAuth App.",
  "svc.github.publicLabel": "Client ID",
  "svc.github.publicHint": "Le Client ID sur la page de l'OAuth App.",
  "svc.github.secretLabel": "Client Secret",
  "svc.github.secretHint":
    "Affiché une seule fois à la création — ensuite, même GitHub ne peut plus vous le montrer. Enregistrez-le avant de quitter cette page.",
  "svc.google.title": "Connexion Google",
  "svc.google.desc":
    "Google Cloud Console → API et services → Identifiants → Créer un ID client OAuth (application Web).",
  "svc.google.publicLabel": "Client ID",
  "svc.google.publicHint": "De la forme xxxxx.apps.googleusercontent.com.",
  "svc.google.secretLabel": "Client Secret",
  "svc.google.secretHint": "Le secret client sur la page de détail de l'identifiant.",
  "svc.turnstile.title": "Vérification humaine Turnstile",
  "svc.turnstile.desc":
    "Tableau de bord Cloudflare → Turnstile → Add site. Une fois configuré, la connexion, l'inscription et l'envoi de code demandent tous une vérification.",
  "svc.turnstile.publicLabel": "Site Key",
  "svc.turnstile.publicHint":
    "Elle finit dans le HTML de la page de connexion — elle est publique par conception.",
  "svc.turnstile.secretLabel": "Secret Key",
  "svc.turnstile.secretHint":
    "Sert à la validation côté serveur ; elle ne doit jamais atteindre le front.",
  "svc.resend.title": "Service e-mail Resend",
  "svc.resend.desc":
    "resend.com → API Keys. Le domaine d'envoi doit être vérifié dans Resend, sinon les e-mails sont rejetés. Une fois configuré, la page de connexion propose le « code par e-mail ».",
  "svc.resend.publicLabel": "Adresse d'expédition",
  "svc.resend.publicHint":
    "Doit appartenir à un domaine vérifié dans Resend, par ex. no-reply@votre-domaine.com.",
  "svc.resend.secretLabel": "API Key",
  "svc.resend.secretHint": "De la forme re_xxxxxxxx.",
  /* ============================================================
     Room — chrome, status bar, stage
     ============================================================ */
  "room.heading": "Salle {code}",
  "room.entering": "Entrée dans la salle…",
  "room.fatalTitle": "Impossible d'ouvrir cette salle",
  "room.fatal.emptyTitle": "Aucun accès",
  "room.fatal.back": "Retour à la liste des salles",
  "room.fatal.body":
    "Aux non-membres, on répond que la salle n'existe pas — c'est délibéré, pour que personne ne puisse sonder les codes de salle un par un.",
  "room.backLabel": "Retour à la liste des salles",
  "room.action.share": "Partager cette salle (lien d'invitation)",
  "room.action.members": "Membres",
  "room.action.settings": "Paramètres de la salle et infos de diffusion",
  "room.action.newPlayer": "Nouveau lecteur synchronisé",
  "room.stat.code": "Code de salle {code}",
  "room.stat.node": "Nœud {name}",
  "room.stat.nodeBuiltin": " (intégré)",
  "room.stat.active": "Active",
  "room.stat.closed": "Fermée",
  "room.stat.members": "Membres : {count}",
  "room.closedTitle": "Salle fermée",
  "room.closedBody":
    "Plus aucun jeton ne peut être émis ; la vidéo et la diffusion sont indisponibles.",

  "channel.rooms.title": "Salles du canal",
  "channel.rooms.create": "Créer une salle",
  "channel.rooms.emptyTitle": "Pas encore de salles",
  "channel.rooms.emptyBody": "Les administrateurs du canal peuvent créer des salles, chacune avec son propre lecteur synchronisé",
  "channel.rooms.creator": "Créateur : {name}",
  "channel.rooms.backToList": "Retour à la liste des salles",

  "room.stage.live": "En direct",
  "room.stage.urlPlaceholder": "Entrer l'URL de lecture",
  "room.stage.urlPlay": "Lecture",
  "room.stage.fullscreen": "Plein écran",
  "room.stage.noSignal": "Aucun signal",
  "room.stage.inRoom": "Dans la salle : {count}",
  "room.stage.onlySelected": "Une seule personne affichée",
  "room.stage.modeScreen": "Partage d'écran",
  "room.stage.modePlayer": "Lecteur synchronisé",
  "room.stage.gettingPermission": "Obtention de la permission de diffuser…",
  "room.stage.viewerOnly":
    "Vous êtes en lecture seule — demandez au propriétaire de changer votre permission, ou d'activer « tout le monde peut partager »",
  "room.stage.tagObs": "OBS",
  "room.stage.tagScreen": "Partage d'écran",
  "room.stage.tagCamera": "Caméra",
  "room.stage.idleSelectedTitle": "Cette personne ne partage rien",
  "room.stage.idleTitle": "Personne ne diffuse encore",
  "room.stage.idleSelectedBody":
    "Utilisez « Afficher tout le monde » à gauche pour voir le reste de la salle.",
  "room.stage.idleBody":
    "Dès qu'une source se connecte, la vidéo apparaît ici — aucun rechargement nécessaire.",
  "room.offline.notConnected": "Non connecté",
  "room.offline.connecting": "Connexion à la salle…",
  "room.offline.closed": "Salle fermée",
  "room.offline.connectingBody": "Émission d'un jeton d'accès.",
  "room.offline.closedBody": "Une salle fermée n'émet aucun jeton et n'accepte aucune diffusion.",
  "room.share.busy": "Traitement…",
  "room.share.stop": "Arrêter le partage",
  "room.share.start": "Partager mon écran",
  "room.share.settings": "Paramètres de partage",
  "room.share.quality": "Paramètres de qualité",
  "room.share.resolution": "Résolution",
  "room.share.frameRate": "Fréquence d'images",
  "room.share.bitrate": "Débit binaire",
  "room.share.codec": "Codec",
  "room.share.codecAuto": "Automatique",
  "room.share.codecVP8": "VP8 (Meilleure compatibilité)",
  "room.share.codecVP9": "VP9 (Haute efficacité)",
  "room.share.codecH264": "H.264 (Accélération matérielle)",
  "room.share.codecAV1": "AV1 (Expérimental)",
  "room.share.presets": "Préréglages",
  "room.share.presetPresentation": "Présentation (Haute résolution, faible FPS)",
  "room.share.presetBalanced": "Équilibré (Recommandé)",
  "room.share.presetSmooth": "Fluide (FPS élevé)",
  "room.share.presetHQ": "Haute qualité (2K)",
  "room.share.presetCustom": "Personnalisé",
  "room.share.applyPreset": "Appliquer le préréglage",
  "room.share.save": "Enregistrer par défaut",
  "room.share.saved": "Enregistré — ces paramètres deviennent vos valeurs par défaut à chaque partage",
  /* ============================================================
     Room — participant rail + context menu
     ============================================================ */
  "rail.label": "Personnes en ligne",
  "rail.online": "En ligne : {count}",
  "rail.showAll": "Afficher tout le monde",
  "rail.empty": "Personne n'est encore là.",
  "rail.obs": "OBS",
  "rail.you": "Vous",
  "rail.onlineTag": "En ligne",
  "rail.hasVideo": " · partage",
  "rail.sharing": "Partage son écran",
  "rail.sharingScreen": "Partage d'écran",
  "rail.menu.ownerLocked": "Propriétaire de la salle — ni modifiable ni expulsable",
  "rail.menu.permission": "Permission",
  "rail.menu.current": " (actuel)",
  "rail.menu.kick": "Retirer de la salle",
  "rail.menu.kickBan": "Retirer et bannir",
  "room.roleChanged": "« {name} » passe à {role}",
  "room.kicked": "« {name} » a été retiré",
  "room.kickedBanned": "« {name} » a été retiré et ajouté à la liste de bannissement",
  "room.kick.titleBan": "Retirer et bannir",
  "room.kick.title": "Retirer le membre",
  "room.kick.confirmBan": "Retirer et bannir",
  "room.kick.confirm": "Retirer",
  "room.kick.bodyBan":
    "Retirer « {name} » de la salle et l'ajouter à la liste de bannissement ? Sa connexion est coupée immédiatement, son URL de diffusion est annulée, et ensuite **même un lien d'invitation ne le fera pas rentrer** jusqu'à ce que vous le débannissiez.",
  "room.kick.body":
    "Retirer « {name} » ? Cela coupe aussi sa connexion et supprime son URL de diffusion. Attention : un lien d'invitation encore en sa possession lui permet de revenir de lui-même — utilisez « Retirer et bannir » pour fermer cette porte.",

  /* ============================================================
     Room — coach mark + first-visit tip
     ============================================================ */
  "room.coach.title": "Vos infos de diffusion sont ici",
  "room.coach.body":
    "Pour revoir ou régénérer l'URL de diffusion OBS plus tard, cliquez sur cet engrenage dans la barre du haut → « Diffusion ».",
  "room.tip.title": "Bienvenue — voici votre URL de diffusion",
  "room.tip.intro":
    "Il y a deux façons d'envoyer de la vidéo dans cette salle : **« Partager mon écran »** au-dessus de la zone vidéo (direct depuis le navigateur, un clic), et l'**URL de diffusion OBS** ci-dessous.",
  "room.tip.noneTitle": "Vous n'avez pas encore d'URL de diffusion dans cette salle",
  "room.tip.noneViewer": "Le propriétaire vous a mis en lecture seule.",
  "room.tip.noneGate": "Le propriétaire a fermé le canal OBS de cette salle.",
  "room.tip.noneIngress": "L'Ingress de ce nœud est indisponible.",
  "room.tip.noneFoot":
    "Vous pouvez tout de même diffuser depuis le navigateur avec « Partager mon écran ».",
  "room.tip.serverLabel": "Server (OBS → Paramètres → Stream → Service : WHIP)",
  "room.tip.notGenerated":
    "Vous n'avez pas encore généré d'URL de diffusion. Elle est liée à « vous + cette salle » — personne d'autre ne peut l'obtenir ni l'utiliser.",
  "room.tip.generateNow": "La générer maintenant",
  /* ============================================================
     Room — modals, tabs, OBS panel
     ============================================================ */
  "room.people.title": "Membres de la salle",
  "room.people.tabs": "Membres et invitations",
  "room.people.tabMembers": "Membres",
  "room.people.tabInvites": "Invitations",
  "room.settings.title": "Paramètres de la salle",
  "room.settings.tabs": "Paramètres de la salle",
  "room.settings.tabPublish": "Diffusion",
  "room.settings.tabRoom": "Salle",
  "room.settings.tabLogs": "Journal d'audit",
  "room.settings.tabBans": "Liste de bannissement",
  "room.nodes.title": "Routes",
  "room.nodes.desc": "Ajouter vos propres nœuds LiveKit à cette salle",
  "room.nodes.selectLabel": "Sélectionner un nœud",
  "room.nodes.add": "Ajouter",
  "room.nodes.added": "Nœud ajouté",
  "room.nodes.col.name": "Nœud",
  "room.nodes.col.status": "Statut",
  "room.nodes.primary": "Principal",
  "room.nodes.secondary": "Secondaire",
  "room.nodes.setPrimary": "Définir comme principal",
  "room.nodes.primarySet": "Nœud principal mis à jour",
  "room.nodes.grantTitle": "Accorder l'accès au nœud",
  "room.nodes.grantDesc": "Donner à {name} l'accès à l'un de vos nœuds",
  "room.nodes.grant": "Accorder",
  "room.nodes.granted": "{name} peut maintenant utiliser ce nœud",
  "obs.title": "Diffusion OBS",
  "obs.noIngressTitle": "L'Ingress de ce nœud est indisponible",
  "obs.noIngressBody":
    "Aucune URL de diffusion OBS ne peut être émise. Vous pouvez toujours utiliser « Partager mon écran » au-dessus de la zone vidéo pour diffuser depuis le navigateur.",
  "obs.viewerTitle": "Vous êtes en lecture seule",
  "obs.viewerBody":
    "Le propriétaire vous a mis en lecture seule, donc il n'y a pas d'URL de diffusion. Demandez-lui de changer votre permission si vous devez diffuser.",
  "obs.gateTitle": "Le propriétaire a désactivé la diffusion OBS",
  "obs.gateBody":
    "Cette salle n'accepte pas les flux OBS et ne peut pas émettre d'URL de diffusion. « Partager mon écran » au-dessus de la zone vidéo fonctionne toujours depuis le navigateur.",
  "obs.myUrl": "Mon URL de diffusion OBS",
  "obs.myUrlDesc":
    "Liée à « vous + cette salle » — personne d'autre ne peut l'obtenir ni l'utiliser. Elle passe en WHIP direct, donc ne consomme aucun quota de transcodage.",
  "obs.generated": "Générée",
  "obs.notGenerated": "Non générée",
  "obs.generate": "Générer l'URL de diffusion",
  "obs.generating": "Génération…",
  "obs.step1": "OBS → Paramètres → Stream → Service : **WHIP**",
  "obs.step2": "Reportez les deux valeurs ci-dessous dans Server et Bearer Token",
  "obs.step3":
    "Le WHIP direct n'a pas de simulcast côté serveur. Pour plusieurs niveaux de qualité, activez-le vous-même dans OBS 32.1.0+ (1 à 4 couches).",
  "obs.serverLabel": "Server",
  "obs.serverShort": "URL du Server",
  "obs.tokenLabel": "Bearer Token (c'est la clé de flux)",
  "obs.tokenShort": "Bearer Token",
  "obs.regenerate": "Régénérer",
  "obs.revoke": "Révoquer",
  "obs.regenNote": "Régénérer invalide immédiatement l'ancienne URL.",
  "obs.revokeTitle": "Révoquer l'URL de diffusion",
  "obs.revokeBody":
    "Après révocation, OBS ne peut plus se connecter ; il faudrait générer une nouvelle URL et mettre OBS à jour. Continuer ?",
  "obs.ownerHint":
    "Vous voulez fermer complètement le canal OBS de cette salle ? C'est dans l'onglet « Salle ».",
  /* ============================================================
     Room — owner settings
     ============================================================ */
  "rset.share.title": "Qui peut partager son écran",
  "rset.share.desc":
    "Les nouveaux membres sont en lecture seule par défaut, donc ils ne voient pas le bouton « Partager mon écran » au-dessus de la vidéo. Pour laisser tout le monde partager, activez l'interrupteur ci-dessous ; pour n'autoriser que certaines personnes, faites un clic droit sur leur carte de membre à gauche de la vidéo et passez-les à « Peut diffuser ».",
  "rset.share.everyone": "Tout le monde",
  "rset.share.restricted": "Propriétaire et diffuseurs uniquement",
  "rset.share.label": "Autoriser tous les membres à partager leur écran",
  "rset.share.hint":
    "S'applique immédiatement aux personnes déjà dans la salle — elles n'ont pas à recharger. N'affecte que le partage depuis le navigateur ; OBS dépend du verrou ci-dessous.",
  "rset.share.onToast": "Tout le monde dans la salle peut désormais partager son écran",
  "rset.share.offToast": "Retour aux diffuseurs uniquement",
  "rset.gate.title": "Verrou de diffusion OBS",
  "rset.gate.desc":
    "Ne concerne que la voie OBS/WHIP. Le « Partager mon écran » du navigateur est une voie distincte (WebRTC direct) et n'est pas affecté.",
  "rset.gate.on": "Activé",
  "rset.gate.off": "Désactivé",
  "rset.gate.label": "Autoriser OBS à diffuser dans cette salle",
  "rset.gate.hint":
    "Le désactiver coupe immédiatement tout flux OBS en cours et annule toutes les URL de diffusion déjà générées pour cette salle.",
  "rset.gate.onToast": "Diffusion OBS autorisée",
  "rset.gate.offToast": "Canal OBS fermé ; {count} URL de diffusion annulée(s)",
  "rset.gate.closeTitle": "Désactiver la diffusion OBS",
  "rset.gate.closeConfirm": "Désactiver",
  "rset.gate.closeBody":
    "Tout flux OBS en cours est coupé immédiatement et toutes les URL de diffusion de cette salle sont annulées. Après réactivation, chacun devra en générer une nouvelle et mettre à jour le Bearer Token dans OBS. Désactiver ?",

  /* ============================================================
     Room — members panel
     ============================================================ */
  "members.title": "Membres",
  "members.desc":
    "Quiconque n'est pas dans ce tableau ne peut recevoir de jeton, et donc ne peut s'abonner à aucune piste — c'est une limite au niveau du protocole, pas un filtrage côté client. Modifiez les permissions et retirez des personnes par un clic droit sur leur carte, à gauche de la vidéo.",
  "members.count": "Membres : {count}",
  "members.col.member": "Membre",
  "members.col.permission": "Permission",
  "members.col.status": "État",
  "members.onlineTag": "En ligne",
  "members.offlineTag": "Hors ligne",
  "members.invite": "Inviter un utilisateur déjà inscrit",
  "members.inviteHint":
    "Il lui faut d'abord un compte ici. Pour les personnes sans compte, envoyez un lien depuis l'onglet Invitations.",
  "members.permission": "Permission",
  "members.add": "Ajouter",
  /* ============================================================
     Room — invites, bans, logs
     ============================================================ */
  "invite.title": "Liens d'invitation",
  "invite.desc":
    "Le destinataire ouvre le lien, se connecte (ou s'inscrit) et rejoint automatiquement. Un lien n'est affiché qu'une fois, à sa création ; seul son hachage est stocké.",
  "invite.activeCount": "Actifs : {count}",
  "invite.freshTitle": "Nouveau lien créé — copiez-le maintenant",
  "invite.freshBody": "C'est la seule fois où vous le verrez.",
  "invite.linkLabel": "Lien d'invitation",
  "invite.hours": "Valable (heures)",
  "invite.hoursPlaceholder": "Vide = pour toujours",
  "invite.uses": "Utilisations max",
  "invite.usesPlaceholder": "Vide = illimité",
  "invite.create": "Créer le lien",
  "invite.creating": "Création…",
  "invite.col.permission": "Permission",
  "invite.col.used": "Utilisé",
  "invite.col.expires": "Expire",
  "invite.unlimitedSuffix": " / ∞",
  "invite.forever": "Jamais",
  "invite.revoke": "Révoquer",
  "invite.revokeTitle": "Révoquer le lien d'invitation",
  "invite.revokeBody":
    "Le lien cesse de fonctionner immédiatement. Les personnes qui l'ont déjà utilisé ne sont pas affectées.",
  "bans.title": "Liste de bannissement",
  "bans.desc":
    "Les personnes de ce tableau ne peuvent pas entrer dans cette salle — les liens d'invitation ne fonctionnent pas non plus pour elles. Débannir ne les rajoute pas comme membre ; il faut les inviter à nouveau.",
  "bans.count": "Bannis : {count}",
  "bans.emptyTitle": "La liste de bannissement est vide",
  "bans.emptyBody":
    "Faites un clic droit sur une carte de membre à gauche de la vidéo et choisissez « Retirer et bannir » pour y ajouter quelqu'un.",
  "bans.col.user": "Utilisateur",
  "bans.col.at": "Banni le",
  "bans.unban": "Débannir",
  "logs.title": "Journal d'audit",
  "logs.desc": "Tout ce qui s'est passé dans cette salle, du plus récent au plus ancien.",
  "logs.emptyTitle": "Rien de consigné pour l'instant",
  "logs.emptyBody":
    "La création de la salle, la génération d'URL de diffusion et les entrées/sorties des membres apparaissent tous ici.",
  "logs.system": "Système",
  /* ============================================================
     Sync player
     ============================================================ */
  "sync.new.title": "Nouveau lecteur synchronisé",
  "sync.new.intro":
    "Une fois créé, il apparaît à côté de la vidéo. Vous (le créateur) êtes le projectionniste — votre position de lecture fait autorité et tous les autres s'alignent sur vous. La vidéo est lue par le navigateur de chaque spectateur directement depuis la source : **elle ne passe jamais par le serveur de ce site, ni par LiveKit**.",
  "sync.new.name": "Nom du lecteur",
  "sync.new.namePlaceholder": "p. ex. Ciné du vendredi",
  "sync.new.create": "Créer",
  "sync.new.creating": "Création…",
  "sync.new.accessLabel": "Qui peut contrôler",
  "sync.accessLabel": "Accès au contrôle",
  "sync.accessMembers": "Tous les membres",
  "sync.accessPublishers": "Diffuseurs uniquement",
  "sync.accessOwner": "Propriétaire uniquement",
  "sync.accessUpdated": "Accès mis à jour",
  "sync.closed": "Lecteur synchronisé fermé",
  "sync.hostedByYou": "Vous projetez",
  "sync.hostedBy": "{name} projette",
  "sync.waitingForOthers": "La synchronisation démarre quand quelqu'un d'autre arrive",
  "sync.waitingForHost": "En attente du projectionniste",
  "sync.inSync": "Synchronisé",
  "sync.drift": "Écart {value} s",
  "sync.close": "Fermer ce lecteur",
  "sync.sdkFailedTitle": "Échec du chargement du lecteur",
  "sync.sdkFailedBody": "Erreur en récupérant MX Player Pro depuis le CDN : {message}",
  "sync.sdkFailedHint": "Vérifiez que cdn.jsdelivr.net est joignable depuis votre réseau.",
  "sync.playbackError": "Erreur de lecture",
  "sync.audioOnlyTitle": "Le son passe, mais l'image est noire",
  "sync.audioOnlyBody": "La piste vidéo utilise un codec que ce navigateur ne sait pas décoder (le plus souvent HEVC/H.265) : il n'y a donc que le son. Essayez une source en H.264.",
  "sync.badSourceTitle": "Cette source ne se lit pas",
  "sync.noSourceHost": "Saisissez une URL vidéo dans la barre ci-dessus",
  "sync.noSourceViewer": "Le projectionniste n'a encore rien choisi",
  "sync.noSourceBody":
    "La vidéo est lue par votre navigateur directement depuis la source via des requêtes Range — elle ne passe jamais par le serveur de ce site, ni par LiveKit.",
  "sync.urlLabel": "URL de la vidéo",
  "sync.urlHint":
    "La source doit autoriser les lectures cross-origin depuis ce site (CORS) et prendre en charge les requêtes Range. La changer change la source pour toute la salle.",
  "sync.play": "Lire et synchroniser",
  "sync.switching": "Changement…",
  "sync.sourceSwitched": "Source changée — toute la salle suit",
  "sync.sourceCleared": "Source effacée",
  "sync.follow": "Suivre le projectionniste",
  "sync.followOn":
    "S'aligne automatiquement sur la position du projectionniste : les gros écarts par un saut, les petits absorbés par une légère variation de vitesse.",
  "sync.followOff":
    "Détaché — vous pouvez naviguer librement. Réactiver ramène à la position du projectionniste.",
  "sync.clock": "Décalage d'horloge {offset} ms · latence aller ≈ {latency} ms",
  "sync.sdkNoExport": "Le SDK n'a pas exporté MXPlayer",
  /* ============================================================
     Browser-side image preparation (lib/client-image.ts)
     ============================================================ */
  "img.notDecodable": "Le navigateur ne sait pas décoder ce fichier comme une image",
  "img.notImage": "Choisissez un fichier image",
  "img.tooBig": "Cette image est trop grande (plus de 25 Mo) — compressez-la avant l'envoi",
  "img.noCanvas": "Ce navigateur ne prend pas en charge canvas ; essayez-en un autre",
  "img.encodeFailed": "L'encodage de l'image a échoué",
  /* ============================================================
     Landing page — chrome, hero, topology
     ============================================================ */
  "landing.meta.description":
    "Partage de bureau basé sur LiveKit. Chaque salle est liée à son propre jeu d'identifiants LiveKit ; envoyez votre écran dans la salle avec OBS ou juste un navigateur. L'autorisation se fait au niveau du protocole, et deux variables d'environnement suffisent à le faire tourner.",
  "landing.nav.label": "Navigation dans la page",
  "landing.nav.paths": "Voies de diffusion",
  "landing.nav.quota": "Quota gratuit",
  "landing.nav.features": "Fonctions",
  "landing.nav.start": "Démarrage",
  "landing.nav.app": "Appli bureau",
  "landing.nav.qa": "Q&R",
  "landing.bar.github": "Voir les sources sur GitHub",
  "landing.entry.console": "Ouvrir la console",
  "landing.entry.login": "Connexion / Inscription",
  "landing.hero.tag": "Bâti sur **LiveKit** · multi-nœuds · démarrage sans configuration",
  "landing.hero.h1a": "Un nœud par salle,",
  "landing.hero.h1b": "une URL de diffusion par personne.",
  "landing.hero.lead":
    "Envoyez votre écran à toute la salle — avec OBS, ou avec rien d'autre qu'un navigateur. Chaque salle est liée à ses propres identifiants LiveKit, donc son trafic média et son quota gratuit se consomment sur ce nœud et personne ne se dispute celui d'un autre.",
  "landing.hero.deploy": "Déployer sur Vercel",
  "landing.hero.fact1": "Deux variables d'environnement suffisent",
  "landing.hero.fact2": "WHIP direct, aucun quota de transcodage",
  "landing.hero.fact3": "Autorisation au niveau du protocole",
  "landing.topo.title": "Nœuds LiveKit",
  "landing.topo.hint": "Quotas séparés",
  "landing.topo.nodeA": "Nœud A",
  "landing.topo.nodeATag": "Le vôtre",
  "landing.topo.nodeB": "Nœud B",
  "landing.topo.nodeBTag": "Celui d'un collègue",
  "landing.topo.builtin": "Nœud intégré",
  "landing.topo.builtinTag": "Partagé par l'admin · 20 salles max",
  "landing.topo.online": "{count} en ligne",
  "landing.topo.idle": "Inactive",
  "landing.topo.foot":
    "Une salle vit sur exactement un nœud — son trafic et son quota gratuit y sont imputés.",
  /* ============================================================
     Landing page — publish routes
     ============================================================ */
  "landing.paths.eyebrow": "01 · Voies de diffusion",
  "landing.paths.h2": "Il y a deux voies de diffusion, et elles sont séparées",
  "landing.paths.lead":
    "La voie navigateur touche ce site exactement une fois — pour obtenir un jeton ; ensuite la vidéo va droit à LiveKit. La voie OBS exige d'abord la création d'un ingress côté serveur. C'est pourquoi désactiver « la diffusion OBS » laisse le partage navigateur fonctionner.",
  "landing.paths.browser.title": "Partager depuis le navigateur",
  "landing.paths.browser.body":
    "Un clic, rien à installer. 1920×1080@15 ips — le partage de bureau privilégie la résolution sur la fluidité. La vidéo ne passe ni par Vercel ni par Ingress.",
  "landing.paths.obs.title": "Diffuser avec OBS (WHIP)",
  "landing.paths.obs.body":
    "Dans la salle, cliquez sur « Générer l'URL de diffusion », puis reportez Server et Bearer Token dans les paramètres de stream d'OBS (service : WHIP). Le mode direct évite le transcodage, donc il n'exige presque rien de la machine et n'entame jamais le quota de 60 minutes.",
  "landing.paths.hopBrowser": "Navigateur",
  "landing.paths.hopNode": "Nœud LiveKit",
  "landing.paths.hopWhip": "WHIP direct",

  /* ============================================================
     Landing page — free tier
     ============================================================ */
  "landing.quota.eyebrow": "02 · Pourquoi apporter son nœud",
  "landing.quota.h2":
    "Le quota gratuit est une enveloppe de test, pas une enveloppe de production",
  "landing.quota.lead":
    "Le plan gratuit Build de LiveKit Cloud est compté par project ; au-delà de la limite, les requêtes échouent simplement et rien n'est facturé — et plusieurs projects gratuits sur un même compte partagent une seule enveloppe.",
  "landing.quota.tile1Label":
    "Minutes-participant WebRTC. Les diffuseurs ne comptent pas — seuls les spectateurs consomment",
  "landing.quota.tile2Label":
    "Bande passante sortante. Dans la plupart des cas, c'est le mur que l'on touche en premier",
  "landing.quota.tile3Value": "60 minutes",
  "landing.quota.tile3Label":
    "Quota de transcodage. L'entrée RTMP transcode toujours — une heure par mois",
  "landing.quota.colRate": "Débit de diffusion",
  "landing.quota.colMinutes": "Minutes-spectateur sur 50 Go",
  "landing.quota.colHours": "En heures-spectateur",
  "landing.quota.note4": "1080p haut débit",
  "landing.quota.note25": "1080p standard",
  "landing.quota.note15": "720p",
  "landing.quota.note08": "Bas débit",
  "landing.quota.tableNote":
    "Environ 1,33 Mbit/s est la ligne de partage : au-dessus, les 50 Go de bande passante s'épuisent d'abord ; en dessous, ce sont les 5 000 minutes. Les heures-spectateur se divisent encore par le nombre de spectateurs — une personne qui partage à trois autres en 1080p, c'est environ 15 heures par mois.",
  "landing.quota.punch":
    "C'est pourquoi ce projet fait des nœuds un citoyen de première classe : **chacun connecte son propre project**, et l'enveloppe passe de « une pour tout le site » à « une chacun ». Le nœud intégré n'est là qu'en secours — pensez à plafonner son nombre de salles.",
  /* ============================================================
     Landing page — features
     ============================================================ */
  "landing.features.eyebrow": "03 · Fonctions",
  "landing.features.h2": "Tout ce qui compte est appliqué côté serveur",
  "landing.features.lead":
    "Un contrôle que l'on peut contourner dans le client n'est pas un contrôle. Tout ce qui suit se joue là où les jetons sont signés et les ingress créés.",
  "landing.feat.auth.title": "Autorisation au niveau du protocole, pas un filtrage côté client",
  "landing.feat.auth.body":
    "Pas dans la table des membres → pas de jeton → pas de connexion → aucun abonnement à une piste. Le champ `room` du grant ne contient qu'un seul nom de salle, donc le jeton ne peut physiquement pas en ouvrir une autre. Les non-membres reçoivent toujours un 404, donc un code de salle ne révèle rien.",
  "landing.feat.nodes.title": "Apportez votre nœud, consommez votre quota",
  "landing.feat.nodes.body":
    "Connectez votre propre project LiveKit Cloud et choisissez lequel utiliser par salle. Avant d'enregistrer, ce site effectue un vrai contrôle sur l'API avec ces identifiants — les mauvais ne sont jamais stockés — et il sonde aussi si l'Ingress fonctionne pour le marquer sur le nœud.",
  "landing.feat.whip.title": "OBS en WHIP direct",
  "landing.feat.whip.body":
    "`enableTranscoding: false` — cela n'entame pas les 60 minutes de transcodage mensuelles. Une URL de diffusion par personne, remplaçable et révocable ; les clés de flux sont chiffrées au repos et déchiffrées seulement pour leur propriétaire.",
  "landing.feat.gate.title": "« Diffusion OBS » est un vrai interrupteur",
  "landing.feat.gate.body":
    "Quand le propriétaire le coupe, tout ce qui diffuse s'arrête : l'ingress est supprimé pour que les anciennes clés ne puissent plus jamais se connecter, et le participant `obs:` est retiré de la salle. Pas un drapeau qui affiche « désactivé » pendant que le flux continue.",
  "landing.feat.sync.title": "Lecture synchronisée",
  "landing.feat.sync.body":
    "Le propriétaire ouvre un lecteur et toute la salle regarde la même source. La position est diffusée sur le data channel de LiveKit, alignée après estimation du décalage d'horloge entre machines par ping/pong ; les octets vidéo ne touchent jamais ce service.",
  "landing.feat.invite.title": "Liens d'invitation",
  "landing.feat.invite.body":
    "Seul le hachage d'un jeton est stocké ; les liens peuvent porter une expiration, un plafond d'utilisations, et être révoqués à tout moment. L'utilisation réserve une place de façon atomique par un UPDATE conditionnel, donc la concurrence ne peut pas percer `max_uses` ; ouvrir un lien sans être connecté passe par la connexion puis rejoint automatiquement.",
  "landing.feat.env.title": "Deux variables d'environnement suffisent",
  "landing.feat.env.body":
    "`DATABASE_URL` et `ADMIN_PASSWORD`. Le compte admin est créé au premier démarrage, la clé de chiffrement des identifiants se génère elle-même en base si elle n'est pas définie, et LiveKit se configure dans l'interface web plutôt qu'en variables d'environnement. Il n'y a pas d'assistant d'installation.",
  "landing.feat.health.title": "Un endroit où regarder quand ça casse",
  "landing.feat.health.body":
    "Les salles ont un journal d'audit dépliable (il ne consigne jamais un secret). `/api/health` ne demande pas de connexion et rapporte point par point : accessibilité de la base, présence des 12 tables, exécution du bootstrap — il liste exactement les tables manquantes pour que vous n'ayez pas à devenir devin devant une trace d'erreur.",
  /* ============================================================
     Landing page — quick start
     ============================================================ */
  "landing.start.eyebrow": "04 · Démarrage",
  "landing.start.h2": "Trois étapes pour faire tourner le vôtre",
  "landing.start.lead":
    "Ce site n'embarque aucun serveur média, donc tout ce dont vous avez réellement besoin, c'est d'une base de données et d'un jeu d'identifiants LiveKit.",
  "landing.start.step1Title": "Renseignez deux variables d'environnement",
  "landing.start.step1Body":
    "Copiez `.env.example` vers `.env.local` — Next ne lit pas le premier, donc modifier le mauvais fichier ne fait absolument rien.",
  "landing.start.passwordPlaceholder": "choisissez-votre-mot-de-passe",
  "landing.start.step2Title": "Créez les tables, lancez",
  "landing.start.step2Comment": "# crée 12 tables",
  "landing.start.step2Body":
    "Puis connectez-vous avec `admin@localhost` et le mot de passe ci-dessus : le compte admin est créé au premier démarrage, et il n'y a pas d'assistant d'installation. Sur Vercel, la migration est déjà câblée dans le build, donc vous ne lancez pas ceci à la main.",
  "landing.start.step3Title": "Connectez un nœud LiveKit",
  "landing.start.step3Body1":
    "Panneau latéral « Nœuds LiveKit » → « Connecter un nœud », puis renseignez l'URL `wss://` et l'API Key / Secret. Le plan gratuit Build de LiveKit Cloud ne demande pas de carte bancaire et il faut environ trois minutes pour obtenir ces trois valeurs ; avant d'enregistrer, ce site les vérifie réellement et refuse de stocker les mauvaises.",
  "landing.start.step3Body2":
    "LiveKit auto-hébergé fonctionne aussi (le champ URL accepte `ws://`), mais diffuser depuis OBS exige alors de déployer Ingress et Redis vous-même.",

  /* ============================================================
     Landing page — desktop app teaser
     ============================================================ */
  "landing.app.eyebrow": "05 · Aperçu",
  "landing.app.h2a": "Nous envisageons une application de bureau :",
  "landing.app.lead":
    "Une messagerie auto-hébergée et chiffrée de bout en bout, capable aussi de partager l'écran — ce site n'est que la moitié « écran » ; la moitié « messagerie » ne se fait pas proprement dans un navigateur.",
  "landing.app.badge": "Au stade du concept",
  "landing.app.note":
    "Le développement **n'a pas commencé** et il n'y a pas de calendrier — cette section est un aperçu. Elle est là pour savoir si quelqu'un en a réellement besoin, car c'est ce qui rend la chose digne d'être construite.",
  "landing.app.idea1.title": "Chiffrement de bout en bout",
  "landing.app.idea1.body":
    "Les messages et le contenu partagé sont chiffrés et déchiffrés aux extrémités ; le serveur ne relaie que du chiffré — posséder le serveur ne révèle toujours pas la conversation.",
  "landing.app.idea2.title": "Auto-hébergé",
  "landing.app.idea2.body":
    "Faites tourner le serveur vous-même : comptes, messages et clés n'ont jamais à être confiés à un tiers. Comme ce site, et sans cette activation en ligne obligatoire.",
  "landing.app.idea3.title": "Discussion et écran au même endroit",
  "landing.app.idea3.body":
    "Texte, fichiers et partage d'écran dans un seul client, au lieu de faire tourner une appli de réunion à côté d'une appli de messagerie.",
  "landing.app.idea4.title": "Natif sur le bureau",
  "landing.app.idea4.body":
    "Des clients Windows / macOS / Linux plutôt qu'un onglet de navigateur — capturer un bureau entier, rester résident, démarrer avec le système : un navigateur ne peut pas vous donner cela.",
  "landing.app.footNote":
    "Si cela vous intéresse, ou si vous trouvez qu'on se trompe quelque part, dites-le. Le retour le plus utile est **ce que vous remplaceriez par cela** — bien plus précieux qu'un « bonne idée ».",
  "landing.app.issues": "Ouvrir un ticket",
  "landing.app.contact": "Nous contacter",
  /* ============================================================
     Landing page — Q&A
     ============================================================ */
  "landing.qa.eyebrow": "06 · Q&R",
  "landing.qa.h2": "Questions fréquentes",
  "landing.qa.lead":
    "Chaque réponse ci-dessous se retrouve dans le code ou le README. Pour tout ce qui n'est pas couvert, utilisez les deux liens de la section précédente.",
  "landing.qa.q1": "Dois-je fournir un serveur ?",
  "landing.qa.a1":
    "Aucun serveur média. Ce site se déploie sur Vercel + Neon (les deux ont une offre gratuite), la vidéo passe par LiveKit Cloud, et il ne vous faut qu'un jeu d'identifiants LiveKit — le plan gratuit Build ne demande pas de carte bancaire. Tout auto-héberger fonctionne aussi : le champ URL accepte `ws://`, mais diffuser depuis OBS signifie alors déployer Ingress et Redis vous-même.",
  "landing.qa.q2": "Combien de temps dure réellement le quota gratuit ?",
  "landing.qa.a2":
    "Dans la plupart des cas, vous atteignez les 50 Go de sortie avant les 5 000 minutes-participant. Une personne qui partage à trois spectateurs en 1080p, c'est environ 15 heures par mois. C'est pourquoi ce projet laisse chacun connecter son propre project LiveKit : l'enveloppe passe de « une pour le propriétaire du site » à « une chacun ».",
  "landing.qa.q3": "La vidéo passe-t-elle par vos serveurs ?",
  "landing.qa.a3":
    "Non. Pour le partage navigateur, ce site est contacté exactement une fois — pour obtenir un jeton ; ensuite la vidéo se connecte droit au nœud LiveKit. Le lecteur synchronisé va plus loin : les octets vidéo sont récupérés par votre propre navigateur directement depuis la source via des requêtes Range, sans passer ni par ce service ni par LiveKit.",
  "landing.qa.q4": "Dois-je installer OBS ?",
  "landing.qa.a4":
    "Non. Un clic partage depuis le navigateur (`getDisplayMedia`, 1920×1080@15 ips — le partage de bureau privilégie la résolution sur la fluidité). La voie OBS est pour ceux qui veulent plusieurs scènes, des transitions et des incrustations ; elle utilise le WHIP direct et n'entame aucun quota de transcodage.",
  "landing.qa.q5": "N'importe qui avec le code de la salle peut-il entrer ?",
  "landing.qa.a5":
    "Non. La table des membres est la seule chose que regarde l'autorisation : ne pas y être signifie pas de jeton, donc aucun abonnement à une piste. Un jeton signé ne porte qu'un seul nom de salle, donc il ne peut physiquement pas en ouvrir une autre ; les requêtes de non-membres renvoient toujours 404, donc vous ne pouvez même pas apprendre si une salle existe.",
  "landing.qa.q6": "Si je désactive « la diffusion OBS », un flux en cours s'arrête-t-il ?",
  "landing.qa.a6":
    "Oui, immédiatement. À cet instant, le serveur supprime l'ingress (les anciennes clés de flux ne pourront plus jamais se connecter) et retire le participant `obs:` de la salle. Ce n'est pas un drapeau qui bascule l'étiquette sur « désactivé » pendant que le flux continue. Le partage navigateur est une voie distincte et n'est pas affecté.",
  "landing.qa.q7": "Si la base de données est volée, les secrets externes fuient-ils avec elle ?",
  "landing.qa.a7":
    "Non. Les secrets GitHub / Google / Turnstile / Resend sont chiffrés en AES-256-GCM avant d'être stockés, et la clé maîtresse peut vivre hors de la base via `CREDENTIAL_ENCRYPTION_KEY`. Aucune API ne renvoie un secret en clair ; l'interface d'administration affiche un masque.",
  "landing.qa.q8": "Puis-je le garder pour moi et empêcher les inconnus de s'inscrire ?",
  "landing.qa.a8":
    "Oui. Administration → « Paramètres du site » → désactivez « Autoriser les inscriptions » : l'inscription par e-mail/mot de passe, une première connexion externe et une première connexion par code e-mail sont toutes bloquées ensemble et reçoivent « les inscriptions sont désactivées sur ce site », tandis que les comptes existants se connectent comme avant. C'est appliqué côté serveur, pas en masquant un bouton.",

  /* ============================================================
     Landing page — closing + footer
     ============================================================ */
  "landing.closing.h2": "Créez une salle, envoyez-y votre écran",
  "landing.closing.body":
    "L'inscription vous donne votre propre espace de travail, où vous pouvez connecter vos propres nœuds LiveKit. Si on vous a envoyé un lien d'invitation, ouvrez-le et connectez-vous — vous rejoindrez la salle automatiquement.",
  "landing.closing.source": "Lire les sources",
  "landing.closing.badge": "07 · Commencer",
  "landing.closing.step1": "Créer une salle",
  "landing.closing.step2": "Envoyer le lien d'invitation",
  "landing.closing.step3": "Envoyer votre écran",
  "landing.footer.links": "Liens utiles",
  "landing.footer.docs": "Documentation",
  "landing.footer.deploy": "Guide de déploiement",
  "landing.footer.livekit": "Docs LiveKit",
  "landing.footer.stack":
    "Lecteur synchronisé propulsé par MX Player Pro —",
  /* ============================================================
     Server-side API messages.

     Route handlers throw `ApiError`s whose `message` is one of these keys; the
     `route()` wrapper translates it once, using the locale of the request that
     caused it. See lib/http.ts.
     ============================================================ */
  "api.unauthorized": "Veuillez d'abord vous connecter",
  "api.forbidden": "Vous n'avez pas la permission",
  "api.notFound": "Introuvable",
  "api.internal": "Erreur serveur",
  "api.badJson": "Le corps de la requête n'est pas du JSON valide",
  "api.badParams": "Paramètres invalides",
  "api.needAdmin": "Accès administrateur requis",
  "api.notReady":
    "Le serveur n'est pas encore prêt : la base de données est injoignable, ou une variable d'environnement obligatoire manque. Ouvrez /api/health pour voir précisément ce qui manque.",
  "api.registrationClosed":
    "Les inscriptions sont désactivées sur ce site. Contactez un administrateur pour obtenir un compte.",

  "api.admin.missingNodeId": "nodeId manquant",
  "api.admin.noFields": "Rien à mettre à jour",
  "api.admin.nodeNotFound": "Nœud inexistant",
  "api.adminUser.selfEdit": "Vous ne pouvez pas changer votre propre rôle ou état",
  "api.adminUser.noFields": "Rien à mettre à jour",
  "api.adminUser.lastAdmin": "Le site doit conserver au moins un administrateur actif",
  "api.adminUser.notFound": "Utilisateur inexistant",
  "api.cron.noSecret": "CRON_SECRET n'est pas configuré ; les appels externes sont refusés",
  "api.cron.badSecret": "Identifiants incorrects",
  "api.services.badService": "Paramètre service invalide",

  "api.node.notFound": "Nœud inexistant",
  "api.node.rotateBothRequired": "Changer les clés exige à la fois l'API Key et l'API Secret",
  "api.node.rotateFailed": "Les nouveaux identifiants ont échoué à la vérification : {error}",
  "api.node.noFields": "Rien à mettre à jour",
  "api.node.builtinNoDelete":
    "Le nœud intégré ne peut pas être supprimé — désactivez-le depuis la page d'administration",
  "api.node.hasActiveRooms":
    "Ce nœud a encore des salles actives ; fermez-les avant de le supprimer",
  "api.node.disabled": "Le nœud « {name} » a été désactivé",
  "api.node.notYours": "Vous ne pouvez pas utiliser un nœud connecté par quelqu'un d'autre",
  "api.node.builtinNotPublic":
    "Le nœud intégré n'est pas ouvert aux utilisateurs ordinaires — connectez votre propre project LiveKit Cloud",
  "api.node.builtinRoomLimit":
    "Le nœud intégré a atteint sa limite de salles ({max}) ; connectez votre propre nœud",
  "api.node.credsCheckFailed": "Vérification des identifiants échouée : {error}",
  "api.node.probeFailed": "Connexion impossible, ou identifiants invalides",
  "api.node.duplicate": "Ces identifiants sont déjà connectés",
  "api.auth.emailTaken": "Cette adresse e-mail est déjà inscrite",
  "api.login.badCredentials": "E-mail ou mot de passe incorrect",
  "api.login.adminNotConfigured":
    "Le compte admin n'a pas été créé : la variable d'environnement ADMIN_PASSWORD est vide. Définissez une valeur non vide, redémarrez, puis connectez-vous en tant que {email}.",
  "api.account.disabled": "Ce compte a été désactivé.",
  "api.account.unverifiedLink":
    "{email} a déjà un compte ici, mais {provider} n'a pas confirmé que cette adresse vous appartient : elle ne peut donc pas être liée automatiquement. Connectez-vous d'abord avec votre mot de passe ou un code e-mail, puis liez-la depuis votre profil.",

  "api.code.tooFast": "C'est trop fréquent — réessayez dans {seconds} s.",
  "api.code.tooManyToday":
    "Trop de codes demandés pour cette adresse aujourd'hui. Réessayez dans une heure.",
  "api.code.noPending":
    "Aucun code n'attend d'être vérifié — appuyez d'abord sur « Envoyer le code ».",
  "api.code.expired": "Ce code a expiré. Demandez-en un nouveau.",
  "api.code.wrongLeft": "Code incorrect — {left} tentative(s) restante(s).",
  "api.code.tooManyWrong": "Trop de tentatives incorrectes. Demandez un nouveau code.",
  "api.captcha.required": "Terminez d'abord la vérification humaine",
  "api.captcha.unreachable":
    "Le service de vérification humaine est injoignable ; réessayez sous peu",
  "api.captcha.expired": "La vérification humaine a expiré — veuillez la refaire",
  "api.captcha.badSecret":
    "La vérification humaine est mal configurée : la Secret Key est incorrecte. Contactez un administrateur",
  "api.captcha.failed": "La vérification humaine n'est pas passée ; veuillez réessayer",

  "api.oauth.unsupported": "Cette méthode de connexion n'est pas prise en charge",
  "api.oauth.userCancelled": "Vous avez annulé la connexion externe.",
  "api.oauth.providerReturned": "Le fournisseur a renvoyé : {error}",
  "api.oauth.missingCode": "Le rappel n'a pas de paramètre code",
  "api.oauth.failed": "La connexion externe a échoué. Réessayez, ou utilisez l'e-mail.",
  "api.oauth.missingState": "Le rappel n'a pas de paramètre state",
  "api.oauth.staleState":
    "Cette demande de connexion n'est plus valide — relancez la connexion externe.",
  "api.oauth.stateTimeout":
    "La demande de connexion a expiré (plus de 10 minutes) — veuillez recommencer.",
  "api.oauth.unreachable":
    "Le service de connexion externe est injoignable ; réessayez sous peu.",
  "api.oauth.providerStatus": "L'API du fournisseur a renvoyé {status}",
  "api.oauth.noAccessToken": "Le fournisseur n'a renvoyé aucun access_token",
  "api.oauth.loginFailed": "La connexion externe a échoué : {reason}",
  "api.oauth.githubNoId": "GitHub n'a renvoyé aucun id de compte",
  "api.oauth.googleNoSub": "Google n'a renvoyé aucun sub de compte",

  "api.rate.emailTooMany": "Trop de tentatives de connexion ; réessayez dans 15 minutes",
  "api.rate.ipTooMany": "Trop de tentatives de connexion depuis ce réseau ; réessayez plus tard",
  "api.mail.unreachable": "Le service e-mail est injoignable ; réessayez sous peu.",
  "api.mail.failed": "L'e-mail n'a pas pu être envoyé : {detail}",
  "api.svc.notConfigured":
    "{name} n'est pas encore configuré — demandez à un administrateur de le renseigner dans Administration → Services externes.",
  "api.svc.firstSecretRequired": "Un secret est obligatoire à la première configuration",
  "api.svc.maskUndecryptable": "(indéchiffrable, veuillez le ressaisir)",
  "api.room.notFound": "Salle inexistante",
  "api.room.ownerOnly": "Seul le propriétaire de la salle peut faire cela",
  "api.room.userBanned":
    "Cet utilisateur est sur la liste de bannissement de la salle ; débannissez-le d'abord.",
  "api.rooms.noNode": "Aucun nœud n'a été indiqué, et ce site n'a pas de nœud intégré disponible",
  "api.rooms.codeConflict": "Collision de code de salle — veuillez réessayer",
  "api.token.roomClosed": "La salle est fermée",
  "api.token.nodeDisabled": "Le nœud sur lequel vit cette salle a été désactivé",
  "api.token.removed": "Vous avez été retiré de cette salle.",

  "api.members.emailNotRegistered": "Cette adresse e-mail n'a pas encore de compte sur ce site",
  "api.members.accountDisabled": "Ce compte a été désactivé",
  "api.members.alreadyMember": "Cet utilisateur est déjà membre de la salle",
  "api.members.cantChangeOwner":
    "La permission du propriétaire de la salle ne peut pas être changée",
  "api.members.notMember": "Cet utilisateur n'est pas membre de la salle",
  "api.members.missingUserId": "userId manquant",
  "api.members.cantRemoveOwner": "Le propriétaire de la salle ne peut pas être retiré",
  "api.bans.missingUserId": "userId manquant",
  "api.bans.notBanned": "Cette personne n'est pas sur la liste de bannissement",
  "api.invites.missingId": "id manquant",
  "api.invite.banned":
    "Vous avez été retiré de cette salle, donc les liens d'invitation ne fonctionnent pas pour vous.",
  "api.invite.invalid": "Ce lien d'invitation est invalide ou n'est plus actif",
  "api.invite.notFound": "Invitation inexistante",

  "api.ingress.notGenerated": "Aucune URL de diffusion n'a encore été générée pour vous",
  "api.ingress.roomClosed": "La salle est fermée",
  "api.ingress.gateClosed":
    "Le verrou « diffusion OBS » de cette salle est fermé — demandez au propriétaire de l'ouvrir avant de générer une URL de diffusion",
  "api.ingress.noPermission": "Vous n'avez pas la permission de diffuser dans cette salle",
  "api.ingress.nodeNoIngress":
    "L'Ingress de ce nœud est indisponible (non activé, ou quota épuisé) : aucune URL de diffusion OBS ne peut être créée",
  "api.ingress.noWhipUrl":
    "LiveKit n'a renvoyé aucune URL WHIP — vérifiez si l'Ingress est disponible sur ce project",
  "api.ingress.nothingToRevoke": "Il n'y a pas d'URL de diffusion à révoquer",
  "api.sync.roomClosed": "La salle est fermée",
  "api.sync.tooMany":
    "Une salle peut avoir au maximum {max} lecteurs synchronisés ouverts à la fois — fermez-en un d'abord.",
  "api.sync.notFound": "Ce lecteur synchronisé n'existe pas, ou a été fermé",
  "api.sync.notAllowed":
    "Seul le créateur ou le propriétaire de la salle peut contrôler ce lecteur",
  "api.image.badKind": "kind doit valoir avatar ou banner",
  "api.image.notFound": "Image inexistante",
  "api.image.badFormat": "Format d'image incorrect : une data URL en base64 est requise",
  "api.image.unsupportedType":
    "Ce format d'image n'est pas pris en charge ({mimeType}) ; utilisez PNG / JPEG / WebP",
  "api.image.tooBigEstimated":
    "Cette image est trop grande (environ {size} Ko) ; la limite est de {limit} Ko",
  "api.image.empty": "L'image est vide",
  "api.image.tooBig": "Cette image est trop grande ({size} Ko) ; la limite est de {limit} Ko",
  "api.image.contentMismatch":
    "Le contenu du fichier ne correspond pas au format d'image déclaré",
  /* ============================================================
     Diagnostics: /api/health and database error hints
     ============================================================ */
  "api.health.set": "Défini",
  "api.health.dbUrlMissing": "DATABASE_URL manque — c'est le seul réglage obligatoire",
  "api.health.dbOk": "Connecté",
  "api.health.dbFail": "Connexion impossible : {message}",
  "api.health.tablesOk": "Les {count} tables sont présentes",
  "api.health.tablesMissing":
    "{count} table(s) manquante(s) ({list}) — la migration n'a jamais tourné, ou seulement à moitié. Lancez npm run db:migrate sur cette base.",
  "api.health.tablesFail": "Impossible de lire la liste des tables : {message}",
  "api.health.adminPasswordMissing":
    "ADMIN_PASSWORD manque (une chaîne vide compte) — le compte admin ne sera pas créé",
  "api.health.bootReady": "Prêt ; e-mail admin {email}",
  "api.health.bootReadyNoAdmin":
    "Prêt, mais aucun compte admin n'a été créé (ADMIN_PASSWORD est vide)",
  "api.health.bootFailed": "Le bootstrap au démarrage a échoué",
  "api.health.keyFromEnv": "Depuis CREDENTIAL_ENCRYPTION_KEY",
  "api.health.keyAuto":
    "Générée automatiquement et stockée en base (définissez explicitement la variable pour une isolation plus forte)",
  "api.health.keyPending": "Pas encore chargée — corrigez d'abord les points en échec ci-dessus",
  "api.db.rawPrefix": " Erreur d'origine : ",
  "api.db.unknown": "La requête base de données a échoué pour une raison inconnue.",
  "api.db.42P01":
    "La table n'existe pas — la migration n'a jamais tourné. Lancez npm run db:migrate sur cette base.",
  "api.db.42703":
    "La colonne n'existe pas — la migration n'a tourné qu'à moitié. Relancez npm run db:migrate.",
  "api.db.3F000":
    "Le schéma n'existe pas — vérifiez le nom de la base dans la chaîne de connexion.",
  "api.db.3D000":
    "La base de données n'existe pas — le nom dans la chaîne de connexion est incorrect.",
  "api.db.28P01":
    "L'authentification par mot de passe a échoué — le mot de passe de la chaîne de connexion est incorrect.",
  "api.db.28000":
    "Authentification refusée — le nom d'utilisateur ou ses permissions dans la chaîne de connexion sont incorrects.",
  "api.db.53300": "Trop de connexions — passez à la chaîne de connexion « pooled » de Neon.",
  "api.db.08006":
    "La connexion a été perdue — vérifiez le réseau, et si l'instance Neon est suspendue ou supprimée.",
  "api.db.57P03":
    "La base de données démarre — démarrage à froid Neon ; attendez quelques secondes et réessayez.",
  /* ============================================================
     Validation messages.

     These live in the zod schemas as *keys* (lib/validation.ts stays a pure,
     dependency-free data module) and are translated by parseOr400.
     ============================================================ */
  "valid.wsUrlRequired": "L'URL LiveKit ne peut pas être vide",
  "valid.wsUrlInvalid": "Ce n'est pas une URL LiveKit valide",
  "valid.emailFormat": "Cette adresse e-mail ne semble pas correcte",
  "valid.emailTooLong": "Cette adresse e-mail est trop longue",
  "valid.apiKeyShort": "L'API Key est trop courte",
  "valid.apiSecretShort": "L'API Secret est trop court",
  "valid.nodeName": "Donnez un nom au nœud",
  "valid.passwordRequired": "Saisissez votre mot de passe",
  "valid.passwordShort": "Le mot de passe doit faire au moins 8 caractères",
  "valid.codeSixDigits": "Le code fait 6 chiffres",
  "valid.roomName": "Le nom de la salle ne peut pas être vide",
  "valid.atLeastOneSetting": "Modifiez au moins un réglage",
  "valid.displayName": "Le nom affiché ne peut pas être vide",
  "valid.playerName": "Donnez un nom au lecteur",
  "valid.sourceUrlScheme": "L'URL doit commencer par http:// ou https://",
  "valid.fieldRequired": "Ce champ ne peut pas être vide",

  /* ============================================================
     Verification-code email
     ============================================================ */
  "mail.subject": "{code} est votre code de vérification {app}",
  "mail.title": "Code de vérification {app}",
  "mail.preview": "Code de vérification {code}, valable {minutes} minutes.",
  "mail.lead": "Utilisez le code ci-dessous pour continuer votre connexion :",
  "mail.validity": "Valable {minutes} minutes et utilisable une seule fois.",
  "mail.textLead": "Votre code de connexion est : {code}",
  "mail.textSafety":
    "Si ce n'était pas vous, ignorez simplement cet e-mail — sans le code, personne n'entre.",
  "mail.safety":
    "Ce n'était pas vous ? Ignorez simplement cet e-mail — sans ce code, personne n'entre. Ce site ne vous demandera jamais ce code, par quelque canal que ce soit.",
  "mail.autoSent": "Cet e-mail a été envoyé automatiquement par {host}.",
};

export default fr;
