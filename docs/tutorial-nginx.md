---
sourcePath: "en/tutorial/nginx.md"
---

# Обратный прокси-сервер Nginx (Reverse Proxy)

[Nginx](http://nginx.org/) — высокопроизводительный HTTP-сервер и обратный прокси-сервер. В архитектуре Hyperf Nginx часто размещается перед сервисами приложений в качестве фронтэнд-сервера (reverse proxy) для:
- Терминации SSL/TLS (HTTPS)
- Балансировки нагрузки между несколькими узлами Hyperf
- Отдачи статических файлов
- Защиты от медленных клиентов (Slowloris) и буферизации запросов

## Настройка HTTP Reverse Proxy

```nginx
# Определение пула upstream-серверов Hyperf (один или несколько серверов)
upstream hyperf {
    server 127.0.0.1:9501;
    server 127.0.0.1:9502;
    keepalive 32;
}

server {
    listen 80;
    server_name proxy.hyperf.io;

    location / {
        # Использование протокола HTTP 1.1 для поддержки keep-alive соединений
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Передача реальных данных клиента (IP, хост) в приложение
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Настройка cookie безопасности
        proxy_cookie_path / "/; secure; HttpOnly; SameSite=strict";
        
        # Проксирование на upstream пул Hyperf
        proxy_pass http://hyperf;
    }
}
```

## Настройка WebSocket Reverse Proxy

Для проксирования соединений WebSocket требуется добавить заголовки `Upgrade` и `Connection`:

```nginx
upstream hyperf_websocket {
    # Метод ip_hash гарантирует, что запросы одного клиента направляются на один и тот же рабочий узел
    ip_hash;
    server 127.0.0.1:9503;
    server 127.0.0.1:9504;
}

server {
    listen 80;
    server_name websocket.hyperf.io;
    
    location / {
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    
        # Таймаут удержания WebSocket-соединения без активности (настройте под логику heartbeat / ping-pong)
        proxy_read_timeout 60s;
        
        proxy_pass http://hyperf_websocket;
    }
}
```
