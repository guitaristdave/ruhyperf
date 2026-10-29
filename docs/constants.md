---
sourcePath: "en/constants.md"
---

# Перечисления и константы (Constants / Enum)

Когда требуется определить коды и сообщения ошибок в приложении, традиционно используют следующий подход:

```php
<?php

class ErrorCode
{
    const SERVER_ERROR = 500;
    const PARAMS_INVALID = 1000;

    public static $messages = [
        self::SERVER_ERROR => 'Ошибка сервера',
        self::PARAMS_INVALID => 'Недопустимые параметры'
    ];
}

$message = ErrorCode::$messages[ErrorCode::SERVER_ERROR] ?? 'Неизвестная ошибка';
```

Однако такой подход не очень удобен: при каждом обращении к коду и тексту ошибки приходится дважды искать информацию в классе. Фреймворк предоставляет элегантное решение на основе перечислений (Enum в PHP 8.1+) и атрибутов.

## Установка

```bash
composer require hyperf/constants
```

## Использование

### Определение класса перечисления

Класс перечисления можно быстро сгенерировать с помощью команды `gen:constant`:

```bash
php bin/hyperf.php gen:constant ErrorCode --type enum
```

Будет создан класс:

```php
<?php

declare(strict_types=1);

namespace App\Constants;

use Hyperf\Constants\Annotation\Constants;
use Hyperf\Constants\Annotation\Message;
use Hyperf\Constants\EnumConstantsTrait;

#[Constants]
enum ErrorCode: int
{
    use EnumConstantsTrait;

    #[Message("Ошибка сервера!")]
    case SERVER_ERROR = 500;

    #[Message("Ошибка системных параметров")]
    case SYSTEM_INVALID = 700;
}
```

Для получения соответствующего сообщения ошибки достаточно вызвать:

```php
$message = ErrorCode::SERVER_ERROR->getMessage();
```

### Определение пользовательского исключения

Чтобы удобно выбрасывать ошибки в бизнес-логике, создадим класс исключения `BusinessException`, который автоматически подтягивает сообщение по переданному коду:

```php
<?php

declare(strict_types=1);

namespace App\Exception;

use App\Constants\ErrorCode;
use Hyperf\Server\Exception\ServerException;
use Throwable;

class BusinessException extends ServerException
{
    public function __construct(ErrorCode|int $code = 0, ?string $message = null, ?Throwable $previous = null)
    {
        if (is_null($message)) {
            if ($code instanceof ErrorCode) {
                $message = $code->getMessage();
            } else {
                $message = ErrorCode::getMessage($code);
            }
        }

        $code = $code instanceof ErrorCode ? $code->value : $code;

        parent::__construct($message, $code, $previous);
    }
}
```

### Вызов исключения в коде

После настройки исключение можно выбрасывать непосредственно в контроллерах или сервисах:

```php
<?php

declare(strict_types=1);

namespace App\Controller;

use App\Constants\ErrorCode;
use App\Exception\BusinessException;

class IndexController extends AbstractController
{
    public function index()
    {
        throw new BusinessException(ErrorCode::SERVER_ERROR);
    }
}
```

### Динамические параметры в сообщениях

При получении сообщения через `getMessage()` можно передавать аргументы для подстановки через `sprintf`:

```php
<?php

use Hyperf\Constants\Annotation\Constants;
use Hyperf\Constants\Annotation\Message;
use Hyperf\Constants\EnumConstantsTrait;

#[Constants]
enum ErrorCode: int
{
    use EnumConstantsTrait;

    #[Message("Параметр %s некорректен.")]
    case PARAMS_INVALID = 1000;
}

$message = ErrorCode::PARAMS_INVALID->getMessage(['user_id']);
// "Параметр user_id некорректен."
```

### Интернационализация (i18n)

> Функция доступна начиная с версии v1.1.13.

Чтобы компонент [hyperf/constants](https://github.com/hyperf/constants) поддерживал локализацию, необходимо установить компонент [hyperf/translation](https://github.com/hyperf/translation) и настроить языковые файлы:

```bash
composer require hyperf/translation
```

Подробнее о настройке см. раздел [Локализация (i18n)](translation.md).

Пример использования ключей перевода в константах:

```php
// Языковой файл перевода:
return [
    'params.invalid' => 'Параметр :param некорректен.',
];
```

```php
use Hyperf\Constants\Annotation\Constants;
use Hyperf\Constants\Annotation\Message;
use Hyperf\Constants\EnumConstantsTrait;

#[Constants]
enum ErrorCode: int
{
    use EnumConstantsTrait;

    #[Message("params.invalid")]
    case PARAMS_INVALID = 1000;
}

$message = ErrorCode::PARAMS_INVALID->getMessage(['param' => 'user_id']);
```
