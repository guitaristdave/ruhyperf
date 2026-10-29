---
sourcePath: "en/kafka.md"
---

# Kafka

`Apache Kafka` — это распределенная платформа потоковой передачи данных с горизонтальным масштабированием, высокой пропускной способностью и минимальными задержками.

Компонент [hyperf/kafka](https://github.com/hyperf/kafka) основан на пакете `longlang/phpkafka` и обеспечивает полноценную работу с брокером Kafka в корутинной среде Hyperf.

## Требования

* Apache Kafka >= 1.0.0
* PHP >= 8.1

## Установка

```bash
composer require hyperf/kafka
```

## Конфигурация

Публикация конфигурации:

```bash
php bin/hyperf.php vendor:publish hyperf/kafka
```

Файл `config/autoload/kafka.php`:

```php
<?php

declare(strict_types=1);

use Hyperf\Kafka\Constants\KafkaStrategy;

return [
    'default' => [
        'connect_timeout' => -1,
        'send_timeout' => -1,
        'recv_timeout' => -1,
        'client_id' => 'hyperf-kafka',
        'max_write_attempts' => 3,
        'bootstrap_servers' => [
            '127.0.0.1:9092',
        ],
        'acks' => 1,
        'producer_id' => -1,
        'producer_epoch' => -1,
        'partition_leader_epoch' => -1,
        'interval' => 0,
        'session_timeout' => 60,
        'rebalance_timeout' => 60,
        'replica_id' => -1,
        'rack_id' => '',
        'group_retry' => 5,
        'group_retry_sleep' => 1,
        'group_heartbeat' => 3,
        'offset_retry' => 5,
        'auto_create_topic' => true,
        'partition_assignment_strategy' => KafkaStrategy::RANGE_ASSIGNOR,
        'sasl' => [],
        'ssl' => [],
    ],
];
```

## Создание потребителя (Consumer)

Генерация класса потребителя:

```bash
php bin/hyperf.php gen:kafka-consumer KafkaConsumer
```

Класс потребителя:

```php
<?php

declare(strict_types=1);

namespace App\Kafka;

use Hyperf\Kafka\AbstractConsumer;
use Hyperf\Kafka\Annotation\Consumer;
use longlang\phpkafka\Consumer\ConsumeMessage;

#[Consumer(topic: "hyperf_topic", nums: 2, groupId: "hyperf_group", autoCommit: true)]
class KafkaConsumer extends AbstractConsumer
{
    public function consume(ConsumeMessage $message): void
    {
        $topic = $message->getTopic();
        $key = $message->getKey();
        $value = $message->getValue();

        var_dump("Kafka msg: [{$topic}] {$key} => {$value}");
    }
}
```

Фреймворк автоматически создает фоновые процессы для чтения топика и перебалансировки группы потребителей.

## Отправка сообщений (Producer)

### Одиночная отправка с подтверждением (ACK)

```php
use Hyperf\Kafka\Producer;

class OrderService
{
    public function __construct(protected Producer $producer)
    {
    }

    public function createOrder(int $orderId, array $data): void
    {
        // Метод send ожидает подтверждения (ACK) от брокера
        $this->producer->send('orders_topic', json_encode($data), (string) $orderId);
    }
}
```

### Асинхронная отправка без блокировки

Если не требуется ждать подтверждения записи от брокера:

```php
$this->producer->sendAsync('events_topic', 'value', 'key');
```

### Пакетная отправка (Batch)

Для отправки пачки сообщений за один сетевой запрос:

```php
use longlang\phpkafka\Producer\ProduceMessage;

$this->producer->sendBatch([
    new ProduceMessage('topic1', 'значение 1', 'ключ 1'),
    new ProduceMessage('topic1', 'значение 2', 'ключ 2'),
    new ProduceMessage('topic2', 'значение 3', 'ключ 3'),
]);
```
