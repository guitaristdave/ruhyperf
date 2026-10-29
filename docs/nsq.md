---
sourcePath: "en/nsq.md"
---

# NSQ

[NSQ](https://nsq.io) — это масштабируемая распределенная платформа обмена сообщениями реального времени, разработанная на языке Go. Компонент [hyperf/nsq](https://github.com/hyperf/nsq) предоставляет нативную поддержку NSQ для корутинного окружения.

## Установка

```bash
composer require hyperf/nsq
```

## Конфигурация

Конфигурационный файл создается по пути `config/autoload/nsq.php`:

```bash
php bin/hyperf.php vendor:publish hyperf/nsq
```

Пример конфигурации:

```php
<?php

return [
    'default' => [
        'host' => '127.0.0.1',
        'port' => 4150,
        'pool' => [
            'min_connections' => 1,
            'max_connections' => 10,
            'connect_timeout' => 10.0,
            'wait_timeout' => 3.0,
            'heartbeat' => -1,
            'max_idle_time' => 60.0,
        ],
    ],
];
```

## Создание потребителя (Consumer)

Генерация класса потребителя:

```bash
php bin/hyperf.php gen:nsq-consumer DemoConsumer
```

Атрибуты аннотации `#[Consumer]`:

| Свойство | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :--- |
| `topic` | string | `''` | Имя темы (топика) для подписки |
| `channel` | string | `''` | Имя канала для прослушивания |
| `name` | string | `'NsqConsumer'` | Имя потребителя |
| `nums` | int | `1` | Количество рабочих процессов |
| `pool` | string | `'default'` | Имя пула подключений NSQ |

Пример потребителя:

```php
<?php

declare(strict_types=1);

namespace App\Nsq\Consumer;

use Hyperf\Nsq\AbstractConsumer;
use Hyperf\Nsq\Annotation\Consumer;
use Hyperf\Nsq\Message;
use Hyperf\Nsq\Result;

#[Consumer(
    topic: "hyperf", 
    channel: "hyperf", 
    name: "DemoNsqConsumer", 
    nums: 2
)]
class DemoNsqConsumer extends AbstractConsumer
{
    public function consume(Message $payload): string 
    {
        var_dump($payload->getBody());
        return Result::ACK;
    }
}
```

### Отключение автозапуска воркеров

Для отладки можно временно отключить автозапуск потребителя, переопределив метод `isEnable()`:

```php
public function isEnable(): bool 
{
    return false;
}
```

## Публикация сообщений (Producer)

Для отправки сообщений используется класс `Hyperf\Nsq\Nsq`:

```php
use Hyperf\Nsq\Nsq;

$nsq = make(Nsq::class);

// Одиночное сообщение
$nsq->publish('hyperf', 'Текст сообщения');

// Пакетная отправка нескольких сообщений за один запрос
$nsq->publish('hyperf', [
    'Сообщение 1',
    'Сообщение 2',
    'Сообщение 3',
]);

// Отложенное сообщение (задержка 5 секунд)
$nsq->publish('hyperf', 'Отложенное сообщение', 5.0);
```

## NSQD HTTP API

Компонент также содержит HTTP-клиенты для административных операций с NSQD (удаление топиков, каналов, получение статистики):

```php
use Hyperf\Context\ApplicationContext;
use Hyperf\Nsq\Nsqd\Topic;

$client = ApplicationContext::getContainer()->get(Topic::class);
$client->delete('hyperf.test');
```
