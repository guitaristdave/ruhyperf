---
sourcePath: "en/controller.md"
---

# Контроллеры (Controllers)

Контроллеры служат точкой входа для обработки входящих HTTP-запросов и возврата ответов клиенту.

Связывание маршрутов с методами контроллеров подробно описано в главе [Маршрутизация (Routing)](router).

---

## Создание контроллера

Контроллер в Hyperf представляет собой обычный PHP-класс. Входящие объекты запроса (`RequestInterface`) и ответа (`ResponseInterface`) могут внедряться:
1. Через аргументы вызываемого метода (Method Injection);
2. Через конструктор класса или атрибут `#[Inject]`.

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Contract\RequestInterface;
use Hyperf\HttpServer\Contract\ResponseInterface;
use Hyperf\HttpServer\Annotation\AutoController;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;

#[AutoController]
class IndexController
{
    public function index(RequestInterface $request, ResponseInterface $response): PsrResponseInterface|string|array
    {
        $name = $request->input('name', 'World');

        // Вариант 1: Возврат простой строки (Content-Type: text/plain)
        // return 'Hello ' . $name;

        // Вариант 2: Возврат массива (автоматически сериализуется в JSON с Content-Type: application/json)
        return [
            'greeting' => 'Hello ' . $name,
            'time' => time(),
        ];

        // Вариант 3: Ручное формирование объекта ответа
        // return $response->json(['greeting' => 'Hello ' . $name]);
    }
}
```

---

## ⚠️ Критически важно: изоляция данных между корутинами

В традиционных фреймворках на базе PHP-FPM (Laravel, Yii, Symfony) разработчики привыкли создавать базовый абстрактный класс `AbstractController` и сохранять в его свойства данные пользователя или запроса:
```php
// ❌ В PHP-FPM это работало, но в HYPERF ЭТО ГРУБЕЙШАЯ ОШИБКА:
class UserController extends AbstractController
{
    private $currentUser; // ❌ ОШИБКА!

    public function profile(RequestInterface $request)
    {
        $this->currentUser = $this->auth->user(); // ❌ ДАННЫЕ УТЕКУТ В ЧУЖОЙ ЗАПРОС!
    }
}
```

### Почему так делать нельзя?
В Hyperf все контроллеры являются **синглтонами (Singleton)**:
* Экземпляр контроллера создается один раз при старте сервера и существует непрерывно.
* Тысячи параллельных корутин-запросов одновременно вызывают методы **одного и того же экземпляра** контроллера.
* Если сохранить данные одного пользователя в `$this->currentUser`, соседний параллельный запрос другого пользователя перезапишет или прочитает эти данные!

### Как правильно?
1. Передавать данные через аргументы методов сервисов;
2. Сохранять контекст в корутинном хранилище: `Hyperf\Context\Context::set('user', $user)`.

> **Примечание о безопасности `RequestInterface` и `ResponseInterface`:**
> Вы можете безопасно внедрять `RequestInterface` и `ResponseInterface` в свойства контроллера через `#[Inject]` или конструктор. Классы `Hyperf\HttpServer\Request` и `Response` являются прокси-объектами, которые внутри себя прозрачно считывают актуальный PSR-7 объект текущей корутины из `Context`.
