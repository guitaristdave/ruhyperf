---
sourcePath: "en/rate-limit.md"
---

# Ограничение частоты запросов (Rate Limit)

Компонент [hyperf/rate-limit](https://github.com/hyperf/rate-limit) реализует алгоритм **Token Bucket** (корзина токенов) для ограничения входящего трафика (Rate Limiting) на уровне контроллеров, методов или маршрутов.

## Установка

```bash
composer require hyperf/rate-limit
```

## Конфигурация

Публикация конфигурационного файла:

```bash
php bin/hyperf.php vendor:publish hyperf/rate-limit
```

Файл `config/autoload/rate_limit.php`:

| Параметр | По умолчанию | Описание |
| :---: | :---: | :--- |
| `create` | `1` | Скорость генерации токенов в секунду (QPS) |
| `consume` | `1` | Количество токенов, расходуемых на один запрос |
| `capacity` | `2` | Максимальная емкость корзины токенов (пиковый всплеск) |
| `limitCallback` | `[]` | Пользовательский коллбэк при срабатывании лимита |
| `waitTimeout` | `1` | Таймаут ожидания токена в очереди (секунды) |

## Использование через атрибуты

Атрибут `#[RateLimit]` можно применять как ко всему классу контроллера, так и к отдельным методам:

```php
<?php

namespace App\Controller;

use Hyperf\HttpServer\Annotation\Controller;
use Hyperf\HttpServer\Annotation\RequestMapping;
use Hyperf\RateLimit\Annotation\RateLimit;

#[Controller(prefix: "rate-limit")]
class RateLimitController
{
    // Ограничение: 1 запрос в секунду, емкость корзины 3
    #[RequestMapping(path: "test")]
    #[RateLimit(create: 1, capacity: 3)]
    public function test(): array
    {
        return ["status" => "ok"];
    }

    // Ограничение: расход 2 токенов на запрос
    #[RequestMapping(path: "test2")]
    #[RateLimit(create: 2, consume: 2, capacity: 4)]
    public function test2(): array
    {
        return ["status" => "ok"];
    }
}
```

> **Приоритет конфигурации:**  
> `Атрибут метода > Атрибут класса > Конфигурационный файл > Настройки по умолчанию`.

## Обработка превышения лимита

По умолчанию при превышении лимита выбрасывается исключение `Hyperf\RateLimit\Exception\RateLimitException`. Вы можете перехватить его с помощью [Exception Handler](exception-handler) или задать кастомный коллбэк `limitCallback`:

```php
#[Controller(prefix: "rate-limit")]
#[RateLimit(limitCallback: [RateLimitController::class, "onLimitReached"])]
class RateLimitController
{
    public static function onLimitReached(float $seconds, ProceedingJoinPoint $proceedingJoinPoint)
    {
        return ['code' => 429, 'message' => 'Слишком много запросов. Попробуйте позже.'];
    }
}
```

## Индивидуальный ключ ограничения (по пользователю или IP)

По умолчанию корзина токенов привязана к URL запроса. Чтобы ограничить частоту индивидуально для каждого пользователя (`user_id`) или IP-адреса, задайте параметр `key`:

```php
#[RateLimit(create: 5, capacity: 10, key: [TestController::class, "getUserKey"])]
public function test()
{
    return ["status" => "ok"];
}

public static function getUserKey(ProceedingJoinPoint $proceedingJoinPoint): string
{
    $request = ApplicationContext::getContainer()->get(RequestInterface::class);
    return 'user:' . ($request->input('user_id') ?? $request->getServerParams()['remote_addr']);
}
```
