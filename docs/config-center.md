---
sourcePath: "en/config-center.md"
---

# Центр конфигураций (Config Center)

В микросервисной архитектуре централизованное управление конфигурациями решает задачи безопасного хранения секретов вне репозиториев кода, динамического обновления параметров на лету без перезапуска подов/серверов и разделения окружений (dev, test, prod).

Hyperf поддерживает работу со следующими центрами конфигураций:
* [Apollo](https://github.com/ctripcorp/apollo) — через `hyperf/config-apollo`
* [Nacos](https://nacos.io/) — через `hyperf/config-nacos`
* [Aliyun ACM](https://help.aliyun.com/product/59604.html) — через `hyperf/config-aliyun-acm`
* [Etcd](https://etcd.io/) — через `hyperf/config-etcd`

## Установка (на примере Apollo)

```bash
composer require hyperf/config-apollo
```

## Конфигурация Apollo

Создайте файл `config/autoload/apollo.php`:

```php
<?php

return [
    // Включение фонового процесса обновления конфигураций ConfigFetcherProcess
    'enable' => true,
    // Адрес сервера Apollo
    'server' => 'http://127.0.0.1:8080',
    'appid' => 'my-app',
    'cluster' => 'default',
    'namespaces' => [
        'application',
    ],
    // Приведение типов: false (всегда строка) или true (по исходному типу в config)
    'strict_mode' => false,
    // Интервал проверки обновлений в секундах
    'interval' => 5,
];
```

## Область действия динамических обновлений

Встроенный процесс `ConfigFetcherProcess` периодически опрашивает центр конфигураций и при обнаружении изменений передает новые значения всем рабочим процессам (Worker) через IPC-сообщения, обновляя объект `Hyperf\Contract\ConfigInterface`.

> **Важно:** Динамическое обновление без перезапуска сервиса применяется к конфигурациям уровня приложения и бизнес-логики (например, переключатели фич-флагов, лимиты, параметры интеграций). Конфигурации системного уровня (порты серверов Swoole, процессы воркеров) требуют перезапуска приложения.

## Событие изменения конфигурации (ConfigChanged)

При обновлении параметров фреймворк генерирует событие `Hyperf\ConfigCenter\Event\ConfigChanged`, на которое можно подписаться через Event Listener:

```php
<?php

declare(strict_types=1);

namespace App\Listener;

use Hyperf\ConfigCenter\Event\ConfigChanged;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;

#[Listener]
class ConfigChangeListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            ConfigChanged::class,
        ];
    }

    public function process(object $event): void
    {
        // Реакция на изменение конфигураций (сброс кэшей, повторное подключение и т.д.)
    }
}
```
