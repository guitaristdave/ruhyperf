---
sourcePath: "en/amqp.md"
---

# AMQP (RabbitMQ)

Компонент [hyperf/amqp](https://github.com/hyperf/amqp) предоставляет полнофункциональную поддержку протокола AMQP 0-9-1 (включая RabbitMQ) для корутинной среды. Поддерживаются очереди, обменники (direct, fanout, topic), отложенные сообщения и вызовы RPC.

## Установка

```bash
composer require hyperf/amqp
```

## Конфигурация

Конфигурационный файл находится в `config/autoload/amqp.php`:

| Параметр | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :--- |
| `host` | string | `'localhost'` | Хост сервера RabbitMQ |
| `port` | int | `5672` | Порт сервера |
| `user` | string | `'guest'` | Имя пользователя |
| `password` | string | `'guest'` | Пароль |
| `vhost` | string | `'/'` | Виртуальный хост (vhost) |
| `concurrent.limit` | int | `0` | Максимальное число параллельных корутин-обработчиков |
| `pool.connections` | int | `1` | Размер пула соединений на рабочий процесс |

Пример конфигурации:

```php
<?php

return [
    'enable' => true,
    'default' => [
        'host' => env('AMQP_HOST', 'localhost'),
        'port' => (int) env('AMQP_PORT', 5672),
        'user' => env('AMQP_USER', 'guest'),
        'password' => env('AMQP_PASSWORD', 'guest'),
        'vhost' => '/',
        'concurrent' => [
            'limit' => 20,
        ],
        'pool' => [
            'connections' => 2,
        ],
        'params' => [
            'insist' => false,
            'login_method' => 'AMQPLAIN',
            'login_response' => null,
            'locale' => 'en_US',
            'connection_timeout' => 3.0,
            'read_write_timeout' => 6.0,
            'context' => null,
            'keepalive' => false,
            'heartbeat' => 3,
            'close_on_destruct' => false,
        ],
    ],
];
```

## Отправка сообщений (Producer)

Генерация класса продюсера:

```bash
php bin/hyperf.php gen:amqp-producer DemoProducer
```

Класс продюсера:

```php
<?php

declare(strict_types=1);

namespace App\Amqp\Producer;

use Hyperf\Amqp\Annotation\Producer;
use Hyperf\Amqp\Message\ProducerMessage;

#[Producer(exchange: 'hyperf', routingKey: 'hyperf')]
class DemoProducer extends ProducerMessage
{
    public function __construct(int $userId, array $data)
    {
        $this->payload = [
            'id' => $userId,
            'data' => $data,
        ];
    }
}
```

Отправка сообщения через экземпляр `Producer`:

```php
use App\Amqp\Producer\DemoProducer;
use Hyperf\Amqp\Producer;
use Hyperf\Di\Annotation\Inject;

class DemoService
{
    #[Inject]
    protected Producer $producer;

    public function notify(int $id, array $data): bool
    {
        return $this->producer->produce(new DemoProducer($id, $data));
    }
}
```

## Потребление сообщений (Consumer)

Генерация класса консьюмера:

```bash
php bin/hyperf.php gen:amqp-consumer DemoConsumer
```

Класс потребителя:

```php
<?php

declare(strict_types=1);

namespace App\Amqp\Consumer;

use Hyperf\Amqp\Annotation\Consumer;
use Hyperf\Amqp\Message\ConsumerMessage;
use Hyperf\Amqp\Result;
use PhpAmqpLib\Message\AMQPMessage;

#[Consumer(exchange: 'hyperf', routingKey: 'hyperf', queue: 'hyperf_queue', nums: 2)]
class DemoConsumer extends ConsumerMessage
{
    public function consumeMessage($data, AMQPMessage $message): Result
    {
        print_r($data);
        return Result::ACK;
    }
}
```

Фреймворк автоматически запустит выделенные процессы воркеров на основе аннотации `#[Consumer]`. При непредвиденном завершении процесс будет автоматически перезапущен.

### Результаты обработки сообщения

Метод `consumeMessage` должен возвращать один из статусов `Hyperf\Amqp\Result`:

| Результат | Поведение RabbitMQ |
| :--- | :--- |
| `Result::ACK` | Сообщение успешно обработано (`basic_ack`) |
| `Result::NACK` | Ошибка обработки, отклонить сообщение (`basic_nack`) |
| `Result::REQUEUE` | Ошибка обработки, вернуть сообщение обратно в очередь (`basic_reject` с requeue) |
| `Result::DROP` | Ошибка обработки, удалить сообщение без возврата в очередь |

## Отложенные сообщения (Delayed Exchange)

Для отложенных очередей требуется установленный плагин [rabbitmq-delayed-message-exchange](https://github.com/rabbitmq/rabbitmq-delayed-message-exchange):

```bash
rabbitmq-plugins enable rabbitmq_delayed_message_exchange
```

В классе продюсера подключите трейт `ProducerDelayedMessageTrait`:

```php
use Hyperf\Amqp\Message\ProducerDelayedMessageTrait;
use Hyperf\Amqp\Message\ProducerMessage;
use Hyperf\Amqp\Message\Type;

class DelayProducer extends ProducerMessage
{
    use ProducerDelayedMessageTrait;

    protected string $exchange = 'delayed_exchange';
    protected string $type = Type::DIRECT;

    public function __construct(mixed $data, int $delayMs = 5000)
    {
        $this->payload = $data;
        $this->setDelayMs($delayMs);
    }
}
```

## Удаленный вызов процедур (RPC)

Компонент AMQP позволяет реализовывать синхронный RPC поверх RabbitMQ:

### Консьюмер RPC

```php
#[Consumer(exchange: 'hyperf.rpc', routingKey: 'calculate', queue: 'rpc.calculate', nums: 1)]
class RpcConsumer extends ConsumerMessage
{
    public function consumeMessage($data, AMQPMessage $message): Result
    {
        $result = ['sum' => $data['a'] + $data['b']];
        $this->reply($result, $message);
        return Result::ACK;
    }
}
```

### Вызов RPC из клиента

```php
use Hyperf\Amqp\Message\DynamicRpcMessage;
use Hyperf\Amqp\RpcClient;

$rpcClient = $container->get(RpcClient::class);
$response = $rpcClient->call(new DynamicRpcMessage('hyperf.rpc', 'calculate', ['a' => 10, 'b' => 20]));
// $response: ['sum' => 30]
```
