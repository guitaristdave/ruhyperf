---
sourcePath: "en/upgrade/3.0.md"
---

# Руководство по обновлению до 3.0

## Ключевые изменения в версии 3.0

- Минимальная поддерживаемая версия PHP повышена до **PHP 8.0**.
- Полный отказ от докблоков Doctrine Annotations (`@Annotation`) в пользу **нативных атрибутов PHP 8** (`#[Attribute]`).
- Добавлена строгая типизация свойств классов и параметров методов по всему фреймворку.

---

## 1. Автоматическая конвертация аннотаций в атрибуты

> **Важно**: Этот шаг выполняется ещё в проекте на базе Hyperf 2.2 перед переключением версии зависимостей!

Установите генератор кода и сконвертируйте аннотации во всем каталоге `app`:

```bash
composer require hyperf/code-generator --dev
php bin/hyperf.php code:generate -D app
```

---

## 2. Обновление версий компонентов

В файле `composer.json` измените версии всех пакетов `hyperf/*` на `3.0.*`:

> Пакет `hyperf/engine` не привязан к общей версии фреймворка, для него должна быть указана версия `^2.1.0`.

Затем запустите обновление:

```bash
composer update "hyperf/*" -o
```

---

## 3. Обновление моделей базы данных

Поскольку базовый класс моделей ORM теперь содержит строгую типизацию полей, перегенерируйте модели:

```bash
php vendor/bin/regenerate-models.php $PWD/app/Model
```

---

## 4. Логирование (Monolog 3.x)

Библиотека `monolog/monolog` 3.x использует новые возможности PHP 8.1. В кастомных процессорах логов обновите сигнатуру метода `__invoke` с `array $record` на `array|LogRecord $record`:

```php
use Monolog\LogRecord;
use Monolog\Processor\ProcessorInterface;

class AppendRequestIdProcessor implements ProcessorInterface
{
    public function __invoke(array|LogRecord $record)
    {
        $record['extra']['request_id'] = Context::getOrSet('request_id', uniqid());
        return $record;
    }
}
```

---

## 5. Выполнение консольных команд

В версии 3.0 при выполнении команд CLI диспетчер событий включен по умолчанию. Если слушатель событий выполняет долгие операции с AMQP или другими постоянными соединениями, процесс команды может не завершаться.

Решения:
- Запускать команду с флагом `--disable-event-dispatcher`.
- Либо добавить слушатель `AfterExecute`, завершающий координатор выхода (`CoordinatorManager::until(Constants::WORKER_EXIT)->resume()`).

---

## 6. gRPC Server

В соответствии со спецификацией gRPC HTTP-статус ответов gRPC Server приведен к `200 OK`, а реальный статус ошибки передается в заголовке `grpc-status`.
