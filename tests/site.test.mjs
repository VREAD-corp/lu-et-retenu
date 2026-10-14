// Site build tests: committed build (docs/) and an open build in a temp dir: pages, links, JSON-LD (Service, offers for
// business customers, no rating), legal limits on the page, vendored scripts identical to octave-checkout, checkout config.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';

const ROOT = resolve(import.meta.dirname, '..');
const DOCS = join(ROOT, 'docs');
const GAS_WEB = process.env.OCTAVE_GAS_WEB || resolve(ROOT, '../octave-checkout/gas/web');
const read = (p) => readFileSync(p, 'utf8');
const ld = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const PRODUCTS = { 'lu-et-retenu-149': 14900, 'lu-et-retenu-199': 19900, 'lu-et-retenu-acquimetre-59': 5900 };

function build(cfgPatch) {
  const dir = mkdtempSync(join(tmpdir(), 'ler-site-'));
  const cfg = { ...JSON.parse(read(join(ROOT, 'sales.config.json'))), ...cfgPatch };
  writeFileSync(join(dir, 'sales.json'), JSON.stringify(cfg));
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: ROOT, env: { ...process.env, SALES_CONFIG: join(dir, 'sales.json'), SITE_OUT: join(dir, 'out') }, stdio: 'pipe' });
  return join(dir, 'out');
}

test('sales.config.json: the three products and prices of octave-checkout Config.js, terms version, VAT 293 B', () => {
  const c = JSON.parse(read(join(ROOT, 'sales.config.json')));
  assert.deepEqual(c.products, PRODUCTS);
  assert.equal(c.termsVersion, 'cgv-pro-lu-et-retenu-2026-10-14');
  assert.equal(c.VAT, 'franchise293B');
});

test('committed build: pages, legal pages, sample and every internal link resolves; buy UI only when SALES_OPEN', () => {
  for (const f of ['index.html', 'cgv-pro.html', 'mentions-legales.html', 'confidentialite.html', '404.html', 'sitemap.xml', 'robots.txt', 'mesure.js', 'cro.js', 'cro-goals.js', 'xp.js', 'apercu-questionnaire.png', 'exemple/LICENCE.txt']) assert.ok(existsSync(join(DOCS, f)), f);
  const open = JSON.parse(read(join(ROOT, 'sales.config.json'))).SALES_OPEN === true;
  for (const f of ['commander.html', 'commande.html', 'envoyer.html', 'checkout/pay.js', 'checkout/commander-xp.js']) assert.equal(existsSync(join(DOCS, f)), open, f);
  for (const page of readdirSync(DOCS).filter((f) => f.endsWith('.html'))) {
    const html = read(join(DOCS, page));
    for (const [, href] of html.matchAll(/(?:href|src)="([^"#:?]+\.(?:html|pdf|zip|css|svg|txt|png|js))"/g)) assert.ok(existsSync(join(DOCS, href)), `${page} -> ${href}`);
    const text = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/g, ' ');
    assert.doesNotMatch(text, /[a-zé»)] [?;!]/, `${page}: breaking space before ? ; !`);
    assert.doesNotMatch(text, /Lu &(amp;)? Compris|Vread Lu/i, `${page}: wrong brand`);
    if (page !== '404.html') assert.match(html, /une activité de READ FRANCE, l’éditeur de Vread/, `${page}: endorsement`);
  }
});

test('home page: JSON-LD Service with business offers (149–199 aggregate, 59), FAQ, no rating; legal limits stated; sample sources cited', () => {
  const html = read(join(DOCS, 'index.html'));
  const [svc, faq] = ld(html);
  assert.equal(svc['@type'], 'Service');
  assert.deepEqual(svc.offers.map((o) => [o['@type'], o.price ?? `${o.lowPrice}-${o.highPrice}`, o.eligibleCustomerType]), [['AggregateOffer', '149.00-199.00', 'https://schema.org/Business'], ['Offer', '59.00', 'https://schema.org/Business']]);
  assert.equal(faq['@type'], 'FAQPage');
  assert.doesNotMatch(html, /aggregateRating|"review"/);
  assert.match(html, /ne vaut pas validation juridique de votre règlement/);
  assert.match(html, /Une signature prouve la remise ; quelques questions montrent la lecture/);
  assert.match(html, /nous ne voyons aucune réponse/);
  assert.match(html, /code\.travail\.gouv\.fr\/code-du-travail\/l6352-3/);
  assert.match(html, /Licence Ouverte etalab 2\.0/);
  assert.match(html, /exemple\/lu-et-retenu-exemple-modeles-officiels\.zip/);
  assert.match(html, /data-prix-std/);
});

test('tracking: mesure.js = the octave-checkout master with the site id fixed to lu-et-retenu; cro.js byte-identical; A/B ler-prix by day', { skip: !existsSync(join(GAS_WEB, 'mesure.js')) }, () => {
  const master = read(join(GAS_WEB, 'mesure.js'));
  const ours = read(join(DOCS, 'mesure.js'));
  assert.match(ours, /site:'lu-et-retenu'/);
  assert.match(ours, /v:2/);
  assert.match(ours, /octave_notrack/);
  assert.equal(ours.split('\n').length, master.split('\n').length);
  assert.equal(ours.replace("site:'lu-et-retenu'", '').replace(/^\/\*![^\n]*\n/, ''), master.replace(/site:\/\^\([^)]*\)\/\.test\(g\)\?g:'hub'/, '').replace(/^\/\*![^\n]*\n/, ''));
  assert.equal(read(join(DOCS, 'cro.js')), read(join(GAS_WEB, 'cro.js')));
  const index = read(join(DOCS, 'index.html'));
  assert.ok(index.indexOf('src="xp.js"') < index.indexOf('src="cro.js"'), 'xp.js before cro.js');
  assert.match(index, /<script src="cro\.js" data-site="lu-et-retenu" data-api="https:\/\/script\.google\.com\/macros\/s\/AKfycbzD1IRL8Q[^"]+\/exec" data-hosts="outils\.vread\.fr"/);
  assert.match(read(join(DOCS, 'xp.js')), /id: 'ler-prix',\s*variants: \['p149', 'p199'\],\s*mode: 'day',\s*tz: 'Europe\/Paris'/);
});

test('open build: commander (products, extra fields, A/B swap before pay.js, CSP), commande, envoyer (3 documents); checkout config = catalog prices', () => {
  const out = build({ SALES_OPEN: true });
  const c = read(join(out, 'commander.html'));
  assert.match(c, /name="product" value="lu-et-retenu-149" checked/);
  assert.match(c, /name="product" value="lu-et-retenu-acquimetre-59"/);
  assert.match(c, /name="rightsAttested" data-octave-extra="bool" required/);
  assert.match(c, /name="acqOrder" data-octave-extra/);
  assert.match(c, /name="acqDeclared" data-octave-extra="bool"/);
  assert.match(c, /name="courses" data-octave-extra min="1" max="3"/);
  assert.match(c, /Content-Security-Policy" content="default-src 'self'; script-src 'self' https:\/\/js\.stripe\.com/);
  assert.match(c, /version du 14 octobre 2026/);
  assert.ok(c.indexOf('checkout/commander-xp.js') < c.indexOf('checkout/pay.js'));
  const cfgJs = read(join(out, 'checkout/checkout-config.js'));
  const cfg = JSON.parse(cfgJs.slice(cfgJs.indexOf('=') + 1).trim().replace(/;$/, ''));
  assert.deepEqual(cfg.offers, Object.fromEntries(Object.entries(PRODUCTS).map(([k, v]) => [k, { amount: v, termsVersion: 'cgv-pro-lu-et-retenu-2026-10-14' }])));
  assert.equal(cfg.orderPage, 'commande.html');
  const order = read(join(out, 'commande.html'));
  assert.ok(order.indexOf('checkout/eval-order.js') < order.indexOf('checkout/order.js'), 'eval-order.js must read the secret before order.js removes it');
  const env = read(join(out, 'envoyer.html'));
  assert.match(env, /id="upload-done"/);
  assert.equal((env.match(/class="course-row"/g) || []).length, 3);
  if (existsSync(join(GAS_WEB, 'pay.js'))) for (const f of ['pay.js', 'order.js']) assert.equal(read(join(out, 'checkout', f)), read(join(GAS_WEB, f)), f);
});

test('closed build: no buy page, CTA by e-mail', () => {
  const out = build({ SALES_OPEN: false });
  assert.equal(existsSync(join(out, 'commander.html')), false);
  assert.match(read(join(out, 'index.html')), /Écrire pour réserver/);
});
