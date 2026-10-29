---
sourcePath: "en/support.md"
---

# Вспомогательные утилиты (Support)

Hyperf предоставляет широкий набор вспомогательных утилит. В этом разделе перечислены некоторые часто используемые функции. Дополнительную информацию можно найти в репозитории [hyperf/support](https://github.com/hyperf/support).

## Утилиты для работы с корутинами

### Hyperf\Coroutine\Coroutine

Этот класс предназначен для проверки состояния и управления корутинами.

#### id(): int

Получение ID текущей корутины через статический метод `id()`. Если код выполняется вне среды корутины, возвращается `-1`.

#### create(callable $callable): int

Статический метод `create(callable $callable)` используется для создания новой корутины. Также можно использовать глобальные функции `co(callable $callable)` и `go(callable $callable)`.

Метод `create(callable $callable)` является надстройкой над нативным методом создания корутин Swoole/Swow. Его ключевое отличие заключается в том, что он перехватывает необработанные исключения и логирует их через `Hyperf\Contract\StdoutLoggerInterface` в качестве предупреждений (`warning`), предотвращая аварийное падение процесса.

#### inCoroutine(): bool

Статический метод `inCoroutine()` проверяет, выполняется ли текущий код внутри корутины.

### Hyperf\Context\Context

Класс `Context` используется для работы с контекстом корутины. По сути, он является оберткой над `Swoole\Coroutine::getContext()`. Однако `Hyperf\Context\Context` также совместим с выполнением вне корутинного окружения (например, в стандартном CLI или традиционном PHP-FPM).

### Hyperf\Coordinator\CoordinatorManager

Класс `CoordinatorManager` используется для координации и синхронизации корутин при наступлении определенных событий жизненного цикла сервиса.

```php
<?php
use Hyperf\Coordinator\CoordinatorManager;
use Hyperf\Coordinator\Constants;
use Hyperf\Coroutine\Coroutine;

Coroutine::create(function() {
    // Ожидание завершения всех обратных вызовов события OnWorkerStart
    CoordinatorManager::until(Constants::WORKER_START)->yield();
    echo 'worker started';
    // Выделение ресурсов...

    // Ожидание сигнала завершения воркера OnWorkerStop
    CoordinatorManager::until(Constants::WORKER_EXIT)->yield();
    echo 'worker exited';
    // Освобождение и очистка ресурсов...
});
```
