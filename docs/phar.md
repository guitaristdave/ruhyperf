---
sourcePath: "en/phar.md"
---

# Сборка приложения в Phar (Phar Packager)

Компонент [hyperf/phar](https://github.com/hyperf/phar) позволяет упаковать всё приложение Hyperf вместе со всеми зависимостями vendor в единый исполняемый `.phar` архив.

## Установка

```bash
composer require hyperf/phar --dev
```

## Использование

### Сборка с настройками по умолчанию

```bash
php bin/hyperf.php phar:build
```

### Дополнительные параметры сборки

- Указание имени выходного phar-файла:

```bash
php bin/hyperf.php phar:build --name=your_project.phar
```

- Указание версии пакета:

```bash
php bin/hyperf.php phar:build --phar-version=1.0.1
```

- Указание входного исполняемого скрипта:

```bash
php bin/hyperf.php phar:build --bin=bin/hyperf.php
```

- Указание директории сборки:

```bash
php bin/hyperf.php phar:build --path=BASE_PATH
```

- Проброс внешних файлов (начиная с `hyperf/phar` >= v2.1.7):

Команда позволяет скомпилированному `.phar` пакету читать файл конфигурации `.env` из текущей рабочей директории рядом с архивом, что упрощает развертывание в различных средах:

```bash
php bin/hyperf.php phar:build -M .env
```

## Запуск скомпилированного архива

```bash
php your_project.phar start
```

## Важные замечания при запуске в режиме Phar

При запуске из `.phar` архива файловая система внутри phar доступна только для чтения (read-only). Поэтому внутренняя директория `runtime` внутри phar не может быть использована для записи логов и PID-файла.

Необходимо переопределить пути для записи во внешнюю директорию (например, `/tmp/runtime`):

### 1. PID файл

Измените настройки в `config/autoload/server.php`:

```php
<?php

return [
     'settings' => [
         'pid_file' => '/tmp/runtime/hyperf.pid',
     ],
];
```

### 2. Логирование

Измените пути к логам в `config/autoload/logger.php`:

```php
<?php
return [
     'default' => [
         'handler' => [
             'class' => Monolog\Handler\StreamHandler::class,
             'constructor' => [
                 'stream' => '/tmp/runtime/logs/hyperf.log',
                 'level' => Monolog\Logger::INFO,
             ],
         ],
     ],
];
```

### 3. Кэш сканирования классов (scan_cacheable)

При сборке phar-пакета сборщик автоматически устанавливает параметр `scan_cacheable` в значение `true` в файле `config/config.php` для быстрого старта без повторного сканирования AST.
