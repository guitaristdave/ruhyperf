---
sourcePath: "en/tutorial/aliyun-logger.md"
---

# Сервис сбора логов Alibaba Cloud Log Service

При работе в Docker-кластере централизованный сбор логов с множества контейнеров является критически важной задачей. В облаке Alibaba Cloud для этого предусмотрен сервис Log Service (SLS) в связке с легковесным агентом Logtail.

## 1. Запуск контейнера Logtail

Запустите контейнер Logtail на каждом узле Docker кластера:

```bash
docker run -d \
  -v /:/logtail_host:ro \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --env ALIYUN_LOGTAIL_CONFIG=/etc/ilogtail/conf/${your_region_name}/ilogtail_config.json \
  --env ALIYUN_LOGTAIL_USER_ID=${your_aliyun_user_id} \
  --env ALIYUN_LOGTAIL_USER_DEFINED_ID=${your_machine_group_user_defined_id} \
  registry.cn-hangzhou.aliyuncs.com/log-service/logtail
```

Параметры:
- `${your_region_name}`: идентификатор региона (например, `cn-hangzhou`).
- `${your_aliyun_user_id}`: идентификатор аккаунта Alibaba Cloud.
- `${your_machine_group_user_defined_id}`: пользовательский идентификатор группы машин (например, `Hyperf`).

## 2. Настройка проекта и Logstore

1. В консоли Alibaba Cloud SLS создайте проект (Project) `hyperf`.
2. Создайте хранилище логов (Logstore), например `hyperf-demo-api`.
3. Создайте группу машин (Machine Group) с пользовательским идентификатором `Hyperf`.
4. Настройте конфигурацию сбора логов Logtail:
   - Путь к логам: `/opt/www/runtime/logs/*.log`
   - Белый список меток (Label Whitelist): `app.name = hyperf-demo-api`
   - Формат парсинга: многострочный регулярный шаблон (Full Regular Pattern)
   - Регулярное выражение первой строки: `\[\d+-\d+-\d+\s\d+:\d+:\d+\]\s.*`
   - Извлечение полей: `\[(\d+-\d+-\d+\s\d+:\d+:\d+)\]\s(\w+)\.(\w+):(.*)`
   - Имена полей: `time`, `name`, `level`, `content`.

## 3. Разметка Docker контейнера

При сборке Dockerfile приложения задайте метку `app.name`:

```dockerfile
FROM hyperf/hyperf:8.1-alpine-v3.18-swoole
LABEL maintainer="Hyperf Developers <group@hyperf.io>" version="1.0" license="MIT" app.name="hyperf-demo-api"
```

Агент Logtail автоматически обнаружит контейнеры с этой меткой и начнет потоковую доставку логов в Logstore для полнотекстового поиска и аналитики.

## Ограничения

- Logtail поддерживает драйверы хранилища Docker `overlay` и `overlay2`. При использовании других драйверов необходимо монтировать директорию логов в хост-систему через Volume.
