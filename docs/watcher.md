---
sourcePath: "en/watcher.md"
---

# Hot Reload (Watcher)

Начиная с версии 2.0, Hyperf использует `BetterReflection` для сканирования абстрактного синтаксического дерева (AST) и данных рефлексии классов.

> При первом запуске приложения сканирование выполняется дольше из-за отсутствия кэша. Последующие запуски ускоряются, однако инстанцирование BetterReflection всё равно занимает некоторое время.

Компонент `Watcher` предназначен для автоматического перезапуска приложения сразу после изменения файлов исходного кода («горячая перезагрузка» / Hot Reload).

> Этот компонент предназначен исключительно для окружения разработки. Не используйте его на production-серверах!

## Установка

```bash
composer require hyperf/watcher --dev
```

## Конфигурация

### Публикация конфигурации

```bash
php bin/hyperf.php vendor:publish hyperf/watcher
```

### Параметры конфигурации

| Параметр | По умолчанию | Описание |
| :---: | :---: | :---: |
| `driver` | `ScanFileDriver` | Драйвер отслеживания файлов |
| `bin` | `PHP_BINARY` | Команда для запуска PHP, например: `php -d swoole.use_shortname=Off` |
| `watch.dir` | `app`, `config` | Отслеживаемые директории |
| `watch.file` | `.env` | Отслеживаемые файлы |
| `watch.interval` | `2000` | Интервал опроса в миллисекундах (при poll-драйвере) |
| `ext` | `.php`, `.env` | Расширения файлов для отслеживания |

## Поддерживаемые драйверы

| Драйвер | Примечание |
| :---: | :---: |
| `Hyperf\Watcher\Driver\ScanFileDriver` | Работает без сторонних утилит и расширений |
| `Hyperf\Watcher\Driver\FswatchDriver` | Требует установленной утилиты `fswatch` (рекомендуется для macOS/Linux) |
| `Hyperf\Watcher\Driver\FindDriver` | Требует утилиты `find` (на macOS требуется `gfind`) |
| `Hyperf\Watcher\Driver\FindNewerDriver` | Требует утилиты `find` |

### Установка fswatch

На macOS:

```bash
brew install fswatch
```

На Ubuntu/Debian:

```bash
apt-get install fswatch
```

Сборка из исходников:

```bash
wget https://github.com/emcrisostomo/fswatch/releases/download/1.14.0/fswatch-1.14.0.tar.gz \
&& tar -xf fswatch-1.14.0.tar.gz \
&& cd fswatch-1.14.0/ \
&& ./configure \
&& make \
&& make install
```

## Запуск

Команду запуска необходимо выполнять из корневой директории проекта:

```bash
php bin/hyperf.php server:watch
```

## Использование в Docker

При запуске в Docker укажите точку входа в `Dockerfile`:

```dockerfile
ENTRYPOINT ["php", "/opt/www/bin/hyperf.php", "server:watch"]
```

## Особенности и ограничения

- Удаление файлов или изменение конфигурации `.env` может потребовать ручного перезапуска сервера.
- В образах на базе Alpine Linux могут возникать задержки при отслеживании изменений через inotify/fswatch.
