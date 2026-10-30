import { defineConfig } from 'vitepress'
import sidebar from './sidebar.json'

const siteUrl = 'https://guitaristdave.github.io/ruhyperf/'

export default defineConfig({
  lang: 'ru-RU',
  title: 'Hyperf на русском',
  description: 'Русский перевод документации Hyperf 3.1: установка, корутины, базы данных и микросервисы.',
  base: '/ruhyperf/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/ruhyperf/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#345a89' }],
    ['meta', { name: 'google-site-verification', content: '80lLk-5b5u74ho8CkcZGaNLIruFavnBZSXU5Qe3uTJ4' }],
    ['meta', { name: 'yandex-verification', content: '91117382da52e97f' }]
  ],
  sitemap: { hostname: siteUrl },
  transformHead({ page }) {
    if (page === '404.md') return [['meta', { name: 'robots', content: 'noindex' }]]
    const path = page.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '.html')
    return [['link', { rel: 'canonical', href: new URL(path, siteUrl).href }]]
  },
  themeConfig: {
    siteTitle: 'Hyperf',
    nav: [
      { text: 'Оригинал', link: 'https://hyperf.wiki/3.1/#/en/' },
      { text: 'Поддержать переводчика', link: 'https://pay.cloudtips.ru/p/188a6b97' }
    ],
    socialLinks: [{ icon: 'github', link: 'https://github.com/guitaristdave/ruhyperf', ariaLabel: 'Исходники перевода на GitHub' }],
    sidebar,
    outline: { level: [2, 3], label: 'На этой странице' },
    docFooter: { prev: 'Предыдущая статья', next: 'Следующая статья' },
    editLink: { pattern: 'https://github.com/guitaristdave/ruhyperf/edit/main/docs/:path', text: 'Предложить правку' },
    sidebarMenuLabel: 'Разделы',
    darkModeSwitchLabel: 'Оформление',
    lightModeSwitchTitle: 'Светлая тема',
    darkModeSwitchTitle: 'Тёмная тема',
    returnToTopLabel: 'Наверх',
    skipToContentLabel: 'Перейти к содержимому',
    externalLinkIcon: false,
    notFound: { title: 'Страница не найдена', quote: 'Возможно, адрес изменился при переносе из wiki. Найдите статью через поиск или меню разделов.', linkLabel: 'К документации', linkText: 'К документации' },
    search: {
      provider: 'local',
      options: {
        locales: {
          root: {
            translations: {
              button: { buttonText: 'Поиск', buttonAriaLabel: 'Поиск по документации' },
              modal: {
                displayDetails: 'Показать подробности',
                resetButtonTitle: 'Очистить поиск',
                backButtonTitle: 'Закрыть поиск',
                noResultsText: 'Ничего не найдено',
                footer: { selectText: 'открыть', selectKeyAriaLabel: 'Enter', navigateText: 'перейти', navigateUpKeyAriaLabel: 'Стрелка вверх', navigateDownKeyAriaLabel: 'Стрелка вниз', closeText: 'закрыть', closeKeyAriaLabel: 'Escape' }
              }
            }
          }
        }
      }
    }
  }
})
