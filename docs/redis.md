---
sourcePath: "en/redis.md"
---

# Клиент Redis

Компонент `hyperf/redis` предоставляет корутинный клиент Redis со встроенным пулом соединений на базе расширения `ext-redis` (`phpredis`).

## Установка

```bash
composer require hyperf/redis
```

## Конфигурация

Публикация конфигурационного файла:

```bash
php bin/hyperf.php vendor:publish hyperf/redis
```

Файл `config/autoload/redis.php`:

| Параметр | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :--- |
| `host` | string | `'localhost'` | Хост сервера Redis |
| `auth` | string | `null` | Пароль подключения |
| `port` | int | `6379` | Порт сервера |
| `db` | int | `0` | Номер базы данных Redis |
| `cluster.enable` | bool | `false` | Режим кластера (Redis Cluster) |
| `cluster.name` | string | `null` | Имя кластера |
| `cluster.seeds` | array | `[]` | Узлы кластера в формате `['host:port']` |
| `pool` | array | `[...]` | Настройки пула соединений |
| `options` | array | `[]` | Опции клиента Redis (`\Redis::OPT_*`) |

Пример конфигурации:

```php
<?php

return [
    'default' => [
        'host' => env('REDIS_HOST', 'localhost'),
        'auth' => env('REDIS_AUTH', null),
        'port' => (int) env('REDIS_PORT', 6379),
        'db' => (int) env('REDIS_DB', 0),
        'cluster' => [
            'enable' => (bool) env('REDIS_CLUSTER_ENABLE', false),
            'name' => null,
            'seeds' => [],
        ],
        'pool' => [
            'min_connections' => 1,
            'max_connections' => 10,
            'connect_timeout' => 10.0,
            'wait_timeout' => 3.0,
            'heartbeat' => -1,
            'max_idle_time' => (float) env('REDIS_MAX_IDLE_TIME', 60),
        ],
        'options' => [
            \Redis::OPT_PREFIX => env('REDIS_PREFIX', ''),
        ],
    ],
];
```

## Базовое использование

Вы можете внедрить `Hyperf\Redis\Redis` через DI-контейнер или получить экземпляр напрямую:

```php
<?php

use Hyperf\Context\ApplicationContext;
use Hyperf\Redis\Redis;

$container = ApplicationContext::getContainer();
$redis = $container->get(Redis::class);

$redis->set('key', 'value', 3600);
$value = $redis->get('key');
```

## Несколько подключений к Redis

Для подключения к нескольким независимым серверам или базам данных добавьте новые пулы в `config/autoload/redis.php`:

```php
return [
    'default' => [
        'host' => '127.0.0.1',
        'port' => 6379,
        'db' => 0,
        // ...
    ],
    'cache' => [
        'host' => '127.0.0.1',
        'port' => 6379,
        'db' => 1,
        // ...
    ],
];
```

### Вариант 1: Через RedisFactory

```php
use Hyperf\Redis\RedisFactory;

class CacheService
{
    public function __construct(protected RedisFactory $redisFactory)
    {
    }

    public function getCacheValue(string $key)
    {
        $redis = $this->redisFactory->get('cache');
        return $redis->get($key);
    }
}
```

### Вариант 2: Через класс-прокси

```php
use Hyperf\Redis\Redis;

class CacheRedis extends Redis
{
    protected string $poolName = 'cache';
}

// Теперь CacheRedis можно внедрять через #[Inject]
```

## Режим Sentinel (Redis Sentinel)

Для настройки отказоустойчивого режима Sentinel укажите адреса узлов Sentinel через точку с запятой:

```php
return [
    'default' => [
        'host' => env('REDIS_HOST', 'localhost'),
        'auth' => env('REDIS_AUTH', null),
        'port' => (int) env('REDIS_PORT', 6379),
        'db' => (int) env('REDIS_DB', 0),
        'sentinel' => [
            'enable' => true,
            'master_name' => 'mymaster',
            'nodes' => [
                '192.168.1.10:26379',
                '192.168.1.11:26379',
            ],
            'persistent' => false,
            'read_timeout' => 30.0,
            'auth' => env('REDIS_SENTINEL_PASSWORD', ''),
        ],
        'pool' => [
            'min_connections' => 1,
            'max_connections' => 10,
        ],
    ],
];
```

## Режим кластера (Redis Cluster)

```php
return [
    'default' => [
        'cluster' => [
            'enable' => true,
            'name' => null,
            'seeds' => [
                '192.168.1.110:6379',
                '192.168.1.111:6379',
            ],
        ],
    ],
];
```

## Дополнительные опции

Например, включение встроенного PHP-сериализатора для сложных объектов:

```php
'options' => [
    \Redis::OPT_SERIALIZER => \Redis::SERIALIZER_PHP,
    \Redis::OPT_READ_TIMEOUT => -1,
],
```
