---
sourcePath: "en/db/resource.md"
---

# API-ресурсы (API Resources)

При разработке API часто требуется слой трансформации данных между моделями Eloquent и ответом в формате JSON, возвращаемым клиенту. Классы ресурсов Hyperf обеспечивают элегантный и декларативный способ преобразования моделей и коллекций моделей в JSON.

## Установка

```bash
composer require hyperf/resource
```

Для поддержки gRPC-ответов:

```bash
composer require hyperf/resource-grpc
```

## Генерация ресурсов

Для создания ресурса используйте команду `gen:resource`. По умолчанию сгенерированные классы размещаются в каталоге `app/Resource`:

```bash
php bin/hyperf.php gen:resource User
```

### Коллекции ресурсов

Для создания ресурса, представляющего коллекцию моделей:

```bash
php bin/hyperf.php gen:resource Users --collection
php bin/hyperf.php gen:resource UserCollection
```

## Концепция и базовое использование

Каждый класс ресурса наследует `Hyperf\Resource\Json\JsonResource` и реализует метод `toArray()`:

```php
<?php

declare(strict_types=1);

namespace App\Resource;

use Hyperf\Resource\Json\JsonResource;

class User extends JsonResource
{
    /**
     * Преобразовать ресурс в массив.
     */
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}
```

Обратите внимание, что доступ к полям модели осуществляется через `$this->fieldName`, так как ресурс автоматически проксирует обращения к базовой модели.

### Использование в контроллере

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use App\Model\User;
use App\Resource\User as UserResource;

class UserController extends AbstractController
{
    public function show(int $id)
    {
        $user = User::findOrFail($id);
        return (new UserResource($user))->toResponse();
    }
}
```

### Коллекции в контроллере

Вы можете использовать статический метод `collection()`:

```php
public function index()
{
    return UserResource::collection(User::all())->toResponse();
}
```

Либо использовать выделенный класс коллекции `UserCollection`:

```php
public function index()
{
    return (new UserCollection(User::paginate()))->toResponse();
}
```

## Включение связей

Вы можете легко добавлять связанные ресурсы:

```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
        'posts' => PostResource::collection($this->posts),
    ];
}
```

## Условные атрибуты и связи

### Условный атрибут (`when`)

Метод `when` позволяет включать поле только при выполнении определенного условия:

```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'secret' => $this->when($this->isAdmin(), 'secret-value'),
    ];
}
```

Также поддерживается замыкание для ленивого вычисления:

```php
'secret' => $this->when($this->isAdmin(), function () {
    return 'computed-secret';
}),
```

### Условное слияние нескольких полей (`mergeWhen`)

```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        $this->mergeWhen($this->isAdmin(), [
            'first_secret' => 'value1',
            'second_secret' => 'value2',
        ]),
    ];
}
```

### Условная загрузка связей (`whenLoaded`)

Для предотвращения проблемы N+1 связь включается только в том случае, если она уже была загружена в модели:

```php
public function toArray(): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'posts' => PostResource::collection($this->whenLoaded('posts')),
    ];
}
```

### Данные промежуточной таблицы (`whenPivotLoaded`)

```php
'expires_at' => $this->whenPivotLoaded('role_user', function () {
    return $this->pivot->expires_at;
}),
```

## Обертывание данных (Data Wrapping)

По умолчанию верхнеуровневый ресурс оборачивается в ключ `data`:

```json
{
    "data": {
        "id": 1,
        "name": "Alex"
    }
}
```

Для отключения обертывания вызовите метод `withoutWrapping()`:

```php
return (new UserResource($user))->withoutWrapping()->toResponse();
```

При пагинации метаданные и ссылки автоматически выносятся в ключи `meta` и `links`:

```json
{
    "data": [ ... ],
    "links": {
        "first": "/users?page=1",
        "last": "/users?page=5",
        "prev": null,
        "next": "/users?page=2"
    },
    "meta": {
        "current_page": 1,
        "total": 50,
        "per_page": 10
    }
}
```

## Добавление метаданных

### На уровне класса ресурса

```php
public function with(): array
{
    return [
        'meta' => [
            'version' => '1.0.0',
        ],
    ];
}
```

### При создании экземпляра (`additional`)

```php
return (new UserCollection($users))
    ->additional([
        'meta' => [
            'key' => 'value',
        ],
    ])
    ->toResponse();
```
