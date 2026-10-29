---
sourcePath: "en/db/querybuilder.md"
---

# Конструктор запросов (Query Builder)

Конструктор запросов Hyperf (`Hyperf\DbConnection\Db::table(...)`) предоставляет удобный текучий (fluent) интерфейс для построения и выполнения SQL-запросов любой сложности. Он полностью совместим с синтаксисом Query Builder из Laravel и защищает приложение от SQL-инъекций за счет обязательного связывания параметров PDO.

---

## Получение результатов

```php
use Hyperf\DbConnection\Db;

// Получение всех строк (возвращает Hyperf\Collection\Collection из объектов \stdClass):
$users = Db::table('users')->get();

// Получение первой строки:
$user = Db::table('users')->where('name', 'Алексей')->first();

// Получение значения одного столбца:
$email = Db::table('users')->where('id', 1)->value('email');

// Получение списка значений одного столбца (массив/коллекция):
$titles = Db::table('roles')->pluck('title');
// С указанием кастомного ключа:
$roles = Db::table('roles')->pluck('title', 'name'); // ['admin' => 'Администратор']
```

---

## Пакетная обработка больших объемов данных: `chunk()` и `chunkById()`

Для обработки десятков или сотен тысяч строк без переполнения оперативной памяти используйте метод `chunk()`:

```php
// Обработка порциями по 100 записей
Db::table('users')->orderBy('id')->chunk(100, function ($users) {
    foreach ($users as $user) {
        // Обработка...
    }
    // Для остановки верните false
});
```

> **Совет:** Если внутри цикла выполняется обновление или удаление записей, используйте метод `chunkById('id')`. Он предотвращает пропуск строк за счет пагинации строго по первичному ключу.

---

## Агрегатные функции и проверка существования

```php
$count = Db::table('orders')->count();
$price = Db::table('orders')->max('price');
$avg   = Db::table('orders')->avg('price');
$total = Db::table('orders')->sum('price');

// Быстрая проверка существования:
if (Db::table('orders')->where('status', 'paid')->exists()) {
    // ...
}

if (Db::table('orders')->where('status', 'cancelled')->doesntExist()) {
    // ...
}
```

---

## Выборка и сырые выражения (Raw Expressions)

```php
// Выборка определенных колонок и алиасов:
$users = Db::table('users')->select('name', 'email as user_email')->get();

// Выборка уникальных значений:
$users = Db::table('users')->distinct()->get();

// Использование сырых выражений Db::raw():
$stats = Db::table('users')
    ->select('gender', Db::raw('COUNT(*) as total'))
    ->groupBy('gender')
    ->get();

// Специализированные сырые методы: selectRaw, whereRaw, havingRaw, orderByRaw:
$orders = Db::table('orders')
    ->selectRaw('price * ? as price_with_vat', [1.20])
    ->whereRaw('price > ?', [1000])
    ->orderByRaw('updated_at - created_at DESC')
    ->get();
```

---

## Объединение таблиц (Joins)

### Внутреннее объединение (Inner Join):
```php
$users = Db::table('users')
    ->join('contacts', 'users.id', '=', 'contacts.user_id')
    ->join('orders', 'users.id', '=', 'orders.user_id')
    ->select('users.*', 'contacts.phone', 'orders.amount')
    ->get();
```

### Левое и правое объединение (Left / Right Join):
```php
$users = Db::table('users')
    ->leftJoin('posts', 'users.id', '=', 'posts.user_id')
    ->get();
```

### Сложные условия объединения (Closure Join):
```php
Db::table('users')
    ->join('contacts', function ($join) {
        $join->on('users.id', '=', 'contacts.user_id')
             ->where('contacts.status', '=', 'active');
    })
    ->get();
```

---

## Условия фильтрации (Where Clauses)

### Простые условия:
```php
Db::table('users')->where('votes', '=', 100)->get();
Db::table('users')->where('votes', 100)->get(); // оператор '=' подразумевается по умолчанию
Db::table('users')->where('votes', '>=', 100)->get();
Db::table('users')->where('name', 'like', 'А%')->get();

// Массив условий (логическое AND):
Db::table('users')->where([
    ['status', '=', 'active'],
    ['role', '=', 'manager'],
])->get();
```

### Условие OR:
```php
$users = Db::table('users')
    ->where('votes', '>', 100)
    ->orWhere('name', 'Дмитрий')
    ->get();
```

### Диапазоны и списки:
```php
// Между значениями:
Db::table('users')->whereBetween('age', [18, 65])->get();
Db::table('users')->whereNotBetween('age', [18, 65])->get();

// Вхождение в массив (IN / NOT IN):
Db::table('users')->whereIn('id', [1, 2, 3])->get();
Db::table('users')->whereNotIn('id', [4, 5, 6])->get();

// Проверка на NULL:
Db::table('users')->whereNull('deleted_at')->get();
Db::table('users')->whereNotNull('updated_at')->get();
```

### Группировка условий в скобках:
```php
// SELECT * FROM users WHERE name = 'Иван' AND (votes > 100 OR role = 'admin')
Db::table('users')
    ->where('name', '=', 'Иван')
    ->where(function ($query) {
        $query->where('votes', '>', 100)
              ->orWhere('role', '=', 'admin');
    })
    ->get();
```

### Поля JSON (MySQL 5.7+ / PostgreSQL):
```php
// Поиск по ключу в JSON-объекте:
Db::table('users')->where('preferences->locale', 'ru')->get();

// Поиск значения в JSON-массиве:
Db::table('users')->whereJsonContains('options->tags', 'vip')->get();
```

---

## Сортировка, группировка, лимиты (Limit / Offset)

```php
// Сортировка:
$users = Db::table('users')->orderBy('name', 'desc')->get();
$newest = Db::table('users')->latest()->first(); // по created_at DESC
$oldest = Db::table('users')->oldest()->first(); // по created_at ASC
$random = Db::table('users')->inRandomOrder()->first();

// Группировка и Having:
$groups = Db::table('users')
    ->groupBy('role')
    ->having('total', '>', 10)
    ->select('role', Db::raw('COUNT(*) as total'))
    ->get();

// Ограничение выборки (Limit / Offset):
$users = Db::table('users')->skip(10)->take(5)->get();
// или:
$users = Db::table('users')->offset(10)->limit(5)->get();
```

---

## Условные запросы: `when()`

Позволяет добавлять условия в запрос только в том случае, если переданное выражение истинно (например, при наличии GET-фильтра от пользователя):

```php
$role = $request->input('role');

$users = Db::table('users')
    ->when($role, function ($query, $role) {
        return $query->where('role_id', $role);
    })
    ->get();
```

---

## Вставка, обновление и удаление

### Вставка (Insert):
```php
// Вставка одной строки:
Db::table('users')->insert([
    'name' => 'Ольга',
    'email' => 'olga@example.com',
]);

// Вставка с получением сгенерированного ID:
$id = Db::table('users')->insertGetId([
    'name' => 'Ольга',
    'email' => 'olga@example.com',
]);
```

### Обновление (Update):
```php
Db::table('users')->where('id', 1)->update(['votes' => 1]);

// Вставить или обновить (Upsert / UpdateOrInsert):
Db::table('users')->updateOrInsert(
    ['email' => 'olga@example.com'], // условия поиска
    ['name' => 'Ольга Иванова', 'votes' => 10] // данные для обновления/вставки
);

// Атомарный инкремент и декремент:
Db::table('users')->where('id', 1)->increment('votes');
Db::table('users')->where('id', 1)->increment('votes', 5);
Db::table('users')->where('id', 1)->decrement('balance', 100.50);
```

### Удаление (Delete):
```php
Db::table('users')->where('status', 'banned')->delete();

// Полная очистка таблицы со сбросом автоинкремента:
Db::table('users')->truncate();
```

---

## Пессимистичные блокировки (Pessimistic Locking)

Для предотвращения состояний гонки (Race Condition) в транзакциях:

```php
// Shared Lock (LOCK IN SHARE MODE) - защита от изменения другими транзакциями:
Db::table('users')->where('id', 1)->sharedLock()->get();

// Lock For Update (FOR UPDATE) - эксклюзивная блокировка строк до конца транзакции:
Db::table('users')->where('id', 1)->lockForUpdate()->get();
```
