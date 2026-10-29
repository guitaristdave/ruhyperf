---
sourcePath: "en/aop.md"
---

# Аспектно-ориентированное программирование (AOP)

## Концепция

**AOP (Aspect-Oriented Programming)** — парадигма программирования, позволяющая выделить сквозную функциональность (логирование, транзакции, кэширование, замер времени, проверка прав) в отдельные изолированные модули — **Аспекты (Aspects)**.

В Hyperf механизм AOP позволяет **перехватить выполнение любого метода любого класса**, управляемого контейнером [hyperf/di](di), изменив или расширив его поведение до, после или вместо оригинального вызова — без модификации исходного кода целевого класса.

> **Требование:** Для работы AOP необходимо использовать стандартный DI-контейнер Hyperf.

---

## Архитектура AOP в Hyperf

В отличие от многих других реализаций AOP, в Hyperf модель максимально упрощена и сведена к универсальной форме **Around** (выполнение кода «вокруг» оригинального метода):

* **Аспект (`Aspect`)** — класс, определяющий точки внедрения (целевые классы, методы или атрибуты) и логику перехвата в методе `process()`.
* **Точка соединения (`ProceedingJoinPoint`)** — контекст вызова, позволяющий получить имя вызываемого метода, переданные аргументы и выполнить оригинальный метод (`$proceedingJoinPoint->process()`).
* **Прокси-класс (`ProxyClass`)** — для каждого класса, затронутого аспектом, Hyperf динамически генерирует прокси-класс в директории `runtime/container/proxy/`.

---

## Создание аспекта

Аспект должен реализовывать интерфейс `Hyperf\Di\Aop\AroundInterface` (для удобства достаточно унаследовать абстрактный класс `Hyperf\Di\Aop\AbstractAspect`) и быть помечен атрибутом `#[Aspect]` (либо зарегистрирован в `config/autoload/aspects.php`).

```php
<?php
declare(strict_types=1);

namespace App\Aspect;

use App\Service\SomeService;
use App\Annotation\Loggable;
use Hyperf\Di\Annotation\Aspect;
use Hyperf\Di\Aop\AbstractAspect;
use Hyperf\Di\Aop\ProceedingJoinPoint;

#[Aspect]
class LoggingAspect extends AbstractAspect
{
    // 1. Указываем целевые классы и методы
    public array $classes = [
        SomeService::class,                  // Перехватить все методы класса
        'App\Service\OrderService::create',  // Перехватить конкретный метод
        'App\Service\PaymentService::*Pay',  // Маска: методы, заканчивающиеся на Pay
    ];

    // 2. Либо перехватываем методы, помеченные определенным атрибутом
    public array $annotations = [
        Loggable::class,
    ];

    public function process(ProceedingJoinPoint $proceedingJoinPoint)
    {
        // --- ДЕЙСТВИЯ ДО ВЫЗОВА МЕТОДА ---
        $className = $proceedingJoinPoint->className;
        $methodName = $proceedingJoinPoint->methodName;
        $arguments = $proceedingJoinPoint->arguments['keys']; // аргументы вызова

        $startTime = microtime(true);

        // ВЫЗОВ ОРИГИНАЛЬНОГО МЕТОДА
        $result = $proceedingJoinPoint->process();

        // --- ДЕЙСТВИЯ ПОСЛЕ ВЫЗОВА МЕТОДА ---
        $duration = microtime(true) - $startTime;
        // Например, запись в лог времени выполнения метода

        return $result;
    }
}
```

---

## Порядок выполнения аспектов (Приоритет)

Если один и тот же метод перехватывается несколькими аспектами, порядок их выполнения определяется свойством `$priority` (чем выше число, тем раньше выполнится аспект):

```php
#[Aspect]
class FirstAspect extends AbstractAspect
{
    public ?int $priority = 100;
}
```

---

## Кэширование прокси-классов

Все сгенерированные прокси-классы сохраняются в директории `./runtime/container/proxy/`.

* В режиме разработки при изменении аспектов или классов кэш автоматически инвалидируется и пересоздается.
* В продакшене рекомендуется предварительно прогревать прокси-классы при сборке Docker-образа:

```bash
# Генерация всех AOP-прокси классов
php bin/hyperf.php di:init-proxy
```
Либо совместить инициализацию с запуском:
```bash
php bin/hyperf.php di:init-proxy && php bin/hyperf.php start
```
