---
sourcePath: "en/snowflake.md"
---

# Генератор идентификаторов Snowflake

`Snowflake` — это популярный распределенный алгоритм генерации глобально уникальных 64-битных целочисленных идентификаторов (`ID`), разработанный в Twitter.

## Структура 64-битного идентификатора

* **1 бит:** не используется (знаковый бит, всегда `0`).
* **41 бит:** метка времени в миллисекундах (хватает примерно на 69 лет).
* **10 бит:** идентификатор рабочего узла (включает 5 бит `DatacenterId` и 5 бит `WorkerId`, позволяя поддерживать до 1024 уникальных серверов).
* **12 бит:** последовательный номер (счетчик для генерации до 4096 уникальных ID на одном узле в пределах одной миллисекунды).

Преимущества Snowflake:
* Все ID строго возрастают во времени.
* Полное отсутствие коллизий в распределенном кластере.
* Высокая скорость генерации без обращения к централизованным СУБД.

## Установка

```bash
composer require hyperf/snowflake
```

Публикация конфигурационного файла:

```bash
php bin/hyperf.php vendor:publish hyperf/snowflake
```

## Использование

Для генерации ID внедрите интерфейс `Hyperf\Snowflake\IdGeneratorInterface`:

```php
<?php

use Hyperf\Context\ApplicationContext;
use Hyperf\Snowflake\IdGeneratorInterface;

$container = ApplicationContext::getContainer();
$generator = $container->get(IdGeneratorInterface::class);

// Генерация уникального ID
$id = $generator->generate();

// Декодирование метаданных из сгенерированного ID
$meta = $generator->degenerate($id);
echo $meta->getTime();
```

## Использование в качестве первичного ключа моделей

Вы можете подключить трейт `Snowflake` к моделям Hyperf, чтобы первичный ключ генерировался автоматически перед сохранением:

```php
<?php

namespace App\Model;

use Hyperf\DbConnection\Model\Model;
use Hyperf\Snowflake\Concern\Snowflake;

class Order extends Model
{
    use Snowflake;

    // Первичный ключ snowflake является 64-битным целым числом
    public bool $incrementing = false;
    protected string $keyType = 'int';
}
```
