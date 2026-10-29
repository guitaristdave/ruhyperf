---
sourcePath: "en/db/model.md"
---

# Модели (Model)

Компонент моделей в Hyperf основан на [Eloquent ORM](https://laravel.com/docs/5.8/eloquent), поэтому большинство стандартных операций аналогичны Eloquent ORM.

## Создание модели

Hyperf предоставляет консольную команду для генерации моделей, позволяя удобно создавать классы моделей на основе существующих таблиц базы данных. Команда использует абстрактное синтаксическое дерево (`AST`), что позволяет безопасно перезапускать генерацию даже после добавления пользовательских методов в модель.

```bash
php bin/hyperf.php gen:model table_name
```

Доступные параметры команды:

| Параметр | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :--- |
| `--pool` | string | `default` | Пул соединений, на основе конфигурации которого создается модель |
| `--path` | string | `app/Model` | Директория для сохранения модели |
| `--force-casts` | bool | `false` | Принудительно сбросить атрибут `casts` |
| `--prefix` | string | `''` | Префикс таблицы |
| `--inheritance` | string | `Model` | Имя родительского класса |
| `--uses` | string | `Hyperf\DbConnection\Model\Model` | Пространство имен родительского класса для `use` |
| `--refresh-fillable` | bool | `false` | Обновить ли атрибут `fillable` |
| `--table-mapping` | array | `[]` | Соответствие таблиц и имен моделей, например: `['users:Account']` |
| `--ignore-tables` | array | `[]` | Список игнорируемых таблиц, например: `['users']` |
| `--with-comments` | bool | `false` | Генерировать ли комментарии к полям из БД |
| `--property-case` | int | `0` | Формат свойств: `0` — snake_case, `1` — camelCase |

При использовании параметра `--property-case 1` (camelCase) необходимо вручную подключить трейт `Hyperf\Database\Model\Concerns\CamelCase` в вашем классе модели.

Эти настройки можно также задать в файле конфигурации `config/autoload/databases.php` в секции `databases.{pool}.commands.gen:model`:

> Все дефисы в именах параметров заменяются на знаки подчеркивания.

```php
<?php

declare(strict_types=1);

use Hyperf\Database\Commands\ModelOption;

return [
    'default' => [
        // Прочие конфигурации...
        'commands' => [
            'gen:model' => [
                'path' => 'app/Model',
                'force_casts' => true,
                'inheritance' => 'Model',
                'uses' => '',
                'refresh_fillable' => true,
                'table_mapping' => [],
                'with_comments' => true,
                'property_case' => ModelOption::PROPERTY_SNAKE_CASE,
            ],
        ],
    ],
];
```

Пример сгенерированной модели:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

/**
 * @property int $id
 * @property string $name
 * @property int $gender
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class User extends Model
{
    /**
     * Таблица, связанная с моделью.
     */
    protected ?string $table = 'user';

    /**
     * Атрибуты, доступные для массового заполнения.
     */
    protected array $fillable = ['id', 'name', 'gender', 'created_at', 'updated_at'];

    /**
     * Атрибуты, которые должны быть приведены к базовым типам.
     */
    protected array $casts = ['id' => 'integer', 'gender' => 'integer'];
}
```

## Свойства модели

| Свойство | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :--- |
| `$connection` | string | `'default'` | Имя подключения к базе данных |
| `$table` | string | `null` | Имя таблицы в БД |
| `$primaryKey` | string | `'id'` | Имя первичного ключа |
| `$keyType` | string | `'int'` | Тип данных первичного ключа |
| `$fillable` | array | `[]` | Белый список атрибутов для массового заполнения |
| `$guarded` | array | `['*']` | Черный список атрибутов для массового заполнения |
| `$casts` | array | `[]` | Правила приведения типов атрибутов |
| `$timestamps` | bool | `true` | Автоматическое ведение меток времени (`created_at`, `updated_at`) |
| `$incrementing` | bool | `true` | Автоинкрементный ли первичный ключ |

### Имя таблицы

Если имя таблицы не указано явно в свойстве `$table`, Hyperf будет использовать имя класса во множественном числе в формате snake_case. Например, для модели `User` будет предполагаться таблица `users`. Вы можете переопределить это, объявив свойство `$table`:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    protected ?string $table = 'user';
}
```

### Первичный ключ

Hyperf предполагает, что каждая таблица имеет первичный ключ с именем `id`. Вы можете переопределить это соглашение с помощью защищенного свойства `$primaryKey`.

Кроме того, Hyperf считает, что первичный ключ является автоинкрементным целочисленным значением (`int`). Если вы используете неинкрементный или нечисловой ключ, установите публичное свойство `$incrementing` в `false`. Если первичный ключ строковый (например, UUID), укажите `$keyType = 'string'`.

### Временные метки (Timestamps)

По умолчанию Hyperf ожидает наличие в таблице столбцов `created_at` и `updated_at`. Если вы не хотите, чтобы фреймворк управлял ими автоматически, установите свойство `$timestamps` в `false`:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    public bool $timestamps = false;
}
```

Для настройки формата хранения дат используйте свойство `$dateFormat`:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    protected ?string $dateFormat = 'U';
}
```

Если вы хотите изменить логику преобразования даты, переопределите метод `fromDateTime($value)` в модели.

Для изменения имен столбцов меток времени переопределите константы `CREATED_AT` и `UPDATED_AT`. Если задать значение `null`, обработка соответствующего поля будет отключена:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    public const CREATED_AT = 'creation_date';
    public const UPDATED_AT = 'last_update';
}
```

### Подключение к базе данных

По умолчанию модели используют подключение `default`. Для указания другого пула соединений задайте свойство `$connection`:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    protected ?string $connection = 'connection-name';
}
```

### Значения атрибутов по умолчанию

Для установки значений атрибутов по умолчанию используйте свойство `$attributes`:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    protected array $attributes = [
        'delayed' => false,
    ];
}
```

## Запросы к моделям

```php
<?php
use App\Model\User;

/** @var User $user */
$user = User::query()->where('id', 1)->first();
$user->name = 'Hyperf';
$user->save();
```

### Перезагрузка модели

Методы `fresh` и `refresh` позволяют повторно запросить данные из базы:

* `fresh()` — возвращает новый экземпляр модели из базы данных, не изменяя текущий:

```php
$user = User::query()->find(1);
$freshUser = $user->fresh();
```

* `refresh()` — перезагружает атрибуты текущего экземпляра свежими данными из базы данных, включая загруженные связи:

```php
$user = User::query()->where('name', 'Hyperf')->first();
$user->name = 'Hyperf2';
$user->refresh();
echo $user->name; // Hyperf
```

### Коллекции

Методы `all` и `get` возвращают экземпляр `Hyperf\Database\Model\Collection`. Коллекция предоставляет множество вспомогательных методов для работы с наборами данных:

```php
$users = $users->reject(function ($user) {
    return $user->deleted;
});
```

### Получение одной модели

Для получения одной записи используйте методы `find` или `first`:

```php
$user = User::query()->where('id', 1)->first();
$user = User::query()->find(1);
```

### Получение нескольких моделей по ключам

Метод `find` также принимает массив идентификаторов:

```php
$users = User::query()->find([1, 2, 3]);
```

### Исключение "Не найдено"

Методы `findOrFail` и `firstOrFail` выбрасывают исключение `Hyperf\Database\Model\ModelNotFoundException`, если запись не найдена:

```php
$model = User::findOrFail(1);
$model = User::where('age', '>', 18)->firstOrFail();
```

### Агрегатные функции

Вы можете использовать методы `count`, `sum`, `max`, `min` и `avg`:

```php
$count = User::query()->where('gender', 1)->count();
```

## Вставка и обновление моделей

### Вставка записи

```php
use App\Model\User;

$user = new User();
$user->name = 'Hyperf';
$user->save();
```

Метки времени `created_at` и `updated_at` будут установлены автоматически.

### Обновление записи

```php
use App\Model\User;

$user = User::query()->find(1);
$user->name = 'Hi Hyperf';
$user->save();
```

### Массовое обновление

```php
use App\Model\User;

User::query()->where('gender', 1)->update(['gender_show' => 'male']);
```

> **Важно:** При массовом обновлении события моделей `saving`, `saved`, `updating`, `updated` **не** вызываются, поскольку экземпляры моделей не создаются. Также не применяются мутаторы и приведения типов (`casts`).

### Массовое заполнение (Mass Assignment)

Для создания записи методом `create` атрибуты должны быть разрешены в `$fillable`:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    protected array $fillable = ['name'];
}
```

Создание записи:

```php
$user = User::create(['name' => 'Hyperf']);
```

Метод `fill` позволяет заполнить атрибуты существующего экземпляра:

```php
$user->fill(['name' => 'Hyperf']);
```

### Защита атрибутов ($guarded)

Свойство `$guarded` определяет черный список полей, которые нельзя заполнять массово:

```php
class User extends Model
{
    protected array $guarded = ['gender_show'];
}
```

> Используйте либо `$fillable`, либо `$guarded`, но не оба одновременно.

### Другие методы создания

* `firstOrCreate` — ищет запись по заданным критериям; если запись не найдена, создает ее в БД:

```php
$user = User::firstOrCreate(['name' => 'Hyperf']);

$user = User::firstOrCreate(
    ['name' => 'Hyperf'],
    ['gender' => 1, 'age' => 20]
);
```

* `firstOrNew` — ищет запись по атрибутам; если запись не найдена, возвращает новый экземпляр модели (без сохранения в БД):

```php
$user = User::firstOrNew(['name' => 'Hyperf']);
$user->save();
```

### Удаление моделей

```php
$user = User::query()->find(1);
$user->delete();
```

Удаление по условию:

```php
User::query()->where('gender', 1)->delete();
```

Удаление по первичному ключу (`destroy`):

```php
User::destroy(1);
User::destroy([1, 2, 3]);
```

### Мягкое удаление (Soft Deletes)

При мягком удалении запись остается в БД, а поле `deleted_at` заполняется текущим временем. Для активации мягкого удаления подключите трейт `SoftDeletes`:

```php
<?php

namespace App\Model;

use Hyperf\Database\Model\Model;
use Hyperf\Database\Model\SoftDeletes;

class User extends Model
{
    use SoftDeletes;
}
```

Восстановление или создание:

```php
$user = User::restoreOrCreate(
    ['name' => 'Hyperf'],
    ['gender' => 1, 'age' => 20]
);
```

## Поддержка типа MySQL BIT

По умолчанию при формировании SQL в Hyperf параметры приводятся к строковому типу, чтобы избежать проблем переполнения больших целых чисел. Если вам требуется поддержка типа `BIT`, зарегистрируйте слушатель:

```php
<?php

declare(strict_types=1);

namespace App\Listener;

use Hyperf\Database\Connection;
use Hyperf\Database\MySqlBitConnection;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Framework\Event\BootApplication;

#[Listener]
class SupportMySQLBitListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            BootApplication::class,
        ];
    }

    public function process(object $event): void
    {
        Connection::resolverFor('mysql', static function ($connection, $database, $prefix, $config) {
            return new MySqlBitConnection($connection, $database, $prefix, $config);
        });
    }
}
```
