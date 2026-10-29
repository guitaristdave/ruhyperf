---
sourcePath: "en/devtool.md"
---

# Инструменты разработки (DevTool)

Компонент `hyperf/devtool` предоставляет полезные инструменты для разработки, включая генераторы кода и интеграцию с редакторами.

## Установка

```bash
composer require hyperf/devtool --dev
```

## Доступные команды генерации

Выполните команду для вывода списка доступных консольных команд:

```bash
php bin/hyperf.php
```

Группа команд `gen:*` и команда `vendor:publish` предоставляются компонентом `devtool`:

```text
 gen
  gen:amqp-consumer  Создать новый класс AMQP consumer
  gen:amqp-producer  Создать новый класс AMQP producer
  gen:aspect         Создать новый класс аспекта (Aspect)
  gen:command        Создать новый класс консольной команды
  gen:controller     Создать новый класс контроллера
  gen:job            Создать новый класс задачи очередей (Job)
  gen:listener       Создать новый класс слушателя событий (Listener)
  gen:middleware     Создать новый класс промежуточного слоя (Middleware)
  gen:process        Создать новый класс пользовательского процесса (Process)
 vendor
  vendor:publish     Опубликовать конфигурационные файлы из пакетов vendor
```

## Быстрое открытие файлов в IDE (Quick Open)

Компонент поддерживает автоматическое открытие сгенерированных файлов в вашей IDE. Поддерживаются: `sublime`, `textmate`, `cursor`, `emacs`, `macvim`, `phpstorm`, `idea`, `vscode`, `vscode-insiders`, `vscode-remote`, `vscode-insiders-remote`, `atom`, `nova`, `netbeans`, `xdebug`.

Для настройки укажите используемую IDE в файле `config/autoload/devtool.php`:

```php
return [
    /**
     * Поддерживаемые редакторы и IDE:
     * "sublime", "textmate", "cursor", "emacs", "macvim", "phpstorm", "idea",
     * "vscode", "vscode-insiders", "vscode-remote", "vscode-insiders-remote",
     * "atom", "nova", "netbeans", "xdebug"
     */
    'ide' => env('DEVTOOL_IDE', 'vscode'),
];
```
