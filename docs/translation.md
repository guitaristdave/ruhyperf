---
sourcePath: "en/translation.md"
---

# Локализация и перевод (Translation / I18n)

Компонент [hyperf/translation](https://github.com/hyperf/translation) предоставляет средства интернационализации (I18n), позволяя вашему приложению поддерживать множество языков с учетом плюрализации и плейсхолдеров.

---

## Установка и конфигурация

```bash
composer require hyperf/translation
php bin/hyperf.php vendor:publish hyperf/translation
```

Конфигурационный файл `config/autoload/translation.php`:

```php
<?php
return [
    // Язык по умолчанию:
    'locale' => 'ru',

    // Резервный язык (fallback), если перевод на основном языке отсутствует:
    'fallback_locale' => 'en',

    // Директория с языковыми пакетами:
    'path' => BASE_PATH . '/storage/languages',
];
```

---

## Структура языковых файлов

Языковые файлы хранятся в подпапках соответствующих локалей:

```text
storage/
└── languages/
    ├── en/
    │   └── messages.php
    └── ru/
        └── messages.php
```

Пример файла переводов `storage/languages/ru/messages.php`:

```php
<?php
return [
    'welcome' => 'Добро пожаловать в приложение, :name!',
    'apples' => '{0} Нет яблок|{1} :count яблоко|[2,4] :count яблока|[5,*] :count яблок',
];
```

---

## Использование переводов в коде

### 1. Через глобальные хелперы `__()` или `trans()`

```php
// Простой перевод:
echo __('messages.welcome', ['name' => 'Александр']);
// Вывод: Добро пожаловать в приложение, Александр!

echo trans('messages.welcome', ['name' => 'Александр']);
```

### 2. Через интерфейс `TranslatorInterface`

```php
use Hyperf\Contract\TranslatorInterface;

class GreetingService
{
    public function __construct(private TranslatorInterface $translator)
    {
    }

    public function greet(string $name, string $locale = 'ru'): string
    {
        return $this->translator->trans('messages.welcome', ['name' => $name], $locale);
    }
}
```

---

## Динамическая смена языка для текущего запроса

В корутинном окружении Hyperf смена языка через `$translator->setLocale('en')` изолирована: она действует **только в рамках текущего запроса (корутины)** и не затрагивает параллельные запросы других пользователей!

Пример в Middleware для переключения языка по заголовку `Accept-Language`:

```php
use Hyperf\Contract\TranslatorInterface;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;

class LocaleMiddleware implements MiddlewareInterface
{
    public function __construct(private TranslatorInterface $translator)
    {
    }

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $lang = $request->getHeaderLine('Accept-Language');
        if (in_array($lang, ['ru', 'en'])) {
            $this->translator->setLocale($lang);
        }

        return $handler->handle($request);
    }
}
```

---

## Плюрализация (множественные формы): `trans_choice()`

Для правильного склонения слов в зависимости от числительных используется функция `trans_choice()`:

```php
// 0 яблок:
echo trans_choice('messages.apples', 0); // "Нет яблок"

// 1 яблоко:
echo trans_choice('messages.apples', 1, ['count' => 1]); // "1 яблоко"

// 3 яблока:
echo trans_choice('messages.apples', 3, ['count' => 3]); // "3 яблока"

// 10 яблок:
echo trans_choice('messages.apples', 10, ['count' => 10]); // "10 яблок"
```
