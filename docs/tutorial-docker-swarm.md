---
sourcePath: "en/tutorial/docker-swarm.md"
---

# Развертывание в кластере Docker Swarm

Технологии контейнеризации Docker позволяют легко организовать кластерную инфраструктуру даже для небольших команд, используя связку из GitLab, реестра образов (например, Alibaba Cloud или Docker Hub) и Docker Swarm.

## Установка Docker

```bash
curl -fsSL https://get.docker.com | sh
```

## Развертывание собственного GitLab

### Установка GitLab CE

Сначала освободим порт `22` для Git SSH, переведя стандартный системный `sshd` на порт `2222`:

```bash
# Отредактируйте /etc/ssh/sshd_config
# Port 2222

systemctl restart sshd.service
```

Запустите контейнер GitLab:

```bash
sudo docker run -d --hostname gitlab.example.com \
  --publish 443:443 --publish 80:80 --publish 22:22 \
  --name gitlab --restart always \
  --volume /srv/gitlab/config:/etc/gitlab \
  --volume /srv/gitlab/logs:/var/log/gitlab \
  --volume /srv/gitlab/data:/var/opt/gitlab \
  gitlab/gitlab-ce:latest
```

При первом входе в веб-интерфейс GitLab задайте пароль администратора (пользователь `root`).

### Установка и регистрация gitlab-runner

На машине сборщика установите GitLab Runner:

```bash
# Для CentOS / RHEL
curl -L https://packages.gitlab.com/install/repositories/runner/gitlab-runner/script.rpm.sh | sudo bash
yum install -y gitlab-runner
```

Регистрация раннера:

```bash
gitlab-runner register
```

Укажите URL GitLab, регистрационный токен проекта/группы, тег (например, `builder`) и исполнитель `shell`.

## Инициализация кластера Docker Swarm

На управляющей ноде инициализируйте Swarm:

```bash
docker swarm init
```

Создайте общую оверлейную сеть для сервисов:

```bash
docker network create \
  --driver overlay \
  --subnet 12.0.0.0/8 \
  --opt encrypted \
  --attachable \
  default-network
```

Получите токен для подключения воркеров или других менеджеров:

```bash
# Токен для менеджеров
docker swarm join-token manager

# Токен для рабочих узлов (workers)
docker swarm join-token worker
```

На остальных серверах выполните выведенную команду `docker swarm join --token <TOKEN> <IP>:2377`.

## Установка Portainer

Для удобного визуального управления Swarm установите [Portainer](https://github.com/portainer/portainer):

```bash
docker service create \
    --name portainer \
    --publish 9000:9000 \
    --replicas=1 \
    --constraint 'node.role == manager' \
    --mount type=volume,src=portainer_data,dst=/data \
    --mount type=bind,src=//var/run/docker.sock,dst=/var/run/docker.sock \
    portainer/portainer-ce
```

Веб-панель Portainer будет доступна на порту `9000`.

## Настройка проекта Hyperf для деплоя

Создайте проект в GitLab на базе [hyperf-skeleton](https://github.com/hyperf/hyperf-skeleton).

### Пример файла развертывания deploy.test.yml:

```yaml
version: '3.7'
services:
  demo:
    image: $REGISTRY_URL/$PROJECT_NAME:test
    environment:
      - "APP_PROJECT=demo"
      - "APP_ENV=test"
    ports:
      - 9501:9501
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 5
      update_config:
        parallelism: 1
        delay: 5s
        order: start-first
    networks:
      - default-network
    configs:
      - source: demo_env_v1
        target: /opt/www/.env
configs:
  demo_env_v1:
    external: true
networks:
  default-network:
    external: true
```

Конфигурацию окружения (`.env`) сохраните через механизм `Docker Configs` (`demo_env_v1`), что позволит безопасно обновлять параметры без пересборки образов.

### Проверка работы

После успешного развертывания сервис Hyperf станет доступен на порту `9501` любой ноды кластера благодаря маршрутизирующей сетке Swarm (Routing Mesh):

```bash
curl http://127.0.0.1:9501/
```
