---
sourcePath: "en/nats.md"
---

# NATS

[NATS](https://nats.io/) — это легковесный, высокопроизводительный распределенный брокер сообщений с архитектурой Publish/Subscribe, разработанный на языке Go. NATS оптимизирован для минимальных задержек и простоты масштабирования.

## Установка

```bash
composer require hyperf/nats
```

## Использование

### Создание потребителя (Consumer)

Для создания класса потребителя выполните команду:

```bash
php bin/hyperf.php gen:nats-consumer DemoConsumer
```

Если указан параметр `queue`, сообщения по данному `subject` будут распределяться между подписчиками одной очереди (балансировка нагрузки). Если `queue` не указан, сообщение получают все запущенные подписчики:

```php
<?php

declare(strict_types=1);

namespace App\Nats\Consumer;

use Hyperf\Nats\AbstractConsumer;
use Hyperf\Nats\Annotation\Consumer;
use Hyperf\Nats\Message;

#[Consumer(subject: 'hyperf.demo', queue: 'hyperf.demo', name: 'DemoConsumer', nums: 1)]
class DemoConsumer extends AbstractConsumer
{
    public function consume(Message $payload): void
    {
        $body = $payload->getBody();
        var_dump($body);
    }
}
```

### Публикация сообщений (Publish)

Обычная асинхронная публикация сообщения без ожидания ответа:

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use Hyperf\Di\Annotation\Inject;
use Hyperf\HttpServer\Annotation\AutoController;
use Hyperf\Nats\Driver\DriverInterface;

#[AutoController(prefix: "nats")]
class NatsController
{
    #[Inject]
    protected DriverInterface $nats;

    public function publish()
    {
        $res = $this->nats->publish('hyperf.demo', [
            'id' => '123',
            'message' => 'Hello NATS',
        ]);

        return ['success' => $res];
    }
}
```

### Запрос-Ответ (Request / Reply)

NATS поддерживает модель синхронного взаимодействия `Request-Reply`:

```php
public function request()
{
    // Асинхронный коллбэк ответа
    $res = $this->nats->request('hyperf.reply', ['id' => 1], function (Message $payload) {
        var_dump($payload->getBody());
    });

    return ['status' => $res];
}

public function sync()
{
    // Синхронное корутинное ожидание ответа
    /** @var Message $message */
    $message = $this->nats->requestSync('hyperf.reply', ['id' => 1]);

    return ['data' => $message->getBody()];
}
```
