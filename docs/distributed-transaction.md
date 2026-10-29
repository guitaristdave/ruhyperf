---
sourcePath: "en/distributed-transaction.md"
---

# Распределенные транзакции (DTM)

В микросервисной архитектуре классические транзакции ACID неприменимы для операций, затрагивающих несколько независимых баз данных. Компонент [dtm/dtm-client](https://github.com/dtm-php/dtm-client), разработанный и поддерживаемый командой Hyperf, предоставляет интеграцию с менеджером распределенных транзакций [DTM](https://github.com/dtm-labs/dtm).

Поддерживаются основные модели распределенных транзакций:
* **TCC** (Try-Confirm-Cancel)
* **Saga** (с компенсирующими транзакциями)
* **XA** (двухфазная фиксация)
* **Двухфазные сообщения** (Two-Phase Message)

## Установка

```bash
composer require dtm/dtm-client
```

Публикация конфигурационного файла:

```bash
php bin/hyperf.php vendor:publish dtm/dtm-client
```

Файл `config/autoload/dtm.php`:

```php
use DtmClient\Constants\Protocol;
use DtmClient\Constants\DbType;

return [
    'protocol' => Protocol::HTTP, // Protocol::HTTP или Protocol::GRPC
    'server' => env('DTM_SERVER_HOST', '127.0.0.1'),
    'port' => [
        'http' => 36789,
        'grpc' => 36790,
    ],
    // Технология Sub-transaction barrier для исключения аномалий (null-компенсация, зависание)
    'barrier' => [
        'db' => [
            'type' => DbType::MySQL,
        ],
    ],
];
```

Зарегистрируйте глобальный посредник `DtmClient\Middleware\DtmMiddleware` в `config/autoload/middlewares.php`.

## Модель Saga

В паттерне Saga глобальная транзакция разбивается на цепочку локальных транзакций. Для каждого шага прямого действия определяется компенсирующий шаг отката:

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use DtmClient\Saga;
use DtmClient\TransContext;
use Hyperf\Di\Annotation\Inject;
use Hyperf\HttpServer\Annotation\Controller;
use Hyperf\HttpServer\Annotation\GetMapping;

#[Controller(prefix: '/saga')]
class SagaController
{
    #[Inject]
    protected Saga $saga;

    #[GetMapping(path: 'transfer')]
    public function transfer(): string
    {
        $payload = ['amount' => 50];

        $this->saga->init();
        
        // Шаг 1: Списание со счета А (компенсация: возврат на счет А)
        $this->saga->add(
            'http://service-bank:9501/saga/transOut', 
            'http://service-bank:9501/saga/transOutCompensate', 
            $payload
        );

        // Шаг 2: Зачисление на счет Б (компенсация: списание со счета Б)
        $this->saga->add(
            'http://service-bank:9501/saga/transIn', 
            'http://service-bank:9501/saga/transInCompensate', 
            $payload
        );

        $this->saga->submit();

        return TransContext::getGid();
    }
}
```

## Модель TCC (Try - Confirm - Cancel)

Паттерн TCC резервирует ресурсы на стадии Try, фиксирует их на стадии Confirm и освобождает на стадии Cancel:

```php
use DtmClient\TCC;

$this->tcc->globalTransaction(function (TCC $tcc) {
    $tcc->callBranch(
        ['amount' => 30],
        'http://service-a:9501/tcc/trans/try',
        'http://service-a:9501/tcc/trans/confirm',
        'http://service-a:9501/tcc/trans/cancel'
    );
});
```

Встроенная технология **Sub-transaction Barrier** автоматически защищает от сетевых дублей, ложных компенсаций и зависания транзакций на уровне БД.
