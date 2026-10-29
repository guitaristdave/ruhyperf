---
sourcePath: "en/crontab.md"
---

# Планировщик задач (Crontab)

В большинстве случаев выполнение периодических задач можно настроить с помощью стандартной команды `crontab` в Linux. Однако настройка crontab на производственных серверах может быть неудобной, а также имеет ограничение: минимальный интервал запуска составляет одну минуту.

Компонент [hyperf/crontab](https://github.com/hyperf/crontab) обеспечивает планирование задач с точностью до секунды и позволяет удобно определять задачи прямо в кодовой базе приложения.

## Установка

```bash
composer require hyperf/crontab
```

## Использование

### Запуск процесса планировщика

Перед использованием компонента периодических задач необходимо зарегистрировать процесс `Hyperf\Crontab\Process\CrontabDispatcherProcess` в файле `config/autoload/processes.php`:

```php
<?php
// config/autoload/processes.php
return [
    Hyperf\Crontab\Process\CrontabDispatcherProcess::class,
];
```

При запуске сервера будет создан отдельный пользовательский процесс для анализа и диспетчеризации задач. Также необходимо убедиться, что параметр `enable` в файле `config/autoload/crontab.php` установлен в `true`. Если файл конфигурации отсутствует, создайте его:

```php
<?php
// config/autoload/crontab.php
return [
    // Включение периодических задач
    'enable' => true,
];
```

## Определение запланированных задач

### С использованием файла конфигурации

Вы можете определить все задачи в конфигурационном файле `config/autoload/crontab.php`. Файл должен возвращать массив объектов `Hyperf\Crontab\Crontab[]`:

```php
<?php
// config/autoload/crontab.php
use Hyperf\Crontab\Crontab;

return [
    'enable' => true,
    // Задачи, определенные через конфигурацию
    'crontab' => [
        // Задача с обратным вызовом (по умолчанию)
        (new Crontab())
            ->setName('Foo')
            ->setRule('* * * * *')
            ->setCallback([App\Task\FooTask::class, 'execute'])
            ->setMemo('Пример запланированной задачи'),
        
        // Задача выполнения консольной команды
        (new Crontab())
            ->setType('command')
            ->setName('Bar')
            ->setRule('* * * * *')
            ->setCallback([
                'command' => 'swiftmailer:spool:send',
                // (необязательно) аргументы
                'fooArgument' => 'barValue',
                // (необязательно) опции
                '--message-limit' => 1,
                // Обязательно добавьте, чтобы избежать завершения основного процесса
                '--disable-event-dispatcher' => true,
            ])
            ->setEnvironments(['develop', 'production']),
        
        // Задача на основе замыкания (поддерживается только в Coroutine Server)
        (new Crontab())
            ->setType('closure')
            ->setName('Closure')
            ->setRule('* * * * *')
            ->setCallback(function () {
                var_dump(date('Y-m-d H:i:s'));
            })
            ->setEnvironments('production'),
    ],
];
```

Начиная с версии Hyperf 3.1, добавлен удобный синтаксис определения расписания через файл `config/crontabs.php`:

```php
<?php
// config/crontabs.php
use Hyperf\Crontab\Schedule;

Schedule::command('foo:bar')->setName('foo-bar')->setRule('* * * * *');
Schedule::call([Foo::class, 'bar'])->setName('foo-bar')->setRule('* * * * *');
Schedule::call(fn() => (new Foo)->bar())->setName('foo-bar')->setRule('* * * * *');
```

### С использованием атрибутов

Задачу можно быстро объявить с помощью атрибута `#[Crontab]`. В следующем примере задача `Foo` будет выполняться каждую минуту:

```php
<?php
namespace App\Task;

use Hyperf\Contract\StdoutLoggerInterface;
use Hyperf\Crontab\Annotation\Crontab;
use Hyperf\Di\Annotation\Inject;

#[Crontab(name: "Foo", rule: "* * * * *", callback: "execute", memo: "Пример запланированной задачи")]
class FooTask
{
    #[Inject]
    private StdoutLoggerInterface $logger;

    public function execute()
    {
        $this->logger->info(date('Y-m-d H:i:s', time()));
    }

    #[Crontab(rule: "* * * * * *", memo: "foo")]
    public function foo()
    {
        var_dump('foo');
    }
}
```

### Параметры конфигурации задачи

#### `name`

Имя запланированной задачи. Может быть любой строкой, имя каждой задачи должно быть уникальным.

#### `rule`

Правило расписания. Если правило состоит из 5 позиций, оно интерпретируется с точностью до минут, аналогично синтаксису cron в Linux. Если правило состоит из 6 позиций, в начало добавляется секунда (секундная точность). Например, `*/5 * * * * *` означает выполнение каждые 5 секунд. Обратите внимание: слэши в строках атрибутов PHP необходимо экранировать обратным слэшем: `*\/5 * * * * *`.

#### `callback`

Целевой обратный вызов задачи. В конфигурационном файле задается в виде массива `[$class, $method]`. В атрибутах достаточно указать имя публичного метода текущего класса. Если у класса всего один публичный метод, параметр можно опустить.

#### `singleton`

Предотвращает одновременный запуск нескольких экземпляров задачи на одном сервере, если предыдущее выполнение еще не завершилось.

#### `onOneServer`

При развертывании в кластере с несколькими серверами (нодами) гарантирует, что задача будет запущена только на одном сервере.

#### `mutexPool`

Имя пула соединений `Redis`, используемого для распределенного мьютекса (блокировки).

#### `mutexExpires`

Таймаут действия блокировки мьютекса (в секундах). Если задача выполнилась, но блокировка не была снята корректно, она автоматически снимется по истечении этого времени.

#### `memo`

Заметка или описание задачи для удобства разработчиков.

#### `enable`

Флаг активности задачи (`true` или `false`).

#### `environments`

Список окружений (`environments`), в которых разрешен запуск задачи (например, `['production', 'stage']`).

### Стратегии распределения задач (Scheduling Strategy)

Компонент позволяет гибко выбирать стратегию распределения и выполнения задач.

> При использовании Coroutine-style сервера используйте корутинную стратегию (`CoroutineStrategy`).

#### Настройка стратегии

Вы можете изменить используемую стратегию через сопоставление интерфейса `Hyperf\Crontab\Strategy\StrategyInterface` в файле `config/autoload/dependencies.php`:

```php
<?php
return [
    \Hyperf\Crontab\Strategy\StrategyInterface::class => \App\Crontab\Strategy\FooStrategy::class,
];
```

##### Стратегия выполнения в Worker-процессах (WorkerStrategy) [по умолчанию]

Класс: `Hyperf\Crontab\Strategy\WorkerStrategy`

Используется по умолчанию. Процесс `CrontabDispatcherProcess` анализирует расписание и поочередно (round-robin) передает задачи в `Worker`-процессы через межпроцессное взаимодействие (IPC). Воркер запускает задачу в новой корутине.

##### Стратегия выполнения в TaskWorker (TaskWorkerStrategy)

Класс: `Hyperf\Crontab\Strategy\TaskWorkerStrategy`

Процесс `CrontabDispatcherProcess` передает задачи в `TaskWorker`-процессы. Каждый TaskWorker выполняет задачу внутри корутины.

##### Многопроцессная стратегия (ProcessStrategy)

Класс: `Hyperf\Crontab\Strategy\ProcessStrategy`

Задачи распределяются между всеми процессами: как Worker, так и TaskWorker.

##### Корутинная стратегия (CoroutineStrategy)

Класс: `Hyperf\Crontab\Strategy\CoroutineStrategy`

Задачи выполняются непосредственно в процессе `CrontabDispatcherProcess` путем создания отдельных корутин под каждое задание.

## Запуск запланированных задач

После настройки конфигурации и объявления задач достаточно просто запустить сервер Hyperf. Задачи начнут исполняться автоматически. Обратите внимание: задачи с минутным расписанием синхронизируются по системному времени и начинают работу с наступлением новой минуты (например, если сервер запущен в 10:11:12, выполнение первой задачи начнется ровно в 10:12:00).
