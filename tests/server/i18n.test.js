// Contrôles du multilingue.
//
// Deux risques : qu'une langue prenne du retard sur le français sans que
// personne ne le voie, et qu'un texte à trous perde sa valeur en chemin.

import assert from 'node:assert/strict';
import test from 'node:test';

import { LANGUAGES, TRANSLATIONS, createTranslator, isLanguage } from '../../src/i18n/translations.ts';
import { buildEmbeddedUrl } from '../../src/shell/messageBridge.ts';

test('les trois langues sont proposées, le français en tête', () => {
  assert.deepEqual(
    LANGUAGES.map((entry) => entry.code),
    ['fr', 'nl', 'en'],
  );
  assert.ok(LANGUAGES.every((entry) => entry.short && entry.label && entry.htmlLang));
});

test('aucune langue n’a de retard sur le français', () => {
  const reference = Object.keys(TRANSLATIONS.fr).sort();
  for (const code of ['nl', 'en']) {
    const manquantes = reference.filter((key) => !TRANSLATIONS[code][key]);
    assert.deepEqual(manquantes, [], `clés absentes en ${code} : ${manquantes.join(', ')}`);
  }
});

test('aucune langue ne contient de clé inconnue du français', () => {
  const reference = new Set(Object.keys(TRANSLATIONS.fr));
  for (const code of ['nl', 'en']) {
    const surnuméraires = Object.keys(TRANSLATIONS[code]).filter((key) => !reference.has(key));
    assert.deepEqual(surnuméraires, [], `clés en trop en ${code} : ${surnuméraires.join(', ')}`);
  }
});

test('les textes à trous gardent les mêmes trous dans les trois langues', () => {
  const trous = (value) => (String(value).match(/\{(\w+)\}/g) || []).sort().join(',');
  for (const [key, valeur] of Object.entries(TRANSLATIONS.fr)) {
    for (const code of ['nl', 'en']) {
      assert.equal(trous(TRANSLATIONS[code][key]), trous(valeur), `trous différents pour ${key} en ${code}`);
    }
  }
});

test('le traducteur remplace les valeurs et retombe sur le français', () => {
  const nl = createTranslator('nl');
  assert.equal(nl('workspace.loading', { app: 'ALPHAP' }), 'ALPHAP wordt geopend…');
  assert.equal(createTranslator('en')('header.admin'), 'Administration');
  // Une clé inconnue ne doit jamais s'afficher comme un texte brut cassé.
  assert.equal(nl('cle.inexistante'), 'cle.inexistante');
  // Une valeur absente laisse le trou visible plutôt que « undefined ».
  assert.equal(createTranslator('fr')('workspace.loading', {}), 'Ouverture de {app}…');
});

test('une langue inconnue retombe sur le français sans casser', () => {
  assert.equal(isLanguage('de'), false);
  assert.equal(isLanguage('fr'), true);
  assert.equal(createTranslator('de')('header.logout'), 'Déconnexion');
});

test('la langue choisie est transmise à l’application intégrée', () => {
  const avec = buildEmbeddedUrl('https://app.example.run.app', 'jeton', 'nl');
  assert.ok(avec.includes('maintexLang=nl'));
  assert.ok(avec.includes('maintexMode=embedded'));
  assert.ok(avec.endsWith('#maintex_token=jeton'));
  // Sans langue, l'adresse reste exactement celle d'avant.
  assert.equal(buildEmbeddedUrl('https://app.example.run.app', null), 'https://app.example.run.app/?maintexMode=embedded');
});
