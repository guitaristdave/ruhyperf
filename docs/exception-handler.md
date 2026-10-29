---
sourcePath: "en/exception-handler.md"
---

# Обработка исключений (Exception Handling)

В Hyperf весь бизнес-код исполняется внутри рабочих процессов (Worker Process) в корутинах. Если внутри запроса возникает необработанное исключение, процесс не падает, но запрос завершается аварийно. 

Механизм **Exception Handlers** позволяет централизованно перехватывать любые исключения (`Throwable`), логировать их и возвращать клиенту стандартизированный ответ (например, JSON с кодом ошибки и пояснением).

---

## Архитектура обработчиков: Цепочка обязанностей

Обработчики исключений организованы в виде **конвейера (Pipeline)**:
1. При возникновении исключения оно по очереди передается каждому зарегистрированному обработчику.
2. Обработчик проверяет в методе `isValid(Throwable $throwable)`, относится ли исключение к его зоне ответственности.
3. В методе `handle()` формируется HTTP-ответ (`ResponseInterface`).
4. Если обработчик вызвал `$this->stopPropagation()`, всплытие исключения прекращается. Если нет — исключение передается следующему обработчику в цепочке.

---

## Создание собственного обработчика исключений

Для создания обработчика унаследуйте абстрактный класс `Hyperf\ExceptionHandler\ExceptionHandler`:

```php
<?php
declare(strict_types=1);

namespace App\Exception\Handler;

use App\Exception\BusinessException;
use Hyperf\ExceptionHandler\ExceptionHandler;
use Hyperf\HttpMessage\Stream\SwooleStream;
use Psr\Http\Message\ResponseInterface;
use Throwable;

class BusinessExceptionHandler extends ExceptionHandler
{
    public function handle(Throwable $throwable, ResponseInterface $response): ResponseInterface
    {
        // 1. Формируем тело JSON-ответа
        $data = json_encode([
            'code' => $throwable->getCode() ?: 400,
            'message' => $throwable->getMessage(),
        ], JSON_UNESCAPED_UNICODE);

        // 2. Останавливаем дальнейшую передачу исключения по цепочке
        $this->stopPropagation();

        // 3. Возвращаем HTTP-ответ с нужным статусом и заголовками
        return $response->withStatus(400)
            ->withHeader('Content-Type', 'application/json; charset=utf-8')
            ->withBody(new SwooleStream($data));
    }

    public function isValid(Throwable $throwable): bool
    {
        // Обрабатывать только исключения типа BusinessException
        return $throwable instanceof BusinessException;
    }
}
```

---

## Регистрация обработчиков исключений

Обработчики регистрируются в файле `config/autoload/exceptions.php`:

```php
<?php
return [
    'handler' => [
        'http' => [
            // Порядок в массиве определяет очередность выполнения:
            \App\Exception\Handler\BusinessExceptionHandler::class,
            \App\Exception\Handler\AppExceptionHandler::class, // Общий обработчик для непредвиденных 500 ошибок
        ],
    ],
];
```

> Также доступна регистрация через PHP-атрибут `#[ExceptionHandler(server: 'http', priority: 10)]`.

---

## Интеграция с Whoops (красивый стек ошибок в dev-режиме)

Для удобной отладки в локальной среде разработки Hyperf поддерживает библиотеку **Whoops**:

### 1. Установка пакета:
```bash
composer require --dev filp/whoops
```

### 2. Подключение в `config/autoload/exceptions.php`:
```php
return [
    'handler' => [
        'http' => [
            \Hyperf\ExceptionHandler\Handler\WhoopsExceptionHandler::class,
            \App\Exception\Handler\AppExceptionHandler::class,
        ],
    ],
];
```

При возникновении ошибки браузер отобразит интерактивную страницу с подсвеченным стеком вызовов:

![Интерфейс Whoops](/imgs/whoops.png)

---

## Преобразование PHP-ошибок (Notice/Warning) в исключения

Чтобы устаревшие предупреждения и ошибки PHP (Notice, Warning, Undefined index) перехватывались как полноценные `\ErrorException`, добавьте слушатель в `config/autoload/listeners.php`:

```php
<?php
return [
    \Hyperf\ExceptionHandler\Listener\ErrorExceptionHandler::class,
];
```

После этого любое обращение к несуществующему элементу массива `$array['unknown']` будет выбрасывать `\ErrorException`, что позволит гарантировать максимальное качество и строгость кода.
