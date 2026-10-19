// Textes de MAINTeX en français, néerlandais et anglais.
//
// Le français est la langue de référence : une clé absente d'une autre langue
// retombe dessus plutôt que d'afficher la clé brute à l'écran. Il n'y a donc
// jamais de régression visible quand une traduction manque.
//
// Les libellés métier des douze domaines (config/domainsConfig.ts) et la zone
// Admin sont traités séparément, par lots.

export const LANGUAGES = [
  { code: 'fr', short: 'FR', label: 'Français', htmlLang: 'fr' },
  { code: 'nl', short: 'NL', label: 'Nederlands', htmlLang: 'nl' },
  { code: 'en', short: 'EN', label: 'English', htmlLang: 'en' },
] as const;

export type Language = (typeof LANGUAGES)[number]['code'];

export const DEFAULT_LANGUAGE: Language = 'fr';

export const isLanguage = (value: unknown): value is Language =>
  LANGUAGES.some((entry) => entry.code === value);

type Dictionary = Record<string, string>;

const fr: Dictionary = {
  // Connexion
  'login.title': 'MAINTeX — Connexion sécurisée',
  'login.intro':
    'Connectez-vous avec votre compte Google professionnel. Un seul login donne accès à toutes vos applications.',
  'login.checking': 'Vérification de la session…',
  'login.notConfigured': 'Le service d’authentification n’est pas encore configuré sur l’hébergement.',
  'login.refused': 'Connexion refusée.',

  // Bandeau
  'header.home': 'Retour à l’accueil MAINTeX',
  'header.quickAccess': 'Accès rapide aux applications',
  'header.modulesLine1': 'Modules',
  'header.modulesLine2': 'en service',
  'header.open': 'Ouvrir',
  'header.notifications': 'Notifications',
  'header.notificationsNew': '{count} NOUVELLES',
  'header.admin': 'Administration',
  'header.logout': 'Déconnexion',
  'header.language': 'Langue',
  'header.chooseLanguage': 'Choisir la langue',

  // Accueil
  'home.eyebrow': 'Maintenance Excellence Platform',
  'home.welcome': 'Bienvenue',
  'home.welcomeOn': 'sur MAINTeX',
  'home.tagline': 'Une vision unifiée pour une maintenance performante, fiable et durable.',

  // Espace de travail
  'workspace.title': 'MAINTeX Workspace',
  'workspace.back': 'Retour à l’accueil MAINTeX',
  'workspace.moduleBelongs': 'Ce module fait partie de l’écosystème MAINTeX.',
  'workspace.toConnect': 'Module à connecter',
  'workspace.noDemo':
    'Aucun module de démonstration n’est chargé. La véritable application sera intégrée ici via le contrat d’intégration MAINTeX.',
  'workspace.openInNewTab': 'Ouvrir {app} dans un nouvel onglet',
  'workspace.loading': 'Ouverture de {app}…',
  'workspace.addressMissing': 'Adresse de {app} non configurée',
  'workspace.addressMissingHelp':
    'L’administrateur doit renseigner l’adresse de cette application sur le serveur MAINTeX (variable MAINTEX_APP_URLS).',
  'workspace.addressInvalid': 'Adresse de {app} invalide',
  'workspace.accessDenied': 'Accès à {app} refusé',
  'workspace.accessDeniedHelp': 'Accès refusé.',
  'workspace.ownLogin':
    'Cette application demande encore sa propre connexion : la connexion unique n’est pas activée pour elle.',

  // Droits
  'access.denied':
    'Accès refusé à ce module pour votre profil. Contactez l’administrateur MAINTeX si vous en avez besoin.',

  // Pied de page
  'footer.brand': 'MAINTeX — Maintenance Excellence Platform',
  'footer.rights': '© 2026 Tuncay GURSOY — Tous droits réservés · Conçu et réalisé par Tuncay GURSOY',
};

const nl: Dictionary = {
  'login.title': 'MAINTeX — Beveiligde aanmelding',
  'login.intro':
    'Meld u aan met uw professionele Google-account. Eén aanmelding geeft toegang tot al uw toepassingen.',
  'login.checking': 'Sessie wordt gecontroleerd…',
  'login.notConfigured': 'De aanmeldingsdienst is nog niet ingesteld op de hosting.',
  'login.refused': 'Aanmelding geweigerd.',

  'header.home': 'Terug naar het MAINTeX-startscherm',
  'header.quickAccess': 'Snelle toegang tot de toepassingen',
  'header.modulesLine1': 'Modules',
  'header.modulesLine2': 'in dienst',
  'header.open': 'Openen',
  'header.notifications': 'Meldingen',
  'header.notificationsNew': '{count} NIEUWE',
  'header.admin': 'Beheer',
  'header.logout': 'Afmelden',
  'header.language': 'Taal',
  'header.chooseLanguage': 'Taal kiezen',

  'home.eyebrow': 'Maintenance Excellence Platform',
  'home.welcome': 'Welkom',
  'home.welcomeOn': 'bij MAINTeX',
  'home.tagline': 'Eén gedeeld overzicht voor een performant, betrouwbaar en duurzaam onderhoud.',

  'workspace.title': 'MAINTeX Workspace',
  'workspace.back': 'Terug naar het MAINTeX-startscherm',
  'workspace.moduleBelongs': 'Deze module maakt deel uit van het MAINTeX-geheel.',
  'workspace.toConnect': 'Module nog aan te sluiten',
  'workspace.noDemo':
    'Er is geen demonstratiemodule geladen. De echte toepassing wordt hier aangesloten volgens het MAINTeX-integratiecontract.',
  'workspace.openInNewTab': '{app} in een nieuw tabblad openen',
  'workspace.loading': '{app} wordt geopend…',
  'workspace.addressMissing': 'Adres van {app} niet ingesteld',
  'workspace.addressMissingHelp':
    'De beheerder moet het adres van deze toepassing op de MAINTeX-server invullen (variabele MAINTEX_APP_URLS).',
  'workspace.addressInvalid': 'Adres van {app} ongeldig',
  'workspace.accessDenied': 'Toegang tot {app} geweigerd',
  'workspace.accessDeniedHelp': 'Toegang geweigerd.',
  'workspace.ownLogin':
    'Deze toepassing vraagt nog haar eigen aanmelding: de eenmalige aanmelding is er nog niet voor ingeschakeld.',

  'access.denied':
    'Uw profiel heeft geen toegang tot deze module. Neem contact op met de MAINTeX-beheerder als u ze nodig hebt.',

  'footer.brand': 'MAINTeX — Maintenance Excellence Platform',
  'footer.rights': '© 2026 Tuncay GURSOY — Alle rechten voorbehouden · Ontworpen en gebouwd door Tuncay GURSOY',
};

const en: Dictionary = {
  'login.title': 'MAINTeX — Secure sign-in',
  'login.intro': 'Sign in with your work Google account. One sign-in opens every application.',
  'login.checking': 'Checking your session…',
  'login.notConfigured': 'The sign-in service is not configured on this hosting yet.',
  'login.refused': 'Sign-in refused.',

  'header.home': 'Back to the MAINTeX home page',
  'header.quickAccess': 'Quick access to applications',
  'header.modulesLine1': 'Modules',
  'header.modulesLine2': 'in service',
  'header.open': 'Open',
  'header.notifications': 'Notifications',
  'header.notificationsNew': '{count} NEW',
  'header.admin': 'Administration',
  'header.logout': 'Sign out',
  'header.language': 'Language',
  'header.chooseLanguage': 'Choose a language',

  'home.eyebrow': 'Maintenance Excellence Platform',
  'home.welcome': 'Welcome',
  'home.welcomeOn': 'to MAINTeX',
  'home.tagline': 'One shared view for maintenance that performs, holds up and lasts.',

  'workspace.title': 'MAINTeX Workspace',
  'workspace.back': 'Back to the MAINTeX home page',
  'workspace.moduleBelongs': 'This module is part of the MAINTeX platform.',
  'workspace.toConnect': 'Module not connected yet',
  'workspace.noDemo':
    'No demonstration module is loaded. The real application will be connected here through the MAINTeX integration contract.',
  'workspace.openInNewTab': 'Open {app} in a new tab',
  'workspace.loading': 'Opening {app}…',
  'workspace.addressMissing': 'Address of {app} not configured',
  'workspace.addressMissingHelp':
    'An administrator must set this application’s address on the MAINTeX server (MAINTEX_APP_URLS variable).',
  'workspace.addressInvalid': 'Address of {app} is invalid',
  'workspace.accessDenied': 'Access to {app} refused',
  'workspace.accessDeniedHelp': 'Access refused.',
  'workspace.ownLogin':
    'This application still asks for its own sign-in: single sign-on is not enabled for it yet.',

  'access.denied':
    'Your profile has no access to this module. Ask your MAINTeX administrator if you need it.',

  'footer.brand': 'MAINTeX — Maintenance Excellence Platform',
  'footer.rights': '© 2026 Tuncay GURSOY — All rights reserved · Designed and built by Tuncay GURSOY',
};

export const TRANSLATIONS: Record<Language, Dictionary> = { fr, nl, en };

/**
 * Traducteur d'une langue. Les valeurs entre accolades sont remplacées :
 * t('workspace.loading', { app: 'ALPHAP' }) → « Ouverture d'ALPHAP… ».
 * Une clé inconnue retombe sur le français, puis sur la clé elle-même.
 */
export function createTranslator(language: Language) {
  const dictionary = TRANSLATIONS[language] || fr;
  return (key: string, values?: Record<string, string | number>): string => {
    const template = dictionary[key] ?? fr[key] ?? key;
    if (!values) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match,
    );
  };
}

export type Translator = ReturnType<typeof createTranslator>;
