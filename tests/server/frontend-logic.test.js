// Tests de la logique pure de l'interface, exécutés avec Node
// (--experimental-strip-types lit directement les fichiers TypeScript).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { interpretMessage, originOf, buildEmbeddedUrl } from '../../src/shell/messageBridge.ts';
import { setAppValue, setModuleValue, getAppValue, getModuleValue, countDefined } from '../../src/components/admin/matrix.ts';

const apps = [
  { id: '5s', url: 'https://five-s.example.run.app' },
  { id: 'alphap', url: 'https://alphap.example.run.app/' },
  { id: 'rca', url: null },
];

test('relais : seules les origines des applications branchées sont acceptées', () => {
  const home = { source: '5s-digital-management', type: 'MAINTeX_REQUEST_HOME' };
  assert.deepEqual(interpretMessage({ origin: 'https://five-s.example.run.app', data: home }, apps), { kind: 'home', appId: '5s' });
  assert.equal(interpretMessage({ origin: 'https://malveillant.com', data: home }, apps), null);
  assert.equal(interpretMessage({ origin: 'https://five-s.example.run.app', data: { ...home, source: 'autre' } }, apps), null);
  assert.equal(interpretMessage({ origin: 'https://five-s.example.run.app', data: { ...home, type: 'AUTRE' } }, apps), null);
  assert.equal(interpretMessage({ origin: 'https://five-s.example.run.app', data: null }, apps), null);
  assert.equal(interpretMessage({ origin: 'null', data: home }, apps), null);
});

test('relais : une application ne peut pas se faire passer pour une autre', () => {
  const data = { source: '5s', type: 'MAINTeX_REQUEST_TOKEN' };
  assert.equal(interpretMessage({ origin: 'https://alphap.example.run.app', data }, apps), null);
  assert.deepEqual(
    interpretMessage({ origin: 'https://alphap.example.run.app', data: { source: 'alphap', type: 'MAINTeX_REQUEST_TOKEN' } }, apps),
    { kind: 'token', appId: 'alphap', origin: 'https://alphap.example.run.app' },
  );
});

test('origines : https obligatoire sauf localhost', () => {
  assert.equal(originOf('http://exemple.com'), null);
  assert.equal(originOf('http://localhost:5174/x'), 'http://localhost:5174');
  assert.equal(originOf('pas une url'), null);
  assert.equal(originOf(''), null);
});

test('adresse intégrée : mode embarqué et jeton dans le fragment', () => {
  const url = buildEmbeddedUrl('https://five-s.example.run.app/app?x=1', 'abc.def.ghi');
  assert.equal(url, 'https://five-s.example.run.app/app?x=1&maintexMode=embedded#maintex_token=abc.def.ghi');
  assert.equal(buildEmbeddedUrl('https://a.run.app', null), 'https://a.run.app/?maintexMode=embedded');
  assert.equal(buildEmbeddedUrl('nope', 't'), null);
});

test('matrice : poser puis remettre « hérité » nettoie les règles', () => {
  let rules = {};
  rules = setAppValue(rules, '5s', 'allow');
  rules = setModuleValue(rules, '5s', 'admin', 'deny');
  assert.deepEqual(rules, { '5s': { access: 'allow', modules: { admin: 'deny' } } });
  assert.equal(getAppValue(rules, '5s'), 'allow');
  assert.equal(getModuleValue(rules, '5s', 'admin'), 'deny');
  assert.equal(getModuleValue(rules, '5s', 'cockpit'), 'inherit');
  assert.equal(countDefined(rules), 2);
  rules = setModuleValue(rules, '5s', 'admin', 'inherit');
  rules = setAppValue(rules, '5s', 'inherit');
  assert.deepEqual(rules, {});
});
