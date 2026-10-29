---
sourcePath: "en/websocket-server.md"
---

# WebSocket сервер

Hyperf предоставляет удобную и производительную обертку над WebSocket Server на базе компонента [hyperf/websocket-server](https://github.com/hyperf/websocket-server).

## Установка

```bash
composer require hyperf/websocket-server
```

## Конфигурация сервера

Добавьте секцию WebSocket в `config/autoload/server.php`:

```php
<?php

use Hyperf\Server\Event;
use Hyperf\Server\Server;

return [
    'servers' => [
        [
            'name' => 'ws',
            'type' => Server::SERVER_WEBSOCKET,
            'host' => '0.0.0.0',
            'port' => 9502,
            'sock_type' => SWOOLE_SOCK_TCP,
            'callbacks' => [
                Event::ON_HAND_SHAKE => [Hyperf\WebSocketServer\Server::class, 'onHandShake'],
                Event::ON_MESSAGE => [Hyperf\WebSocketServer\Server::class, 'onMessage'],
                Event::ON_CLOSE => [Hyperf\WebSocketServer\Server::class, 'onClose'],
            ],
        ],
    ],
];
```

## Настройка маршрутизации

В файле `config/routes.php` добавьте обработчик для сервера с именем `ws`:

```php
<?php

use Hyperf\HttpServer\Router\Router;

Router::addServer('ws', function () {
    Router::get('/', 'App\Controller\WebSocketController');
});
```

## Настройка Middleware

В файле `config/autoload/middlewares.php`:

```php
<?php

return [
    'ws' => [
        // App\Middleware\WebSocketAuthMiddleware::class,
    ],
];
```

## Создание WebSocket-контроллера

Контроллер должен реализовывать необходимые интерфейсы (`OnMessageInterface`, `OnOpenInterface`, `OnCloseInterface`):

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use Hyperf\Contract\OnCloseInterface;
use Hyperf\Contract\OnMessageInterface;
use Hyperf\Contract\OnOpenInterface;
use Swoole\Http\Request;
use Swoole\Websocket\Frame;

class WebSocketController implements OnMessageInterface, OnOpenInterface, OnCloseInterface
{
    public function onOpen($server, Request $request): void
    {
        $server->push($request->fd, 'Connected successfully');
    }

    public function onMessage($server, Frame $frame): void
    {
        $server->push($frame->fd, 'Recv: ' . $frame->data);
    }

    public function onClose($server, int $fd, int $reactorId): void
    {
        // Логика при отключении клиента
    }
}
```

Запустите сервер:

```bash
php bin/hyperf.php start
```

Вы увидите вывод:
```
[INFO] Worker#0 started.
[INFO] WebSocket Server listening at 0.0.0.0:9502
[INFO] HTTP Server listening at 0.0.0.0:9501
```

> **Важно:** Поскольку класс `Swoole\WebSocket\Server` наследуется от `Swoole\Http\Server`, по умолчанию порт HTTP-сервера 9501 также может принимать WebSocket-рукопожатия. Если вы хотите отключить это на HTTP-порту, установите параметр `'open_websocket_protocol' => false` в настройках HTTP-сервера.

## Контекст соединения (Connected Context)

Обработчики `onOpen`, `onMessage` и `onClose` выполняются в разных корутинах, поэтому они не могут напрямую разделять обычный корутинный контекст. Компонент WebSocket Server предоставляет специальный **Connected Context**, привязанный к дескриптору соединения (`fd`):

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use Hyperf\Contract\OnMessageInterface;
use Hyperf\Contract\OnOpenInterface;
use Hyperf\WebSocketServer\Context;
use Swoole\Http\Request;
use Swoole\Websocket\Frame;

class WebSocketController implements OnMessageInterface, OnOpenInterface
{
    public function onOpen($server, Request $request): void
    {
        // Сохраняем имя пользователя в контексте соединения
        Context::set('username', $request->cookie['username'] ?? 'guest');
    }

    public function onMessage($server, Frame $frame): void
    {
        // Читаем из контекста соединения
        $username = Context::get('username');
        $server->push($frame->fd, 'Hello, ' . $username);
    }
}
```

## Отправка сообщений из любого места приложения (Sender)

Если вам необходимо отправить сообщение или разорвать WebSocket-соединение из HTTP-контроллера, фонового процесса или очереди:

`Hyperf\WebSocketServer\Sender` автоматически проверяет, на каком Worker находится указанный `$fd`, и при необходимости использует межпроцессный `PipeMessage`.

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use Hyperf\Di\Annotation\Inject;
use Hyperf\HttpServer\Annotation\AutoController;
use Hyperf\WebSocketServer\Sender;

#[AutoController]
class NotifyController
{
    #[Inject]
    protected Sender $sender;

    public function send(int $fd)
    {
        $this->sender->push($fd, 'Привет из HTTP-контроллера!');
        return 'ok';
    }

    public function close(int $fd)
    {
        $this->sender->disconnect($fd);
        return 'closed';
    }
}
```

## Конфигурация Nginx для балансировки WebSocket

```nginx
upstream ws_cluster {
    server 127.0.0.1:9502;
    server 127.0.0.1:9503;
}

server {
    listen 80;
    server_name ws.example.com;

    location / {
        proxy_pass http://ws_cluster;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
