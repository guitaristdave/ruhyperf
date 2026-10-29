---
sourcePath: "en/websocket-client.md"
---

# Корутинный WebSocket-клиент

Компонент [hyperf/websocket-client](https://github.com/hyperf/websocket-client) предоставляет удобный корутинный клиент для подключения к WebSocket-серверам из любых частей вашего приложения.

## Установка

```bash
composer require hyperf/websocket-client
```

## Использование

Для создания клиента используется фабрика `Hyperf\WebSocketClient\ClientFactory`:

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use Hyperf\Di\Annotation\Inject;
use Hyperf\HttpServer\Annotation\AutoController;
use Hyperf\WebSocketClient\ClientFactory;
use Hyperf\WebSocketClient\Frame;

#[AutoController]
class WsClientController
{
    #[Inject]
    protected ClientFactory $clientFactory;

    public function test(): string
    {
        // Адрес удаленного WebSocket сервера (ws:// или wss://)
        $host = '127.0.0.1:9502';

        // Создание экземпляра клиента
        $client = $this->clientFactory->create($host);

        // Отправка текстового сообщения на сервер
        $client->push('Привет от корутинного клиента!');

        // Получение ответа от сервера с таймаутом 2 секунды
        /** @var Frame $frame */
        $frame = $client->recv(2.0);

        return $frame ? $frame->data : 'Таймаут получения ответа';
    }
}
```

## Управление автоматическим закрытием соединения

По умолчанию созданный клиент закрывает соединение автоматически при завершении корутины (`defer`). Если вам требуется удерживать соединение открытым:

```php
$autoClose = false;
$client = $clientFactory->create($host, $autoClose);

// В этом случае соединение необходимо закрыть вручную
$client->close();
```
