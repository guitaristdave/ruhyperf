---
sourcePath: "en/coroutine-server.md"
---

# Корутинный сервер (Coroutine Style Server)

По умолчанию Hyperf запускается в классическом **асинхронном стиле Swoole** (`Swoole Asynchronous Style`), который представляет собой многопроцессную архитектуру (Master -> Manager -> Worker), а кастомные процессы запускаются как отдельные изолированные процессы ОС.

Hyperf также поддерживает **корутинный стиль** (`Swoole Coroutine Style`), при котором сервер функционирует в однопроцессной модели, а все фоновые и пользовательские процессы выполняются в виде корутин без порождения отдельных системных процессов.

> Обе модели имеют свои достоинства. **Не рекомендуется переключать стиль сервера в работающем проекте без веских архитектурных оснований.**

## Включение корутинного сервера

Для переключения в корутинный стиль укажите `Hyperf\Server\CoroutineServer::class` в параметре `type` файла `config/autoload/server.php`:

```php
<?php

declare(strict_types=1);

use Hyperf\Server\Event;
use Hyperf\Server\Server;

return [
    'type' => Hyperf\Server\CoroutineServer::class,
    'servers' => [
        [
            'name' => 'http',
            'type' => Server::SERVER_HTTP,
            'host' => '0.0.0.0',
            'port' => 9501,
            'sock_type' => SWOOLE_SOCK_TCP,
            'callbacks' => [
                Event::ON_REQUEST => [Hyperf\HttpServer\Server::class, 'onRequest'],
            ],
        ],
    ],
];
```

## Особенности и ограничения

1. **Различия в сигнатурах коллбэков:**  
   В асинхронном стиле первым аргументом событий (например, `onReceive`) передается экземпляр `Swoole\Server`, тогда как в корутинном стиле передается `Swoole\Coroutine\Server\Connection`:

   ```php
   namespace Hyperf\Contract;

   use Swoole\Coroutine\Server\Connection;
   use Swoole\Server as SwooleServer;

   interface OnReceiveInterface
   {
       /**
        * @param Connection|SwooleServer $server
        */
       public function onReceive($server, int $fd, int $reactorId, string $data): void;
   }
   ```

2. **Жизненный цикл корутин в Middleware WebSocket:**  
   В корутинном стиле корутина посредника WebSocket завершается только после закрытия соединения (`onClose`). Так как соединения с базой данных в Hyperf возвращаются в пул только при завершении корутины, использование ORM/DB внутри долгоживущего middleware WebSocket в корутинном стиле приведет к удержанию соединений пула.
