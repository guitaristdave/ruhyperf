---
sourcePath: "en/process.md"
---

# Пользовательские процессы (Custom Process)

Компонент [hyperf/process](https://github.com/hyperf/process) позволяет добавлять собственные пользовательские процессы. Эта функция обычно используется для создания специальных фоновых процессов мониторинга, отправки отчетов, обработки очередей или выполнения других служебных задач. При старте сервера автоматически создается процесс и запускается указанная логика подпроцесса. В случае непредвиденного падения или завершения процесса сервер автоматически перезапустит его.

## Создание пользовательского процесса

Создайте класс, наследующий `Hyperf\Process\AbstractProcess`, и реализуйте метод интерфейса `handle(): void`, поместив в него логику процесса.

Пример:

```php
<?php
declare(strict_types=1);

namespace App\Process;

use Hyperf\Process\AbstractProcess;

class FooProcess extends AbstractProcess
{
    public function handle(): void
    {
        // Ваша бизнес-логика...
    }
}
```

Класс пользовательского процесса определен, но его еще необходимо зарегистрировать в `ProcessManager`. Это можно сделать одним из двух способов: через конфигурационный файл или с помощью атрибута (аннотации).

### Регистрация через конфигурационный файл

Добавьте ваш класс процесса в массив конфигурации `config/autoload/processes.php`:

```php
// config/autoload/processes.php
return [
    \App\Process\FooProcess::class,
];
```

### Регистрация через атрибут

Укажите атрибут `#[Process]` над классом процесса, и Hyperf автоматически обнаружит и зарегистрирует его:

```php
<?php
declare(strict_types=1);

namespace App\Process;

use Hyperf\Process\AbstractProcess;
use Hyperf\Process\Annotation\Process;

#[Process(name: "foo_process")]
class FooProcess extends AbstractProcess
{
    public function handle(): void
    {
        // Ваша бизнес-логика...
    }
}
```

> При использовании атрибута `#[Process]` не забудьте импортировать пространство имен `use Hyperf\Process\Annotation\Process;`.

## Условия для запуска процесса

Иногда пользовательский процесс должен запускаться не всегда, а лишь при определенных условиях или значениях конфигурации. Для этого можно переопределить метод `isEnable($server): bool` в классе процесса. По умолчанию этот метод возвращает `true`, что означает запуск процесса вместе со стартом сервиса. Если метод вернет `false`, процесс запущен не будет.

```php
<?php
declare(strict_types=1);

namespace App\Process;

use Hyperf\Process\AbstractProcess;
use Hyperf\Process\Annotation\Process;

#[Process(name: "foo_process")]
class FooProcess extends AbstractProcess
{
    public function handle(): void
    {
        // Ваша логика...
    }

    public function isEnable($server): bool
    {
        // Не запускать при старте сервиса при определенных условиях
        return false;
    }
}
```

## Настройка пользовательского процесса

У пользовательского процесса есть ряд настраиваемых параметров, которые можно переопределить в свойствах подкласса или передать в атрибуте `#[Process]`:

```php
<?php
declare(strict_types=1);

namespace App\Process;

use Hyperf\Process\AbstractProcess;
use Hyperf\Process\Annotation\Process;

#[Process(name: "user-process", nums: 1, redirectStdinStdout: false, pipeType: 2, enableCoroutine: true)]
class FooProcess extends AbstractProcess
{
    /**
     * Количество запускаемых процессов
     * @var int
     */
    public $nums = 1;

    /**
     * Имя процесса
     * @var string
     */
    public $name = 'user-process';

    /**
     * Перенаправление стандартного ввода/вывода (stdin/stdout) процесса
     * @var bool
     */
    public $redirectStdinStdout = false;

    /**
     * Тип пайпа (pipe)
     * @var int
     */
    public $pipeType = 2;

    /**
     * Включена ли поддержка корутин в процессе
     * @var bool
     */
    public $enableCoroutine = true;
}
```

## Пример использования

Создадим дочерний процесс для мониторинга количества упавших задач в очереди и вывода предупреждения в лог при наличии ошибок:

```php
<?php
declare(strict_types=1);

namespace App\Process;

use Hyperf\Process\AbstractProcess;
use Hyperf\Process\Annotation\Process;
use Hyperf\Contract\StdoutLoggerInterface;

#[Process(name: "demo_process")]
class DemoProcess extends AbstractProcess
{
    public function handle(): void
    {
        $logger = $this->container->get(StdoutLoggerInterface::class);

        while (true) {
            $redis = $this->container->get(\Redis::class);
            $count = $redis->llen('queue:failed');

            if ($count > 0) {
                $logger->warning('The num of failed queue is ' . $count);
            }

            sleep(1);
        }
    }
}
```
