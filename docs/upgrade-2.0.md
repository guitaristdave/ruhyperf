---
sourcePath: "en/upgrade/2.0.md"
---

# Руководство по обновлению до 2.0

## Ключевые изменения в версии 2.0

- Минимальные требования к Swoole повышены до **Swoole >= 4.5+**.
- Полный рефакторинг движка AOP: устранена необходимость использования bash-скрипта `init-proxy.sh`.
- Добавлен кэш сканирования аннотаций для мгновенного старта приложений в production.

---

## 1. Точка входа приложения: инициализация ClassLoader

В файле `bin/hyperf.php` добавьте вызов `Hyperf\Di\ClassLoader::init();` первой строкой анонимной функции запуска:

```php
(function () {
    Hyperf\Di\ClassLoader::init();

    $container = require BASE_PATH . '/config/container.php';
    $application = $container->get(\Hyperf\Contract\ApplicationInterface::class);
    $application->run();
})();
```

Аналогичный вызов добавьте в `tests/bootstrap.php`.

---

## 2. Изменения в composer.json

Удалите вызов `"init-proxy.sh"` из секции `scripts.post-autoload-dump` и замените его очисткой директории прокси: `"rm -rf runtime/container"`.

Обновите версии пакетов `hyperf/*` до `~2.0.0`, а `phpstan/phpstan` — до `^0.12`.

---

## 3. Оптимизация Dockerfile и кэширование аннотаций

В `Dockerfile` добавьте переменные окружения и предварительный прогрев кэша:

```dockerfile
ENV APP_ENV=prod \
    SCAN_CACHEABLE=(true)

COPY . /opt/www
RUN composer install --no-dev -o && php bin/hyperf.php
```

В файле `config/config.php` добавьте параметры:

```php
return [
    'app_env' => env('APP_ENV', 'dev'),
    'scan_cacheable' => env('SCAN_CACHEABLE', false),
];
```

---

## 4. Обработка исключений маршрутизации (HttpExceptionHandler)

В версии 2.0 ошибки 404 (Not Found) и 405 (Method Not Allowed) вызывают исключение `HttpException`. Добавьте обработчик `HttpExceptionHandler` в `config/autoload/exceptions.php` перед `AppExceptionHandler`:

```php
return [
    'handler' => [
        'http' => [
            Hyperf\HttpServer\Exception\Handler\HttpExceptionHandler::class,
            App\Exception\Handler\AppExceptionHandler::class,
        ],
    ],
];
```

---

## 5. Изменения в gRPC Client

Базовые методы клиента gRPC переименованы с префиксом подчеркивания во избежание конфликтов имен RPC-методов:
- `simpleRequest` -> `_simpleRequest`
- `clientStreamRequest` -> `_clientStreamRequest`
- `getGrpcClient` -> `_getGrpcClient`
