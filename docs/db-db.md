---
sourcePath: "en/db/db.md"
---

# Минималистичный компонент DB

Компонент [hyperf/database](https://github.com/hyperf/database) обладает богатым функционалом, однако в сценариях с экстремальными требованиями к производительности накладные расходы ORM могут быть избыточными. Компонент `hyperf/db` предоставляет легковесную, сверхбыструю обертку над соединениями базы данных.

## Установка

```bash
composer require hyperf/db
```

## Публикация конфигурации

```bash
php bin/hyperf.php vendor:publish hyperf/db
```

Конфигурационный файл будет создан по пути `config/autoload/db.php`.

## Параметры конфигурации

| Параметр | Тип | По умолчанию | Описание |
| :---: | :---: | :---: | :--- |
| `driver` | string | `null` | Драйвер базы данных (`mysql`) |
| `host` | string | `'localhost'` | Адрес сервера базы данных |
| `port` | int | `3306` | Порт сервера |
| `database` | string | `null` | Имя базы данных |
| `username` | string | `null` | Пользователь БД |
| `password` | string | `null` | Пароль |
| `charset` | string | `'utf8mb4'` | Кодировка соединения |
| `collation` | string | `'utf8mb4_unicode_ci'` | Сопоставление символов |
| `fetch_mode` | int | `PDO::FETCH_ASSOC` | Режим выборки строк PDO |
| `pool.min_connections` | int | `1` | Минимальное число соединений в пуле |
| `pool.max_connections` | int | `10` | Максимальное число соединений в пуле |
| `pool.connect_timeout` | float | `10.0` | Таймаут ожидания установки соединения |
| `pool.wait_timeout` | float | `3.0` | Таймаут ожидания свободного соединения из пула |
| `pool.heartbeat` | int | `-1` | Интервал проверки соединения (heartbeat) |
| `pool.max_idle_time` | float | `60.0` | Максимальное время простоя соединения (секунды) |
| `options` | array | `[]` | Дополнительные опции драйвера PDO |

## Поддерживаемые методы

С интерфейсом можно ознакомиться в `Hyperf\DB\ConnectionInterface`:

| Метод | Возвращаемое значение | Описание |
| :---: | :---: | :--- |
| `beginTransaction` | `void` | Открыть транзакцию (поддерживаются вложенные) |
| `commit` | `void` | Зафиксировать транзакцию |
| `rollBack` | `void` | Откатить транзакцию |
| `insert` | `int` | Вставить запись, возвращает ID добавленной строки |
| `execute` | `int` | Выполнить SQL-запрос, возвращает число затронутых строк |
| `query` | `array` | Выполнить SQL-запрос выборки, возвращает список строк |
| `fetch` | `array\|object` | Выполнить SQL-запрос, возвращает первую строку выборки |
| `connection` | `self` | Переключиться на указанное подключение к БД |

## Использование

### Через экземпляр DB

```php
<?php

use Hyperf\Context\ApplicationContext;
use Hyperf\DB\DB;

$db = ApplicationContext::getContainer()->get(DB::class);
$users = $db->query('SELECT * FROM `user` WHERE gender = ?;', [1]);
```

### Через статические вызовы

```php
<?php

use Hyperf\DB\DB;

$users = DB::query('SELECT * FROM `user` WHERE gender = ?;', [1]);
```

### Выполнение произвольных операций над PDO

Метод `DB::run` предоставляет прямой доступ к базовому объекту `PDO`:

```php
<?php

use Hyperf\DB\DB;

$sql = 'SELECT * FROM `user` WHERE id = ?;';
$bindings = [2];
$mode = \PDO::FETCH_OBJ;

$result = DB::run(function (\PDO $pdo) use ($sql, $bindings, $mode) {
    $statement = $pdo->prepare($sql);
    $statement->execute($bindings);
    return $statement->fetchAll($mode);
});
```
