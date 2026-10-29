---
sourcePath: "en/logger.md"
---

# Логирование (Logger)

Компонент [hyperf/logger](https://github.com/hyperf/logger) реализует стандарт [PSR-3](https://www.php-fig.org/psr/psr-3/) (`Psr\Log\LoggerInterface`) и построен на базе популярнейшей библиотеки [monolog/monolog](https://github.com/Seldaek/monolog).

Поскольку сетевой движок Swoole автоматически корутинизирует файловые операции (`fopen`, `fwrite`), запись логов в Hyperf является **корутино-безопасной и неблокирующей** (при условии, что параметр `useLocking` не установлен в `true`).

---

## Установка и конфигурация

```bash
composer require hyperf/logger
```

Файл конфигурации каналов логирования: `config/autoload/logger.php`:

```php
<?php
use Monolog\Handler\RotatingFileHandler;
use Monolog\Formatter\LineFormatter;
use Monolog\Level;

return [
    'default' => [
        'handler' => [
            // RotatingFileHandler автоматически ротирует логи по дням
            'class' => RotatingFileHandler::class,
            'constructor' => [
                'filename' => BASE_PATH . '/runtime/logs/hyperf.log',
                'maxFiles' => 30, // хранить логи за последние 30 дней
                'level' => Level::Debug,
            ],
        ],
        'formatter' => [
            'class' => LineFormatter::class,
            'constructor' => [
                'format' => "[%datetime%] %channel%.%level_name%: %message% %context% %extra%\n",
                'dateFormat' => 'Y-m-d H:i:s',
                'allowInlineLineBreaks' => true,
            ],
        ],
    ],
];
```

---

## Использование логгера

Для получения экземпляра логгера внедрите фабрику `Hyperf\Logger\LoggerFactory`:

```php
<?php
declare(strict_types=1);

namespace App\Service;

use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

class OrderService
{
    protected LoggerInterface $logger;

    public function __construct(LoggerFactory $loggerFactory)
    {
        // Первый аргумент - имя канала лога, второй - группа из config/autoload/logger.php
        $this->logger = $loggerFactory->get('order', 'default');
    }

    public function createOrder(array $data): void
    {
        $this->logger->info('Создан новый заказ', [
            'order_id' => 12345,
            'amount' => 990.00,
            'user_id' => 42,
        ]);

        try {
            // ...
        } catch (\Throwable $e) {
            $this->logger->error('Ошибка проведения оплаты: ' . $e->getMessage(), [
                'exception' => $e,
            ]);
        }
    }
}
```

---

## Статический фасад для логов

Если вам удобен привычный статический синтаксис `Log::info(...)`:

Создайте класс `App\Log`:

```php
<?php
declare(strict_types=1);

namespace App;

use Hyperf\Context\ApplicationContext;
use Hyperf\Logger\LoggerFactory;
use Psr\Log\LoggerInterface;

class Log
{
    public static function get(string $name = 'app'): LoggerInterface
    {
        return ApplicationContext::getContainer()
            ->get(LoggerFactory::class)
            ->get($name);
    }
}
```

Использование в коде:
```php
Log::get('payment')->info('Платеж подтвержден', ['tx' => $txId]);
```

> ⚠️ **Предостережение от утечки памяти:**
> Никогда не используйте динамические уникальные значения (например, `request_id` или `user_id`) в качестве имени логгера (`Log::get($requestId)`). `LoggerFactory` кэширует созданные логгеры в памяти процесса, что при динамических именах приведет к бесконечному росту потребления RAM!

---

## Логирование в консоль: `StdoutLoggerInterface`

Логи самого фреймворка (информация о запуске серверов, зарегистрированных портах и воркерах) выводятся в стандартный вывод терминала (`stdout`) через интерфейс `Hyperf\Contract\StdoutLoggerInterface`.

Внедрите `StdoutLoggerInterface` в любые консольные команды или сервисы:

```php
use Hyperf\Contract\StdoutLoggerInterface;

public function __construct(private StdoutLoggerInterface $consoleLogger)
{
}

public function handle()
{
    $this->consoleLogger->info('Сервер готов к приему трафика');
    $this->consoleLogger->warning('Внимание: высокое потребление ресурсов');
}
```

---

## Логирование в формате JSON (для ELK / Loki)

В продакшене для интеграции с системами сбора логов (Elasticsearch, Fluentd, Promtail/Loki) рекомендуется использовать форматтер `Monolog\Formatter\JsonFormatter`:

```php
// config/autoload/logger.php
'formatter' => [
    'class' => \Monolog\Formatter\JsonFormatter::class,
    'constructor' => [
        'batchMode' => \Monolog\Formatter\JsonFormatter::BATCH_MODE_NEWLINES,
        'appendNewline' => true,
    ],
],
```
