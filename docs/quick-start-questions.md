---
sourcePath: "en/quick-start/questions.md"
---

# Часто задаваемые вопросы (FAQ)

В этом разделе собраны типовые ошибки и решения наиболее частых проблем при разработке на Hyperf.

---

## 1. Ошибка: Swoole short function names must be disabled

```text
[ERROR] Swoole short function names must be disabled before the server starts, please set swoole.use_shortname = 'Off' in your php.ini.
```

**Причина:** Hyperf использует собственные хелперы корутин и требует отключения глобальных коротких функций Swoole (`go()`, `co()`).

**Решение:** Добавьте в файл `php.ini` следующую строку:
```ini
swoole.use_shortname = 'Off'
```
> *Обратите внимание: эта настройка должна быть задана именно в `php.ini` (изменение через `ini_set()` в коде не сработает).*

Либо передайте параметр через флаг `-d` при запуске:
```bash
php -d swoole.use_shortname=Off bin/hyperf.php start
```

---

## 2. Потеря сообщений в асинхронных очередях (async-queue)

Если метод `handle()` в задаче `async-queue` не выполняется:

1. **Проверьте, не разделяется ли Redis с другим проектом.** Если несколько проектов используют одну и ту же БД Redis и один канал (channel), задачи может забирать другой проект.
2. **Проверьте старые незавершенные процессы.** Возможно, в фоне остался старый Worker, который перехватывает сообщения.

**Решение:**
1. Завершите зависшие процессы: `killall php`.
2. Измените имя канала очереди `channel` в файле `config/autoload/async_queue.php`.

---

## 3. Ошибка Swoole\Error: API must be called in the coroutine при работе с AMQP

В конфигурационном файле `config/autoload/amqp.php` установите параметр:
```php
'close_on_destruct' => false,
```

---

## 4. Все запросы возвращают 404 при использовании компонента View

Если при подключении шаблонизаторов (компонент `view`) все запросы отдают 404:
Удалите параметр `static_handler_locations` из `config/autoload/server.php`. Если там указан путь `/`, Swoole пытается интерпретировать каждый HTTP-запрос как обращение к статическому файлу на диске.

---

## 5. Изменения в коде не применяются

1. Выполните команду обновления автозагрузчика:
   ```bash
   composer dump-autoload -o
   ```
2. Убедитесь, что в файле `.env` или `config/config.php` параметр `SCAN_CACHEABLE` установлен в `false` для среды разработки. Если включен `scan_cacheable = true`, Hyperf берет структуру классов из кэша.

---

## 6. Ошибка нехватки памяти (memory_limit)

По умолчанию лимит памяти в PHP часто равен `128M`. Во время сканирования классов с помощью `BetterReflection` на больших проектах может потребоваться больше памяти:

```bash
# Запуск с отключенным лимитом памяти
php -d memory_limit=-1 bin/hyperf.php start
```
Или измените директиву в `php.ini`:
```ini
memory_limit = -1
```

---

## 7. Консольная команда (Command) не завершается

Если в консольной команде Hyperf использовались клиенты с пулами соединений или мультиплексированием (например, AMQP), корутинный цикл ожидает выхода воркера.

Для корректного завершения добавьте в конце команды:
```php
use Hyperf\Coordinator\CoordinatorManager;
use Hyperf\Coordinator\Constants;

CoordinatorManager::until(Constants::WORKER_EXIT)->resume();
```

---

## 8. Несоответствие версий Swoole при установке и запуске

Ошибка вида:
```text
Hyperf\Engine\Channel::push(mixed $data, float $timeout = -1): bool must be compatible with Swoole\Coroutine\Channel::push($data, $timeout = -1)
```

**Причина:** Версия расширения Swoole, под которой выполнялся `composer install`, отличается от версии Swoole в PHP, под которым проект запускается (например, разные версии CLI или окружение в Docker и хосте).

**Решение:** Убедитесь, что версия PHP и Swoole одинаковы на этапах сборки и запуска.
