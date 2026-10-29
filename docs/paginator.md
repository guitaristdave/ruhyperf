---
sourcePath: "en/paginator.md"
---

# Пагинация (Paginator)

Компонент [hyperf/paginator](https://github.com/hyperf/paginator) предназначен для разбиения наборов данных на страницы. Он тесно интегрирован с ORM `hyperf/database`, но может использоваться и независимо для любых массивов и коллекций.

---

## Установка

```bash
composer require hyperf/paginator
```

---

## Варианты пагинаторов

Компонент предоставляет два основных класса:

1. **`Hyperf\Paginator\Paginator` (Простая пагинация)**:
   - Не выполняет запрос `SELECT COUNT(*)` для подсчета общего числа строк в БД.
   - Знает только о наличии следующей страницы (`hasMorePages()`).
   - Идеален для бесконечного скролла или огромных таблиц (высокая производительность).
2. **`Hyperf\Paginator\LengthAwarePaginator` (Полная пагинация)**:
   - Знает общее количество записей (`total()`) и последнюю страницу (`lastPage()`).
   - Используется для классической постраничной навигации с номерами страниц (`1, 2, 3 ... 10`).

---

## Ручное использование для произвольных коллекций

Вы можете разбить любой массив данных с помощью `Paginator` или `LengthAwarePaginator`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Annotation\AutoController;
use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\Paginator\Paginator;
use Hyperf\Collection\Collection;

#[AutoController]
class UserController
{
    public function index(RequestInterface $request)
    {
        $currentPage = (int) $request->input('page', 1);
        $perPage = (int) $request->input('per_page', 10);

        $collection = new Collection([
            ['id' => 1, 'name' => 'Александр'],
            ['id' => 2, 'name' => 'Елена'],
            ['id' => 3, 'name' => 'Дмитрий'],
            ['id' => 4, 'name' => 'Мария'],
        ]);

        // Извлекаем элементы для текущей страницы
        $slice = array_values($collection->forPage($currentPage, $perPage)->toArray());

        // Возвращаем объект пагинатора (автоматически сериализуется в JSON)
        return new Paginator($slice, $perPage, $currentPage);
    }
}
```

---

## Основные методы объекта пагинатора

```php
// Текущая страница:
$page = $paginator->currentPage();

// Количество элементов на странице:
$perPage = $paginator->perPage();

// Количество элементов на текущей странице:
$count = $paginator->count();

// Есть ли следующая страница?
if ($paginator->hasMorePages()) {
    $nextUrl = $paginator->nextPageUrl();
}

// Находимся ли на первой странице?
if ($paginator->onFirstPage()) {
    // ...
}

// Общее количество элементов (только для LengthAwarePaginator):
$total = $paginator->total();

// Номер последней страницы (только для LengthAwarePaginator):
$lastPage = $paginator->lastPage();

// Преобразование структуры пагинации в массив / JSON:
$data = $paginator->toArray();
```

---

## Пагинация в базе данных (ORM)

При работе с базой данных `hyperf/database` пагинация вызывается непосредственно у построителя запросов:

```php
// Полная пагинация (с подсчетом total):
$users = User::query()->where('status', 1)->paginate(perPage: 15);

// Быстрая простая пагинация (без COUNT(*)):
$users = User::query()->where('status', 1)->simplePaginate(perPage: 15);
```
Подробнее читайте в разделе [Пагинация базы данных](db-paginator).
