---
sourcePath: "en/rpc-multiplex.md"
---

# RPC с мультиплексированием соединений (RPC Multiplex)

Компонент [hyperf/rpc-multiplex](https://github.com/hyperf/rpc-multiplex) реализует высокопроизводительный RPC-протокол поверх TCP с **мультиплексированием соединений** (Connection Multiplexing).

В отличие от классического подхода с пулом соединений (где одно TCP-соединение обрабатывает только один синхронный запрос за раз), мультиплексирование позволяет множеству параллельных корутин одновременно отправлять и принимать запросы через одно или несколько постоянных TCP-соединений.

## Установка

```bash
composer require hyperf/rpc-multiplex
```

## Конфигурация сервера

В файле `config/autoload/server.php`:

```php
<?php

declare(strict_types=1);

use Hyperf\Server\Event;
use Hyperf\Server\Server;

return [
    'servers' => [
        [
            'name' => 'rpc',
            'type' => Server::SERVER_BASE,
            'host' => '0.0.0.0',
            'port' => 9502,
            'sock_type' => SWOOLE_SOCK_TCP,
            'callbacks' => [
                Event::ON_RECEIVE => [Hyperf\RpcMultiplex\TcpServer::class, 'onReceive'],
            ],
            'settings' => [
                'open_length_check' => true,
                'package_length_type' => 'N',
                'package_length_offset' => 0,
                'package_body_offset' => 4,
                'package_max_length' => 1024 * 1024 * 2, // 2MB
            ],
        ],
    ],
];
```

Публикация сервиса:

```php
<?php

namespace App\RPC;

use App\JsonRpc\CalculatorServiceInterface;
use Hyperf\RpcMultiplex\Constant;
use Hyperf\RpcServer\Annotation\RpcService;

#[RpcService(name: "CalculatorService", server: "rpc", protocol: Constant::PROTOCOL_DEFAULT)]
class CalculatorService implements CalculatorServiceInterface
{
    public function add(int $a, int $b): int
    {
        return $a + $b;
    }
}
```

## Конфигурация клиента

В файле `config/autoload/services.php`:

```php
<?php

return [
    'consumers' => [
        [
            'name' => 'CalculatorService',
            'service' => App\JsonRpc\CalculatorServiceInterface::class,
            'id' => App\JsonRpc\CalculatorServiceInterface::class,
            'protocol' => Hyperf\RpcMultiplex\Constant::PROTOCOL_DEFAULT,
            'load_balancer' => 'random',
            'nodes' => [
                ['host' => '127.0.0.1', 'port' => 9502],
            ],
            'options' => [
                'connect_timeout' => 5.0,
                'recv_timeout' => 5.0,
                'settings' => [
                    'package_max_length' => 1024 * 1024 * 2,
                ],
                'retry_count' => 2,
                'retry_interval' => 100,
                'client_count' => 4, // Число мультиплексированных постоянных TCP-соединений
                'heartbeat' => 30, // Интервал проверки соединения в секундах
            ],
        ],
    ],
];
```

При использовании сервисного реестра (Consul) зарегистрируйте слушатель:

```php
// config/autoload/listeners.php
return [
    Hyperf\RpcMultiplex\Listener\RegisterServiceListener::class,
];
```
