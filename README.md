# Hyperf 3.1 на русском

Русский перевод документации Hyperf 3.1. Сайт на VitePress с локальным поиском, светлой и тёмной темами.

- Сайт после публикации: https://guitaristdave.github.io/ruhyperf/
- Оригинал: https://hyperf.wiki/3.1/#/en/
- Исходная wiki: https://github.com/guitaristdave/ruhyperf/wiki
- Поддержать переводчика: https://pay.cloudtips.ru/p/188a6b97

## Локальный запуск

Нужен Node.js 22 (см. `.nvmrc`).

```sh
npm ci
npm run docs:dev
```

Откройте адрес, напечатанный VitePress. Путь сайта — `/ruhyperf/`.

## Проверка и сборка

```sh
npm run check
npm run docs:build
npm run docs:preview
```

`check` проверяет полноту меню, внутренние ссылки и изображения. Сборка дополнительно проверяет компиляцию всех страниц и формирует поисковый индекс. Готовый сайт находится в `docs/.vitepress/dist`.

## Редактирование

Статьи хранятся в `docs/*.md`, изображения — в `docs/public/imgs/`, меню — в `docs/.vitepress/sidebar.json`. Поле `sourcePath` в начале статьи задаёт ссылку на английский оригинал. Оформление — `docs/.vitepress/theme/style.css`.

После переноса редактируйте статьи в этом репозитории. Wiki сохранена как архив; автоматической синхронизации с ней нет.

## GitHub Pages

В настройках репозитория **Settings → Pages → Build and deployment → Source** выберите **GitHub Actions**. Отправка в `main` запустит проверку, сборку и публикацию через `.github/workflows/deploy.yml`. Для pull request выполняются только проверки и сборка.

При смене имени репозитория или домена обновите `base`, `head` и `sitemap.hostname` в `docs/.vitepress/config.mts`.

## Зависимости

Используется стабильный VitePress 1.6.4. На момент установки `npm audit` сообщает о трёх уязвимостях в цепочке Vite/esbuild, относящихся к инструментам разработки. Готовый сайт — статические HTML/CSS/JS, сервер Vite на GitHub Pages не запускается. Не открывайте dev-сервер во внешнюю сеть; обновите VitePress после выхода исправленной стабильной версии.

## Авторство

Оригинальная документация — команда Hyperf, лицензия MIT (см. `LICENSE`). Русский перевод — David Akunts. Пожертвования переводчику принимаются через CloudTips; поддержка команды Hyperf описана отдельно в статье «Пожертвования».
