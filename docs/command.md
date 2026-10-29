---
sourcePath: "en/command.md"
---

# Консольные команды (Command)

Управление консольными командами в Hyperf реализуется пакетом [hyperf/command](https://github.com/hyperf/command), который построен поверх мощного компонента [symfony/console](https://github.com/symfony/console).

Все команды в Hyperf исполняются в корутинном окружении, что позволяет свободно использовать клиенты баз данных, Redis, очереди и асинхронный ввод-вывод прямо в консольных скриптах.

---

## Просмотр доступных команд

Вызов входного скрипта без аргументов отображает полный список команд:

```bash
php bin/hyperf.php
```

---

## Создание команды

Для быстрой генерации каркаса команды используйте `gen:command`:

```bash
php bin/hyperf.php gen:command UserReportCommand
```

Файл будет создан в каталоге `app/Command/UserReportCommand.php`:

```php
<?php
declare(strict_types=1);

namespace App\Command;

use Hyperf\Command\Annotation\Command;
use Hyperf\Command\Command as HyperfCommand;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputOption;

#[Command]
class UserReportCommand extends HyperfCommand
{
    // Имя команды для вызова в терминале:
    protected ?string $name = 'report:users';

    public function configure()
    {
        parent::configure();
        $this->setDescription('Генерация отчета по активности пользователей');

        // Аргументы команды (позиционные)
        $this->addArgument('days', InputArgument::OPTIONAL, 'Количество дней для отчета', 7);

        // Опции команды (флаги: --dry-run, --format=json)
        $this->addOption('dry-run', 'd', InputOption::VALUE_NONE, 'Тестовый прогон без отправки отчета');
        $this->addOption('format', 'f', InputOption::VALUE_REQUIRED, 'Формат отчета (csv, json)', 'json');
    }

    public function handle()
    {
        // Получение аргументов и опций:
        $days = (int) $this->input->getArgument('days');
        $dryRun = (bool) $this->input->getOption('dry-run');
        $format = (string) $this->input->getOption('format');

        $this->info("Формирование отчета за последние {$days} дней в формате [{$format}]...");

        if ($dryRun) {
            $this->warn('Внимание: запущен тестовый режим (--dry-run)');
        }

        // Логика выборки из БД с помощью корутинной ORM...
        // ...

        $this->info('Отчет успешно сформирован!');
    }
}
```

---

## Вывод информации в консоль

Класс `HyperfCommand` предоставляет встроенные методы форматирования вывода:

```php
// Информационное сообщение (зеленый цвет):
$this->info('Операция успешно завершена');

// Предупреждение (желтый цвет):
$this->warn('Внимание: ресурс занят');

// Ошибка (красный фон/текст):
$this->error('Критический сбой подключения');

// Стандартный вывод:
$this->line('Обычный текст');
```

### Табличный вывод:
```php
$headers = ['ID', 'Email', 'Статус'];
$rows = [
    [1, 'alex@example.com', 'Активен'],
    [2, 'maria@example.com', 'Заблокирован'],
];

$this->table($headers, $rows);
```

### Прогресс-бар (Progress Bar):
```php
$users = User::all();
$progressBar = $this->output->createProgressBar($users->count());

foreach ($users as $user) {
    // Обработка...
    $progressBar->advance();
}

$progressBar->finish();
$this->newLine();
```

---

## Интерактивный ввод данных

```php
// Вопрос с получением текстового ответа:
$name = $this->ask('Как вас зовут?', 'Гость');

// Скрытый ввод (для паролей):
$password = $this->secret('Введите пароль:');

// Подтверждение (Да/Нет):
if ($this->confirm('Вы действительно хотите удалить эти данные?', false)) {
    // Удаление...
}

// Выбор из списка вариантов:
$role = $this->choice('Выберите роль пользователя', ['admin', 'manager', 'user'], default: 2);
```

---

## Режимы аргументов и опций

### Аргументы (`InputArgument`):
* `InputArgument::REQUIRED` (1) — аргумент обязателен.
* `InputArgument::OPTIONAL` (2) — аргумент необязателен (обычно задается значение по умолчанию).
* `InputArgument::IS_ARRAY` (4) — массив значений (`php bin/hyperf.php report:users 1 2 3`).

### Опции (`InputOption`):
* `InputOption::VALUE_NONE` (1) — булев флаг (`--dry-run`).
* `InputOption::VALUE_REQUIRED` (2) — опция требует обязательного значения (`--format=json`).
* `InputOption::VALUE_OPTIONAL` (4) — значение опции может быть опущено.
* `InputOption::VALUE_IS_ARRAY` (8) — опция может повторяться несколько раз (`--id=1 --id=2`).
