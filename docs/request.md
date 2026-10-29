---
sourcePath: "en/request.md"
---

# Объект запроса (Request)

Объект HTTP-запроса в Hyperf полностью реализует стандарт [PSR-7](https://www.php-fig.org/psr/psr-7/) и предоставляется пакетом [hyperf/http-message](https://github.com/hyperf/http-message).

> **Особенность PSR-7:** Объекты запроса проектируются как **неизменяемые (immutable)**. Все методы с префиксом `with*` (например, `$request->withHeader(...)`) возвращают новый клон объекта, не изменяя исходный.

---

## Получение объекта запроса

Рекомендуемый способ получения объекта запроса — внедрение контракта `Hyperf\HttpServer\Contract\RequestInterface`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Annotation\AutoController;

#[AutoController]
class IndexController
{
    // Внедрение в метод контроллера:
    public function info(RequestInterface $request)
    {
        return $request->all();
    }
}
```

> Объект `RequestInterface` можно безопасно внедрять и в конструктор синглтон-сервисов/контроллеров. Внутри Hyperf используется прокси-класс, который прозрачно извлекает актуальный PSR-7 запрос текущей корутины из `Context`.

---

## Параметры маршрута (Route Parameters)

Если в маршруте определены динамические параметры (например, `/users/{id:\d+}`):

1. **Через аргументы метода контроллера**:
   ```php
   public function show(RequestInterface $request, int $id)
   {
       // $id автоматически преобразуется к типу int
   }
   ```
2. **Через метод `$request->route()`**:
   ```php
   $id = $request->route('id');          // null, если параметр отсутствует
   $id = (int) $request->route('id', 0); // значение по умолчанию 0
   ```

---

## Путь и HTTP-метод

```php
// Путь без query-параметров (например: "user/profile")
$path = $request->path();

// Проверка соответствия маске с подстановочным знаком *
if ($request->is('user/*')) {
    // ...
}

// URL без query-параметров: "http://example.com/user/profile"
$url = $request->url();

// Полный URL с query-параметрами: "http://example.com/user/profile?ref=tg"
$fullUrl = $request->fullUrl();

// Получение HTTP-метода (GET, POST и т.д.)
$method = $request->getMethod();

// Проверка метода
if ($request->isMethod('POST')) {
    // ...
}
```

---

## Получение входных данных (Input)

Hyperf унифицирует доступ к query-параметрам, данным `form-data`, `x-www-form-urlencoded` и входящему телу в формате `JSON`.

### 1. Все параметры: `$request->all()`
```php
$data = $request->all(); // ассоциативный массив всех данных
```

### 2. Конкретные параметры: `$request->input()`
```php
// Получить значение или null
$name = $request->input('name');

// Со значением по умолчанию
$name = $request->input('name', 'Гость');

// Получение нескольких параметров сразу:
$data = $request->inputs(['name', 'email'], ['name' => 'Anonymous']);
```

### 3. Точечная нотация для вложенных массивов и JSON
Если запрос содержит структурированный JSON, вложенные поля извлекаются через точку:

```php
$productName = $request->input('order.items.0.name');
$allNames = $request->input('order.items.*.name');
```

### 4. Только Query-параметры (URL string)
```php
$page = $request->query('page', 1);
$allQuery = $request->query();
```

### 5. Проверка наличия данных: `has()`
```php
if ($request->has('email')) {
    // Параметр присутствует в запросе
}

// Проверка нескольких параметров одновременно:
if ($request->has(['name', 'email'])) {
    // Присутствуют оба параметра
}
```

---

## Работа с Cookies

```php
// Получить все Cookie в виде ассоциативного массива:
$cookies = $request->getCookieParams();

// Получить конкретную Cookie:
$sessionId = $request->cookie('SESSIONID', default: null);
```

---

## Загрузка файлов (Uploads)

Для работы с загруженными файлами Hyperf предоставляет объект `Hyperf\HttpMessage\Upload\UploadedFile` (наследующий стандартный PHP-класс `SplFileInfo`):

```php
// Проверить наличие загруженного файла
if ($request->hasFile('avatar')) {
    $file = $request->file('avatar');

    // Проверить успешность загрузки без ошибок
    if ($file->isValid()) {
        // Исходное расширение файла
        $extension = $file->getExtension();

        // Временный путь на диске
        $tempPath = $file->getPath();

        // Перемещение файла в постоянное хранилище:
        $file->moveTo('/storage/uploads/avatars/' . uniqid() . '.' . $extension);

        if ($file->isMoved()) {
            // Файл успешно сохранен
        }
    }
}
```
