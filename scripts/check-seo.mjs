import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const docs = resolve(import.meta.dirname, '../docs')
const dist = resolve(docs, '.vitepress/dist')
const siteUrl = 'https://guitaristdave.github.io/ruhyperf/'
const pages = readdirSync(docs).filter(name => name.endsWith('.md'))
const locations = [...readFileSync(resolve(dist, 'sitemap.xml'), 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)]
  .map(([, url]) => url)
const expected = pages.map(page => new URL(page === 'index.md' ? '' : page.replace(/\.md$/, '.html'), siteUrl).href)
assert.deepEqual(locations.sort(), [...expected].sort(), 'Sitemap должен содержать все статьи без дублей и страницы 404')

for (const [index, page] of pages.entries()) {
  const html = readFileSync(resolve(dist, page.replace(/\.md$/, '.html')), 'utf8')
  const head = html.split('</head>')[0]
  assert.ok(head.includes(`<link rel="canonical" href="${expected[index]}">`), `${page}: неверный canonical`)
  assert.doesNotMatch(head, /<meta\b[^>]*\bcontent="[^"]*\b(?:noindex|none)\b/i, `${page}: индексация запрещена`)
  assert.match(html, /<h1\b/, `${page}: заголовок должен быть в готовом HTML`)
  for (const name of ['google-site-verification', 'yandex-verification']) {
    assert.ok(head.includes(`name="${name}"`), `${page}: отсутствует ${name}`)
  }
}
assert.match(readFileSync(resolve(dist, '404.html'), 'utf8'), /<meta name="robots" content="noindex">/)
console.log(`SEO: проверены sitemap, canonical и HTML для ${pages.length} страниц; 404 закрыта от индексации.`)
