---
sourcePath: "en/jet.md"
---

# Jet RPC клиент

**Jet** — это универсальный унифицированный RPC-клиент от команды Hyperf с поддержкой протокола JSON-RPC, способный работать в **любом PHP-окружении**, включая классический `PHP-FPM`, консольные скрипты CLI и асинхронные среды `Swoole` / `Swow`.

## Установка

```bash
composer require hyperf/jet
```

## Быстрый старт

### 1. Регистрация протокола

Регистрация протокола через `Hyperf\Jet\ProtocolManager` объединяет транспорт (Transporter), упаковщик данных (Packer), генератор путей (PathGenerator) и форматтер данных (DataFormatter):

```php
<?php

use Hyperf\Jet\DataFormatter\DataFormatter;
use Hyperf\Jet\Packer\JsonEofPacker;
use Hyperf\Jet\PathGenerator\PathGenerator;
use Hyperf\Jet\ProtocolManager;
use Hyperf\Jet\Transporter\StreamSocketTransporter;

ProtocolManager::register($protocol = 'jsonrpc', [
    ProtocolManager::TRANSPORTER => new StreamSocketTransporter(),
    ProtocolManager::PACKER => new JsonEofPacker(),
    ProtocolManager::PATH_GENERATOR => new PathGenerator(),
    ProtocolManager::DATA_FORMATTER => new DataFormatter(),
]);
```

### 2. Регистрация сервиса

Свяжите зарегистрированный протокол с именем удаленного сервиса и адресами узлов через `Hyperf\Jet\ServiceManager`:

```php
<?php

use Hyperf\Jet\ServiceManager;

ServiceManager::register($service = 'CalculatorService', $protocol = 'jsonrpc', [
    ServiceManager::NODES => [
        ['127.0.0.1', 9503],
    ],
]);
```

### 3. Вызов удаленных методов (RPC)

#### Вариант A: Через ClientFactory

```php
<?php

use Hyperf\Jet\ClientFactory;

$clientFactory = new ClientFactory();
$client = $clientFactory->create('CalculatorService', 'jsonrpc');

// Вызов удаленного метода add с аргументами (1, 2)
$result = $client->add(1, 2);
```

#### Вариант B: Через кастомный типизированный класс клиента

Создайте класс клиента, унаследовав его от `Hyperf\Jet\AbstractClient`:

```php
<?php

use Hyperf\Jet\AbstractClient;
use Hyperf\Jet\Packer\JsonEofPacker;
use Hyperf\Jet\Transporter\StreamSocketTransporter;

/**
 * @method int add(int $a, int $b)
 * @method int subtract(int $a, int $b)
 */
class CalculatorService extends AbstractClient
{
    public function __construct(string $service = 'CalculatorService')
    {
        $transporter = new StreamSocketTransporter('127.0.0.1', 9503);
        $packer = new JsonEofPacker();
        parent::__construct($service, $transporter, $packer);
    }
}
```

Вызов:

```php
$client = new CalculatorService();
$result = $client->add(10, 20); // 30
```
