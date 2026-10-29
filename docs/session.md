---
sourcePath: "en/session.md"
---

# Сессии (Session)

Протокол HTTP не сохраняет состояние (stateless). Для сохранения пользовательского контекста между последовательными запросами браузера в Hyperf используется компонент [hyperf/session](https://github.com/hyperf/session).

---

## Установка и настройка

```bash
composer require hyperf/session
php bin/hyperf.php vendor:publish hyperf/session
```

### 1. Подключение глобального middleware:
В файле `config/autoload/middlewares.php` обязательно добавьте `SessionMiddleware`:

```php
<?php
return [
    'http' => [
        \Hyperf\Session\Middleware\SessionMiddleware::class,
    ],
];
```

### 2. Выбор драйвера хранилища (`config/autoload/session.php`):

Компонент поддерживает два драйвера:
1. **Файловый драйвер (`FileHandler`)** — сохраняет сессии в локальные файлы `runtime/session/`. Подходит для локальной разработки.
2. **Драйвер Redis (`RedisHandler`)** — сохраняет сессии в Redis. **Настоятельно рекомендуется для продакшена**, так как обеспечивает сверхвысокую скорость и позволяет разделять сессии между несколькими нодами кластера:

```php
<?php
return [
    'handler' => Hyperf\Session\Handler\RedisHandler::class,
    'options' => [
        'connection' => 'default',
    ],
];
```

---

## Использование сессий

Для работы с сессией внедрите контракт `Hyperf\Contract\SessionInterface`:

```php
<?php
declare(strict_types=1);

namespace App\Controller;

use Hyperf\Contract\SessionInterface;
use Hyperf\HttpServer\Annotation\AutoController;

#[AutoController]
class AuthController
{
    public function __construct(private SessionInterface $session)
    {
    }

    public function login(): array
    {
        // 1. Сохранение данных в сессию:
        $this->session->set('user_id', 42);
        $this->session->set('username', 'Alex');

        // Получить ID сессии:
        $sessionId = $this->session->getId();

        return ['status' => 'logged_in', 'session_id' => $sessionId];
    }

    public function profile(): array
    {
        // 2. Проверка наличия ключа:
        if (! $this->session->has('user_id')) {
            return ['error' => 'Не авторизован'];
        }

        // 3. Получение значения (со значением по умолчанию):
        $userId = $this->session->get('user_id');
        $username = $this->session->get('username', 'Аноним');

        // 4. Получить все данные сессии:
        $all = $this->session->all();

        return compact('userId', 'username');
    }

    public function logout(): string
    {
        // 5. Удалить одно или несколько значений:
        $this->session->forget('user_id');
        $this->session->forget(['username', 'role']);

        // Либо полностью очистить сессию:
        $this->session->clear();

        return 'Вы вышли из системы';
    }
}
```

> **Безопасность корутин:** Объект `SessionInterface` безопасно внедрять через конструктор в синглтоны. Он является корутино-безопасным прокси и всегда обращается к сессии текущей корутины (запроса).
