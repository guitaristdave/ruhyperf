---
sourcePath: "en/annotation.md"
---

# Атрибуты и аннотации (Annotations / Attributes)

## Концепция

Атрибуты (введенные нативно в PHP 8.0) и аннотации предоставляют возможность добавлять структурированные машиночитаемые метаданные к объявлениям в коде: классам, методам, свойствам и параметрам.

В Hyperf метаданные атрибутов инспектируются при старте приложения с помощью механизма Reflection (рефлексии) и используются как декларативный язык конфигурации, избавляя от необходимости создавать громоздкие конфигурационные файлы.

### Как это работает в Hyperf?

1. При запуске приложения сканер классов анализирует исходный код проекта.
2. Все объявленные атрибуты и их параметры сохраняются в центральное хранилище — `Hyperf\Di\Annotation\AnnotationCollector`.
3. Компоненты фреймворка (роутер, контейнер DI, слушатели событий, планировщик задач) считывают данные из `AnnotationCollector` и автоматически регистрируют маршруты, зависимости и слушатели.

---

## Области применения атрибутов

В Hyperf атрибуты могут применяться на трех уровнях:

### 1. На уровне класса (Class level)
Атрибут указывается непосредственно над ключевым словом `class`.
Примеры: `#[Controller]`, `#[AutoController]`, `#[Aspect]`.

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\HttpServer\Annotation\AutoController;

#[AutoController]
class UserController
{
}
```

### 2. На уровне метода (Method level)
Атрибут указывается над объявлением метода.
Примеры: `#[GetMapping]`, `#[PostMapping]`, `#[RequestMapping]`.

```php
<?php
use Hyperf\HttpServer\Annotation\GetMapping;

class UserController
{
    #[GetMapping(path: '/user/profile')]
    public function profile()
    {
    }
}
```

### 3. На уровне свойства (Property level)
Атрибут указывается над свойством класса.
Примеры: `#[Inject]`, `#[Value]`.

```php
<?php
use Hyperf\Di\Annotation\Inject;
use Hyperf\Config\Annotation\Value;
use App\Service\UserService;

class UserController
{
    #[Inject]
    private UserService $userService;

    #[Value('app_name')]
    private string $appName;
}
```

---

## Передача параметров в атрибуты

Благодаря поддержке именованных аргументов PHP 8:
* Одиночный позиционный параметр: `#[GetMapping('/users')]`
* Именованные параметры: `#[RequestMapping(path: '/users', methods: ['GET', 'POST'])]`
* Массивы и вложенные структуры: `#[Middleware(FooMiddleware::class, priority: 10)]`

---

## Игнорирование определенных атрибутов

Если в проекте используются сторонние анализаторы кода (например, атрибуты PhpStorm `#[ArrayShape]`), чтобы сканер Hyperf не тратил ресурсы на их парсинг, их можно добавить в список исключений в `config/autoload/annotations.php`:

```php
<?php
use JetBrains\PhpStorm\ArrayShape;

return [
    'scan' => [
        'ignore_annotations' => [
            ArrayShape::class,
        ],
    ],
];
```

---

## Создание собственных атрибутов (Custom Attributes)

Вы можете легко создавать собственные атрибуты для вашей бизнес-логики (например, метки доступа, кэширования или аудита).

### 1. Создание класса атрибута

Класс атрибута должен иметь нативный атрибут `#[Attribute]` и наследовать `Hyperf\Di\Annotation\AbstractAnnotation`:

```php
<?php
declare(strict_types=1);

namespace App\Annotation;

use Attribute;
use Hyperf\Di\Annotation\AbstractAnnotation;

#[Attribute(Attribute::TARGET_CLASS | Attribute::TARGET_METHOD)]
class AuditLog extends AbstractAnnotation
{
    public function __construct(public string $action = '')
    {
    }
}
```

### 2. Использование своего атрибута

```php
#[AuditLog(action: 'user_delete')]
public function delete(int $id)
{
    // ...
}
```

### 3. Получение метаданных из `AnnotationCollector`

В любом месте приложения (например, в [Аспекте AOP](aop) или Middleware) можно получить метаданные атрибута:

```php
use Hyperf\Di\Annotation\AnnotationCollector;
use App\Annotation\AuditLog;

// Получить атрибуты метода класса
$annotation = AnnotationCollector::getClassMethodAnnotation(
    $className, 
    $methodName
)[AuditLog::class] ?? null;

if ($annotation) {
    echo $annotation->action; // 'user_delete'
}
```
