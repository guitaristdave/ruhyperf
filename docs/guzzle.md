---
sourcePath: "en/guzzle.md"
---

# HTTP-клиент Guzzle

Компонент [hyperf/guzzle](https://github.com/hyperf/guzzle) адаптирует популярный HTTP-клиент Guzzle для корутинного окружения Swoole/Swow, заменяя стандартный cURL-обработчик на неблокирующий корутинный транспорт.

## Установка

```bash
composer require hyperf/guzzle
```

## Использование через ClientFactory

Для удобного создания настроенного корутинного клиента Guzzle используется фабрика `Hyperf\Guzzle\ClientFactory`:

```php
<?php

declare(strict_types=1);

namespace App\Service;

use Hyperf\Guzzle\ClientFactory;

class ApiService
{
    public function __construct(protected ClientFactory $clientFactory)
    {
    }

    public function fetchExternalData(): string
    {
        // Создание клиента с поддержкой корутин
        $client = $this->clientFactory->create([
            'base_uri' => 'https://api.example.com',
            'timeout' => 5.0,
        ]);

        $response = $client->get('/users');
        return $response->getBody()->getContents();
    }
}
```

## Пул соединений для HTTP-запросов (PoolHandler)

При высокой частоте исходящих запросов к одному сервису повторное открытие TCP-соединений может вызывать исчерпание сокетов (TIME-WAIT). Компонент `hyperf/guzzle` предоставляет обработчик с пулом постоянных соединений:

```php
<?php

use GuzzleHttp\Client;
use GuzzleHttp\HandlerStack;
use Hyperf\Guzzle\HandlerStackFactory;

$factory = new HandlerStackFactory();

// Создает стек обработчиков со встроенным пулом соединений
$stack = $factory->create([
    'min_connections' => 1,
    'max_connections' => 30,
    'wait_timeout' => 3.0,
]);

$client = make(Client::class, [
    'config' => [
        'handler' => $stack,
        'base_uri' => 'https://api.example.com',
    ],
]);

$response = $client->get('/data');
```

## Автоматические повторные попытки (RetryMiddleware)

Компонент включает посредник для повтора запросов при временных сбоях сети:

```php
use GuzzleHttp\HandlerStack;
use Hyperf\Guzzle\PoolHandler;
use Hyperf\Guzzle\RetryMiddleware;

$handler = make(PoolHandler::class, ['option' => ['max_connections' => 50]]);
$retry = make(RetryMiddleware::class, ['retries' => 2, 'delay' => 100]); // 2 повтора с интервалом 100мс

$stack = HandlerStack::create($handler);
$stack->push($retry->getMiddleware(), 'retry');
```
