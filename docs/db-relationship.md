---
sourcePath: "en/db/relationship.md"
---

# Связи моделей (Relationships)

## Определение связей

Связи моделей в `Hyperf` определяются как методы в классах моделей. Как и сами модели, они выступают в качестве мощных построителей запросов (Query Builder), поддерживая цепочки методов.

```php
$user->role()->where('level', 1)->get();
```

### Один к одному (One To One)

Связь «один к одному» является базовой. Например, модель `User` может быть связана с одной моделью `Role`. Для определения связи создайте метод `role` и вызовите `hasOne`:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    public function role()
    {
        return $this->hasOne(Role::class, 'user_id', 'id');
    }
}
```

Первый аргумент `hasOne` — имя связанного класса модели. Доступ к связанным данным осуществляется через динамические свойства:

```php
$role = User::query()->find(1)->role;
```

### Один ко многим (One To Many)

Связь «один ко многим» используется, когда одна модель владеет несколькими дочерними (например, один автор и множество его книг):

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    public function books()
    {
        return $this->hasMany(Book::class, 'user_id', 'id');
    }
}
```

Получение коллекции записей:

```php
$books = User::query()->find(1)->books;

foreach ($books as $book) {
    echo $book->title;
}
```

Добавление дополнительных условий в запрос:

```php
$book = User::query()->find(1)->books()->where('title', 'Hyperf в действии')->first();
```

### Один ко многим (обратная связь)

Для получения автора по книге используется обратная связь `belongsTo`:

```php
<?php

declare(strict_types=1);

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class Book extends Model
{
    public function author()
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
```

Использование:

```php
$book = Book::find(1);
echo $book->author->name;
```

### Многие ко многим (Many To Many)

Для связи «многие ко многим» требуется промежуточная таблица (pivot table). Например, пользователи и роли (`users`, `roles`, `role_user`).

Определение связи методом `belongsToMany`:

```php
<?php

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class User extends Model
{
    public function roles()
    {
        return $this->belongsToMany(Role::class);
    }
}
```

Получение данных:

```php
$user = User::query()->find(1);

foreach ($user->roles as $role) {
    echo $role->name;
}
```

Кастомизация имени промежуточной таблицы и внешних ключей:

```php
return $this->belongsToMany(Role::class, 'role_user', 'user_id', 'role_id');
```

#### Доступ к полям промежуточной таблицы (Pivot)

```php
$user = User::find(1);

foreach ($user->roles as $role) {
    echo $role->pivot->created_at;
}
```

Для загрузки дополнительных полей из промежуточной таблицы используйте `withPivot`:

```php
return $this->belongsToMany(Role::class)->withPivot('column1', 'column2');
```

Для автоматического управления временными метками в промежуточной таблице:

```php
return $this->belongsToMany(Role::class)->withTimestamps();
```

#### Кастомное имя для pivot

```php
return $this->belongsToMany(Podcast::class)->as('subscription')->withTimestamps();
```

```php
foreach ($users->flatMap->podcasts as $podcast) {
    echo $podcast->subscription->created_at;
}
```

#### Фильтрация по промежуточной таблице

```php
return $this->belongsToMany(Role::class)->wherePivot('approved', 1);
return $this->belongsToMany(Role::class)->wherePivotIn('priority', [1, 2]);
```

## Жадная загрузка (Eager Loading)

При обращении к связям через динамические свойства по умолчанию используется «ленивая» загрузка (Lazy Loading), что может приводить к проблеме N+1 запросов.

Для оптимизации используйте метод `with`:

```php
$users = User::query()->with('role')->get();

foreach ($users as $user) {
    echo $user->role->name;
}
```

В этом случае выполняется всего 2 запроса вместо N+1:

```sql
SELECT * FROM `user`;
SELECT * FROM `role` WHERE id IN (1, 2, 3, ...);
```

## Полиморфные связи (Polymorphic Relations)

Полиморфные связи позволяют целевой модели принадлежать более чем одному типу моделей в рамках одной связи.

### Один к одному (полиморфная)

Структура таблиц:
* `book`: `id`, `title`
* `user`: `id`, `name`
* `image`: `id`, `url`, `imageable_id`, `imageable_type`

Модели:

```php
<?php

namespace App\Model;

use Hyperf\DbConnection\Model\Model;

class Image extends Model
{
    public function imageable()
    {
        return $this->morphTo();
    }
}

class Book extends Model
{
    public function image()
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}

class User extends Model
{
    public function image()
    {
        return $this->morphOne(Image::class, 'imageable');
    }
}
```

Получение связи:

```php
$user = User::find(1);
$image = $user->image;

$image = Image::find(1);
$owner = $image->imageable; // User или Book
```

### Один ко многим (полиморфная)

```php
class Book extends Model
{
    public function images()
    {
        return $this->morphMany(Image::class, 'imageable');
    }
}
```

### Пользовательское сопоставление (Morph Map)

По умолчанию `imageable_type` сохраняет полное имя класса. Для упрощения имен и развязки структуры базы данных настройте `morphMap`:

```php
use Hyperf\Database\Model\Relations\Relation;

Relation::morphMap([
    'user' => App\Model\User::class,
    'book' => App\Model\Book::class,
]);
```

Слушатель для регистрации при запуске приложения:

```php
<?php

declare(strict_types=1);

namespace App\Listener;

use Hyperf\Database\Model\Relations\Relation;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Framework\Event\BootApplication;

#[Listener]
class MorphMapRelationListener implements ListenerInterface
{
    public function listen(): array
    {
        return [
            BootApplication::class,
        ];
    }

    public function process(object $event): void
    {
        Relation::morphMap([
            'user' => \App\Model\User::class,
            'book' => \App\Model\Book::class,
        ]);
    }
}
```

### Запросы по полиморфным связям

```php
use App\Model\Book;
use App\Model\Image;
use App\Model\User;
use Hyperf\Database\Model\Builder;

$images = Image::query()->whereHasMorph(
    'imageable',
    [User::class, Book::class],
    function (Builder $query) {
        $query->where('imageable_id', 1);
    }
)->get();
```
