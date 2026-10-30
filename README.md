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
npm run check:seo
npm run docs:preview
```

`check` проверяет полноту меню, внутренние ссылки и изображения. Сборка дополнительно проверяет компиляцию всех страниц и формирует поисковый индекс. `check:seo` после сборки проверяет sitemap, канонические адреса, наличие заголовков в HTML и отсутствие запрета индексации статей. Готовый сайт находится в `docs/.vitepress/dist`.

## Редактирование

Статьи хранятся в `docs/*.md`, изображения — в `docs/public/imgs/`, меню — в `docs/.vitepress/sidebar.json`. Поле `sourcePath` в начале статьи задаёт ссылку на английский оригинал. Оформление — `docs/.vitepress/theme/style.css`.

После переноса редактируйте статьи в этом репозитории. Wiki сохранена как архив; автоматической синхронизации с ней нет.

## GitHub Pages

В настройках репозитория **Settings → Pages → Build and deployment → Source** выберите **GitHub Actions**. Отправка в `main` запустит проверку, сборку и публикацию через `.github/workflows/deploy.yml`. Для pull request выполняются только проверки и сборка.

При смене имени репозитория или домена обновите `base`, `head` и `sitemap.hostname` в `docs/.vitepress/config.mts`.

## Индексация Google и Яндексом

Сайт отдаёт статьи в готовом HTML. При сборке VitePress создаёт карту всех статей `https://guitaristdave.github.io/ruhyperf/sitemap.xml`, а конфигурация добавляет каждой статье канонический адрес. Страница ошибки 404 получает `noindex`.

1. Откройте [Google Search Console](https://search.google.com/search-console/), добавьте ресурс типа **Префикс URL**: `https://guitaristdave.github.io/ruhyperf/`. Выберите подтверждение через **HTML-тег** и скопируйте только значение `content` из `google-site-verification`.
2. Откройте [Яндекс Вебмастер](https://webmaster.yandex.ru/), добавьте тот же адрес сайта. Выберите подтверждение метатегом и скопируйте значение `content` из `yandex-verification`.
3. Коды подтверждения уже добавлены в `head` файла `docs/.vitepress/config.mts`. При смене владельца замените значения `content` соответствующих метатегов. Это публичные коды, они попадут в HTML; переменные GitHub для них не нужны.
4. Опубликуйте изменения через `main`. Дождитесь успешного завершения workflow **Actions → Документация · GitHub Pages**. Проверьте наличие метатегов в исходном HTML главной страницы и нажмите подтверждение в обоих кабинетах. Не удаляйте метатеги после подтверждения: сервисы могут проверять права повторно.
5. В Google Search Console откройте **Файлы Sitemap** и отправьте `https://guitaristdave.github.io/ruhyperf/sitemap.xml`. В Яндекс Вебмастере откройте **Индексирование → Файлы Sitemap** и добавьте тот же URL.
6. В Google используйте **Проверка URL** для главной страницы и нажмите **Запросить индексирование**. В Яндексе отправьте главную и важные статьи через **Индексирование → Переобход страниц**. Статус обхода и индексации отслеживайте в кабинетах.

`robots.txt` поисковики читают только из корня хоста: `https://guitaristdave.github.io/robots.txt`. Этот репозиторий публикуется в `/ruhyperf/`, поэтому добавление `docs/public/robots.txt` не управляет обходом сайта. Отсутствующий корневой robots.txt сам по себе не запрещает обход. Если корневой сайт будет настроен отдельно, можно добавить туда `Sitemap: https://guitaristdave.github.io/ruhyperf/sitemap.xml`. До этого отправляйте карту через кабинеты.

Регистрация и отправка карты помогают обнаружить страницы, но не гарантируют включения в поиск и конкретных сроков. Инструкции: [Google о подтверждении прав](https://support.google.com/webmasters/answer/9008080), [Google о Sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [Яндекс о Sitemap](https://yandex.ru/support/webmaster/ru/indexing-options/sitemap).

## Зависимости

Используется стабильный VitePress 1.6.4. На момент установки `npm audit` сообщает о трёх уязвимостях в цепочке Vite/esbuild, относящихся к инструментам разработки. Готовый сайт — статические HTML/CSS/JS, сервер Vite на GitHub Pages не запускается. Не открывайте dev-сервер во внешнюю сеть; обновите VitePress после выхода исправленной стабильной версии.

## Авторство

Оригинальная документация — команда Hyperf, лицензия MIT (см. `LICENSE`). Русский перевод — David Akunts. Пожертвования переводчику принимаются через CloudTips; поддержка команды Hyperf описана отдельно в статье «Пожертвования».
