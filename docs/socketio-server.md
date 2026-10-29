---
sourcePath: "en/socketio-server.md"
---

# Socket.io сервер

Socket.io — это популярный протокол и библиотека для двусторонней связи реального времени с поддержкой пространств имен (namespaces), комнат (rooms) и широковещательных рассылок (broadcasts). Пакет [hyperf/socketio-server](https://github.com/hyperf/socketio-server) реализует поддержку протокола Socket.io поверх WebSocket.

## Установка

```bash
composer require hyperf/socketio-server
```

Поскольку компонент работает поверх WebSocket, убедитесь, что в `config/autoload/server.php` настроен WebSocket-сервер:

```php
[
    'name' => 'socket-io',
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
```

## Быстрый старт

### Создание контроллера пространства имен

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use Hyperf\Codec\Json;
use Hyperf\SocketIOServer\Annotation\Event;
use Hyperf\SocketIOServer\Annotation\SocketIONamespace;
use Hyperf\SocketIOServer\BaseNamespace;
use Hyperf\SocketIOServer\Socket;

#[SocketIONamespace("/")]
class WebSocketController extends BaseNamespace
{
    /**
     * Простое событие 'event' с ответом
     */
    #[Event("event")]
    public function onEvent(Socket $socket, $data)
    {
        return 'Получено событие: ' . $data;
    }

    /**
     * Вход пользователя в комнату
     */
    #[Event("join-room")]
    public function onJoinRoom(Socket $socket, $data)
    {
        // Добавляем текущего пользователя в комнату
        $socket->join($data);

        // Отправка остальным участникам комнаты (кроме текущего)
        $socket->to($data)->emit('event', $socket->getSid() . " присоединился к {$data}");

        // Широковещательная рассылка всем участникам комнаты (включая текущего)
        $this->emit('event', 'В комнате ' . $data . ' сейчас участников: ' . count($socket->getAdapter()->clients($data)));
    }

    /**
     * Отправка сообщения в комнату
     */
    #[Event("say")]
    public function onSay(Socket $socket, $data)
    {
        $payload = Json::decode($data);
        $socket->to($payload['room'])->emit('event', $socket->getSid() . ': ' . $payload['message']);
    }
}
```

> **Примечание:** Каждый сокет автоматически подключается к комнате со своим `sid` (`$socket->getSid()`), что позволяет отправлять ему личные сообщения.

### Клиентская часть (JavaScript)

Поскольку данный сервер реализует именно WebSocket-транспорт, на клиенте укажите `{ transports: ["websocket"] }`:

```html
<script src="https://cdn.bootcdn.net/ajax/libs/socket.io/2.3.0/socket.io.js"></script>
<script>
    const socket = io('ws://127.0.0.1:9502', { transports: ["websocket"] });

    socket.on('connect', () => {
        socket.emit('event', 'Привет, Hyperf!', console.log);
        socket.emit('join-room', 'room1', console.log);
        
        setInterval(() => {
            socket.emit('say', JSON.stringify({ room: "room1", message: "Сообщение каждую секунду" }));
        }, 1000);
    });

    socket.on('event', console.log);
</script>
```

## Методы отправки (API)

### Внутри событийного обработчика (Socket API)

```php
#[Event("SomeEvent")]
public function onSomeEvent(Socket $socket)
{
    // Отправка клиенту-инициатору
    $socket->emit('hello', 'Данные', 123);

    // Всем клиентам кроме отправителя
    $socket->broadcast->emit('broadcast', 'Внимание всем');

    // Всем клиентам в комнате 'game' кроме отправителя
    $socket->to('game')->emit('nice game', 'Сыграем?');

    // Отправка в несколько комнат
    $socket->to('game1')->to('game2')->emit('event', 'data');

    // Отправка с подтверждением (Acknowledgement / Reply)
    $reply = $socket->emit('question', 'Согласны?')->reply();

    // Без сжатия
    $socket->compress(false)->emit('uncompressed', 'raw');
}
```

### Глобальная отправка (Global API)

Экземпляр `SocketIO` можно получить из DI-контейнера в любом месте приложения:

```php
use Hyperf\Context\ApplicationContext;
use Hyperf\SocketIOServer\SocketIO;

$io = ApplicationContext::getContainer()->get(SocketIO::class);

// Рассылка по всей комнате (включая отправителя)
$io->in('game')->emit('big-announcement', 'Игра скоро начнется');

// Рассылка в конкретном пространстве имен
$io->of('/chat')->to('general')->emit('message', 'Привет всем в чате');

// Личное сообщение по socketId
$io->to($socketId)->emit('private', 'Секретное сообщение');

// Всем клиентам на текущем сервере (в кластере)
$io->local->emit('node-alert', 'Обновление узла');

// Всем подключенным клиентам вообще
$io->emit('global-broadcast', 'Системное оповещение');
```

## Адаптеры комнат (Room Adapters)

По умолчанию для отслеживания комнат используется адаптер `Redis`, что обеспечивает прозрачную работу в многопроцессном режиме и при распределенном кластере.

При работе в одном процессе можно переключиться на `MemoryAdapter`:

```php
// config/autoload/dependencies.php
return [
    \Hyperf\SocketIOServer\Room\AdapterInterface::class => \Hyperf\SocketIOServer\Room\MemoryAdapter::class,
];
```

## Аутентификация через Middleware

Вы можете перехватить рукопожатие WebSocket и проверить авторизацию с помощью стандартного HTTP Middleware:

```php
<?php

declare(strict_types=1);

namespace App\Middleware;

use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class WebSocketAuthMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $token = $request->getQueryParams()['token'] ?? null;
        if (! $token || ! $this->validateToken($token)) {
            return new \Hyperf\HttpMessage\Server\Response(403, [], 'Forbidden');
        }

        return $handler->handle($request);
    }
}
```

## Конфигурация Nginx

```nginx
server {
    location ^~/socket.io/ {
        proxy_pass http://127.0.0.1:9502;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
