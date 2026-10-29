---
sourcePath: "en/nacos.md"
---

# Клиент Nacos

Компонент [hyperf/nacos](https://github.com/hyperf/nacos) предоставляет корутинный PHP-клиент для [Alibaba Nacos](https://nacos.io/) — популярной платформы управления конфигурациями и обнаружения микросервисов.

## Установка

```bash
composer require hyperf/nacos
```

## Конфигурация

Публикация конфигурационного файла:

```bash
php bin/hyperf.php vendor:publish hyperf/nacos
```

Файл `config/autoload/nacos.php`:

```php
<?php

declare(strict_types=1);

return [
    'host' => env('NACOS_HOST', '127.0.0.1'),
    'port' => (int) env('NACOS_PORT', 8848),
    'username' => env('NACOS_USERNAME', null),
    'password' => env('NACOS_PASSWORD', null),
    // Аутентификация Aliyun (AccessKey / SecretKey)
    'access_key' => env('NACOS_ACCESS_KEY', null),
    'access_secret' => env('NACOS_ACCESS_SECRET', null),
    'guzzle' => [
        'config' => null,
    ],
];
```

## Регистрация сервисов и мониторинг (Heartbeat)

Для интеграции с реестром сервисов Nacos установите дополнительный компонент:

```bash
composer require hyperf/service-governance-nacos
```

Зарегистрируйте слушатели и фоновые процессы в конфигурации Hyperf:

1. **Слушатели** (`config/autoload/listeners.php`):
   * `Hyperf\ServiceGovernanceNacos\Listener\MainWorkerStartListener`
   * `Hyperf\ServiceGovernanceNacos\Listener\OnShutdownListener`

2. **Процесс Heartbeat** (`config/autoload/processes.php`):
   * `Hyperf\ServiceGovernanceNacos\Process\InstanceBeatProcess`

3. **Событие завершения работы** (`config/autoload/server.php`):

```php
use Hyperf\Server\Event;

return [
    'callbacks' => [
        Event::ON_SHUTDOWN => [Hyperf\Framework\Bootstrap\ShutdownCallback::class, 'onShutdown'],
    ],
];
```
