---
sourcePath: "en/db/paginator.md"
---

# Пагинация в базе данных

При выполнении запросов с помощью [hyperf/database](https://github.com/hyperf/database) компонент [hyperf/paginator](https://github.com/hyperf/paginator) предоставляет простой и эффективный механизм разделения результатов на страницы.

## Использование

При использовании [Query Builder](db-querybuilder) или [Моделей](db-model) вы можете вызывать метод `paginate()`. Он автоматически определяет текущую страницу на основе параметра `page` из входящего HTTP-запроса и рассчитывает необходимые `limit` и `offset`:

> По умолчанию результаты пагинации возвращаются в формате `application/json`.

### Пагинация через Query Builder

```php
<?php

use Hyperf\DbConnection\Db;

// Постраничный вывод по 10 пользователей на страницу
return Db::table('users')->paginate(10);
```

### Пагинация через модель

Вы можете вызвать метод `paginate` непосредственно на классе модели:

```php
<?php

use App\Model\User;

return User::paginate(10);
```

Или добавить условия фильтрации:

```php
<?php

use App\Model\User;

return User::where('gender', 1)->paginate(10);
```

## Методы экземпляра пагинатора

Для подробного описания всех возможностей и методов объекта пагинатора обратитесь к разделу [Пагинация](paginator).
