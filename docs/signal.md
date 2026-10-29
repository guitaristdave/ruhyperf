---
sourcePath: "en/signal.md"
---

# Обработчик сигналов (Signal Handler)

Компонент обработки сигналов прослушивает системные сигналы операционной системы в процессах `Worker` и пользовательских процессах (`Custom Process`), автоматически регистрируя обработчики в менеджере сигналов при запуске.

## Установка

```bash
composer require hyperf/signal
```

## Публикация конфигурации

Вы можете опубликовать файл конфигурации по умолчанию в свой проект с помощью следующей команды:

```bash
php bin/hyperf.php vendor:publish hyperf/signal
```

## Добавление обработчика сигналов

Ниже приведен пример перехвата сигнала `SIGTERM` в процессе `Worker` с выводом значения сигнала:

```php
<?php

declare(strict_types=1);

namespace App\Signal;

use Hyperf\Signal\Annotation\Signal;
use Hyperf\Signal\SignalHandlerInterface;

#[Signal]
class TermSignalHandler implements SignalHandlerInterface
{
    public function listen(): array
    {
        return [
            [SignalHandlerInterface::WORKER, SIGTERM],
        ];
    }

    public function handle(int $signal): void
    {
        var_dump($signal);
    }
}
```

Поскольку полученный процессом Worker сигнал `SIGTERM` теперь перехватывается вашим кодом, процесс не сможет завершиться стандартным образом. Пользователь может принудительно завершить его через `Ctrl + C`, либо настроить встроенный обработчик в `config/autoload/signal.php`:

> `WorkerStopHandler` не предназначен для корутинного сервера (CoroutineServer); при необходимости реализуйте собственный обработчик.

```php
<?php

declare(strict_types=1);

return [
    'handlers' => [
        Hyperf\Signal\Handler\WorkerStopHandler::class => PHP_INT_MIN
    ],
    'timeout' => 5.0,
];
```

При срабатывании `WorkerStopHandler` процесс корректно завершит работу после истечения времени, заданного директивой конфигурации [max_wait_time](https://wiki.swoole.com/#/server/setting?id=max_wait_time).

## Пример обработчика для Coroutine Server

> Стандартные обработчики адаптированы для классических серверов Swoole в асинхронном стиле. Если вы используете корутинный сервер (Coroutine Style Server), создайте собственный обработчик:

```php
<?php

declare(strict_types=1);

namespace App\Kernel\Signal;

use Hyperf\Contract\ConfigInterface;
use Hyperf\Process\ProcessManager;
use Hyperf\Server\ServerManager;
use Hyperf\Signal\SignalHandlerInterface;
use Psr\Container\ContainerInterface;

class CoroutineServerStopHandler implements SignalHandlerInterface
{
    protected ContainerInterface $container;
    protected ConfigInterface $config;

    public function __construct(ContainerInterface $container)
    {
        $this->container = $container;
        $this->config = $container->get(ConfigInterface::class);
    }

    public function listen(): array
    {
        // В корутинном стиле существует только один Worker-процесс
        return [
            [self::WORKER, SIGTERM],
            [self::WORKER, SIGINT],
        ];
    }

    public function handle(int $signal): void
    {
        ProcessManager::setRunning(false);

        foreach (ServerManager::list() as [$type, $server]) {
            // Корректное закрытие запущенных сервисов
            $server->shutdown();
        }
    }
}
```
