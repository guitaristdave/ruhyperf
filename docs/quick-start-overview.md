---
sourcePath: "en/quick-start/overview.md"
---

# Быстрый старт

В качестве вводного примера использования **Hyperf**, на этой странице мы создадим HTTP-сервер для реализации простого Web-сервиса с помощью определения маршрутов и контроллеров. 

Возможности Hyperf значительно шире: сервисное управление, gRPC, AOP и работа с базами данных подробно рассматриваются в соответствующих главах документации.

---

## Определение маршрутов

По умолчанию Hyperf использует компонент [nikic/fast-route](https://github.com/nikic/FastRoute). Маршруты можно определять как в конфигурационном файле `config/routes.php`, так и через удобные **PHP-атрибуты** прямо над методами контроллеров.

Подробнее обо всех возможностях маршрутизации читайте в разделе [Маршрутизация (Router)](router).

### Вариант 1. Маршруты через конфигурационный файл

Файл маршрутов находится по пути `config/routes.php`. Примеры определения:

```php
<?php
use Hyperf\HttpServer\Router\Router;

// Маршрут для GET-запроса, связывает адрес '/get' с методом App\Controller\IndexController::get()
Router::get('/get', 'App\Controller\IndexController::get');
Router::get('/get', 'App\Controller\IndexController@get');
Router::get('/get', [\App\Controller\IndexController::class, 'get']);

// Маршрут для POST-запроса
Router::post('/post', [\App\Controller\IndexController::class, 'post']);

// Маршрут, разрешающий сразу несколько методов (GET, POST, HEAD)
Router::addRoute(['GET', 'POST', 'HEAD'], '/multi', [\App\Controller\IndexController::class, 'multi']);
```

---

### Вариант 2. Маршруты через PHP-атрибуты (Аннотации)

Hyperf предоставляет мощную поддержку атрибутов PHP 8. Для контроллеров предусмотрены атрибуты `#[Controller]` и `#[AutoController]`.

#### Автоматическая маршрутизация: `#[AutoController]`

Атрибут `#[AutoController]` автоматически регистрирует маршруты для всех публичных методов класса по схеме `/{имя_контроллера}/{имя_метода}` для методов `GET` и `POST`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Annotation\AutoController;

#[AutoController]
class IndexController
{
    // Hyperf автоматически создаст маршрут `/index/index` для GET и POST запросов
    public function index(RequestInterface $request): string
    {
        // Получаем параметр 'id' из запроса (по умолчанию 1)
        $id = $request->input('id', 1);
        return (string) $id;
    }
}
```

#### Точная маршрутизация: `#[Controller]` и `#[RequestMapping]`

Для явного и гибкого контроля путей и методов HTTP используется `#[Controller]` в сочетании с `#[RequestMapping]` или быстрыми атрибутами `#[GetMapping]`, `#[PostMapping]`, `#[PutMapping]`, `#[DeleteMapping]`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Annotation\Controller;
use Hyperf\HttpServer\Annotation\GetMapping;
use Hyperf\HttpServer\Annotation\PostMapping;

#[Controller]
class IndexController
{
    #[GetMapping(path: "/index")]
    public function index(RequestInterface $request): string
    {
        $id = $request->input('id', 1);
        return (string) $id;
    }

    #[PostMapping(path: "/user/create")]
    public function create(RequestInterface $request): array
    {
        return [
            'status' => 'success',
            'data' => $request->all(),
        ];
    }
}
```

---

## Обработка HTTP-запросов

Hyperf не навязывает жестких рамок архитектуры: вы можете использовать классический паттерн MVC или стиль RequestHandler (PSR-15).

Контроллер получает объект запроса `RequestInterface` (соответствующий стандартам PSR-7 / PSR-15) и может возвращать строку, массив (автоматически сериализуемый в JSON) или полноценный объект `ResponseInterface`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\HttpServer\Annotation\AutoController;

#[AutoController]
class IndexController
{
    public function json(RequestInterface $request, ResponseInterface $response)
    {
        $data = [
            'name' => 'Hyperf',
            'version' => '3.1',
        ];

        // Возврат ассоциативного массива автоматически формирует JSON-ответ с заголовком application/json
        return $data;
    }
}
```

---

## Автоматическое внедрение зависимостей (DI)

Внедрение зависимостей — ключевая особенность Hyperf, обеспечивающая модульность и расширяемость проекта.

Hyperf поддерживает два способа внедрения:
1. **Через конструктор (Constructor Injection)**;
2. **Через атрибут `#[Inject]` над свойством класса**.

Предположим, у нас есть сервис `\App\Service\UserService`:

### Способ 1. Внедрение через конструктор

Достаточно объявить тип параметра в сигнатуре конструктора, и Hyperf автоматически разрешит и передаст экземпляр сервиса:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Annotation\AutoController;
use App\Service\UserService;

#[AutoController]
class IndexController
{
    public function __construct(private UserService $userService)
    {
    }

    // Доступно по адресу: /index/info?id=1
    public function info(RequestInterface $request): array
    {
        $id = (int) $request->input('id', 1);
        return $this->userService->getInfoById($id);
    }
}
```

### Способ 2. Внедрение через атрибут `#[Inject]`

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Annotation\AutoController;
use Hyperf\Di\Annotation\Inject;
use App\Service\UserService;

#[AutoController]
class IndexController
{
    #[Inject]
    private UserService $userService;

    // Доступно по адресу: /index/info?id=1
    public function info(RequestInterface $request): array
    {
        $id = (int) $request->input('id', 1);
        return $this->userService->getInfoById($id);
    }
}
```

В обоих случаях объект `$userService` создается и управляется DI-контейнером. Если `UserService` сам требует других зависимостей, Hyperf автоматически построит дерево зависимостей и создаст все требуемые объекты.

Подробнее о контейнере читайте в главе [Внедрение зависимостей (DI)](di).

---

## Запуск сервера

Так как Hyperf работает как постоянный CLI-процесс, приложение запускается из терминала в корневой директории проекта командой:

```bash
php bin/hyperf.php start
```

После запуска в консоли появится сообщение о готовности сервера. По умолчанию сервер слушает порт `9501`:
```bash
curl http://127.0.0.1:9501/index/index?id=10
```

---

## Перезагрузка кода (Reload)

Hyperf — это долгоживущее приложение: все файлы PHP загружаются в память один раз при старте процесса. Поэтому изменения в файлах PHP не вступают в силу мгновенно, как в PHP-FPM.

Для применения изменений:
1. Остановите сервер комбинацией клавиш `Ctrl + C` в терминале.
2. Снова выполните `php bin/hyperf.php start`.

> **Совет:** Для автоматической перезагрузки сервера при сохранении файлов используйте компонент [Watcher](watcher):
> ```bash
> composer require hyperf/watcher --dev
> php bin/hyperf.php server:watch
> ```
