---
sourcePath: "en/grpc.md"
---

# Сервис gRPC

`gRPC` — это высокопроизводительный универсальный RPC-фреймворк с открытым исходным кодом, разработанный Google. Он использует протокол HTTP/2 для передачи данных и Protocol Buffers (protobuf) для сериализации сообщений.

Hyperf предоставляет удобную и нативную поддержку gRPC как для сервера, так и для клиента на базе корутин Swoole/Swow.

## Установка

```bash
composer require hyperf/grpc-server
composer require hyperf/grpc-client
```

## Определение Protobuf (.proto)

Создайте файл описания протокола `grpc.proto`:

```protobuf
syntax = "proto3";

package grpc;

service Hi {
    rpc SayHello (HiUser) returns (HiReply) {}
}

message HiUser {
    string name = 1;
    int32 sex = 2;
}

message HiReply {
    string message = 1;
    HiUser user = 2;
}
```

Генерация PHP-классов с помощью `protoc`:

```bash
# Установка компилятора protobuf
apk add protobuf  # для Alpine / brew install protobuf для macOS

# Генерация классов сообщений
protoc --php_out=grpc/ grpc.proto
```

В `composer.json` добавьте автозагрузку сгенерированных классов:

```json
"autoload": {
    "psr-4": {
        "App\\": "app/",
        "GPBMetadata\\": "grpc/GPBMetadata",
        "Grpc\\": "grpc/Grpc"
    }
}
```

Выполните `composer dump-autoload`.

## gRPC-сервер

### 1. Конфигурация сервера в `server.php`

gRPC работает поверх HTTP/2, поэтому в настройках сервера указывается тип `Server::SERVER_HTTP`:

```php
'servers' => [
    [
        'name' => 'grpc',
        'type' => Server::SERVER_HTTP,
        'host' => '0.0.0.0',
        'port' => 9503,
        'sock_type' => SWOOLE_SOCK_TCP,
        'callbacks' => [
            Event::ON_REQUEST => [\Hyperf\GrpcServer\Server::class, 'onRequest'],
        ],
    ],
],
```

### 2. Маршрутизация в `config/routes.php`

Маршруты gRPC строятся по соглашению: `/{package}.{service}/{method}`:

```php
use Hyperf\HttpServer\Router\Router;

Router::addServer('grpc', function () {
    Router::addGroup('/grpc.Hi', function () {
        Router::post('/SayHello', 'App\Controller\HiController@sayHello');
    });
});
```

### 3. Контроллер обработчика

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use Grpc\HiReply;
use Grpc\HiUser;

class HiController
{
    public function sayHello(HiUser $user): HiReply
    {
        $reply = new HiReply();
        $reply->setMessage("Привет, " . $user->getName());
        $reply->setUser($user);

        return $reply;
    }
}
```

## gRPC-клиент

### 1. Создание класса клиента

Создайте класс, расширяющий базовый клиент `Hyperf\GrpcClient\BaseClient`:

```php
<?php

declare(strict_types=1);

namespace App\Grpc;

use Grpc\HiReply;
use Grpc\HiUser;
use Hyperf\GrpcClient\BaseClient;

class HiClient extends BaseClient
{
    public function sayHello(HiUser $argument)
    {
        return $this->_simpleRequest(
            '/grpc.Hi/SayHello',
            $argument,
            [HiReply::class, 'decode']
        );
    }
}
```

### 2. Вызов удаленного метода

```php
use App\Grpc\HiClient;
use Grpc\HiUser;

$client = new HiClient('127.0.0.1:9503', [
    'credentials' => null,
]);

$request = new HiUser();
$request->setName('Hyperf');
$request->setSex(1);

/** @var \Grpc\HiReply $reply */
[$reply, $status] = $client->sayHello($request);

echo $reply->getMessage(); // Привет, Hyperf
```

Клиент является корутинно-безопасным и может переиспользоваться между запросами. Поддерживается также режим потоковой передачи (Streaming mode).
