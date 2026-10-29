---
sourcePath: "en/eco/box.md"
---

# Hyperf Box

Box создан для улучшения опыта разработки PHP-приложений (в особенности на базе Hyperf), управления версиями PHP и зависимостями, сборки PHP-приложений в автономные бинарные исполняемые файлы, а также для предоставления встроенного обратного прокси-сервера (reverse proxy) для управления и развертывания приложений на базе Swoole и Swow.

## Установка Box

### macOS

```bash
wget https://github.com/hyperf/box/releases/download/v0.5.5/box_x86_64_macos -O box
sudo mv ./box /usr/local/bin/box
sudo chmod 755 /usr/local/bin/box
```
*(Убедитесь, что директория `/usr/local/bin` включена в переменную `$PATH`)*

### Linux x86_64

```bash
wget https://github.com/hyperf/box/releases/download/v0.5.5/box_x86_64_linux -O box
sudo mv ./box /usr/local/bin/box
sudo chmod 755 /usr/local/bin/box
```

### Linux aarch64 (ARM64)

```bash
wget https://github.com/hyperf/box/releases/download/v0.0.3/box_php8.1_aarch64_linux -O box
sudo mv ./box /usr/local/bin/box
sudo chmod 755 /usr/local/bin/box
```

### Windows

```powershell
curl -o box.exe https://github.com/hyperf/box/releases/download/v0.5.5/box_x64_windows.exe
```
*(Поместите `box.exe` в директорию, включенную в системный `PATH`, и запускайте через `box.exe`)*

## Инициализация GitHub Access Token

Box использует GitHub API для получения списка доступных версий пакетов:

1. [Создайте токен доступа GitHub](https://github.com/settings/tokens/new) (обязательно выберите scope `workflow`).
2. Сохраните токен командой:
   ```bash
   box config set github.access-token <YOUR_TOKEN>
   ```

## Настройка ядра (Kernel) Box

По умолчанию Box работает на базе движка Swow, но также поддерживает ядро Swoole. Переключить ядро можно командой `box config set kernel swoole` (обратите внимание: ядро Swoole поддерживает только PHP 8.1, сборка бинарников на нем недоступна, а на Windows поддерживается только Swow):

```bash
# Использовать ядро Swow [по умолчанию]
box config set kernel swow

# Использовать ядро Swoole (не поддерживается на Windows)
box config set kernel swoole
```

## Основные команды

- `box get pkg@version` — автоматическая установка пакета из репозитория (например, `box get php@8.1` для установки PHP 8.1, `box get composer` для Composer).
- `box build-prepare` — подготовка окружения к сборке бинарников.
- `box build-self` — сборка самого бинарника `box`.
- `box build <path>` — сборка приложения Hyperf в автономный бинарный исполняемый файл.
- `box self-update` — обновление утилиты `box` до последней версии.
- `box config list` — вывод текущей конфигурации.
- `box config get <key>` — получить значение параметра конфигурации.
- `box config set <key> <value>` — установить параметр конфигурации.
- `box config unset <key>` — удалить параметр.
- `box config set-php-version <version>` — выбор используемой версии PHP (8.0 | 8.1).
- `box config get-php-version` — текущая активная версия PHP.
- `box reverse-proxy -u <upstreamHost:upstreamPort>` — запуск HTTP reverse proxy для балансировки upstream-серверов.
- `box php <argument>` — запуск команд PHP через встроенную среду Box.
- `box composer <argument>` — запуск команд Composer.
- `box php-cs-fixer <argument>` — запуск php-cs-fixer.
- `box cs-fix <argument>` — запуск форматирования кода `php-cs-fix fix`.
- `box phpstan <argument>` — запуск анализатора кода PHPStan.
- `box pint <argument>` — запуск форматировщика Laravel Pint.
- `box version` — вывод версии утилиты Box.

## Использование со скелетом Swow

Для использования всех возможностей Box (включая компиляцию в бинарник) рекомендуется использовать проект на базе Swow:

```bash
box composer create-project hyperf/swow-skeleton:dev-master
```
