---
sourcePath: "en/task.md"
---

# Фоновые задачи (Task)

На данном этапе `Swoole` не может автоматически перехватывать (`hook`) абсолютно все блокирующие вызовы сторонних расширений C. Это означает, что некоторые вызовы по-прежнему вызывают блокировку процесса, нарушая диспетчеризацию корутин. В таких случаях можно использовать компонент `Task`.

Компонент позволяет переносить блокирующие вызовы в отдельные `Task Worker` процессы без блокировки основных рабочих процессов (`Worker`). Поскольку под капотом используется традиционная мультипроцессная модель, производительность выполнения блокирующих задач будет зависеть от количества выделенных процессов `Task Worker` и будет уступать нативным корутинам.

## Установка

```bash
composer require hyperf/task
```

## Конфигурация

Поскольку `Task` не включен по умолчанию, вам необходимо добавить настройки в файл `config/autoload/server.php`:

```php
<?php

declare(strict_types=1);

use Hyperf\Server\Event;

return [
    // Другие параметры конфигурации опущены
    'settings' => [
        // Количество процессов Task Worker (настройте в зависимости от конфигурации сервера)
        'task_worker_num' => 8,
        // Поскольку Task в основном обрабатывает не корутинизируемые блокирующие вызовы, рекомендуется установить значение false во избежание конфликта данных
        'task_enable_coroutine' => false,
    ],
    'callbacks' => [
        // Обратные вызовы событий Task
        Event::ON_TASK => [Hyperf\Framework\Bootstrap\TaskCallback::class, 'onTask'],
        Event::ON_FINISH => [Hyperf\Framework\Bootstrap\FinishCallback::class, 'onFinish'],
    ],
];
```

## Использование

Компонент Task предоставляет два способа доставки задач: прямая доставка через метод и декларативная доставка через атрибут.

### Прямая доставка через метод

```php
<?php

use Hyperf\Coroutine\Coroutine;
use Hyperf\Context\ApplicationContext;
use Hyperf\Task\TaskExecutor;
use Hyperf\Task\Task;

class MethodTask
{
    public function handle($cid)
    {
        return [
            'worker.cid' => $cid,
            // Возвращает -1, когда task_enable_coroutine = false, иначе возвращает ID корутины
            'task.cid' => Coroutine::id(),
        ];
    }
}

$container = ApplicationContext::getContainer();
$exec = $container->get(TaskExecutor::class);
$result = $exec->execute(new Task([MethodTask::class, 'handle'], [Coroutine::id()]));
```

### Использование атрибута #[Task]

Использование прямой доставки не всегда удобно и наглядно. Hyperf предоставляет атрибут `#[Task]`, который модифицирует вызов метода через механизм AOP. При вызове метода в `Worker`-процессе задача автоматически доставляется в процесс `Task Worker`, а текущая корутина приостанавливается и ожидает возврата результата.

```php
<?php

use Hyperf\Coroutine\Coroutine;
use Hyperf\Context\ApplicationContext;
use Hyperf\Task\Annotation\Task;

class AnnotationTask
{
    #[Task]
    public function handle($cid)
    {
        return [
            'worker.cid' => $cid,
            // Возвращает -1, если task_enable_coroutine=false, иначе возвращает ID корутины
            'task.cid' => Coroutine::id(),
        ];
    }
}

$container = ApplicationContext::getContainer();
$task = $container->get(AnnotationTask::class);
$result = $task->handle(Coroutine::id());
```

> При использовании атрибута `#[Task]` необходимо подключить пространство имен `use Hyperf\Task\Annotation\Task;`.

Атрибут поддерживает следующие параметры:

| Параметр | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :---: |
| `timeout` | int | 10 | Таймаут выполнения задачи в секундах |
| `workerId` | int | -1 | Идентификатор конкретного процесса Task Worker для доставки (-1 означает случайную доставку свободному процессу) |

## Приложение: функции, пока не поддерживающие корутины

Библиотеки и драйверы C, которые пока не поддерживают нативные корутины в Swoole:

- `mysql` (на базе libmysqlclient, использовать не рекомендуется; используйте `pdo_mysql` или `mysqli`)
- `mongo` (на базе `mongo-c-client`)
- `pdo_pgsql`
- `pdo_ori`
- `pdo_odbc`
- `pdo_firebird`

### Использование с MongoDB

Поскольку официальное расширение `MongoDB` блокирует процесс, запросы к нему можно изолировать с помощью `Task`:

```php
<?php

declare(strict_types=1);

namespace App\Task;

use Hyperf\Task\Annotation\Task;
use MongoDB\Driver\BulkWrite;
use MongoDB\Driver\Manager;
use MongoDB\Driver\Query;
use MongoDB\Driver\WriteConcern;

class MongoTask
{
    public Manager $manager;

    #[Task]
    public function insert(string $namespace, array $document)
    {
        $writeConcern = new WriteConcern(WriteConcern::MAJORITY, 1000);
        $bulk = new BulkWrite();
        $bulk->insert($document);

        $result = $this->manager()->executeBulkWrite($namespace, $bulk, $writeConcern);
        return $result->getUpsertedCount();
    }

    #[Task]
    public function query(string $namespace, array $filter = [], array $options = [])
    {
        $query = new Query($filter, $options);
        $cursor = $this->manager()->executeQuery($namespace, $query);
        return $cursor->toArray();
    }

    protected function manager()
    {
        if ($this->manager instanceof Manager) {
            return $this->manager;
        }
        $uri = 'mongodb://127.0.0.1:27017';
        return $this->manager = new Manager($uri, []);
    }
}
```

Пример использования:

```php
<?php
use App\Task\MongoTask;
use Hyperf\Context\ApplicationContext;

$client = ApplicationContext::getContainer()->get(MongoTask::class);
$client->insert('hyperf.test', ['id' => rand(0, 99999999)]);

$result = $client->query('hyperf.test', [], [
    'sort' => ['id' => -1],
    'limit' => 5,
]);
```

> **Важно**: Входящие и исходящие параметры метода с атрибутом `#[Task]` должны быть сериализуемыми и не должны содержать дескрипторов ресурсов ввода-вывода (например, открытых сокетов или экземпляров клиентов баз данных).

## Альтернативные решения: GoTask

Если механизм Task в PHP не удовлетворяет вашим требованиям по производительности, вы можете рассмотреть проект [GoTask](https://github.com/hyperf/gotask). GoTask запускает скомпилированный Go-процесс в качестве sidecar-процесса рядом с главным процессом Swoole и передает задачи на исполнение в Go через высокоскоростной IPC.
