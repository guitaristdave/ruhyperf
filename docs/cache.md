---
sourcePath: "en/cache.md"
---

# Кэширование (Cache)

Пакет [hyperf/cache](https://github.com/hyperf/cache) предоставляет:
1. Кэширование на базе **AOP-аспектов и PHP-атрибутов** над методами классов;
2. Реализацию стандарта **[PSR-16](https://www.php-fig.org/psr/psr-16/) (Simple Cache)** (`Psr\SimpleCache\CacheInterface`).

---

## Установка и конфигурация

```bash
composer require hyperf/cache
```

Конфигурационный файл `config/autoload/cache.php`:

```php
<?php
return [
    'default' => [
        'driver' => Hyperf\Cache\Driver\RedisDriver::class,
        'packer' => Hyperf\Codec\Packer\PhpSerializerPacker::class,
        'prefix' => 'c:',
        'skip_cache_results' => [],
    ],
];
```

---

## 1. Кэширование через стандарт PSR-16 (Simple Cache)

Для прямого программного взаимодействия с кэшем внедрите `Psr\SimpleCache\CacheInterface`:

```php
use Psr\SimpleCache\CacheInterface;

class ReportService
{
    public function __construct(private CacheInterface $cache)
    {
    }

    public function getMetrics(): array
    {
        // Проверяем наличие ключа в кэше
        if ($this->cache->has('system_metrics')) {
            return $this->cache->get('system_metrics');
        }

        $metrics = $this->calculateHeavyMetrics();
        // Сохраняем в кэш на 1 час (3600 сек)
        $this->cache->set('system_metrics', $metrics, 3600);

        return $metrics;
    }
}
```

---

## 2. Декларативное кэширование через PHP-атрибуты

Самый мощный и удобный способ — аннотирование методов сервисов атрибутами кэша.

### Атрибут `#[Cacheable]` (Автоматическое чтение и запись)

При первом вызове метод выполняется и сохраняет результат в Redis. При последующих вызовах метод **не исполняется**, а результат мгновенно возвращается из кэша:

```php
<?php
declare(strict_types=1);

namespace App\Service;

use App\Model\User;
use Hyperf\Cache\Annotation\Cacheable;

class UserService
{
    // prefix - префикс ключа
    // ttl - время жизни в секундах
    // listener - имя события для инвалидации
    #[Cacheable(prefix: 'user', ttl: 7200, listener: 'user-update')]
    public function getUser(int $id): ?array
    {
        $user = User::query()->find($id);
        return $user?->toArray();
    }

    // Кастомный ключ с использованием свойств аргументов через #{}:
    #[Cacheable(prefix: 'user_profile', value: '_#{user.id}', ttl: 3600)]
    public function getProfile(User $user): array
    {
        return ['name' => $user->name, 'orders' => $user->orders()->count()];
    }
}
```

---

### Атрибут `#[CacheAhead]` (Защита от пробоя кэша — Cache Avalanche)

Когда одновременно истекает кэш горячих данных, сотни параллельных запросов могут одномоментно ударить в базу данных. 

Атрибут `#[CacheAhead]` заблаговременно обновляет кэш в фоне за `aheadSeconds` секунд до его истечения:

```php
use Hyperf\Cache\Annotation\CacheAhead;

// TTL = 7200 сек. За 600 сек до истечения первый же запрос асинхронно прогреет кэш
#[CacheAhead(prefix: 'hot_news', ttl: 7200, aheadSeconds: 600, lockSeconds: 10)]
public function getHotNews(): array
{
    return News::query()->orderByDesc('views')->limit(10)->get()->toArray();
}
```

---

### Атрибут `#[CachePut]` (Принудительное обновление)

В отличие от `Cacheable`, метод с `#[CachePut]` **всегда выполняется**, а возвращенный им результат перезаписывает значение в кэше:

```php
use Hyperf\Cache\Annotation\CachePut;

#[CachePut(prefix: 'user', ttl: 7200, value: '_#{id}')]
public function updateUser(int $id, array $data): array
{
    $user = User::query()->findOrFail($id);
    $user->update($data);
    return $user->toArray();
}
```

---

### Атрибут `#[CacheEvict]` (Инвалидация и удаление)

Удаляет указанный ключ из кэша после успешного выполнения метода:

```php
use Hyperf\Cache\Annotation\CacheEvict;

#[CacheEvict(prefix: 'user', value: '_#{id}')]
public function deleteUser(int $id): bool
{
    User::destroy($id);
    return true;
}
```

#### Очистка через событие `DeleteListenerEvent`:
Если метод помечен `#[Cacheable(..., listener: 'user-update')]`, сбросить кэш можно программно через вызов события:

```php
use Hyperf\Cache\Listener\DeleteListenerEvent;
use Psr\EventDispatcher\EventDispatcherInterface;

$dispatcher->dispatch(new DeleteListenerEvent('user-update', [$userId]));
```

---

## Поддерживаемые драйверы кэша

В `config/autoload/cache.php` можно объявить несколько групп кэша с разными драйверами:

1. **`RedisDriver`** (по умолчанию) — распределенный кэш в Redis.
2. **`MemoryDriver`** — локальный кэш в памяти текущего Worker-процесса (сверхбыстрый, но не разделяется между разными Worker-процессами).
3. **`CoroutineMemoryDriver`** — кэш в рамках контекста текущей корутины (`Context`). Идеален, когда в рамках одного сложного HTTP-запроса один и тот же метод вызывается в разных местах десятки раз: данные будут загружены из Redis/БД ровно один раз, а в конце запроса память автоматически освободится:

```php
// config/autoload/cache.php
'co' => [
    'driver' => Hyperf\Cache\Driver\CoroutineMemoryDriver::class,
    'packer' => Hyperf\Codec\Packer\PhpSerializerPacker::class,
],

// Использование:
#[Cacheable(prefix: 'request_auth', group: 'co')]
public function getCurrentPermissions(): array
{
    // Будет выполнен только 1 раз за весь HTTP-запрос
}
```
