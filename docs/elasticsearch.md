---
sourcePath: "en/elasticsearch.md"
---

# Клиент Elasticsearch

Компонент [hyperf/elasticsearch](https://github.com/hyperf/elasticsearch) предоставляет фабрику для создания клиентов официальной библиотеки [elasticsearch-php](https://github.com/elastic/elasticsearch-php) с автоматической поддержкой корутин.

Поскольку базовый клиент Elasticsearch использует обработчик на основе Guzzle Ring, компонент заменяет его на неблокирующий корутинный транспорт Hyperf.

## Установка

```bash
composer require hyperf/elasticsearch
```

## Использование

Для создания клиента используйте фабрику `Hyperf\Elasticsearch\ClientBuilderFactory`:

```php
<?php

declare(strict_types=1);

namespace App\Service;

use Hyperf\Elasticsearch\ClientBuilderFactory;

class EsService
{
    public function __construct(protected ClientBuilderFactory $builderFactory)
    {
    }

    public function search()
    {
        $builder = $this->builderFactory->create();

        $client = $builder->setHosts([
            'http://127.0.0.1:9200',
        ])->build();

        return $client->info();
    }
}
```

> Если клиент создается внутри корутины, он автоматически использует корутинный обработчик. При создании вне корутины (например, в скриптах запуска) используется стандартный синхронный обработчик.
