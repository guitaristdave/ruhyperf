---
sourcePath: "en/db/gen.md"
---

# Генератор моделей (gen:model)

Hyperf предоставляет мощные консольные команды для создания моделей напрямую из структуры таблиц базы данных. Команда генерирует код с использованием `AST` (абстрактного синтаксического дерева), что позволяет безопасно повторно выполнять генерацию и обновлять модели даже после добавления в них кастомных методов.

```bash
php bin/hyperf.php gen:model table_name
```

## Параметры команды

| Параметр | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :--- |
| `--pool` | string | `default` | Имя пула соединений БД для генерации |
| `--path` | string | `app/Model` | Директория для сохранения сгенерированных моделей |
| `--force-casts` | bool | `false` | Принудительно сбросить атрибут `$casts` |
| `--prefix` | string | `''` | Префикс таблицы базы данных |
| `--inheritance` | string | `Model` | Имя родительского класса модели |
| `--uses` | string | `Hyperf\DbConnection\Model\Model` | Пространство имен базового класса для импорта (`use`) |
| `--refresh-fillable` | bool | `false` | Пересоздать атрибут `$fillable` |
| `--table-mapping` | array | `[]` | Соответствие таблиц и имен моделей, например: `['users:Account']` |
| `--ignore-tables` | array | `[]` | Таблицы, исключаемые из генерации моделей, например: `['users']` |
| `--with-comments` | bool | `false` | Добавлять ли комментарии полей таблицы в phpdoc |
| `--property-case` | int | `0` | Формат свойств: `0` — snake_case, `1` — camelCase |

> При указании `--property-case 1` необходимо добавить в модель трейт `Hyperf\Database\Model\Concerns\CamelCase`.

## Настройка по умолчанию

Параметры генератора можно настроить в `config/autoload/databases.php` в блоке `commands.gen:model`:

```php
<?php

declare(strict_types=1);

use Hyperf\Database\Commands\ModelOption;

return [
    'default' => [
        // Прочие настройки БД...
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
     * Таблица, ассоциированная с моделью.
     */
    protected ?string $table = 'user';

    /**
     * Атрибуты, доступные для массового заполнения.
     */
    protected array $fillable = ['id', 'name', 'gender', 'created_at', 'updated_at'];

    /**
     * Атрибуты, приводимые к типам PHP.
     */
    protected array $casts = ['id' => 'integer', 'gender' => 'integer'];
}
```

## Посетители AST (Visitors)

Фреймворк поддерживает механизм `Visitor` для расширения возможностей генерации кода модели. Для включения посетителей добавьте их в конфигурацию `visitors`:

```php
<?php

declare(strict_types=1);

return [
    'default' => [
        'commands' => [
            'gen:model' => [
                'visitors' => [
                    Hyperf\Database\Commands\Ast\ModelRewriteKeyInfoVisitor::class,
                ],
            ],
        ],
    ],
];
```

### Доступные встроенные посетители

* `Hyperf\Database\Commands\Ast\ModelRewriteKeyInfoVisitor`  
  Автоматически генерирует `$incrementing`, `$primaryKey` и `$keyType` на основе данных о первичном ключе таблицы.

* `Hyperf\Database\Commands\Ast\ModelRewriteSoftDeletesVisitor`  
  Определяет наличие поля мягкого удаления по константе `DELETED_AT` и автоматически подключает трейт `SoftDeletes`.

* `Hyperf\Database\Commands\Ast\ModelRewriteTimestampsVisitor`  
  Анализирует поля `created_at` и `updated_at` и автоматически включает или выключает отслеживание временных меток.

* `Hyperf\Database\Commands\Ast\ModelRewriteGetterSetterVisitor`  
  Генерирует геттеры и сеттеры (`getId()`, `setId()`) для всех столбцов таблицы.

## Переопределение посетителей

По умолчанию генератор сопоставляет `tinyint, smallint, mediumint, int, bigint` как `int`, `bool, boolean` как `boolean`, а все остальные типы — как `string`. Вы можете изменить это поведение, переопределив `ModelUpdateVisitor`:

```php
<?php

declare(strict_types=1);

namespace App\Kernel\Visitor;

use Hyperf\Database\Commands\Ast\ModelUpdateVisitor as Visitor;
use Hyperf\Stringable\Str;

class ModelUpdateVisitor extends Visitor
{
    protected function formatDatabaseType(string $type): ?string
    {
        switch ($type) {
            case 'tinyint':
            case 'smallint':
            case 'mediumint':
            case 'int':
            case 'bigint':
                return 'integer';
            case 'decimal':
                return 'decimal:2';
            case 'float':
            case 'double':
            case 'real':
                return 'float';
            case 'bool':
            case 'boolean':
                return 'boolean';
            default:
                return null;
        }
    }

    protected function formatPropertyType(string $type, ?string $cast): ?string
    {
        if (! isset($cast)) {
            $cast = $this->formatDatabaseType($type) ?? 'string';
        }

        switch ($cast) {
            case 'integer':
                return 'int';
            case 'date':
            case 'datetime':
                return '\Carbon\Carbon';
            case 'json':
                return 'array';
        }

        if (Str::startsWith($cast, 'decimal')) {
            return 'string';
        }

        return $cast;
    }
}
```

Зарегистрируйте класс в `config/autoload/dependencies.php`:

```php
<?php

return [
    Hyperf\Database\Commands\Ast\ModelUpdateVisitor::class => App\Kernel\Visitor\ModelUpdateVisitor::class,
];
```
