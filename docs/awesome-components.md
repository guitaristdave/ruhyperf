---
sourcePath: "en/awesome-components.md"
---

# Популярные компоненты (Awesome Components)

Все официальные библиотеки компонентов Hyperf адаптированы для безопасной работы внутри корутин (Coroutine-safe). Благодаря открытости и расширяемости архитектуры Hyperf, сообщество разработчиков создало и адаптировало множество сторонних компонентов.

На этой странице собран каталог проверенных корутинных библиотек и расширений, совместимых с Hyperf.

## Как добавить свой компонент?

Если вы разработали компонент для Hyperf, создайте Pull Request в ветку `master` репозитория [hyperf/hyperf](https://github.com/hyperf/hyperf), дополнив этот документ. Ознакомьтесь с [Руководством по разработке компонентов](component-guide-intro.md).

---

## Каталог компонентов

### Маршрутизация (Route)

- [nikic/fastroute](https://github.com/nikic/FastRoute) — высокоскоростной роутер, лежащий в основе маршрутизации Hyperf.
- [lazychanger/urlrewrite](https://github.com/lazychanger/urlrewrite) — инструмент перезаписи URL на базе FastRoute и PSR-7.

### События (Event)

- [hyperf/event](https://github.com/hyperf/event) — менеджер событий, совместимый со стандартом PSR-14.

### Логирование (Log)

- [hyperf/logger](https://github.com/hyperf/logger) — система логирования на базе PSR-3 и Monolog.

### Консольные команды (Command)

- [hyperf/command](https://github.com/hyperf/command) — расширение Symfony Console с поддержкой атрибутов Hyperf.
- [symfony/console](https://github.com/symfony/console) — базовая библиотека консоли Symfony.

### Базы данных и ORM

- [hyperf/database](https://github.com/hyperf/database) — форк Eloquent ORM, оптимизированный под корутины и пул соединений Hyperf.
- [hyperf/model-cache](https://github.com/hyperf/model-cache) — автоматическое двухуровневое кэширование моделей ORM.

### Контейнер внедрения зависимостей (DI)

- [hyperf/di](https://github.com/hyperf/di) — мощный DI-контейнер Hyperf с поддержкой внедрения зависимостей через атрибуты и AOP-аспектов.

### Серверы (Server)

- [hyperf/http-server](https://github.com/hyperf/http-server) — официальный HTTP-сервер Hyperf.
- [hyperf/grpc-server](https://github.com/hyperf/grpc-server) — высокопроизводительный gRPC-сервер.
- [hyperf/websocket-server](https://github.com/hyperf/websocket-server) — WebSocket-сервер Hyperf.
- [hyperf/rpc-server](https://github.com/hyperf/rpc-server) — универсальный абстрактный RPC-сервер.

### Клиенты (Client)

- [hyperf/redis](https://github.com/hyperf/redis) — пул соединений и корутинный клиент Redis.
- [hyperf/guzzle](https://github.com/hyperf/guzzle) — корутинный HTTP-клиент на базе Guzzle.
- [hyperf/elasticsearch](https://github.com/hyperf/elasticsearch) — корутинный клиент Elasticsearch.
- [hyperf/consul](https://github.com/hyperf/consul) — клиент Consul для регистрации сервисов и KV.
- [hyperf/grpc-client](https://github.com/hyperf/grpc-client) — корутинный gRPC-клиент.
- [hyperf/websocket-client](https://github.com/hyperf/websocket-client) — корутинный WebSocket-клиент.
- [hyperf/cache](https://github.com/hyperf/cache) — система кэширования на базе стандартов PSR-16.
- [friendsofhyperf/http-client](https://github.com/friendsofhyperf/http-client) — удобный HTTP-клиент от FriendsOfHyperf.
- [friendsofhyperf/openai-client](https://github.com/friendsofhyperf/openai-client) — корутинный клиент OpenAI API для Hyperf.

### Тестирование (Testing)

- [hyperf/testing](https://github.com/hyperf/testing) — официальный компонент для юнит- и функционального тестирования.
- [friendsofhyperf/pest-plugin-hyperf](https://github.com/friendsofhyperf/pest-plugin-hyperf) — плагин тестирования для тестового фреймворка [Pest PHP](https://pestphp.com/) с поддержкой корутин.

### Очереди сообщений (Message Queue)

- [hyperf/async-queue](https://github.com/hyperf/async-queue) — асинхронные очереди на базе Redis.
- [hyperf/amqp](https://github.com/hyperf/amqp) — корутинный драйвер AMQP (RabbitMQ).

### Центры конфигурации (Config Center)

- [hyperf/config-apollo](https://github.com/hyperf/config-apollo) — интеграция с CTrip Apollo.
- [hyperf/config-aliyun-acm](https://github.com/hyperf/config-aliyun-acm) — интеграция с сервисом конфигураций Alibaba Cloud ACM.

### Микросервисы и сервис-менеджмент

- [hyperf/json-rpc](https://github.com/hyperf/json-rpc) — реализация протокола JSON-RPC.
- [hyperf/rate-limit](https://github.com/hyperf/rate-limit) — ограничение частоты запросов на базе алгоритма Token Bucket.
- [hyperf/circuit-breaker](https://github.com/hyperf/circuit-breaker) — предохранитель сбоев (Circuit Breaker).
- [hyperf/tracer](https://github.com/hyperf/tracer) — распределенная трассировка OpenTracing / Jaeger / Zipkin.
- [friendsofhyperf/sentry](https://github.com/friendsofhyperf/sentry) — интеграция трекера ошибок [Sentry](https://sentry.io).

### DTO и валидация

- [fatbit/form-request-param](https://github.com/duncanxia97/hyperf-form-request-param) — строгая типизация входящих параметров запроса и автоматическая валидация через DTO.

### Разработка и отладка (Dev & Debug)

- [learvin/hyperf-tinker](https://github.com/Arvin-Lee/hyperf-tinker) — интерактивная консоль REPL для Hyperf на базе PsySH.
- [friendsofhyperf/telescope](https://github.com/friendsofhyperf/telescope) — панель глубокой отладки запросов, очередей и логов Hyperf Telescope.
- [qbhy/hyperf-multi-env](https://github.com/qbhy/hyperf-multi-env) — поддержка множественных файлов окружения (`.env.testing`, `.env.production`).
- [qiutuleng/hyperf-dump-server](https://github.com/qiutuleng/hyperf-dump-server) — вывод отладочных переменных в отдельное окно терминала (Var-Dump Server).
- [firstphp/wsdebug](https://github.com/lamplife/wsdebug) — отладка и наблюдение ошибок в реальном времени через WebSocket.
