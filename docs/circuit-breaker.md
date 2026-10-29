---
sourcePath: "en/circuit-breaker.md"
---

# Автоматический выключатель (Circuit Breaker)

В распределенных микросервисных системах сбой одного базового сервиса может вызвать лавинообразное падение всей цепочки зависимых сервисов (эффект лавины / service avalanche). Для защиты системы применяется паттерн **Circuit Breaker** (автоматический выключатель), обеспечивающий быструю изоляцию сбойного сервиса и деградацию функционала (Fallback).

Компонент [hyperf/circuit-breaker](https://github.com/hyperf/circuit-breaker) предоставляет удобную реализацию данного паттерна на базе AOP-аннотаций.

## Установка

```bash
composer require hyperf/circuit-breaker
```

## Использование

Для защиты метода добавьте атрибут `#[CircuitBreaker]`:

```php
<?php

declare(strict_types=1);

namespace App\Service;

use App\Client\UserServiceClient;
use Hyperf\CircuitBreaker\Annotation\CircuitBreaker;
use Hyperf\Di\Annotation\Inject;

class UserService
{
    #[Inject]
    private UserServiceClient $client;

    /**
     * Запрос к удаленному сервису с защитой выключателем.
     */
    #[CircuitBreaker(
        options: ['timeout' => 0.05], 
        failCounter: 1, 
        successCounter: 1, 
        fallback: [UserService::class, 'searchFallback']
    )]
    public function search(int $offset, int $limit): array
    {
        return $this->client->users($offset, $limit);
    }

    /**
     * Метод деградации при сбое удаленного сервиса.
     */
    public function searchFallback(int $offset, int $limit): array
    {
        return [];
    }
}
```

### Параметры CircuitBreaker

* `options.timeout` — таймаут выполнения запроса (в секундах).
* `failCounter` — количество последовательных ошибок/таймаутов для размыкания цепи (Open State). После размыкания запросы перестают отправляться в удаленный сервис, мгновенно вызывая `fallback`.
* `successCounter` — количество успешных пробных запросов в полуоткрытом состоянии (Half-Open) для восстановления цепи (Closed State).
* `fallback` — резервный метод для вызова в случае сбоя или разомкнутой цепи.

### Пользовательские обработчики (Custom Handler)

По умолчанию используется стратегия таймаутов (`Timeout Policy`). Вы можете реализовать собственный обработчик, унаследовав его от `Hyperf\CircuitBreaker\Handler\AbstractHandler`.
