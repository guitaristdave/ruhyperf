---
sourcePath: "en/tcp-server.md"
---

# TCP / UDP сервер

Hyperf «из коробки» предоставляет возможность создания высокопроизводительных сервисов `TCP` и `UDP`. Для их запуска требуется лишь добавить конфигурацию сервера и реализовать обработчик событий.

## TCP-сервер

### 1. Создание класса обработчика TcpServer

Создайте класс, реализующий интерфейс `Hyperf\Contract\OnReceiveInterface`:

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use Hyperf\Contract\OnReceiveInterface;

class TcpServer implements OnReceiveInterface
{
    public function onReceive($server, int $fd, int $reactorId, string $data): void
    {
        $server->send($fd, 'recv:' . $data);
    }
}
```

### 2. Добавление конфигурации сервера

Добавьте конфигурацию в массив `servers` в файле `config/autoload/server.php`:

```php
<?php

declare(strict_types=1);

use Hyperf\Server\Event;
use Hyperf\Server\Server;

return [
    // Другие серверы (например, http)...
    'servers' => [
        [
            'name' => 'tcp',
            'type' => Server::SERVER_BASE,
            'host' => '0.0.0.0',
            'port' => 9504,
            'sock_type' => SWOOLE_SOCK_TCP,
            'callbacks' => [
                Event::ON_RECEIVE => [App\Controller\TcpServer::class, 'onReceive'],
            ],
            'settings' => [
                // Опции Swoole по необходимости (open_length_check, package_length_type и т.д.)
            ],
        ],
    ],
];
```

### 3. Пример клиента для тестирования

```php
<?php

$client = new \Swoole\Client(SWOOLE_SOCK_TCP);
$client->connect('127.0.0.1', 9504);
$client->send('Hello World.');
$ret = $client->recv(); // recv:Hello World.
```

## UDP-сервер

### 1. Создание класса обработчика UdpServer

Реализуйте интерфейс `Hyperf\Contract\OnPacketInterface`:

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use Hyperf\Contract\OnPacketInterface;

class UdpServer implements OnPacketInterface
{
    public function onPacket($server, $data, $clientInfo): void
    {
        var_dump($clientInfo);
        $server->sendto($clientInfo['address'], $clientInfo['port'], 'Server:' . $data);
    }
}
```

### 2. Конфигурация UDP-сервера

В `config/autoload/server.php`:

```php
<?php

declare(strict_types=1);

use Hyperf\Server\Event;
use Hyperf\Server\Server;

return [
    'servers' => [
        [
            'name' => 'udp',
            'type' => Server::SERVER_BASE,
            'host' => '0.0.0.0',
            'port' => 9505,
            'sock_type' => SWOOLE_SOCK_UDP,
            'callbacks' => [
                Event::ON_PACKET => [App\Controller\UdpServer::class, 'onPacket'],
            ],
            'settings' => [
                // Настройки по необходимости
            ],
        ],
    ],
];
```

## Поддерживаемые события сокетов

| Событие | Описание |
| :---: | :--- |
| `Event::ON_CONNECT` | Новое входящее соединение |
| `Event::ON_RECEIVE` | Получение данных по TCP-соединению |
| `Event::ON_CLOSE` | Закрытие соединения клиентом или сервером |
| `Event::ON_PACKET` | Получение пакета данных по протоколу UDP |
