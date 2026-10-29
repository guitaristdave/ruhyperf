---
sourcePath: "en/upgrade/2.2.md"
---

# Руководство по обновлению до 2.2

Главная особенность версии 2.2 — полная поддержка **PHP 8** и нативных атрибутов.

## 1. Обновление версий пакетов Hyperf

Измените зависимости `hyperf/*` в `composer.json` на `2.2.*`.

Для подсказок атрибутов в IDE рекомендуется установить:

```bash
composer require "hyperf/ide-helper:2.2.*" --dev
```

Выполните обновление:

```bash
composer update "hyperf/*" -o
```

## 2. Обновление скрипта тестов

В `composer.json` добавьте опцию `--prepend test/bootstrap.php`:

```json
{
    "scripts": {
        "test": "co-phpunit --prepend test/bootstrap.php -c phpunit.xml --colors=always"
    }
}
```

## 3. Расширение pcntl

Новый сканер аннотаций использует расширение PHP `pcntl` для многопроцессного сканирования. Убедитесь, что расширение включено: `php --ri pcntl`.

## 4. Мультиплексирование в AMQP

Компонент AMQP получил полную поддержку мультиплексирования каналов внутри пула соединений. Ознакомьтесь с обновленной структурой конфигурации `config/autoload/amqp.php`.

## 5. Рефакторинг Центра конфигураций

Центры конфигураций вынесены в отдельные драйверы:
- Базовый компонент: `composer require "hyperf/config-center:~2.2.0"`
- Драйверы: `hyperf/config-apollo`, `hyperf/config-nacos` и др.
- Все параметры собраны в единый файл: `config/autoload/config_center.php`.

## 6. Сервис-провайдеры реестра сервисов

Драйверы регистрации сервисов для Consul и Nacos выделены в отдельные пакеты:
- `hyperf/service-governance-consul`
- `hyperf/service-governance-nacos`

## 7. Поддержка Flysystem v2

Hyperf 2.2 поддерживает как `league/flysystem` v1.0, так и v2.0. При переходе на Flysystem v2 обновите адаптеры хранилищ согласно документации.
