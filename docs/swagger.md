---
sourcePath: "en/swagger.md"
---

# Hyperf Swagger / OpenAPI

Компонент `hyperf/swagger` построен на базе библиотеки `zircote/swagger-php` и предоставляет удобную генерацию спецификаций OpenAPI/Swagger и встроенный интерфейс Swagger UI.

Полный список поддерживаемых атрибутов доступен в репозитории [zircote/swagger-php](https://github.com/zircote/swagger-php) и [официальной документации](https://zircote.github.io/swagger-php/).

## Установка

```bash
composer require hyperf/swagger --dev
```

## Конфигурация

Опубликуйте файл конфигурации:

```bash
php bin/hyperf.php vendor:publish hyperf/swagger
```

### Параметры конфигурации

| Параметр | Описание |
| :---: | :---: |
| `enable` | Включение/выключение генератора Swagger |
| `port` | Порт генератора документации |
| `json_dir` | Директория для сохранения сгенерированных JSON-файлов спецификации |
| `html` | HTML-шаблон для отображения Swagger UI |
| `url` | URL-маршрут для доступа к документации в браузере (например, `/swagger`) |
| `auto_generate` | Автоматическая генерация документации при старте приложения |
| `scan.paths` | Массив путей к директориям контроллеров для сканирования аннотаций |

## Генерация документации

Если параметр `auto_generate` установлен в `true`, документация будет генерироваться автоматически при запуске сервера. Также доступна ручная генерация через команду:

```bash
php bin/hyperf.php gen:swagger
```

## Использование атрибутов

> В примерах используется псевдоним `use Hyperf\Swagger\Annotation as SA;`

Фреймворк поддерживает запуск нескольких HTTP-серверов. С помощью атрибута `#[SA\HyperfServer]` можно разделять маршруты и генерировать отдельные файлы спецификаций для каждого сервера.

```php
#[SA\HyperfServer('http')]
```

### Пример документирования POST-запроса с телом формы:

```php
#[SA\Post(path: '/test', summary: 'Пример POST формы', tags: ['Api/Test'])]
#[SA\RequestBody(
    description: 'Параметры запроса',
    content: [
        new SA\MediaType(
            mediaType: 'application/x-www-form-urlencoded',
            schema: new SA\Schema(
                required: ['username', 'age'],
                properties: [
                    new SA\Property(property: 'username', description: 'Имя пользователя', type: 'string'),
                    new SA\Property(property: 'age', description: 'Возраст', type: 'string'),
                    new SA\Property(property: 'city', description: 'Город', type: 'string'),
                ]
            ),
        ),
    ],
)]
#[SA\Response(response: 200, description: 'Описание успешного ответа')]
public function test()
{
}
```

### Пример документирования GET-запроса:

```php
#[SA\Get(path: '/test', summary: 'Пример GET запроса', tags: ['Api/Test'])]
#[SA\Parameter(name: 'username', description: 'Имя пользователя', in: 'query', required: true, schema: new SA\Schema(type: 'string'))]
#[SA\Parameter(name: 'age', description: 'Возраст', in: 'query', required: true, schema: new SA\Schema(type: 'string'))]
#[SA\Parameter(name: 'city', description: 'Город', in: 'query', required: false, schema: new SA\Schema(type: 'string'))]
#[SA\Response(
    response: 200,
    description: 'Успешный ответ',
    content: new SA\JsonContent(
        example: '{"code":200, "data":[]}'
    ),
)]
public function list(ConversationRequest $request): array
{
}
```

### Совместное использование с валидатором (SwaggerRequest)

В атрибутах `SA\Property` и `SA\QueryParameter` можно указывать параметр `rules`. В связке с `SwaggerRequest` это позволяет автоматически валидировать входящие параметры прямо по спецификации OpenAPI:

```php
<?php
namespace App\Controller;

use Hyperf\Swagger\Request\SwaggerRequest;
use Hyperf\Swagger\Annotation as SA;

#[SA\HyperfServer(name: 'http')]
class CardController extends Controller
{
    #[SA\Post('/user/save', summary: 'Сохранить профиль пользователя', tags: ['user-management'])]
    #[SA\QueryParameter(name: 'token', description: 'Токен авторизации', type: 'string', rules: 'required|string')]
    #[SA\RequestBody(content: new SA\JsonContent(properties: [
        new SA\Property(property: 'nickname', type: 'string', rules: 'required|string'),
        new SA\Property(property: 'gender', type: 'integer', rules: 'required|integer|in:0,1,2'),
    ]))]
    #[SA\Response(response: 200, content: new SA\JsonContent(ref: '#/components/schemas/SavedSchema'))]
    public function info(SwaggerRequest $request)
    {
        $result = $this->service->save($request->all());

        return $this->response->success($result);
    }
}
```

### Замена CDN для интерфейса Swagger Dashboard

По умолчанию страница Swagger UI загружает ассеты с CDN. При необходимости вы можете изменить CDN или шаблоны в ключе `html` файла конфигурации `config/autoload/swagger.php`, например переключившись на `unpkg.com` или локальные скрипты.
