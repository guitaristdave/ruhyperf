import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../docs')
const pages = readdirSync(root).filter(name => name.endsWith('.md'))
const sidebar = JSON.parse(readFileSync(resolve(root, '.vitepress/sidebar.json'), 'utf8'))
const menuPages = sidebar.flatMap(group => group.items).filter(item => item.link.startsWith('/'))
const targets = new Set(menuPages.map(item => item.link === '/' ? 'index.md' : `${item.link.slice(1)}.md`))
assert.equal(pages.length, 114, 'Ожидаются все 114 страниц перевода')
assert.deepEqual(new Set(pages), targets, 'Меню должно содержать каждую статью и только существующие страницы')

for (const page of pages) {
  const text = readFileSync(resolve(root, page), 'utf8')
  assert.match(text, /^---\nsourcePath: /, `${page}: отсутствует ссылка на оригинал`)
  const prose = text.replace(/^([ \t]*)(`{3,}|~{3,})[^\n]*\n[\s\S]*?^\1\2[^\n]*$/gm, '')
  for (const [, href] of prose.matchAll(/\]\(([^\s)]+)/g)) {
    if (/^(?:https?:|mailto:|#)/.test(href)) continue
    const path = decodeURIComponent(href.split('#')[0])
    if (!path) continue
    const clean = path.replace(/^\.?\//, '')
    const file = /\.[a-z\d]+$/i.test(clean) ? clean : `${clean || 'index'}.md`
    assert.ok(existsSync(resolve(root, clean.startsWith('imgs/') ? `public/${file}` : file)), `${page}: ссылка на отсутствующий файл ${href}`)
  }
}
console.log(`Проверено ${pages.length} страниц, ${sidebar.length} разделов меню, внутренние ссылки и изображения.`)
