---
sourcePath: "en/reactive-x.md"
---

# Интеграция ReactiveX

Компонент [hyperf/reactive-x](https://github.com/hyperf/reactive-x) предоставляет интеграцию библиотеки ReactiveX в окружении Swoole и Hyperf.

## История ReactiveX

ReactiveX — это сокращение от Reactive Extensions (обычно сокращается как Rx). Изначально это было расширение LINQ, разработанное командой под руководством архитектора Microsoft Эрика Мейера (Erik Meijer) и переданное в open source в ноябре 2012 года. Rx — это парадигма и модель программирования, целью которой является предоставление согласованного программного интерфейса, помогающего разработчикам легко обрабатывать асинхронные потоки данных. Библиотеки Rx поддерживают .NET, JavaScript, C++, Java, PHP и почти все современные языки программирования. Большинство реализаций поддерживается сообществом ReactiveX, а официальный портал доступен по адресу [reactivex.io](http://reactivex.io).

## Что такое ReactiveX

По определению Microsoft: Rx — это библиотека функций, позволяющая разработчикам создавать асинхронные событийно-ориентированные программы с использованием наблюдаемых последовательностей (Observable sequences) и операторов запросов в стиле LINQ. В терминах формулы: **Rx = Observables + LINQ + Schedulers**.

Определение [reactivex.io](http://reactivex.io): Rx — это интерфейс для асинхронного программирования с использованием наблюдаемых потоков данных. ReactiveX объединяет лучшие идеи паттерна «Наблюдатель» (Observer), паттерна «Итератор» (Iterator) и функционального программирования.

## Преимущества и соображения перед использованием

### Преимущества

- Парадигма реактивного программирования позволяет значительно упростить сложные асинхронные сценарии и обработку цепочек событий.
- Если у вас уже есть опыт работы с RxJS или RxJava, этот компонент позволит перенести привычные подходы в Hyperf.
- Несмотря на то, что Swoole позволяет писать асинхронный код линейно через корутины, в Swoole по-прежнему генерируется множество событий, а эффективная обработка событий — сильная сторона Rx.
- Rx незаменим при работе с потоковыми данными: WebSocket, gRPC Streaming, SSE и т.д.

### Соображения

- Мышление в терминах реактивных потоков отличается от классического объектно-ориентированного подхода и требует некоторого привыкания.
- Rx — это архитектурный подход, а не магия. Любая задача, решаемая через Rx, может быть решена и традиционными средствами.
- Реализация RxPHP уступает по зрелости RxJS и RxJava.

## Установка

```bash
composer require hyperf/reactive-x
```

## Возможности и примеры использования

### Observable::fromEvent

Метод `Observable::fromEvent` преобразует стандартные события PSR в наблюдаемую последовательность.

В базовом скелете Hyperf по умолчанию зарегистрирован слушатель запросов к БД `app/Listener/DbQueryExecutedListener.php`. Предположим, мы хотим оптимизировать его логирование:

1. Выводить только запросы, время выполнения которых превысило 100 мс.
2. Для каждого подключения выполнять запись в лог не чаще 1 раза в секунду, чтобы предотвратить переполнение диска медленными запросами.

С помощью ReactiveX эта задача решается элегантно:

```php
<?php

declare(strict_types=1);

namespace Hyperf\ReactiveX\Example;

use Hyperf\Database\Events\QueryExecuted;
use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Framework\Event\BeforeWorkerStart;
use Hyperf\Logger\LoggerFactory;
use Hyperf\ReactiveX\Observable;
use Hyperf\Collection\Arr;
use Hyperf\Stringable\Str;
use Psr\Container\ContainerInterface;

class SqlListener implements ListenerInterface
{
    private $logger;

    public function __construct(ContainerInterface $container)
    {
        $this->logger = $container->get(LoggerFactory::class)->get('sql');
    }

    public function listen(): array
    {
        return [
            BeforeWorkerStart::class,
        ];
    }

    public function process(object $event)
    {
        Observable::fromEvent(QueryExecuted::class)
            ->filter(
                function ($event) {
                    return $event->time > 100;
                }
            )
            ->groupBy(
                function ($event) {
                    return $event->connectionName;
                }
            )
            ->flatMap(
                function ($group) {
                    return $group->throttle(1000);
                }
            )
            ->map(
                function ($event) {
                    $sql = $event->sql;
                    if (! Arr::isAssoc($event->bindings)) {
                        foreach ($event->bindings as $key => $value) {
                            $sql = Str::replaceFirst('?', "'{$value}'", $sql);
                        }
                    }
                    return [$event->connectionName, $event->time, $sql];
                }
            )->subscribe(
                function ($message) {
                    $this->logger->info(sprintf('slow log: [%s] [%s] %s', ...$message));
                }
            );
    }
}
```

### Observable::fromChannel

Превращает корутинный канал Swoole Channel в наблюдаемую последовательность. Позволяет легко организовать схему «многие ко многим» (fan-out) для чтения из одного канала:

```php
<?php

declare(strict_types=1);

use Hyperf\ReactiveX\Observable;
use Swoole\Coroutine\Channel;

$chan = new Channel(1);
$pub = Observable::fromChannel($chan)->publish();

$pub->subscribe(function ($x) {
    echo 'First Subscription:' . $x . PHP_EOL;
});
$pub->subscribe(function ($x) {
    echo 'Second Subscription:' . $x . PHP_EOL;
});
$pub->connect();

$chan->push('hello');
$chan->push('world');

// First Subscription: hello
// Second Subscription: hello
// First Subscription: world
// Second Subscription: world
```

### Observable::fromCoroutine

Запуск одной или нескольких корутин с объединением результатов выполнения в поток. Например, организация «гонки» конкурентных корутин (аналог `Promise.race` в JS), где используется результат первой завершившейся задачи:

```php
<?php

declare(strict_types=1);

use Hyperf\ReactiveX\Observable;
use Swoole\Coroutine\Channel;

$result = new Channel(1);
$o = Observable::fromCoroutine([function () {
    sleep(2);
    return 1;
}, function () {
    sleep(1);
    return 2;
}]);

$o->take(1)->subscribe(
    function ($x) use ($result) {
        $result->push($x);
    }
);
echo $result->pop(); // 2
```

### Observable::fromHttpRoute

Поскольку HTTP-запросы также управляются событиями, маршрутизацию запросов можно подключить к ReactiveX (например, в слушателе события `BootApplication`):

```php
<?php

declare(strict_types=1);

namespace Hyperf\ReactiveX\Example;

use Hyperf\Event\Contract\ListenerInterface;
use Hyperf\Framework\Event\BootApplication;
use Hyperf\ReactiveX\Observable;
use Psr\Http\Message\RequestInterface;

class BatchSaveRoute implements ListenerInterface
{
    public function listen(): array
    {
        return [
            BootApplication::class,
        ];
    }

    public function process(object $event)
    {
        // Буферизация пачками по 10 запросов перед сохранением
        Observable::fromHttpRoute(['POST', 'PUT'], '/save')
            ->map(
                function (RequestInterface $request) {
                    return $request->getBody();
                }
            )
            ->bufferWithCount(10)
            ->subscribe(
                function (array $bodies) {
                    echo count($bodies); // 10
                }
            );
    }
}
```

### Межпроцессное взаимодействие: IpcSubject

Компонент предоставляет межпроцессную версию реактивных субъектов (`IpcSubject`), позволяющую рассылать данные между рабочими процессами Swoole.

Пример чата на WebSocket, где сообщения синхронизируются между всеми процессами Worker, а новому пользователю отдаются последние 5 сообщений через `ReplaySubject`:

```php
<?php

declare(strict_types=1);

namespace Hyperf\ReactiveX\Example;

use Hyperf\Contract\OnCloseInterface;
use Hyperf\Contract\OnMessageInterface;
use Hyperf\Contract\OnOpenInterface;
use Hyperf\ReactiveX\Contract\BroadcasterInterface;
use Hyperf\ReactiveX\IpcSubject;
use Rx\Subject\ReplaySubject;
use Swoole\Http\Request;
use Swoole\Server;
use Swoole\WebSocket\Frame;
use Swoole\WebSocket\Server as WebSocketServer;

class WebSocketController implements OnMessageInterface, OnOpenInterface, OnCloseInterface
{
    private IpcSubject $subject;
    private $subscriber = [];

    public function __construct(BroadcasterInterface $broadcaster)
    {
        $relaySubject = make(ReplaySubject::class, ['bufferSize' => 5]);
        $this->subject = new IpcSubject($relaySubject, $broadcaster, 1);
    }

    public function onMessage(WebSocketServer $server, Frame $frame): void
    {
        $this->subject->onNext($frame->data);
    }

    public function onClose(Server $server, int $fd, int $reactorId): void
    {
        $this->subscriber[$fd]->dispose();
    }

    public function onOpen(WebSocketServer $server, Request $request): void
    {
        $this->subscriber[$request->fd] = $this->subject->subscribe(function ($data) use ($server, $request) {
            $server->push($request->fd, $data);
        });
    }
}
```

### Шина сообщений: MessageBusInterface

Для удобства на базе `IpcSubject` создана готовая шина сообщений `MessageBusInterface`:

```php
<?php
$bus = make(Hyperf\ReactiveX\MessageBusInterface::class);

// Рассылка сообщения всем процессам
$bus->onNext('Hello Hyperf');

// Подписка на сообщения
$bus->subscribe(function($message){
    echo $message;
});
```

> **Важно**: Поскольку ReactiveX опирается на цикл событий (Event Loop), вызовы методов ReactiveX должны осуществляться после старта сервера Swoole.
