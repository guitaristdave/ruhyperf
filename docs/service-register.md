---
sourcePath: "en/service-register.md"
---

# Регистрация и обнаружение сервисов (Service Governance)

При разделении монолита на микросервисы количество узлов и инстансов многократно возрастает. Для координации кластера необходим централизованный компонент — **Реестр сервисов (Service Registry / Service Center)**.

В реестре накапливается актуальная информация обо всех доступных узлах (IP-адреса, порты, протоколы, состояние здоровья). При вызове удаленной процедуры клиент обращается к реестру и с помощью балансировщика нагрузки (Load Balancer) выбирает здоровый узел.

В Hyperf управление реестрами реализовано компонентом [hyperf/service-governance](https://github.com/hyperf/service-governance) с нативной поддержкой **Consul** и **Nacos**.

## Установка

```bash
composer require hyperf/service-governance
```

## Публикация сервиса в реестре

Публикация выполняется через атрибут `#[RpcService]`:

```php
<?php

declare(strict_types=1);

namespace App\JsonRpc;

use Hyperf\RpcServer\Annotation\RpcService;

#[RpcService(
    name: "CalculatorService", 
    protocol: "jsonrpc-http", 
    server: "jsonrpc-http", 
    publishTo: "consul"
)]
class CalculatorService implements CalculatorServiceInterface
{
    public function calculate(int $a, int $b): int
    {
        return $a + $b;
    }
}
```

Параметр `publishTo: "consul"` указывает фреймворку автоматически зарегистрировать сервис при старте и периодически передавать статус работоспособности (Health Check). При плавном завершении работы приложения сервис автоматически снимается с регистрации.

Подробные инструкции по настройке клиентов и балансировщиков приведены в разделе [JSON-RPC](json-rpc).
