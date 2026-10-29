---
sourcePath: "en/tutorial/supervisor.md"
---

# Развертывание и управление процессами с помощью Supervisor

[Supervisor](http://www.supervisord.org/) — популярный инструмент управления процессами в операционных системах Linux/Unix. Он позволяет отслеживать, запускать, останавливать и перезапускать фоновые процессы. Если процесс сервиса Hyperf случайно завершится с ошибкой или будет принудительно остановлен сигналом `KILL`, Supervisor немедленно перезапустит его автоматически.

## Установка Supervisor

Пример установки в дистрибутивах на базе CentOS / RHEL:

```bash
yum install -y epel-release
yum install -y supervisor
```

Пример установки в Ubuntu / Debian:

```bash
apt-get update
apt-get install -y supervisor
```

## Создание конфигурационного файла

Скопируйте или создайте файл конфигурации программы в `/etc/supervisord.d/hyperf.ini` (или `/etc/supervisor/conf.d/hyperf.conf` в Ubuntu):

```ini
[program:hyperf]
# Команда запуска проекта (укажите реальный путь к проекту)
command=php /var/www/hyperf/bin/hyperf.php start
# Пользователь, от имени которого запускается процесс
user=root
# Автозапуск сервиса при старте Supervisor
autostart=true
# Автоматический перезапуск в случае падения
autorestart=true
# Минимальное время работы процесса для признания успешного старта (в сек)
startsecs=5
# Количество попыток перезапуска
startretries=3
# Лог ошибок процесса (stderr)
stderr_logfile=/var/www/hyperf/runtime/stderr.log
# Лог стандартного вывода (stdout)
stdout_logfile=/var/www/hyperf/runtime/stdout.log
```

## Запуск Supervisor

Запустите демон Supervisor:

```bash
supervisord -c /etc/supervisord.conf
```

Либо через systemd:

```bash
systemctl enable supervisord
systemctl start supervisord
```

## Управление приложением через supervisorctl

Для контроля запущенного приложения используйте утилиту командной строки `supervisorctl`:

```bash
# Проверить статус работы всех процессов
supervisorctl status

# Запустить приложение Hyperf
supervisorctl start hyperf

# Перезапустить приложение Hyperf
supervisorctl restart hyperf

# Остановить приложение Hyperf
supervisorctl stop hyperf

# Обновить конфигурации и перезагрузить измененные процессы
supervisorctl update
```
