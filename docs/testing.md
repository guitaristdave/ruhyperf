---
sourcePath: "en/testing.md"
---

# Автоматизированное тестирование (Testing)

Тестирование в Hyperf строится на базе популярного фреймворка **PHPUnit**. Однако, поскольку Hyperf работает в корутинном окружении Swoole / Swow, стандартный скрипт PHPUnit требует специальной корутинной обертки: для этого пакет `hyperf/testing` предоставляет утилиту **`co-phpunit`**.

---

## Установка и запуск

```bash
composer require --dev hyperf/testing
```

В файле `composer.json` настраивается команда вызова `co-phpunit`:

```json
"scripts": {
    "test": "co-phpunit -c phpunit.xml --colors=always"
}
```

Запуск тестов в консоли:
```bash
composer test
```

---

## Файл инициализации тестов (`tests/bootstrap.php`)

Перед запуском тестов `bootstrap.php` инициализирует DI-контейнер и включает корутинные хуки:

```php
<?php
declare(strict_types=1);

error_reporting(E_ALL);
date_default_timezone_set('UTC');

! defined('BASE_PATH') && define('BASE_PATH', dirname(__DIR__, 1));
! defined('SWOOLE_HOOK_FLAGS') && define('SWOOLE_HOOK_FLAGS', SWOOLE_HOOK_ALL);

Swoole\Runtime::enableCoroutine(true);

require BASE_PATH . '/vendor/autoload.php';

Hyperf\Di\ClassLoader::init();

$container = require BASE_PATH . '/config/container.php';
$container->get(Hyperf\Contract\ApplicationInterface::class);
```

---

## HTTP-тестирование без запуска сервера: `Hyperf\Testing\Client`

Пакет `hyperf/testing` предоставляет виртуальный HTTP-клиент `Hyperf\Testing\Client`. Он симулирует прохождение запроса через ядро Hyperf, middleware и контроллеры **напрямую в памяти**, без необходимости открывать сетевые порты или запускать фоновый веб-сервер.

### Пример интеграционного теста API:

```php
<?php
declare(strict_types=1);

namespace HyperfTest\Cases;

use Hyperf\Testing\Client;
use PHPUnit\Framework\TestCase;

class UserApiTest extends TestCase
{
    protected Client $client;

    public function setUp(): void
    {
        parent::setUp();
        // Создаем экземпляр виртуального HTTP-клиента
        $this->client = make(Client::class);
    }

    public function testGetUserInfo()
    {
        // Выполняем виртуальный GET-запрос:
        $response = $this->client->get('/api/users/1');

        $this->assertSame(200, $response['code'] ?? null);
        $this->assertSame('Alex', $response['data']['name'] ?? null);
    }

    public function testCreateUserValidation()
    {
        // Выполняем POST-запрос с JSON-телом:
        $response = $this->client->json('/api/users', [
            'email' => 'invalid-email',
            'name' => '',
        ]);

        // Ожидаем ошибку валидации 422
        $this->assertArrayHasKey('errors', $response);
    }

    public function testFileUpload()
    {
        // Тестирование загрузки файлов:
        $response = $this->client->file('/api/upload', [
            'name' => 'avatar',
            'file' => BASE_PATH . '/tests/fixtures/test.png',
        ]);

        $this->assertTrue($response['success']);
    }
}
```

---

## Преимущества тестирования в Hyperf

1. **Быстрая отладка бизнес-логики**: Вместо ручного перезапуска сервера в консоли и отправки запросов через Postman / cURL, достаточно запустить `composer test`, чтобы мгновенно проверить все сценарии.
2. **Полный доступ к контейнеру**: В тестах можно легко получать любые сервисы из контейнера (`ApplicationContext::getContainer()->get(...)`) или заменять их моками.
3. **Изоляция базы данных**: В тестах можно использовать транзакции для отката изменений в БД после каждого теста.
