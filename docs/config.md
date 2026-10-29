---
sourcePath: "en/config.md"
---

# Конфигурация (Configuration)

В проектах на базе Hyperf все конфигурационные файлы расположены в директории `config/` в корне проекта.

Компонент конфигурации реализует контракт `Hyperf\Contract\ConfigInterface` и поставляется в пакете [hyperf/config](https://github.com/hyperf/config).

---

## Структура файлов конфигурации

Стандартная структура каталога `config/`:

```text
config/
├── autoload/              # Файлы в этой папке загружаются автоматически
│   ├── amqp.php           # Настройки RabbitMQ (AMQP)
│   ├── annotations.php    # Настройки сканирования аннотаций
│   ├── aspects.php        # Регистрация AOP-аспектов
│   ├── async_queue.php    # Асинхронная очередь (Redis)
│   ├── cache.php          # Конфигурация драйверов кэша
│   ├── commands.php       # Регистрация консольных команд
│   ├── databases.php      # Подключения к базам данных (MySQL, Postgres и др.)
│   ├── dependencies.php   # Связывание интерфейсов и реализаций в DI
│   ├── exceptions.php     # Обработчики исключений (Exception Handlers)
│   ├── listeners.php      # Слушатели событий
│   ├── logger.php         # Каналы логирования (Monolog)
│   ├── middlewares.php    # Глобальные и серверные посредники
│   ├── redis.php          # Пул подключений Redis
│   └── server.php         # Настройки сетевого сервера Swoole/Swow (порты, воркеры)
├── config.php             # Пользовательские или общие настройки приложения
├── container.php          # Скрипт инициализации DI-контейнера
└── routes.php             # Конфигурация маршрутов HTTP-сервера
```

---

## Принцип работы `autoload/` и `config.php`

При старте сервера все файлы из каталога `autoload/` и файл `config.php` объединяются в единое многомерное дерево конфигурации:

* Имя файла в `config/autoload/` становится **ключом первого уровня**.
  * Например, ключ `timeout` в файле `config/autoload/client.php`:
    ```php
    // config/autoload/client.php
    return [
        'request' => ['timeout' => 10],
    ];
    ```
    Будет доступен по пути: `client.request.timeout`.
* Настройки из `config/config.php` попадают в корень конфигурации.

---

## Получение значений конфигурации

Hyperf предоставляет 3 удобных способа доступа к конфигурации:

### 1. Через объект `ConfigInterface` (рекомендуемый способ)
Внедрите `Hyperf\Contract\ConfigInterface` через конструктор:

```php
use Hyperf\Contract\ConfigInterface;

class OrderService
{
    public function __construct(private ConfigInterface $config)
    {
    }

    public function getTimeout(): int
    {
        // Доступ через точечную нотацию: $config->get('путь.к.ключу', значение_по_умолчанию)
        return (int) $this->config->get('client.request.timeout', 5);
    }
}
```

### 2. Через атрибут `#[Value]`
Позволяет внедрять конкретные конфигурационные параметры напрямую в свойства класса:

```php
use Hyperf\Config\Annotation\Value;

class OrderService
{
    #[Value('client.request.timeout')]
    private int $timeout = 5;

    #[Value('databases.default.host')]
    private string $dbHost;
}
```

### 3. Через глобальный хелпер `config()`
```php
$timeout = config('client.request.timeout', 5);
```

---

## Переменные окружения (.env)

Для разделения конфигурации между средами разработки, тестирования и продакшена Hyperf использует библиотеку [vlucas/phpdotenv](https://github.com/vlucas/phpdotenv) и файл `.env`.

> ⚠️ **Файл `.env` никогда не должен попадать в репозиторий Git!** В репозитории хранится только `.env.example`.

Все переменные из `.env` могут быть переопределены системными переменными окружения сервера или Docker-контейнера.

### Преобразование типов в `env()`:

| Значение в `.env` | Значение, возвращаемое `env()` |
|:------------------|:-------------------------------|
| `true`, `(true)`  | `(bool) true`                  |
| `false`, `(false)`| `(bool) false`                 |
| `empty`, `(empty)`| `(string) ""`                  |
| `null`, `(null)`  | `(null) null`                  |

### Лучшая практика использования `env()`:
Не вызывайте функцию `env()` напрямую в бизнес-логике или контроллерах. Всегда считывайте `env()` в конфигурационных файлах `config/autoload/*.php`, а в коде используйте `config()` или `ConfigInterface`:

```php
// config/autoload/redis.php
return [
    'default' => [
        'host' => env('REDIS_HOST', '127.0.0.1'),
        'port' => (int) env('REDIS_PORT', 6379),
    ],
];
```

---

## Центры распределенной конфигурации

Для микросервисных архитектур Hyperf поддерживает динамические центры конфигурации (с автоматическим обновлением значений в рантайме без перезапуска сервиса):
* **Apollo** (`hyperf/config-apollo`)
* **Nacos** (`hyperf/config-nacos`)
* **Aliyun ACM** (`hyperf/config-aliyun-acm`)
* **ETCD** (`hyperf/config-etcd`)
