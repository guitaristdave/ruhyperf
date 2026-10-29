---
sourcePath: "en/metric.md"
---

# Мониторинг и метрики (Metrics)

Ключевым аспектом надежности микросервисов является наблюдаемость (Observability). Компонент [hyperf/metric](https://github.com/hyperf/metric) предоставляет универсальный фасад для сбора телеметрии и метрик с поддержкой **Prometheus**, **StatsD** и **InfluxDB**.

## Установка

```bash
composer require hyperf/metric
```

Публикация конфигурационного файла:

```bash
php bin/hyperf.php vendor:publish hyperf/metric
```

## Конфигурация Prometheus

Файл `config/autoload/metric.php`:

```php
<?php

use Hyperf\Metric\Adapter\Prometheus\Constants;

return [
    'default' => env('METRIC_DRIVER', 'prometheus'),
    // Использовать отдельный процесс для сбора метрик (рекомендуется)
    'use_standalone_process' => true,
    // Автоматический сбор системных метрик (CPU, память, корутины Swoole)
    'enable_default_metric' => true,
    'default_metric_interval' => 5,

    'metric' => [
        'prometheus' => [
            'driver' => Hyperf\Metric\Adapter\Prometheus\MetricFactory::class,
            // Режим сбора: SCRAPE_MODE (Pull модель Prometheus) или PUSH_MODE (Pushgateway)
            'mode' => Constants::SCRAPE_MODE,
            'namespace' => env('APP_NAME', 'hyperf_app'),
            'scrape_host' => '0.0.0.0',
            'scrape_port' => '9502',
            'scrape_path' => '/metrics',
        ],
    ],
];
```

## Основные типы метрик

Компонент абстрагирует три стандартных типа метрик:

1. **Counter (Счетчик)** — монотонно возрастающее значение (например, количество выполненных HTTP-запросов, число ошибок).
2. **Gauge (Датчик)** — мгновенное значение, которое может как увеличиваться, так и уменьшаться (размер пула соединений, использование оперативной памяти).
3. **Histogram (Гистограмма)** — распределение наблюдений по интервалам (латентность ответов, длительность выполнения SQL-запросов).

## Сбор метрик HTTP-запросов

Подключите посредник в `config/autoload/middlewares.php`:

```php
return [
    'http' => [
        \Hyperf\Metric\Middleware\MetricMiddleware::class,
    ],
];
```

## Пользовательские метрики в бизнес-коде

Вы можете создавать и обновлять собственные метрики через интерфейс `MetricFactoryInterface`:

```php
<?php

declare(strict_types=1);

namespace App\Service;

use Hyperf\Di\Annotation\Inject;
use Hyperf\Metric\Contract\MetricFactoryInterface;

class OrderService
{
    #[Inject]
    private MetricFactoryInterface $metricFactory;

    public function createOrder(string $paymentMethod, float $amount): void
    {
        // 1. Счетчик заказов с меткой платежной системы
        $counter = $this->metricFactory->makeCounter('orders_total', ['payment_method']);
        $counter->with($paymentMethod)->add(1);

        // 2. Гистограмма суммы заказов
        $histogram = $this->metricFactory->makeHistogram('order_amount', ['currency']);
        $histogram->with('RUB')->put($amount);
    }
}
```
