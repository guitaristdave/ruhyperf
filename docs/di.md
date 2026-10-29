---
sourcePath: "en/di.md"
---

# Внедрение зависимостей (Dependency Injection)

## Введение

Hyperf по умолчанию использует компонент [hyperf/di](https://github.com/hyperf/di) в качестве контейнера внедрения зависимостей (IoC / DI). Архитектура Hyperf позволяет заменить контейнер на любую реализацию стандарта [PSR-11](https://www.php-fig.org/psr/psr-11/), однако мы **настоятельно не рекомендуем** этого делать, поскольку именно `hyperf/di` обеспечивает поддержку атрибутов PHP 8 и глубокую интеграцию с механизмом AOP (аспектно-ориентированного программирования).

### Ключевые возможности `hyperf/di`:
* Оптимизирован для долгоживущих процессов (CLI / микросервисы);
* Автоматическое связывание зависимостей через конструктор (Auto-wiring);
* Внедрение через PHP-атрибуты (`#[Inject]`, `#[Value]`);
* Поддержка фабрик и интерфейсных привязок;
* Ленивая загрузка зависимостей (Lazy Loading);
* Полноценная поддержка [AOP (Аспектов)](aop).

---

## Способы внедрения объектов

### 1. Простое внедрение объектов

В большинстве случаев Hyperf автоматически определяет типы аргументов и внедряет нужные экземпляры без необходимости ручной конфигурации.

Предположим, у нас есть сервис:
```php
<?php
namespace App\Service;

class UserService
{
    public function getInfoById(int $id): array
    {
        return ['id' => $id, 'name' => 'Hyperf User'];
    }
}
```

#### Внедрение через конструктор (рекомендуемый способ)

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\UserService;
use Hyperf\HttpServer\Annotation\AutoController;

#[AutoController]
class IndexController
{
    // PHP 8 Constructor Promotion: объявление и автоматическое внедрение
    public function __construct(private UserService $userService)
    {
    }

    public function index(): array
    {
        return $this->userService->getInfoById(1);
    }
}
```

> **Важно:** Внедрение зависимостей работает только для тех объектов, которые сами были созданы через DI-контейнер (контроллеры, слушатели событий, команды, middleware).

#### Опциональные зависимости (Nullable)

Если параметр конструктора помечен как `nullable` (или имеет значение по умолчанию `null`), контейнер не будет выбрасывать исключение при отсутствии зависимости, а передаст `null`:

```php
public function __construct(private ?UserService $userService = null)
{
}
```

---

#### Внедрение через атрибут `#[Inject]`

Внедрение в свойства класса позволяет не загромождать конструктор, особенно в контроллерах:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use App\Service\UserService;
use Hyperf\Di\Annotation\Inject;
use Hyperf\HttpServer\Annotation\AutoController;

#[AutoController]
class IndexController
{
    #[Inject]
    private UserService $userService;

    public function index(): array
    {
        return $this->userService->getInfoById(1);
    }
}
```

##### Необязательные зависимости (`required: false`)
По умолчанию `#[Inject]` требует обязательного наличия класса. Если класс опционален:
```php
#[Inject(required: false)]
private ?UserService $userService = null;
```

---

### 2. Внедрение интерфейсов (Abstract Injection)

Согласно принципам чистой архитектуры, контроллеры и сервисы должны зависеть от интерфейсов, а не от конкретных реализаций.

1. **Определяем интерфейс**:
   ```php
   namespace App\Service;

   interface UserServiceInterface
   {
       public function getInfoById(int $id): array;
   }
   ```

2. **Создаем реализацию**:
   ```php
   namespace App\Service;

   class UserService implements UserServiceInterface
   {
       public function getInfoById(int $id): array
       {
           return ['id' => $id, 'name' => 'Hyperf User'];
       }
   }
   ```

3. **Связываем интерфейс с реализацией** в файле `config/autoload/dependencies.php`:
   ```php
   <?php
   return [
       \App\Service\UserServiceInterface::class => \App\Service\UserService::class,
   ];
   ```

Теперь в любом месте можно запрашивать `UserServiceInterface`, а контейнер автоматически подставит `UserService`:

```php
#[Inject]
private UserServiceInterface $userService;
```

---

### 3. Фабричное внедрение (Factory Injection)

Если создание объекта требует сложной логики (чтение конфигов, динамические параметры соединения):

1. **Создаем фабрику с методом `__invoke()`**:
   ```php
   <?php
   namespace App\Service;

   use Psr\Container\ContainerInterface;
   use Hyperf\Contract\ConfigInterface;

   class UserServiceFactory
   {
       public function __invoke(ContainerInterface $container, array $parameters = []): UserService
       {
           $config = $container->get(ConfigInterface::class);
           $enableCache = (bool) $config->get('cache.enable', false);

           // Функция make() создает объект с поддержкой AOP
           return make(UserService::class, compact('enableCache'));
       }
   }
   ```

2. **Привязываем фабрику** в `config/autoload/dependencies.php`:
   ```php
   <?php
   return [
       \App\Service\UserServiceInterface::class => \App\Service\UserServiceFactory::class,
   ];
   ```

---

### 4. Ленивая загрузка (Lazy Loading)

При старте Hyperf создает долгоживущие объекты. Однако:
* В момент выполнения конструктора сервис еще не находится в корутинном окружении. Если конструктор инициирует сетевой вызов (I/O), сервер не сможет запуститься.
* Могут возникнуть циклические зависимости (например, между `Listener` и `EventDispatcherInterface`).

Для решения этой проблемы Hyperf поддерживает **ленивую загрузку**: вместо реального объекта внедряется легкий прокси-объект, а реальный экземпляр инициализируется только в момент первого фактического обращения к его методу или свойству:

```php
use Hyperf\Di\Annotation\Inject;
use App\Service\UserServiceInterface;

class OrderController
{
    #[Inject(lazy: true)]
    private UserServiceInterface $userService;

    public function show()
    {
        // Реальный сервис будет создан ТОЛЬКО ЗДЕСЬ, при первом вызове:
        return $this->userService->getInfoById(1);
    }
}
```

---

## Создание короткоживущих объектов: `make()`

Объекты, созданные через `new ClassName()`, не управляются DI-контейнером и не могут быть перехвачены механизмами AOP (аспектами).

Если вам нужно создать новый объект (например, сущность или модель) с передачей параметров в конструктор, но при этом задействовать DI для остальных зависимостей и сохранить работу AOP:

```php
// make(string $name, array $parameters = [])
$userService = make(UserService::class, ['enableCache' => true]);
```

---

## Прямой доступ к контейнеру (ContainerInterface)

В редких случаях требуется прямой доступ к контейнеру. Получить его можно двумя путями:

1. **Внедрение через конструктор или `#[Inject]`**:
   ```php
   use Psr\Container\ContainerInterface;

   public function __construct(private ContainerInterface $container)
   {
   }
   ```

2. **Статический доступ через `ApplicationContext`**:
   ```php
   use Hyperf\Context\ApplicationContext;

   $container = ApplicationContext::getContainer();
   $service = $container->get(UserServiceInterface::class);
   ```

---

## ⚠️ Важное правило: синглтоны и состояние

* Контейнер DI управляет **долгоживущими объектами-синглтонами**.
* Синглтоны **не должны хранить состояние конкретного запроса** в свойствах объекта.
* Данные запроса должны передаваться через параметры методов либо сохраняться в контексте корутины ([Context](coroutine)).
