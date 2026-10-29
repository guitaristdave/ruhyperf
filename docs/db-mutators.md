---
sourcePath: "en/db/mutators.md"
---

# Мутаторы и приведение типов (Mutators & Casts)

Аксессоры (Accessors) и мутаторы (Mutators) позволяют форматировать значения атрибутов при их получении или установке в экземплярах моделей.

## Аксессоры и мутаторы

### Определение аксессора

Для создания аксессора объявите в модели метод `getFooAttribute`, где `Foo` — имя атрибута в стиле camelCase. В следующем примере создается аксессор для поля `first_name`:

```php
<?php

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    /**
     * Получить имя пользователя с заглавной буквы.
     */
    public function getFirstNameAttribute(?string $value): ?string
    {
        return $value ? ucfirst($value) : null;
    }
}
```

Исходное значение из БД передается аргументом в метод. Для чтения значения просто обратитесь к свойству `first_name`:

```php
$user = User::find(1);
$firstName = $user->first_name;
```

Также можно вычислять виртуальные свойства на основе других атрибутов:

```php
public function getFullNameAttribute(): string
{
    return "{$this->first_name} {$this->last_name}";
}
```

```php
echo $user->full_name;
```

### Определение мутатора

Для создания мутатора объявите метод `setFooAttribute`:

```php
<?php

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    /**
     * Установить имя пользователя в нижнем регистре.
     */
    public function setFirstNameAttribute(string $value): void
    {
        $this->attributes['first_name'] = strtolower($value);
    }
}
```

Мутатор принимает присваиваемое значение и сохраняет преобразованное значение во внутреннем массиве `$this->attributes`.

```php
$user = User::find(1);
$user->first_name = 'Sally';
$user->save();
```

## Преобразование дат

По умолчанию столбцы `created_at` и `updated_at` автоматически преобразуются в экземпляры `Carbon`. Вы можете добавить дополнительные поля дат в массив `$dates`:

```php
<?php

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    protected array $dates = [
        'seen_at',
    ];
}
```

```php
$user = User::find(1);
return $user->seen_at->getTimestamp();
```

## Приведение типов атрибутов ($casts)

Свойство `$casts` предоставляет удобный способ преобразования атрибутов к распространенным типам данных:

Поддерживаемые типы: `integer`, `real`, `float`, `double`, `decimal:<digits>`, `string`, `boolean`, `object`, `array`, `collection`, `date`, `datetime` и `timestamp`.

```php
<?php

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    protected array $casts = [
        'is_admin' => 'boolean',
        'options' => 'array',
        'created_at' => 'datetime:Y-m-d H:i:s',
    ];
}
```

### Массивы и JSON

Приведение типа `'options' => 'array'` автоматически десериализует JSON-строку из БД в PHP-массив при чтении и сериализует массив обратно в JSON при сохранении:

```php
$user = User::find(1);
$options = $user->options;
$options['theme'] = 'dark';
$user->options = $options;
$user->save();
```

## Пользовательское приведение типов (Custom Casts)

Для реализации нестандартной логики преобразования создайте класс, реализующий интерфейс `Hyperf\Contract\CastsAttributes`:

```php
<?php

namespace App\Casts;

use Hyperf\Contract\CastsAttributes;

class Json implements CastsAttributes
{
    public function get($model, string $key, $value, array $attributes)
    {
        return json_decode($value, true);
    }

    public function set($model, string $key, $value, array $attributes)
    {
        return json_encode($value, JSON_UNESCAPED_UNICODE);
    }
}
```

Использование в модели:

```php
class User extends Model
{
    protected array $casts = [
        'options' => \App\Casts\Json::class,
    ];
}
```

### Приведение типов во время выполнения запроса (withCasts)

Если вам необходимо преобразовать вычисляемый столбец, возвращаемый в сыром виде:

```php
use App\Model\Post;
use App\Model\User;

$users = User::select([
    'users.*',
    'last_posted_at' => Post::selectRaw('MAX(created_at)')
        ->whereColumn('user_id', 'users.id'),
])->withCasts([
    'last_posted_at' => 'date',
])->get();
```
