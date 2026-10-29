---
sourcePath: "en/tracer.md"
---

# Распределенная трассировка (Tracer)

В микросервисной архитектуре сквозной бизнес-запрос пользователя часто проходит через десятки изолированных микросервисов, баз данных и очередей сообщений. Поиск узких мест и диагностика ошибок в таких условиях требуют системы распределенной трассировки.

Компонент [hyperf/tracer](https://github.com/hyperf/tracer) реализует стандарт [OpenTracing](https://opentracing.io/) с готовой поддержкой систем [Zipkin](https://zipkin.io/) и [Jaeger](https://www.jaegertracing.io/).

## Установка

```bash
composer require hyperf/tracer
```

Для использования Jaeger установите дополнительную библиотеку:

```bash
composer require jonahgeorge/jaeger-client-php
```

Публикация конфигурационного файла:

```bash
php bin/hyperf.php vendor:publish hyperf/tracer
```

## Конфигурация

Файл `config/autoload/opentracing.php`:

```php
<?php

use Hyperf\Tracer\Adapter\JaegerTracerFactory;
use Hyperf\Tracer\Adapter\ZipkinTracerFactory;
use const Jaeger\SAMPLER_TYPE_CONST;

return [
    'default' => env('TRACER_DRIVER', 'jaeger'),

    // Модули, для которых автоматически собираются Span-интервалы
    'enable' => [
        'guzzle' => true,
        'redis' => true,
        'db' => true,
    ],

    'tracer' => [
        // Конфигурация Zipkin
        'zipkin' => [
            'app' => [
                'name' => env('APP_NAME', 'my-service'),
                'ipv4' => '127.0.0.1',
                'port' => 9501,
            ],
            'driver' => ZipkinTracerFactory::class,
            'options' => [
                'endpoint_url' => env('ZIPKIN_ENDPOINT_URL', 'http://localhost:9411/api/v2/spans'),
                'timeout' => 1,
            ],
        ],
        // Конфигурация Jaeger
        'jaeger' => [
            'driver' => JaegerTracerFactory::class,
            'name' => env('APP_NAME', 'my-service'),
            'options' => [
                'sampler' => [
                    'type' => SAMPLER_TYPE_CONST,
                    'param' => true, // 100% сэмплирование
                ],
                'local_agent' => [
                    'reporting_host' => env('JAEGER_REPORTING_HOST', 'localhost'),
                    'reporting_port' => (int) env('JAEGER_REPORTING_PORT', 5775),
                ],
            ],
        ],
    ],
];
```

## Подключение трассировки входящих HTTP-запросов

В файле `config/autoload/middlewares.php`:

```php
return [
    'http' => [
        \Hyperf\Tracer\Middleware\TraceMiddleware::class,
    ],
];
```

Посредник `TraceMiddleware` автоматически извлекает заголовки контекста трассировки (`X-B3-TraceId`, `uber-trace-id`) из входящих HTTP-запросов и передает их дальше по цепочке вызовов (Guzzle, RPC, DB, Redis).
