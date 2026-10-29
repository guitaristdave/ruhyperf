---
sourcePath: "en/consul.md"
---

# Клиент Consul

Hyperf предоставляет полнофункциональный корутинный клиент для [Consul](https://www.consul.io/) на базе компонента `hyperf/consul`.

Все HTTP-запросы к Consul выполняются в неблокирующем режиме через `hyperf/guzzle`.

## Установка

```bash
composer require hyperf/consul
```

## Доступные интерфейсы и модули

Результат большинства вызовов возвращает объект ответа `Hyperf\Consul\ConsulResponse`.

### 1. Хранилище ключ-значение (KV)

Реализует интерфейс `Hyperf\Consul\KVInterface` (`Hyperf\Consul\KV`):

* `get($key, array $options = []): ConsulResponse` — чтение значения по ключу
* `put($key, $value, array $options = []): ConsulResponse` — запись значения
* `delete($key, array $options = []): ConsulResponse` — удаление ключа

### 2. Агент (Agent)

Реализует интерфейс `Hyperf\Consul\AgentInterface` (`Hyperf\Consul\Agent`):

* `services(): ConsulResponse` — список локальных сервисов
* `registerService($service): ConsulResponse` — регистрация сервиса
* `deregisterService($serviceId): ConsulResponse` — снятие сервиса с регистрации
* `checks(): ConsulResponse` — список проверок работоспособности (Health Checks)
* `registerCheck($check): ConsulResponse` — регистрация проверки
* `passCheck($checkId, array $options = []): ConsulResponse` — отправка статуса PASS (TTL check)

### 3. Каталог (Catalog)

Реализует интерфейс `Hyperf\Consul\CatalogInterface` (`Hyperf\Consul\Catalog`):

* `datacenters(): ConsulResponse` — список дата-центров
* `nodes(array $options = []): ConsulResponse` — список узлов кластера
* `services(array $options = []): ConsulResponse` — все зарегистрированные сервисы в каталоге
* `service($service, array $options = []): ConsulResponse` — узлы, предоставляющие указанный сервис

### 4. Проверка здоровья (Health)

Реализует интерфейс `Hyperf\Consul\HealthInterface` (`Hyperf\Consul\Health`):

* `service($service, array $options = []): ConsulResponse` — состояние здоровья сервиса
* `state($state, array $options = []): ConsulResponse` — выборка проверок по статусу (`passing`, `warning`, `critical`)

### 5. Сессии и распределенные блокировки (Session)

Реализует интерфейс `Hyperf\Consul\SessionInterface` (`Hyperf\Consul\Session`):

* `create($body = null, array $options = []): ConsulResponse` — создание сессии
* `destroy($sessionId, array $options = []): ConsulResponse` — уничтожение сессии
* `renew($sessionId, array $options = []): ConsulResponse` — продление TTL сессии
