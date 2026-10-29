---
sourcePath: "en/upgrade/1.1.md"
---

# Руководство по обновлению до 1.1

## Ключевые изменения в версии 1.1

- Минимальные системные требования к Swoole повышены до **Swoole >= 4.4+** (LTS).
- Оптимизирована структура директории `config/autoload/` и фабрика контейнера внедрения зависимостей.

---

## 1. Константа SWOOLE_HOOK_FLAGS

В файле `bin/hyperf.php` и тестовом бутстрапе `test/bootstrap.php` добавьте объявление:

```php
! defined('SWOOLE_HOOK_FLAGS') && define('SWOOLE_HOOK_FLAGS', SWOOLE_HOOK_ALL);
```

---

## 2. Перемещение config/dependencies.php

Файл `config/dependencies.php` перемещен в `config/autoload/dependencies.php`. Первый уровень ключа `'dependencies' => [...]` удален:

```php
<?php
// config/autoload/dependencies.php
return [
    FooInterface::class => Foo::class,
];
```

---

## 3. Обновление config/container.php

Используйте класс `DefinitionSourceFactory` для инициализации контейнера:

```php
<?php
declare(strict_types=1);

use Hyperf\Di\Container;
use Hyperf\Di\Definition\DefinitionSourceFactory;
use Hyperf\Utils\ApplicationContext;
use Psr\Container\ContainerInterface;

$container = new Container((new DefinitionSourceFactory(true))());
if (! $container instanceof ContainerInterface) {
    throw new RuntimeException('The dependency injection container is invalid.');
}
return ApplicationContext::setContainer($container);
```

---

## 4. Обновление контроллеров WebSocket

Сигнатура методов `onMessage` и `onOpen` принимает экземпляр `Swoole\WebSocket\Server` вместо базового Server:

```php
use Swoole\WebSocket\Server as WebSocketServer;
use Swoole\Websocket\Frame;
use Swoole\Http\Request;

public function onMessage(WebSocketServer $server, Frame $frame): void
public function onOpen(WebSocketServer $server, Request $request): void
```

---

## 5. Обновление версий пакетов в composer.json

Обновите зависимости `hyperf/*` с `~1.0.0` на `~1.1.0` и выполните `composer update`.
