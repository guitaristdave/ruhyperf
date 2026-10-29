---
sourcePath: "en/retry.md"
---

# Повторные попытки (Retry)

Сетевые коммуникации в распределенных системах по своей природе подвержены временным сбоям. Механизм повторных попыток (Retry) повышает общую надежность системы, однако бесконтрольные повторы опасны: при массовых сбоях они удваивают нагрузку на упавшие сервисы, провоцируя «лавинный эффект» (cascading failure / avalanche).

Компонент [hyperf/retry](https://github.com/hyperf/retry) предоставляет гибкие стратегии повторных попыток с контролем бюджета (Budget Retry), плавным нарастанием интервалов (Backoff) и защитой от перегрузок.

## Установка

```bash
composer require hyperf/retry
```

## Базовое использование

Добавьте атрибут `#[Retry]` к методу, требующему повторных попыток при исключениях:

```php
use Hyperf\Retry\Annotation\Retry;

class RemoteService
{
    #[Retry(maxAttempts: 3, base: 100)]
    public function callRemoteApi(): array
    {
        // Вызов удаленного сервиса
        return $this->client->get('/data');
    }
}
```

## Доступные стратегии (Retry Policies)

Повторные попытки собираются из модульных стратегий подобно стеку middleware:

* `MaxAttemptsRetryPolicy` — ограничение максимального числа попыток (`maxAttempts`).
* `ClassifierRetryPolicy` — классификатор ошибок: определяет, при каких исключениях или возвращаемых значениях разрешен повтор (`retryThrowables`, `ignoreThrowables`, `retryOnThrowablePredicate`, `retryOnResultPredicate`).
* `FallbackRetryPolicy` — резервный метод (Fallback), вызываемый при исчерпании всех попыток (`fallback: "App\Service\FallbackService@handle"`).
* `SleepRetryPolicy` — интервалы между попытками: фиксированный (`FlatStrategy`) или экспоненциальный с рандомизацией (`BackoffStrategy`).
* `TimeoutRetryPolicy` — общий лимит времени на выполнение всех попыток (`timeout` в секундах).
* `CircuitBreakerRetryPolicy` — временное размыкание цепи при постоянных ошибках.
* `BudgetRetryPolicy` — механизм «бюджета повторов» на основе Token Bucket: гарантирует, что количество повторных попыток не превысит заданный процент от общего трафика (например, не более 20%), предотвращая перегрузку удаленного сервиса при авариях.

## Готовые аннотации-алиасы

Для часто используемых сценариев компонент предоставляет готовые атрибуты:

* `#[RetryThrowable]` — повтор при возникновении любого `Throwable` (аналог базового `#[Retry]`).
* `#[RetryFalsy]` — повтор, если метод вернул значение, приводимое к `false` (без исключений).
* `#[BackoffRetryThrowable]` — повтор при исключениях с нарастающим интервалом (от 100 мс).
* `#[BackoffRetryFalsy]` — повтор при `false` с нарастающим интервалом.

## Использование через Fluent API (в коде)

Механизм Retry можно использовать не только через атрибуты, но и в обычном процедурном коде:

```php
use Hyperf\Retry\Retry;

$result = Retry::whenReturns(false)
    ->max(3)
    ->inSeconds(5)
    ->sleep(100) // 100 мс
    ->fallback(fn () => ['status' => 'fallback'])
    ->call(function () {
        return $this->checkExternalStatus();
    });
```
