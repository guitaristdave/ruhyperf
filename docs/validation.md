---
sourcePath: "en/validation.md"
---

# Валидация данных (Validation)

Компонент [hyperf/validation](https://github.com/hyperf/validation) основан на валидаторе [illuminate/validation](https://github.com/illuminate/validation) (из экосистемы Laravel). Он адаптирован для работы в асинхронном корутинном окружении Hyperf, сохраняя все привычные правила валидации и синтаксис.

---

## Установка и первоначальная настройка

### 1. Установка пакета:
```bash
composer require hyperf/validation
```

### 2. Подключение глобального middleware:
В файле `config/autoload/middlewares.php` зарегистрируйте `ValidationMiddleware` (необходимо для автоматической работы `FormRequest`):

```php
<?php
return [
    'http' => [
        \Hyperf\Validation\Middleware\ValidationMiddleware::class,
    ],
];
```

### 3. Подключение обработчика ошибок валидации:
В файле `config/autoload/exceptions.php`:

```php
<?php
return [
    'handler' => [
        'http' => [
            \Hyperf\Validation\ValidationExceptionHandler::class,
        ],
    ],
];
```

### 4. Публикация языковых файлов (переводы сообщений об ошибках):
```bash
php bin/hyperf.php vendor:publish hyperf/translation
php bin/hyperf.php vendor:publish hyperf/validation
```
Файлы переводов будут размещены в `storage/languages/`.

---

## Способы валидации

### Способ 1. Запросы форм (FormRequest) — рекомендуемый способ

Для изоляции логики валидации от контроллера создается специальный класс запроса:

```bash
php bin/hyperf.php gen:request UserRegisterRequest
```

Файл будет создан в каталоге `app/Request/UserRegisterRequest.php`:

```php
<?php
declare(strict_types=1);

namespace App\Request;

use Hyperf\Validation\Request\FormRequest;

class UserRegisterRequest extends FormRequest
{
    /**
     * Определение прав на выполнение запроса (авторизация).
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Правила валидации.
     */
    public function rules(): array
    {
        return [
            'email' => 'required|email|max:255',
            'username' => 'required|string|min:3|max:50',
            'password' => 'required|string|min:8|confirmed',
            'age' => 'nullable|integer|min:18',
        ];
    }

    /**
     * Пользовательские сообщения об ошибках.
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Адрес электронной почты обязателен для заполнения.',
            'password.min' => 'Пароль должен содержать не менее 8 символов.',
        ];
    }

    /**
     * Человекочитаемые названия атрибутов в ошибках.
     */
    public function attributes(): array
    {
        return [
            'email' => 'электронная почта',
            'password' => 'пароль',
        ];
    }
}
```

#### Использование в контроллере:
Достаточно объявить класс `UserRegisterRequest` в сигнатуре метода. Валидация выполнится **автоматически до** входа в тело метода контроллера:

```php
use App\Request\UserRegisterRequest;

#[PostMapping(path: '/register')]
public function register(UserRegisterRequest $request): array
{
    // Получение только успешно провалидированных данных:
    $validated = $request->validated();

    // Создание пользователя...
    return ['status' => 'success', 'user_id' => 1];
}
```
*Если валидация не прошла, автоматически выбрасывается `ValidationException`, и клиент получает JSON со списком ошибок и HTTP-статусом 422 Unprocessable Entity.*

---

### Способ 2. Ручное создание валидатора через фабрику

Если валидация требуется внутри сервиса или команды:

```php
use Hyperf\Di\Annotation\Inject;
use Hyperf\Validation\Contract\ValidatorFactoryInterface;

class OrderService
{
    #[Inject]
    protected ValidatorFactoryInterface $validationFactory;

    public function process(array $data)
    {
        $validator = $this->validationFactory->make(
            $data,
            [
                'amount' => 'required|numeric|min:0.01',
                'currency' => 'required|in:RUB,USD,EUR',
            ]
        );

        if ($validator->fails()) {
            // Первая ошибка:
            $error = $validator->errors()->first();
            throw new \InvalidArgumentException($error);
        }

        $cleanData = $validator->validated();
    }
}
```

---

## Популярные правила валидации

* `required` — поле обязательно и не должно быть пустым;
* `string`, `numeric`, `integer`, `boolean`, `array` — проверка типа данных;
* `email` — корректный формат email;
* `min:value`, `max:value` — минимальный/максимальный размер (для строк — длина, для чисел — значение, для массивов — кол-во элементов);
* `confirmed` — проверка совпадения поля с полем `{field}_confirmation` (например, пароль);
* `in:foo,bar,...` — значение должно входить в список;
* `not_in:foo,bar` — значение не должно входить в список;
* `regex:pattern` — проверка по регулярному выражению;
* `date`, `date_format:Y-m-d` — проверка даты и формата;
* `unique:table,column` — проверка уникальности записи в таблице базы данных;
* `exists:table,column` — проверка существования записи в БД;
* `nullable` — поле может быть `null`.
