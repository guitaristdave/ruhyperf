---
sourcePath: "en/etcd.md"
---

# Клиент ETCD

Компонент [hyperf/etcd](https://github.com/hyperf/etcd) предоставляет корутинный клиент для распределенного хранилища конфигураций и обнаружения сервисов `etcd` (версия протокола v3 через gRPC-HTTP gateway).

## Установка

```bash
composer require hyperf/etcd
```

## Конфигурация

Создайте файл `config/autoload/etcd.php`:

```php
<?php

declare(strict_types=1);

return [
    'uri' => env('ETCD_URI', 'http://127.0.0.1:2379'),
    'version' => 'v3beta',
    'options' => [
        'timeout' => 10,
    ],
];
```

## Использование

Для работы с хранилищем ключ-значение внедрите интерфейс `Hyperf\Etcd\KVInterface`:

```php
<?php

declare(strict_types=1);

namespace App\Service;

use Hyperf\Etcd\KVInterface;

class EtcdService
{
    public function __construct(protected KVInterface $client)
    {
    }

    public function example()
    {
        // Запись значения
        $this->client->put('/config/app_name', 'Hyperf App');

        // Получение значения
        $res = $this->client->get('/config/app_name');
        
        return $res;
    }
}
```
