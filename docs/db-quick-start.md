---
sourcePath: "en/db/quick-start.md"
---

# База данных: Быстрый старт (Database)

Компонент [hyperf/database](https://github.com/hyperf/database) создан на базе [illuminate/database](https://github.com/illuminate/database) (из экосистемы Laravel). Он адаптирован для корутинного окружения Swoole/Swow с помощью пакета [hyperf/db-connection](https://github.com/hyperf/db-connection), который реализует встроенный **пул соединений к базе данных (Connection Pool)**.

---

## Установка и конфигурация

```bash
composer require hyperf/db-connection
```

Конфигурационный файл `config/autoload/databases.php`:

```php
<?php
return [
    'default' => [
        'driver' => env('DB_DRIVER', 'mysql'),
        'host' => env('DB_HOST', 'localhost'),
        'port' => (int) env('DB_PORT', 3306),
        'database' => env('DB_DATABASE', 'hyperf'),
        'username' => env('DB_USERNAME', 'root'),
        'password' => env('DB_PASSWORD', ''),
        'charset' => env('DB_CHARSET', 'utf8mb4'),
        'collation' => env('DB_COLLATION', 'utf8mb4_unicode_ci'),
        'prefix' => env('DB_PREFIX', ''),

        // Настройки пула соединений:
        'pool' => [
            'min_connections' => 1,       // Минимальное число активных соединений
            'max_connections' => 20,      // Максимальный размер пула на один Worker
            'connect_timeout' => 10.0,    // Таймаут на установку TCP-соединения
            'wait_timeout' => 3.0,       // Время ожидания свободного соединения из пула
            'heartbeat' => -1,           // Пинг-проверка соединения (-1 выключено)
            'max_idle_time' => (float) env('DB_MAX_IDLE_TIME', 60), // Закрывать неактивные сокеты
        ],

        'options' => [
            PDO::ATTR_CASE => PDO::CASE_NATURAL,
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_ORACLE_NULLS => PDO::NULL_NATURAL,
            PDO::ATTR_STRINGIFY_FETCHES => false,
            PDO::ATTR_EMULATE_PREPARES => false,
        ],
    ],
];
```

---

## Разделение чтения и записи (Read / Write Splitting)

Hyperf поддерживает автоматическое распределение запросов: `SELECT` отправляются на реплики (Read Replicas), а `INSERT`, `UPDATE`, `DELETE` — на Master:

```php
'default' => [
    'driver' => 'mysql',
    'read' => [
        'host' => ['192.168.1.11', '192.168.1.12'], // Реплики для чтения
    ],
    'write' => [
        'host' => ['192.168.1.10'],                 // Мастер для записи
    ],
    'sticky' => true, // Если в рамках запроса была запись, последующие SELECT читаются с мастера
    // ... общие параметры credentials, базы данных и пула
],
```

> **Опция `sticky: true`:** Предотвращает проблемы репликационной задержки (Replication Lag). Если в текущем запросе уже была выполнена запись, последующие чтения до конца запроса будут выполняться с Master-сервера.

---

## Несколько подключений к базам данных

В `config/autoload/databases.php` можно объявить любое количество подключений:

```php
return [
    'default' => [ /* настройки основного MySQL */ ],
    'analytics' => [ /* подключение к аналитической БД */ ],
];
```

Переключение соединений:
```php
use Hyperf\DbConnection\Db;

// Запрос к default:
$users = Db::select('SELECT * FROM users');

// Запрос к analytics:
$stats = Db::connection('analytics')->select('SELECT * FROM logs');
```

В моделях подключение задается свойством `$connection`:
```php
class UserLog extends Model
{
    protected string $connection = 'analytics';
}
```

---

## Выполнение прямых SQL-запросов (`Db`)

Фасад `Hyperf\DbConnection\Db` предоставляет привычные методы для выполнения сырых SQL-запросов с защитой от SQL-инъекций через связывание параметров (`?`):

### 1. Выборка (`SELECT`):
```php
use Hyperf\DbConnection\Db;

// Возвращает массив объектов \stdClass
$users = Db::select('SELECT id, name, email FROM users WHERE status = ? AND age >= ?', [1, 18]);

foreach ($users as $user) {
    echo $user->name;
}
```

### 2. Вставка (`INSERT`):
```php
$success = Db::insert('INSERT INTO users (name, email) VALUES (?, ?)', ['Дмитрий', 'dmitry@example.com']);
```

### 3. Обновление (`UPDATE`) и Удаление (`DELETE`):
```php
// Возвращает количество затронутых строк (int)
$affected = Db::update('UPDATE users SET status = ? WHERE id = ?', [2, 10]);

$deleted = Db::delete('DELETE FROM users WHERE id = ?', [10]);
```

---

## Транзакции базы данных

### Автоматические транзакции (рекомендуемый способ)
Метод `Db::transaction()` оборачивает код в транзакцию. При возникновении любого `Throwable` транзакция автоматически откатывается (`ROLLBACK`). При успешном выполнении вызывается `COMMIT`:

```php
use Hyperf\DbConnection\Db;

Db::transaction(function () use ($senderId, $recipientId, $amount) {
    Db::table('accounts')->where('id', $senderId)->decrement('balance', $amount);
    Db::table('accounts')->where('id', $recipientId)->increment('balance', $amount);
    Db::table('transactions')->insert([
        'sender_id' => $senderId,
        'recipient_id' => $recipientId,
        'amount' => $amount,
        'created_at' => date('Y-m-d H:i:s'),
    ]);
});
```

### Ручное управление транзакциями
```php
Db::beginTransaction();

try {
    // Операции...
    Db::commit();
} catch (\Throwable $e) {
    Db::rollBack();
    throw $e;
}
```

---

## Поддерживаемые СУБД и драйверы

* **MySQL / MariaDB** (встроено по умолчанию)
* **PostgreSQL** (`composer require hyperf/database-pgsql`)
* **SQLite** (`composer require hyperf/database-sqlite`)
* **Microsoft SQL Server** (`composer require hyperf/database-sqlserver-incubator`)
