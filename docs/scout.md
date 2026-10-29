---
sourcePath: "en/scout.md"
---

# Полнотекстовый поиск (Scout)

Компонент [hyperf/scout](https://github.com/hyperf/scout) адаптирован из Laravel Scout для корутинной среды Swoole/Swow с сохранением привычного API. Scout предоставляет простое решение на основе драйверов для добавления полнотекстового поиска в модели Eloquent.

По умолчанию компонент поставляется со встроенным драйвером для **Elasticsearch**.

## Установка

```bash
composer require hyperf/scout
composer require hyperf/elasticsearch
```

Публикация конфигурационного файла:

```bash
php bin/hyperf.php vendor:publish hyperf/scout
```

Файл настроек будет создан по пути `config/autoload/scout.php`.

## Подключение к модели

Для добавления возможности поиска подключите трейт `Hyperf\Scout\Searchable` к модели:

```php
<?php

namespace App\Model;

use Hyperf\Database\Model\Model;
use Hyperf\Scout\Searchable;

class Post extends Model
{
    use Searchable;
}
```

## Конфигурация

Файл `config/autoload/scout.php`:

```php
<?php

declare(strict_types=1);

return [
    'default' => env('SCOUT_ENGINE', 'elasticsearch'),
    'chunk' => [
        'searchable' => 500,
        'unsearchable' => 500,
    ],
    'prefix' => env('SCOUT_PREFIX', ''),
    'soft_delete' => false,
    'concurrency' => 100,
    'engine' => [
        'elasticsearch' => [
            'driver' => Hyperf\Scout\Provider\ElasticsearchProvider::class,
            // Если index равен null, каждая модель сохраняется в отдельный индекс
            'index' => null,
            'hosts' => [
                env('ELASTICSEARCH_HOST', 'http://127.0.0.1:9200'),
            ],
        ],
    ],
];
```

### Настройка индекса модели

По умолчанию каждая модель синхронизируется с индексом, имя которого совпадает с таблицей модели. Вы можете настроить имя индекса, переопределив метод `searchableAs`:

```php
public function searchableAs(): string
{
    return 'posts_index';
}
```

### Настройка индексируемых данных

По умолчанию индексируются данные, возвращаемые методом модели `toArray`. Чтобы указать, какие именно поля должны попадать в поисковый индекс, переопределите метод `toSearchableArray`:

```php
public function toSearchableArray(): array
{
    return [
        'id' => $this->id,
        'title' => $this->title,
        'content' => $this->content,
    ];
}
```

## Индексация

### Пакетный импорт данных

Для начальной загрузки существующих записей БД в поисковый индекс:

```bash
php bin/hyperf.php scout:import "App\Model\Post"
```

Для очистки индекса:

```bash
php bin/hyperf.php scout:flush "App\Model\Post"
```

### Добавление и обновление записей

После добавления трейта `Searchable` вызов `$model->save()` автоматически синхронизирует данные с поисковым индексом. Обновление выполняется асинхронно в конце текущей корутины без блокировки HTTP-запроса.

Пакетная индексация через конструктор запросов:

```php
App\Model\Order::where('price', '>', 100)->searchable();
$user->orders()->searchable();
$orders->searchable();
```

### Удаление из индекса

Вызов метода `$model->delete()` автоматически удаляет запись из поискового индекса (поддерживается и Soft Deletes):

```php
$order = App\Model\Order::find(1);
$order->delete();
```

Массовое удаление из индекса без извлечения моделей:

```php
App\Model\Order::where('price', '>', 100)->unsearchable();
```

### Приостановка синхронизации (без индексации)

Если вам необходимо выполнить пакетные операции над БД без обновления индекса поиска:

```php
App\Model\Order::withoutSyncingToSearch(function () {
    // Операции с моделями без отправки в Elasticsearch...
});
```

## Поиск

Для поиска используется метод `search`:

```php
$orders = App\Model\Order::search('Hyperf')->get();
```

### Дополнительные условия (Where)

Поисковые запросы поддерживают простые числовые равенства (например, фильтрация по ID владельца):

```php
$orders = App\Model\Order::search('Hyperf')->where('user_id', 1)->get();
```

### Пагинация поисковых результатов

Метод `paginate()` возвращает стандартный экземпляр `Hyperf\Paginator\Paginator`:

```php
$orders = App\Model\Order::search('Hyperf')->paginate(15);
```

## Отличия от Laravel Scout

1. **Корутинная синхронизация:** Hyperf/Scout использует корутины Swoole/Swow для синхронизации поисковых индексов и записей моделей без обязательного использования тяжелых очередей сообщений.
2. **Elasticsearch из коробки:** Вместо проприетарного облачного сервиса Algolia в Hyperf Scout основным открытым движком по умолчанию является Elasticsearch.
