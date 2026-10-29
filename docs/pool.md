---
sourcePath: "en/pool.md"
---

# Пул соединений (Pool)

## Установка

```bash
composer require hyperf/pool
```

## Зачем нужен пул соединений?

При очень низкой нагрузке соединения с базой данных или кэшем можно устанавливать по мере необходимости. Однако, когда пропускная способность сервиса достигает сотен или тысяч запросов в секунду, частые операции `Connect` и `Close` становятся узким местом системы. На практике при запуске сервиса заранее создается определенное количество соединений, которые помещаются в очередь. При необходимости соединение извлекается из очереди, используется и после завершения работы возвращается обратно. Структура данных такой очереди поддерживается пулом соединений (Connection Pool).

## Использование

Для компонентов, предоставляемых Hyperf (таких как базы данных, Redis, gRPC и др.), пул соединений уже встроен и настроен. При разработке разработчик даже не замечает его работы: Hyperf автоматически получает и возвращает соединения в пул.

## Пользовательский пул соединений

Чтобы определить собственный пул соединений, необходимо создать класс, наследующий `Hyperf\Pool\Pool` и реализующий абстрактный метод `createConnection()`, который должен возвращать объект, реализующий интерфейс `Hyperf\Contract\ConnectionInterface`.

Пример реализации:

```php
<?php
namespace App\Pool;

use Hyperf\Contract\ConnectionInterface;
use Hyperf\Pool\Pool;

class MyConnectionPool extends Pool
{
    public function createConnection(): ConnectionInterface
    {
        return new MyConnection();
    }
}
```

После этого соединения можно получать и возвращать, вызывая методы `get(): ConnectionInterface` и `release(ConnectionInterface $connection): void` у созданного объекта `MyConnectionPool`.

## SimplePool

В Hyperf предусмотрена простая реализация пула соединений без необходимости создания отдельных классов:

```php
<?php

use Hyperf\Pool\SimplePool\PoolFactory;
use Swoole\Coroutine\Http\Client;

$factory = $container->get(PoolFactory::class);

$pool = $factory->get('your pool name', function () use ($host, $port, $ssl) {
    return new Client($host, $port, $ssl);
}, [
    'max_connections' => 50
]);

$connection = $pool->get();

$client = $connection->getConnection(); // Вышеуказанный клиент Client

// Выполнение операций...

$connection->release();
```

## Интерфейс низкой частоты (Low-frequency Interface)

Пул имеет встроенный интерфейс `LowFrequencyInterface`. По умолчанию используется механизм отслеживания частоты обращений: на основе частоты запросов соединений из пула он определяет, нужно ли освобождать избыточные неиспользуемые соединения.

Если необходимо переопределить соответствующий компонент низкой частоты, вы можете настроить его в конфигурации `dependencies.php`. Рассмотрим на примере компонента базы данных:

```php
<?php

declare(strict_types=1);

namespace App\Pool;

class Frequency extends \Hyperf\Pool\Frequency
{
    /**
     * Интервал времени для расчета частоты (в секундах)
     * @var int
     */
    protected $time = 10;

    /**
     * Пороговое значение низкой частоты
     * @var int
     */
    protected $lowFrequency = 5;

    /**
     * Минимальный интервал времени для непрерывного срабатывания низкой частоты
     * @var int
     */
    protected $lowFrequencyInterval = 60;
}
```

Затем измените сопоставление зависимостей:

```php
<?php
return [
    Hyperf\DbConnection\Frequency::class => App\Pool\Frequency::class,
];
```

### Постоянная частота (Constant frequency)

Hyperf также предоставляет альтернативный компонент `ConstantFrequency`.

При создании этого компонента запускается таймер, который с регулярным интервалом вызывает метод `Pool::flushOne(false)`. Этот метод извлекает соединение из пула и уничтожает его, если оно простаивало дольше заданного периода времени.

```php
<?php
return [
    Hyperf\DbConnection\Frequency::class => Hyperf\Pool\ConstantFrequency::class,
];
```
