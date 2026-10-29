---
sourcePath: "en/async-queue.md"
---

# Асинхронная очередь (Async Queue)

Компонент [hyperf/async-queue](https://github.com/hyperf/async-queue) предоставляет легковесный механизм асинхронной и отложенной обработки задач на базе Redis.

В отличие от специализированных брокеров сообщений (`RabbitMQ`, `Kafka`), компонент ориентирован на простоту и не реализует строгих гарантий доставки или расширенных протоколов подтверждения (ACK).

## Установка

```bash
composer require hyperf/async-queue
```

## Конфигурация

Конфигурационный файл находится по пути `config/autoload/async_queue.php`:

| Параметр | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :--- |
| `driver` | string | `RedisDriver::class` | Драйвер очереди (поддерживается Redis) |
| `channel` | string | `'queue'` | Префикс имени очереди в Redis |
| `retry_seconds` | int | `5` | Интервал повторной попытки при ошибке (в секундах) |
| `processes` | int | `1` | Количество процессов-обработчиков (воркеров) |

Пример конфигурации:

```php
<?php

return [
    'default' => [
        'driver' => Hyperf\AsyncQueue\Driver\RedisDriver::class,
        'channel' => 'queue',
        'retry_seconds' => 5,
        'processes' => 1,
    ],
];
```

## Запуск процесса-потребителя (Consumer)

Для автоматического запуска воркеров очереди добавьте процесс `ConsumerProcess` в файл `config/autoload/processes.php`:

```php
<?php

return [
    Hyperf\AsyncQueue\Process\ConsumerProcess::class,
];
```

## Создание и отправка задач

### 1. Определение задачи (Job)

Создайте класс задачи, унаследовав его от `Hyperf\AsyncQueue\Job`:

```php
<?php

declare(strict_types=1);

namespace App\Job;

use Hyperf\AsyncQueue\Job;

class ExampleJob extends Job
{
    public array $params;

    public function __construct(array $params)
    {
        // Передавайте только сериализуемые простые типы данных.
        // Не передавайте ресурсы и объекты ввода-вывода (например, PDO).
        $this->params = $params;
    }

    public function handle(): void
    {
        // Логика выполнения задачи
        var_dump($this->params);
    }
}
```

> **Важно:** Экземпляр задачи сериализуется и сохраняется в Redis. Избегайте использования тяжелых объектов с состоянием или внедрения зависимостей через конструктор задачи. Не используйте фабричный хелпер `make` для создания Job.

### 2. Сервис отправки задач в очередь

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\Job\ExampleJob;
use Hyperf\AsyncQueue\Driver\DriverFactory;
use Hyperf\AsyncQueue\Driver\DriverInterface;

class QueueService
{
    protected DriverInterface $driver;

    public function __construct(DriverFactory $driverFactory)
    {
        $this->driver = $driverFactory->get('default');
    }

    /**
     * Поместить задачу в очередь.
     * 
     * @param array $params Данные для задачи
     * @param int $delay Задержка выполнения в секундах (0 - немедленно)
     */
    public function push(array $params, int $delay = 0): bool
    {
        return $this->driver->push(new ExampleJob($params), $delay);
    }
}
```

### 3. Отправка задачи из контроллера

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use App\Service\QueueService;
use Hyperf\Di\Annotation\Inject;
use Hyperf\HttpServer\Annotation\AutoController;

#[AutoController]
class QueueController
{
    #[Inject]
    protected QueueService $service;

    public function index(): string
    {
        // Задача выполнится через 10 секунд
        $this->service->push([
            'email' => 'user@example.com',
            'action' => 'send_report',
        ], 10);

        return 'Задача успешно добавлена в очередь';
    }
}
```
