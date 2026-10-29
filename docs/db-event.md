---
sourcePath: "en/db/event.md"
---

# События базы данных и моделей

События базы данных и моделей в Hyperf построены на базе интерфейса [psr/event-dispatcher](https://github.com/php-fig/event-dispatcher).

## Слушатель запросов к базе данных (QueryExecuted)

С помощью компонента [hyperf/event](https://github.com/hyperf/event) можно перехватывать системные события базы данных:
* `QueryExecuted` — выполнение SQL-запроса
* `StatementPrepared` — подготовка подготовленного выражения
* `TransactionBeginning` — начало транзакции
* `TransactionCommitted` — фиксация транзакции
* `TransactionRolledBack` — откат транзакции

### Пример: логирование всех SQL-запросов

Создадим слушатель `DbQueryExecutedListener`:

```php
<?php

declare(strict_types=1);

namespace App\Listener;

use Hyperf\Collection\Arr;
use Hyperf\Database\Events\QueryExecuted;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Logger\LoggerFactory;
use Hyperf\Stringable\Str;
use Psr\Log\LoggerInterface;

#[Listener]
class DbQueryExecutedListener implements ListenerInterface
{
    private LoggerInterface $logger;

    public function __construct(LoggerFactory $loggerFactory)
    {
        $this->logger = $loggerFactory->get('sql');
    }

    public function listen(): array
    {
        return [
            QueryExecuted::class,
        ];
    }

    public function process(object $event): void
    {
        if ($event instanceof QueryExecuted) {
            $sql = $event->sql;
            if (! Arr::isAssoc($event->bindings)) {
                foreach ($event->bindings as $value) {
                    $sql = Str::replaceFirst('?', "'{$value}'", $sql);
                }
            }

            $this->logger->info(sprintf('[%s ms] %s', $event->time, $sql));
        }
    }
}
```

## События жизненного цикла моделей

В отличие от Laravel Eloquent, использующего паттерн `Observer`, в Hyperf хуки событий модели объявляются непосредственно как методы в классе модели.

### Доступные хуки

| Имя события | Момент вызова | Блокирующий? | Описание |
| :---: | :---: | :---: | :--- |
| `booting` | Перед первой загрузкой модели | Нет | Вызывается один раз за жизненный цикл рабочего процесса |
| `booted` | После первой загрузки модели | Нет | Вызывается один раз за жизненный цикл рабочего процесса |
| `retrieved` | После извлечения данных | Нет | Срабатывает при получении модели из БД или кэша |
| `creating` | Перед созданием записи | Да | При возврате `false` отменяет операцию |
| `created` | После создания записи | Нет |  |
| `updating` | Перед обновлением записи | Да | При возврате `false` отменяет операцию |
| `updated` | После обновления записи | Нет |  |
| `saving` | Перед сохранением (create/update) | Да | При возврате `false` отменяет операцию |
| `saved` | После сохранения | Нет |  |
| `restoring` | Перед восстановлением мягко удаленной | Да |  |
| `restored` | После восстановления | Нет |  |
| `deleting` | Перед удалением записи | Да | При возврате `false` отменяет операцию |
| `deleted` | После удаления записи | Нет |  |
| `forceDeleting` | Перед полным удалением записи | Да |  |
| `forceDeleted` | После полного удаления записи | Нет |  |

### Пример использования хука в модели

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\Database\Model\Events\Saving;
use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    protected ?string $table = 'user';

    protected array $fillable = ['id', 'name', 'gender', 'created_at', 'updated_at'];

    public function saving(Saving $event): void
    {
        $this->setCreatedAt('2024-01-01');
    }
}
```

### Глобальные слушатели событий моделей

Если требуется перехватывать события для всех моделей централизованно (например, для сброса кэша):

```php
<?php

declare(strict_types=1);

namespace Hyperf\ModelCache\Listener;

use Hyperf\Database\Model\Events\Deleted;
use Hyperf\Database\Model\Events\Event;
use Hyperf\Database\Model\Events\Saved;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\ModelCache\CacheableInterface;

#[Listener]
class DeleteCacheListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            Deleted::class,
            Saved::class,
        ];
    }

    public function process(object $event): void
    {
        if ($event instanceof Event) {
            $model = $event->getModel();
            if ($model instanceof CacheableInterface) {
                $model->deleteCache();
            }
        }
    }
}
```
