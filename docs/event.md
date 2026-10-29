---
sourcePath: "en/event.md"
---

# Диспетчер событий (Event Dispatcher)

## Введение

Механизм обработки событий в Hyperf строго следует стандарту [PSR-14](https://www.php-fig.org/psr/psr-14/) (Event Dispatcher). За реализацию отвечает компонент [hyperf/event](https://github.com/hyperf/event).

Событийная модель отлично подходит для декомпозиции бизнес-логики и уменьшения связанности модулей (low coupling).

### Ключевые роли:
* **Событие (Event)** — объект передачи состояния между вызывающим кодом и слушателями.
* **Слушатель (Listener)** — класс, ожидающий наступления определенных событий и выполняющий бизнес-логику при их возникновении.
* **Диспетчер событий (Event Dispatcher)** — сервис, ответственный за вызов и доставку событий зарегистрированным слушателям.

---

## Использование событийного механизма

### 1. Определение события (Event)

Событие — это обычный PHP-класс (DTO), инкапсулирующий данные произошедшего действия:

```php
<?php
declare(strict_types=1);

namespace App\Event;

use App\Model\User;

class UserRegistered
{
    public function __construct(public User $user)
    {
    }
}
```

---

### 2. Определение слушателя (Listener)

Слушатель реализует интерфейс `Hyperf\Event\Contract\ListenerInterface`:

```php
<?php
declare(strict_types=1);

namespace App\Listener;

use App\Event\UserRegistered;
use Hyperf\Event\Annotation\Listener;
use Hyperf\Event\Contract\ListenerInterface;
use Psr\Container\ContainerInterface;

#[Listener(priority: 1)]
class SendWelcomeEmailListener implements ListenerInterface
{
    public function __construct(private ContainerInterface $container)
    {
    }

    /**
     * Список событий, которые обрабатывает этот слушатель.
     * Один слушатель может подписаться на несколько событий.
     */
    public function listen(): array
    {
        return [
            UserRegistered::class,
        ];
    }

    /**
     * Обработка события.
     * @param UserRegistered $event
     */
    public function process(object $event): void
    {
        $user = $event->user;
        // Логика отправки приветственного письма пользователю $user
    }
}
```

#### Регистрация слушателей:
1. **Через атрибут `#[Listener]`** (рекомендуемый способ):
   Параметр `priority` задает порядок выполнения слушателей (чем выше число, тем раньше выполнится слушатель).
2. **Через конфигурационный файл `config/autoload/listeners.php`**:
   ```php
   <?php
   return [
       \App\Listener\SendWelcomeEmailListener::class,
   ];
   ```

---

### 3. Отправка (диспатч) события

Для запуска события внедрите интерфейс `Psr\EventDispatcher\EventDispatcherInterface` и вызовите метод `dispatch()`:

```php
<?php
declare(strict_types=1);

namespace App\Service;

use App\Event\UserRegistered;
use App\Model\User;
use Hyperf\Di\Annotation\Inject;
use Psr\EventDispatcher\EventDispatcherInterface;

class UserService
{
    #[Inject]
    private EventDispatcherInterface $eventDispatcher;

    public function register(array $data): User
    {
        $user = User::create($data);

        // Диспетчер по очереди вызовет всех зарегистрированных слушателей события UserRegistered
        $this->eventDispatcher->dispatch(new UserRegistered($user));

        return $user;
    }
}
```

---

## Диаграмма событий жизненного цикла Hyperf

![](/imgs/hyperf-events.svg)

---

## ⚠️ Важные предостережения

### 1. Не внедряйте `EventDispatcherInterface` в конструктор `Listener`
`EventDispatcherInterface` зависит от провайдера слушателей (`ListenerProviderInterface`), который инициализирует все слушатели. Если слушатель внедрит в свой конструктор `EventDispatcherInterface`, возникнет **циклическая зависимость** (Circular Dependency), приводящая к переполнению стека/памяти при старте.

### 2. Избегайте инициализации корутинных клиентов в конструкторе слушателя
Слушатели инстанциируются в момент запуска сервера, когда корутинное окружение еще не запущено. Если конструктор слушателя попытается обратиться к БД или Redis, запуск сервера завершится ошибкой.

**Решение:** Внедряйте зависимости в свойства через `#[Inject(lazy: true)]` либо получайте сервисы динамически из `$this->container->get(...)` внутри метода `process()`.
