import { defineConfig } from 'vitepress'
import sidebar from './sidebar.json'

export default defineConfig({
  lang: 'ru-RU',
  title: 'Hyperf на русском',
  description: 'Русский перевод документации Hyperf 3.1: установка, корутины, базы данных и микросервисы.',
  base: '/ruhyperf/',
  head: [
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/ruhyperf/favicon.svg' }],
    ['meta', { name: 'theme-color', content: '#345a89' }]
  ],
  sitemap: { hostname: 'https://guitaristdave.github.io/ruhyperf/' },
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
