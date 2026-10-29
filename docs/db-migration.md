---
sourcePath: "en/db/migration.md"
---

# Миграции базы данных (Migrations)

Миграции представляют собой систему контроля версий для структуры вашей базы данных, упрощая совместную командную разработку и развертывание изменений схем данных.

## Генерация миграций

Создание файла миграции выполняется командой `gen:migration`:

```bash
php bin/hyperf.php gen:migration create_users_table
```

Сгенерированные файлы сохраняются в директорию `migrations` в корне проекта.

### Опции команды

* `--table` — указывает имя существующей таблицы для изменения
* `--create` — указывает имя новой таблицы для создания

```bash
php bin/hyperf.php gen:migration create_users_table --create=users
php bin/hyperf.php gen:migration add_votes_to_users_table --table=users
```

## Структура файла миграции

Каждый класс миграции содержит два метода: `up` (применение изменений) и `down` (откат изменений):

```php
<?php

use Hyperf\Database\Schema\Schema;
use Hyperf\Database\Schema\Blueprint;
use Hyperf\Database\Migrations\Migration;

class CreateUsersTable extends Migration
{
    /**
     * Выполнить миграцию.
     */
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamps();
        });
    }

    /**
     * Откатить миграцию.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
    }
}
```

## Запуск и откат миграций

### Выполнение всех ожидающих миграций

```bash
php bin/hyperf.php migrate
```

В продакшн-окружении для подавления подтверждения используйте флаг `--force`:

```bash
php bin/hyperf.php migrate --force
```

### Откат последней операции

```bash
php bin/hyperf.php migrate:rollback
```

Откат определенного количества шагов:

```bash
php bin/hyperf.php migrate:rollback --step=5
```

### Полный сброс всех миграций

```bash
php bin/hyperf.php migrate:reset
```

### Перезапуск всех миграций

```bash
# Откат и повторный запуск
php bin/hyperf.php migrate:refresh

# С повторным запуском сидеров (seeder)
php bin/hyperf.php migrate:refresh --seed
```

### Полное пересоздание БД

```bash
php bin/hyperf.php migrate:fresh
php bin/hyperf.php migrate:fresh --seed
```

## Управление таблицами (Schema)

Класс `Hyperf\Database\Schema\Schema` предоставляет фасад для управления структурой БД.

### Создание таблицы

```php
Schema::create('users', function (Blueprint $table) {
    $table->bigIncrements('id');
    $table->string('name');
    $table->timestamps();
});
```

Дополнительные параметры таблицы:

```php
$table->engine = 'InnoDB';
$table->charset = 'utf8mb4';
$table->collation = 'utf8mb4_unicode_ci';
$table->temporary(); // Создать временную таблицу
```

### Переименование и удаление таблиц

```php
Schema::rename($from, $to);

Schema::drop('users');
Schema::dropIfExists('users');
```

### Проверка существования таблиц и столбцов

```php
if (Schema::hasTable('users')) {
    // Таблица существует
}

if (Schema::hasColumn('users', 'email')) {
    // Столбец существует
}
```

### Указание пула соединений

```php
class CreateUsersTable extends Migration
{
    protected string $connection = 'foo';
}
```

## Доступные типы столбцов (Blueprint)

| Метод | Тип в SQL / Описание |
| :--- | :--- |
| `$table->bigIncrements('id');` | Автоинкрементный UNSIGNED BIGINT (первичный ключ) |
| `$table->bigInteger('votes');` | BIGINT |
| `$table->binary('data');` | BLOB |
| `$table->boolean('confirmed');` | BOOLEAN |
| `$table->char('name', 100);` | CHAR с указанной длиной |
| `$table->date('created_at');` | DATE |
| `$table->dateTime('created_at');` | DATETIME |
| `$table->dateTimeTz('created_at');` | DATETIME с часовым поясом |
| `$table->decimal('amount', 8, 2);` | DECIMAL с точностью и масштабом |
| `$table->double('amount', 8, 2);` | DOUBLE |
| `$table->enum('level', ['easy', 'hard']);` | ENUM |
| `$table->float('amount', 8, 2);` | FLOAT |
| `$table->increments('id');` | Автоинкрементный UNSIGNED INTEGER |
| `$table->integer('votes');` | INTEGER |
| `$table->ipAddress('visitor');` | IP-адрес |
| `$table->json('options');` | JSON |
| `$table->jsonb('options');` | JSONB |
| `$table->longText('description');` | LONGTEXT |
| `$table->mediumInteger('votes');` | MEDIUMINT |
| `$table->mediumText('description');` | MEDIUMTEXT |
| `$table->morphs('taggable');` | Полиморфные столбцы `taggable_id` (UNSIGNED BIGINT) и `taggable_type` (VARCHAR) |
| `$table->nullableTimestamps();` | `created_at` и `updated_at`, допускающие `NULL` |
| `$table->rememberToken();` | `remember_token` (VARCHAR 100) |
| `$table->smallInteger('votes');` | SMALLINT |
| `$table->softDeletes();` | Мягкое удаление: столбец `deleted_at` |
| `$table->string('name', 100);` | VARCHAR с заданной длиной |
| `$table->text('description');` | TEXT |
| `$table->time('sunrise');` | TIME |
| `$table->timestamp('added_on');` | TIMESTAMP |
| `$table->timestamps();` | Столбцы `created_at` и `updated_at` |
| `$table->tinyInteger('votes');` | TINYINT |
| `$table->unsignedBigInteger('votes');` | UNSIGNED BIGINT |
| `$table->unsignedInteger('votes');` | UNSIGNED INT |
| `$table->uuid('id');` | UUID |
| `$table->comment('Описание таблицы');` | Комментарий к таблице |

## Модификаторы столбцов

```php
$table->string('email')->nullable(); // Разрешить NULL
$table->string('role')->default('user'); // Значение по умолчанию
$table->unsignedInteger('score')->after('name'); // Разместить после столбца
$table->comment('Email пользователя'); // Комментарий к столбцу
```

## Изменение существующих столбцов

Для изменения столбцов требуется пакет `doctrine/dbal`:

```bash
composer require "doctrine/dbal:^3.0"
```

Пример изменения типа или параметров:

```php
Schema::table('users', function (Blueprint $table) {
    $table->string('name', 50)->nullable()->change();
});
```

Переименование столбца:

```php
Schema::table('users', function (Blueprint $table) {
    $table->renameColumn('from', 'to');
});
```

Удаление столбцов:

```php
Schema::table('users', function (Blueprint $table) {
    $table->dropColumn('votes');
    $table->dropColumn(['votes', 'avatar']);
});
```

## Индексы и внешние ключи

### Создание индексов

```php
$table->string('email')->unique(); // Уникальный индекс
$table->index(['account_id', 'created_at']); // Составной индекс
$table->primary('id'); // Первичный ключ
```

### Удаление индексов

```php
$table->dropPrimary('users_id_primary');
$table->dropUnique('users_email_unique');
$table->dropIndex('geo_state_index');
```

### Внешние ключи (Foreign Keys)

```php
Schema::table('posts', function (Blueprint $table) {
    $table->unsignedBigInteger('user_id');

    $table->foreign('user_id')
          ->references('id')->on('users')
          ->onDelete('cascade');
});
```

Удаление внешнего ключа:

```php
$table->dropForeign('posts_user_id_foreign');
$table->dropForeign(['user_id']);
```

Включение/отключение проверки внешних ключей:

```php
Schema::enableForeignKeyConstraints();
Schema::disableForeignKeyConstraints();
```
