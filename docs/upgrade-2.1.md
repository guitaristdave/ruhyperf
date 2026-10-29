---
sourcePath: "en/upgrade/2.1.md"
---

# Руководство по обновлению до 2.1

## Ключевые изменения в версии 2.1

- Появление абстрактного корутинного движка `hyperf/engine`, позволившего запускать Hyperf как поверх **Swoole**, так и поверх **Swow**.
- Минимальная версия PHP повышена с 7.2 до **7.3**.

## 1. Обновление зависимостей composer.json

Измените ограничения версий всех пакетов `hyperf/*` на `2.1.*`.

## 2. Оптимизация автозагрузки Composer

Рекомендуется включить опцию `optimize-autoloader` в `composer.json`, чтобы composer всегда генерировал карту классов `class_map`:

```json
{
    "config": {
        "optimize-autoloader": true,
        "sort-packages": true
    }
}
```

## 3. Переименование класса событий SwooleEvent

Класс `Hyperf\Server\SwooleEvent` переименован в `Hyperf\Server\Event`. Обновите импорты в конфигурационном файле `config/autoload/server.php`.

## 4. Пагинатор (Paginator)

Пакет `hyperf/paginator` исключен из обязательных зависимостей `hyperf/database`. Если вы используете постраничную пагинацию в запросах к БД, подключите компонент явно:

```bash
composer require hyperf/paginator
```

## 5. Обновление Doctrine DBAL

Если в проекте используется `doctrine/dbal` (например, для миграций БД), обновите его до версии `^3.0`. Удалите устаревший пакет `doctrine/common`, вызывавший конфликты.
