---
sourcePath: "en/db/model-cache.md"
---

# Кэширование моделей (Model Cache)

В высоконагруженных сценариях частое выполнение однотипных запросов по первичному ключу к базе данных может стать узким местом. Компонент `hyperf/model-cache` предоставляет автоматическое прозрачное кэширование моделей по первичному ключу (Key-Value), снижая нагрузку на СУБД.

При изменении или удалении модели кэш сбрасывается автоматически. При инкременте и декременте операция выполняется напрямую в хранилище кэша.

> В настоящий момент в качестве бэкенда кэширования поддерживается `Redis`.

## Установка

```bash
composer require hyperf/model-cache
```

## Конфигурация

Кэширование настраивается в файле `config/autoload/databases.php` для каждого пула соединений:

| Параметр | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :--- |
| `handler` | string | `RedisHandler::class` | Обработчик хранилища кэша |
| `cache_key` | string | `'mc:%s:m:%s:%s:%s'` | Формат ключа кэша: `mc:префикс:m:таблица:ключ:значение` |
| `prefix` | string | имя соединения | Префикс кэша |
| `pool` | string | `'default'` | Имя пула Redis |
| `ttl` | int | `3600` | Время жизни записи в кэше (секунды) |
| `empty_model_ttl` | int | `60` | Время жизни пустой записи (защита от Cache Penetration) |
| `load_script` | bool | `true` | Использовать `evalSha` вместо `eval` в Redis |
| `use_default_value` | bool | `false` | Использовать значения по умолчанию при добавлении новых полей |

Пример конфигурации:

```php
<?php

return [
    'default' => [
        // Настройки соединения БД...
        'cache' => [
            'handler' => \Hyperf\DbConnection\Cache\Handler\RedisHandler::class,
            'cache_key' => 'mc:%s:m:%s:%s:%s',
            'prefix' => 'default',
            'ttl' => 3600 * 24,
            'empty_model_ttl' => 3600,
            'load_script' => true,
            'use_default_value' => false,
        ],
    ],
];
```

## Использование

Для включения кэширования модель должна реализовать интерфейс `CacheableInterface` и подключить трейт `Cacheable`:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;
use Hyperf\ModelCache\Cacheable;
use Hyperf\ModelCache\CacheableInterface;

class User extends Model implements CacheableInterface
{
    use Cacheable;

    protected ?string $table = 'user';
    protected array $fillable = ['id', 'name', 'gender', 'created_at', 'updated_at'];
    protected array $casts = ['id' => 'integer', 'gender' => 'integer'];
}
```

### Запрос одной записи из кэша

```php
// Получение модели по первичному ключу из кэша
$user = User::findFromCache($id);
```

### Массовый запрос из кэша

```php
// Массовое получение записей (возвращает Hyperf\Database\Model\Collection)
$users = User::findManyFromCache([1, 2, 3]);
```

### Массовое удаление со сбросом кэша

Трейт `Cacheable` перехватывает метод `Model::query`:

```php
// При передаче true удалятся и записи из БД, и соответствующие ключи кэша
User::query(true)->where('gender', '>', 1)->delete();
```

### Настройка TTL на уровне модели

Вы можете индивидуально переопределить время жизни кэша для конкретной модели:

```php
class User extends Model implements CacheableInterface
{
    use Cacheable;

    public function getCacheTTL(): ?int
    {
        return 600; // Кэшировать на 10 минут
    }
}
```

### Жадная загрузка кэша (EagerLoad)

Компонент позволяет кэшировать и связанные сущности, снижая число обращений к БД:

```php
$books = Book::findManyFromCache([1, 2, 3]);
$books->loadCache(['user']);

foreach ($books as $book) {
    var_dump($book->user);
}
```

## Обработчики кэша (Handlers)

1. `Hyperf\ModelCache\Handler\RedisHandler` (по умолчанию)  
   Хранит данные в виде Redis `HASH`. Эффективно работает с `increment()` и `decrement()`, однако строковый тип хеша имеет нюансы с `null`.

2. `Hyperf\ModelCache\Handler\RedisStringHandler`  
   Хранит сериализованные строки (`String`). Поддерживает любые типы данных PHP, однако при инкременте сбрасывает кэш для обеспечения целостности.
