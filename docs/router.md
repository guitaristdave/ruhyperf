---
sourcePath: "en/router.md"
---

# Маршрутизация (Routing)

По умолчанию для сопоставления маршрутов Hyperf использует высокоскоростной компонент [nikic/fast-route](https://github.com/nikic/FastRoute). Обработка входящих HTTP-запросов осуществляется пакетом `hyperf/http-server`, а RPC-маршрутизация — пакетом `hyperf/rpc-server`.

---

## Способы объявления маршрутов

Hyperf поддерживает два способа регистрации маршрутов:
1. **Через конфигурационный файл `config/routes.php`**;
2. **Через PHP-атрибуты (Аннотации)** непосредственно над классами и методами контроллеров (рекомендуемый способ).

---

## 1. Маршруты в файле `config/routes.php`

### Базовые маршруты с замыканиями (Closure)
```php
<?php
use Hyperf\HttpServer\Router\Router;

Router::get('/hello', function () {
    return 'Привет, Hyperf!';
});
```

### Привязка к контроллерам
```php
use Hyperf\HttpServer\Router\Router;
use App\Controller\UserController;

// Все три варианта синтаксиса эквивалентны:
Router::get('/user', [UserController::class, 'index']);
Router::get('/user', 'App\Controller\UserController@index');
Router::get('/user', 'App\Controller\UserController::index');
```

### Поддерживаемые HTTP-методы:
```php
Router::get($uri, $callback);
Router::post($uri, $callback);
Router::put($uri, $callback);
Router::patch($uri, $callback);
Router::delete($uri, $callback);
Router::head($uri, $callback);

// Маршрут для нескольких методов одновременно:
Router::addRoute(['GET', 'POST'], '/user/save', [UserController::class, 'save']);
```

### Группы маршрутов (Route Groups)
Группы позволяют задавать общий префикс URL (и при необходимости подключать middleware ко всей группе):

```php
Router::addGroup('/api/v1/', function () {
    Router::get('users', [UserController::class, 'index']);
    Router::post('users', [UserController::class, 'store']);
    Router::get('users/{id:\d+}', [UserController::class, 'show']);
});
```

---

## 2. Маршрутизация через PHP-атрибуты (Аннотации)

В крупных проектах гораздо удобнее держать определение маршрутов рядом с кодом методов.

### Автоматическая маршрутизация: `#[AutoController]`

Атрибут `#[AutoController]` автоматически регистрирует все публичные методы контроллера для методов `GET` и `POST`. Имя контроллера автоматически преобразуется из PascalCase в snake_case:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Annotation\AutoController;

#[AutoController]
class UserController
{
    // Будет доступен по адресу: /user/index
    public function index(RequestInterface $request): string
    {
        return 'Список пользователей';
    }

    // Будет доступен по адресу: /user/info
    public function info(RequestInterface $request): string
    {
        return 'Информация';
    }
}
```

### Точные атрибуты: `#[Controller]` и `#[GetMapping]` / `#[PostMapping]`

Для строгого REST API используется атрибут `#[Controller]` на уровне класса в комбинации со специализированными атрибутами методов:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Annotation\Controller;
use Hyperf\HttpServer\Annotation\GetMapping;
use Hyperf\HttpServer\Annotation\PostMapping;
use Hyperf\HttpServer\Annotation\DeleteMapping;
use Hyperf\HttpServer\Annotation\RequestMapping;

#[Controller(prefix: '/api/v1/orders')]
class OrderController
{
    #[GetMapping(path: '')]
    public function list(): array
    {
        return [];
    }

    #[PostMapping(path: '')]
    public function create(): array
    {
        return ['status' => 'created'];
    }

    #[DeleteMapping(path: '{id:\d+}')]
    public function delete(int $id): array
    {
        return ['deleted' => $id];
    }

    // Универсальный маппинг нескольких методов:
    #[RequestMapping(path: 'process', methods: ['GET', 'POST'])]
    public function process()
    {
    }
}
```

> **Совет по префиксу:** Если путь в методе начинается со слеша (`/`), например `path: '/custom/path'`, значение `prefix` контроллера игнорируется, и маршрут привязывается к корню.

---

## Параметры маршрутов

### 1. Обязательные параметры: `{name}`
```php
Router::get('/user/{id}', [UserController::class, 'show']);
```

### 2. Необязательные параметры: `[{name}]`
```php
// /user или /user/42
Router::get('/user[/{id}]', [UserController::class, 'show']);
```

### 3. Регулярные выражения для валидации параметров
```php
// Только цифры
Router::get('/user/{id:\d+}', [UserController::class, 'show']);

// Любые символы, включая слэши
Router::get('/file/{path:.+}', [FileController::class, 'download']);
```

### Получение параметров в контроллере:

1. **Через аргументы метода** (с автоматическим приведением типов PHP):
   ```php
   public function show(int $id)
   {
       return User::findOrFail($id);
   }
   ```
2. **Через объект запроса `$request->route()`**:
   ```php
   public function show(RequestInterface $request)
   {
       $id = $request->route('id', 0);
   }
   ```

---

## Просмотр списка маршрутов (CLI)

Чтобы увидеть полную таблицу зарегистрированных маршрутов сервера, выполните консольную команду:

```bash
php bin/hyperf.php describe:routes
```

С фильтрацией по конкретному пути:
```bash
php bin/hyperf.php describe:routes --path=/api/v1/orders
```

---

## Ошибки 404 (Not Found) и 405 (Method Not Allowed)

Если маршрут не найден или вызван неподдерживаемый HTTP-метод, Hyperf выбрасывает исключение, наследующее `Hyperf\HttpMessage\Exception\HttpException`. 

Обработка и форматирование таких ответов (например, возврат JSON вместо HTML) настраивается в слое [Обработки исключений (Exception Handler)](exception-handler).
