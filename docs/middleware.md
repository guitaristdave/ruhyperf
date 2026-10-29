---
sourcePath: "en/middleware/middleware.md"
---

# Посредники (Middleware)

Посредники (Middleware) в Hyperf реализуют стандарт [PSR-15](https://www.php-fig.org/psr/psr-15/) (`Psr\Http\Server\MiddlewareInterface`) и предназначены для сквозной обработки HTTP-запроса перед передачей в контроллер и ответа после его формирования.

---

## Принцип работы: Луковичная модель (Onion Model)

Механизм middleware построен по принципу «луковицы»:

![Схема middleware](/imgs/middleware.jpg)

Порядок прохождения:
`Входящий Request -> Middleware 1 -> Middleware 2 -> Контроллер (Ядро) -> Middleware 2 -> Middleware 1 -> Исходящий Response`

* До вызова `$handler->handle($request)` выполняется **Pre-логика** (проверка токенов авторизации, валидация заголовков, CORS).
* После вызова `$handler->handle($request)` выполняется **Post-логика** (добавление заголовков, замер времени, сжатие ответа, логирование).

---

## Создание Middleware

Создать класс посредника можно вручную или консольной командой:

```bash
php bin/hyperf.php gen:middleware Auth/TokenMiddleware
```

Класс должен реализовывать интерфейс `Psr\Http\Server\MiddlewareInterface`:

```php
<?php
declare(strict_types=1);

namespace App\Middleware\Auth;

use Hyperf\HttpServer\Contract\ResponseInterface as HttpResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class TokenMiddleware implements MiddlewareInterface
{
    public function __construct(protected HttpResponse $response)
    {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        // 1. Предварительная проверка (Pre-operation)
        $token = $request->getHeaderLine('Authorization');

        if (empty($token) || $token !== 'secret-token') {
            // Прерываем выполнение цепочки и возвращаем JSON-ответ
            return $this->response->json([
                'code' => 401,
                'message' => 'Не авторизован',
            ])->withStatus(401);
        }

        // 2. Передаем управление следующему посреднику или контроллеру
        $response = $handler->handle($request);

        // 3. Пост-обработка ответа (Post-operation)
        return $response->withHeader('X-Processed-By', 'TokenMiddleware');
    }
}
```

---

## Регистрация Middleware

### 1. Глобальные посредники (Global Middleware)

Применяются ко всем входящим запросам указанного HTTP-сервера. Настраиваются в файле `config/autoload/middlewares.php`:

```php
<?php
return [
    'http' => [
        \App\Middleware\CorsMiddleware::class,
        \App\Middleware\Auth\TokenMiddleware::class,
    ],
];
```

---

### 2. Локальные посредники через PHP-атрибуты

Применяются к конкретному контроллеру или отдельному методу с помощью атрибутов `#[Middleware]` и `#[Middlewares]`:

#### На уровне всего контроллера:
```php
use App\Middleware\Auth\TokenMiddleware;
use Hyperf\HttpServer\Annotation\AutoController;
use Hyperf\HttpServer\Annotation\Middleware;

#[AutoController]
#[Middleware(TokenMiddleware::class)]
class OrderController
{
    public function index()
    {
        return 'Заказы пользователя';
    }
}
```

#### На уровне отдельного метода:
```php
#[AutoController]
class OrderController
{
    #[Middleware(TokenMiddleware::class)]
    public function secureAction()
    {
        return 'Защищенное действие';
    }
}
```

---

### 3. Локальные посредники в `config/routes.php`

```php
use App\Middleware\Auth\TokenMiddleware;
use Hyperf\HttpServer\Router\Router;

Router::get('/secure', [IndexController::class, 'index'], [
    'middleware' => [TokenMiddleware::class]
]);

// Для группы маршрутов:
Router::addGroup('/admin', function () {
    Router::get('/dashboard', [AdminController::class, 'dashboard']);
}, ['middleware' => [TokenMiddleware::class]]);
```

---

## Приоритет выполнения (Priority)

Если для маршрута задано несколько посредников, по умолчанию они выполняются в порядке:
`Глобальные -> Посредники контроллера -> Посредники метода`.

Начиная с Hyperf 3.0, можно явно задать приоритет (чем выше число, тем раньше запустится middleware):

```php
#[AutoController]
#[Middleware(FirstMiddleware::class, priority: 10)]
#[Middleware(SecondMiddleware::class, priority: 5)]
class DemoController
{
}
```

---

## Модификация Request и Response в контексте корутины

Объекты стандарта PSR-7 являются **неизменяемыми (Immutable)**. Вызов `$request->withAttribute(...)` или `$response->withHeader(...)` возвращает **клон** объекта, а не меняет исходный экземпляр.

Если вы изменили `$request` внутри middleware и хотите, чтобы измененный объект был доступен далее в контроллерах через внедряемый `RequestInterface`, сохраните его обратно в контекст корутины:

```php
use Hyperf\Context\Context;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Message\ResponseInterface;

public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
{
    // Добавляем атрибут в запрос
    $request = $request->withAttribute('user_id', 42);
    // Обновляем запрос в текущей корутине
    Context::set(ServerRequestInterface::class, $request);

    $response = $handler->handle($request);

    // Добавляем заголовок в ответ
    $response = $response->withHeader('X-Custom-Header', 'Value');
    Context::set(ResponseInterface::class, $response);

    return $response;
}
```

---

## Практический пример: Посредник CORS (междоменные запросы)

```php
<?php
declare(strict_types=1);

namespace App\Middleware;

use Hyperf\Context\Context;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class CorsMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $response = Context::get(ResponseInterface::class);
        $response = $response->withHeader('Access-Control-Allow-Origin', '*')
            ->withHeader('Access-Control-Allow-Credentials', 'true')
            ->withHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            ->withHeader('Access-Control-Allow-Headers', 'DNT,Keep-Alive,User-Agent,Cache-Control,Content-Type,Authorization');

        Context::set(ResponseInterface::class, $response);

        // Быстрый ответ на preflight-запросы OPTIONS
        if ($request->getMethod() === 'OPTIONS') {
            return $response->withStatus(204);
        }

        return $handler->handle($request);
    }
}
```
