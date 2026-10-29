---
sourcePath: "en/json-rpc.md"
---

# Сервис JSON-RPC

JSON-RPC — это легковесный протокол удаленного вызова процедур (RPC), использующий JSON для кодирования сообщений. В Hyperf поддержка JSON-RPC реализована компонентом [hyperf/json-rpc](https://github.com/hyperf/json-rpc) с возможностью передачи поверх HTTP или напрямую через TCP.

## Установка

```bash
composer require hyperf/json-rpc
```

Для работы сервера установите:
```bash
composer require hyperf/rpc-server
```

Для работы клиента установите:
```bash
composer require hyperf/rpc-client
```

## Концепция взаимодействия

В микросервисной архитектуре выделяют две роли:
1. **Поставщик услуг (ServiceProvider)** — сервис, предоставляющий свои методы другим сервисам.
2. **Потребитель услуг (ServiceConsumer)** — клиентский сервис, вызывающий удаленные процедуры.

Контракт взаимодействия обычно определяется в общем интерфейсе (`Service Contract`), который подключается как на стороне сервера, так и на стороне клиента.

## Определение поставщика услуг (RPC-сервера)

Для публикации сервиса используется атрибут `#[RpcService]`:

```php
<?php

declare(strict_types=1);

namespace App\JsonRpc;

use Hyperf\RpcServer\Annotation\RpcService;

#[RpcService(name: "CalculatorService", protocol: "jsonrpc-http", server: "jsonrpc-http")]
class CalculatorService implements CalculatorServiceInterface
{
    public function add(int $a, int $b): int
    {
        return $a + $b;
    }
}
```

Параметры атрибута `#[RpcService]`:
* `name` — уникальное глобальное имя сервиса (используется для обнаружения в реестре сервисов).
* `protocol` — протокол передачи: `jsonrpc-http` (поверх HTTP), `jsonrpc` (поверх TCP с разделителем EOF `\r\n`), `jsonrpc-tcp-length-check` (поверх TCP с заголовком длины пакета).
* `server` — имя сервера из `config/autoload/server.php`.
* `publishTo` — реестр сервисов (например, `'consul'` или `null` для ручного указания узлов).

### Конфигурация серверов в `server.php`

#### HTTP JSON-RPC сервер (`jsonrpc-http`)

```php
[
    'name' => 'jsonrpc-http',
    'type' => Server::SERVER_HTTP,
    'host' => '0.0.0.0',
    'port' => 9504,
    'sock_type' => SWOOLE_SOCK_TCP,
    'callbacks' => [
        Event::ON_REQUEST => [\Hyperf\JsonRpc\HttpServer::class, 'onRequest'],
    ],
],
```

#### TCP JSON-RPC сервер (`jsonrpc`)

```php
[
    'name' => 'jsonrpc',
    'type' => Server::SERVER_BASE,
    'host' => '0.0.0.0',
    'port' => 9503,
    'sock_type' => SWOOLE_SOCK_TCP,
    'callbacks' => [
        Event::ON_RECEIVE => [\Hyperf\JsonRpc\TcpServer::class, 'onReceive'],
    ],
    'settings' => [
        'open_eof_split' => true,
        'package_eof' => "\r\n",
        'package_max_length' => 1024 * 1024 * 2,
    ],
],
```

## Регистрация в сервис-центре (Consul)

Для автоматической регистрации сервиса в Consul укажите `publishTo: "consul"`:

```php
#[RpcService(name: "CalculatorService", protocol: "jsonrpc-http", server: "jsonrpc-http", publishTo: "consul")]
```

И настройте `config/autoload/consul.php`:

```php
return [
    'uri' => 'http://127.0.0.1:8500',
];
```

## Определение потребителя (RPC-клиента)

### Способ 1: Автоматический динамический прокси

В файле `config/autoload/services.php`:

```php
<?php

return [
    'consumers' => [
        [
            'name' => 'CalculatorService',
            'service' => \App\JsonRpc\CalculatorServiceInterface::class,
            'id' => \App\JsonRpc\CalculatorServiceInterface::class,
            'protocol' => 'jsonrpc-http',
            'load_balancer' => 'random', // random, round-robin, weighted
            // При использовании Consul:
            'registry' => [
                'protocol' => 'consul',
                'address' => 'http://127.0.0.1:8500',
            ],
            // Или прямое указание узлов (без Consul):
            // 'nodes' => [
            //     ['host' => '127.0.0.1', 'port' => 9504],
            // ],
            'options' => [
                'connect_timeout' => 5.0,
                'recv_timeout' => 5.0,
                'retry_count' => 2,
                'retry_interval' => 100,
                'pool' => [
                    'min_connections' => 1,
                    'max_connections' => 32,
                    'connect_timeout' => 10.0,
                    'wait_timeout' => 3.0,
                    'heartbeat' => -1,
                    'max_idle_time' => 60.0,
                ],
            ],
        ],
    ],
];
```

Теперь сервис можно просто внедрить в контроллер через DI:

```php
use App\JsonRpc\CalculatorServiceInterface;
use Hyperf\Di\Annotation\Inject;

class OrderController
{
    #[Inject]
    protected CalculatorServiceInterface $calculatorService;

    public function calculate()
    {
        return $this->calculatorService->add(10, 20); // 30
    }
}
```

### Способ 2: Ручное создание класса клиента

```php
<?php

namespace App\JsonRpc;

use Hyperf\RpcClient\AbstractServiceClient;

class CalculatorServiceConsumer extends AbstractServiceClient implements CalculatorServiceInterface
{
    protected string $serviceName = 'CalculatorService';
    protected string $protocol = 'jsonrpc-http';

    public function add(int $a, int $b): int
    {
        return $this->__request(__FUNCTION__, compact('a', 'b'));
    }
}
```

## Пул соединений для TCP JSON-RPC

Для предотвращения частого открытия сокетов при высокой нагрузке используйте пул соединений `JsonRpcPoolTransporter`. Замените транспортер в `config/autoload/dependencies.php`:

```php
use Hyperf\JsonRpc\JsonRpcPoolTransporter;
use Hyperf\JsonRpc\JsonRpcTransporter;

return [
    JsonRpcTransporter::class => JsonRpcPoolTransporter::class,
];
```
