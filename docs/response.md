---
sourcePath: "en/response.md"
---

# Объект ответа (Response)

Объект HTTP-ответа в Hyperf реализует стандарт [PSR-7](https://www.php-fig.org/psr/psr-7/) (`Psr\Http\Message\ResponseInterface`) и доступен через интерфейс `Hyperf\HttpServer\Contract\ResponseInterface`.

> **Важно помнить:** Стандартный PSR-7 объект ответа является **неизменяемым (Immutable)**. Все методы модификации заголовков или статуса (начинающиеся с `with*`, например `$response->withStatus(201)`) возвращают **новый клон** объекта.

---

## Способы формирования ответа

### 1. Автоматический возврат из контроллера (самый простой способ)

Hyperf автоматически форматирует данные, возвращаемые из методов контроллера:
* **Массив (`array`) или объект (`Arrayable`)**: автоматически сериализуется в JSON с заголовком `Content-Type: application/json; charset=utf-8`.
* **Строка (`string`)**: возвращается клиенту с заголовком `Content-Type: text/plain; charset=utf-8`.

```php
#[GetMapping(path: '/user')]
public function getUser(): array
{
    // Будет автоматически преобразовано в JSON {"id": 1, "name": "Dave"}
    return ['id' => 1, 'name' => 'Dave'];
}
```

---

### 2. Возврат JSON через `ResponseInterface`

Метод `$response->json($data)` принимает массив или объект, реализующий `Hyperf\Contract\Arrayable`:

```php
use Hyperf\HttpServer\Contract\ResponseInterface;
use Psr\Http\Message\ResponseInterface as PsrResponseInterface;

public function index(ResponseInterface $response): PsrResponseInterface
{
    $data = [
        'code' => 0,
        'message' => 'Успешно',
        'data' => ['items' => [1, 2, 3]],
    ];

    return $response->json($data);
}
```

---

### 3. Возврат XML

Метод `$response->xml($data)` устанавливает заголовок `Content-Type: application/xml` и форматирует массив или объект `Hyperf\Contract\Xmlable`:

```php
public function feed(ResponseInterface $response): PsrResponseInterface
{
    return $response->xml([
        'item' => [
            'title' => 'Hyperf News',
            'link' => 'https://hyperf.wiki',
        ],
    ]);
}
```

---

### 4. Необработанный контент (Raw / HTML)

```php
public function raw(ResponseInterface $response): PsrResponseInterface
{
    return $response->raw('<h1>Привет, Hyperf!</h1>')
        ->withHeader('Content-Type', 'text/html; charset=utf-8');
}
```

---

### 5. Перенаправления (Redirects)

Метод `redirect(string $toUrl, int $status = 302, string $schema = 'http')`:

```php
public function toProfile(ResponseInterface $response): PsrResponseInterface
{
    // Относительный редирект (хост и протокол подставятся автоматически)
    return $response->redirect('/user/profile');

    // Абсолютный редирект с указанием HTTP-кода 301 Permanent Redirect
    // return $response->redirect('https://example.com/new-url', 301);
}
```

---

### 6. Установка Cookies

Для установки Cookie используется класс `Hyperf\HttpMessage\Cookie\Cookie`:

```php
use Hyperf\HttpMessage\Cookie\Cookie;

public function setSession(ResponseInterface $response): PsrResponseInterface
{
    // Cookie(name, value, expire, path, domain, secure, httpOnly, sameSite)
    $cookie = new Cookie(
        name: 'session_id',
        value: 'xyz123',
        expire: time() + 3600,
        path: '/',
        httpOnly: true
    );

    return $response->withCookie($cookie)
        ->json(['status' => 'logged_in']);
}
```

---

### 7. Скачивание файлов (Download)

Метод `download(string $file, string $name = '')` отправляет файл клиенту в виде вложения (`Content-Disposition: attachment`), корректно обрабатывая заголовки кэширования `ETag` и `304 Not Modified`:

```php
public function exportReport(ResponseInterface $response): PsrResponseInterface
{
    $filePath = BASE_PATH . '/runtime/reports/monthly.pdf';

    // Вторым аргументом передается имя файла, отображаемое клиенту при скачивании
    return $response->download($filePath, 'report-2026-10.pdf');
}
```
