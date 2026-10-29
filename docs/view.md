---
sourcePath: "en/view.md"
---

# Представления и шаблоны (View)

Компонент [hyperf/view](https://github.com/hyperf/view) обеспечивает рендеринг HTML-страниц и представлений. Он поддерживает 5 популярных шаблонизаторов: **Blade**, **Twig**, **Smarty**, **Plates** и **ThinkTemplate**.

---

## Установка

```bash
composer require hyperf/view
```

Публикация конфигурационного файла:
```bash
php bin/hyperf.php vendor:publish hyperf/view
```

Конфигурационный файл `config/autoload/view.php`:

```php
<?php
declare(strict_types=1);

use Hyperf\View\Mode;
use Hyperf\View\Engine\BladeEngine;

return [
    // Шаблонизатор по умолчанию (например, Blade):
    'engine' => BladeEngine::class,

    // Режим рендеринга (рекомендуется Mode::TASK для безопасности корутин):
    'mode' => Mode::TASK,

    'config' => [
        'view_path' => BASE_PATH . '/storage/view/',
        'cache_path' => BASE_PATH . '/runtime/view/',
    ],
];
```

---

## Режимы рендеринга (Render Modes)

### 1. Режим `Mode::TASK` (рекомендуемый)
Рендеринг шаблона выполняется в отдельных фоновых процессах **Task Worker**, а не в основном корутинном процессе Worker. Это изолирует потенциально блокирующие файловые операции компиляции шаблонов от сетевого цикла событий.
> *Для работы требуется установить пакет `hyperf/task` и в `config/autoload/server.php` убедиться, что `task_enable_coroutine` установлено в `false`.*

### 2. Синхронный режим `Mode::SYNC`
Рендеринг шаблона выполняется непосредственно в текущем Worker-процессе. Используйте этот режим только в том случае, если используемый движок шаблонов полностью корутино-безопасен (например, `hyperf/view-engine`).

---

## Подключение шаблонизаторов

Сам пакет `hyperf/view` не содержит тяжелых зависимостей движков. Установите нужный вам шаблонизатор:

### Blade (нативный порт для Hyperf):
```bash
composer require hyperf/view-engine
```
*(Подробнее см. главу [Шаблонизаторы View Engine](view-engine))*

### Twig:
```bash
composer require twig/twig
```

### Smarty:
```bash
composer require smarty/smarty
```

### Plates:
```bash
composer require league/plates
```

---

## Использование в контроллере

Внедрите интерфейс `Hyperf\View\RenderInterface`:

1. Создайте шаблон `storage/view/index.blade.php`:
   ```html
   <!DOCTYPE html>
   <html lang="ru">
   <head>
       <meta charset="UTF-8">
       <title>Hyperf</title>
   </head>
   <body>
       <h1>Привет, {{ $name }}!</h1>
       <p>Сервер работает на Hyperf 3.1.</p>
   </body>
   </html>
   ```

2. Вызовите рендер в контроллере:
   ```php
   <?php
   declare(strict_types=1);

   namespace App\Controller;

   use Hyperf\HttpServer\Annotation\AutoController;
   use Hyperf\View\RenderInterface;

   #[AutoController]
   class HomeController
   {
       public function index(RenderInterface $render)
       {
           // Имя шаблона указывается без расширения (.blade.php):
           return $render->render('index', ['name' => 'Разработчик']);
       }
   }
   ```

---

## Раздача статических файлов (CSS, JS, изображения)

Чтобы Swoole мог самостоятельно отдавать статические файлы из папки `public/`, включите обработчик в `config/autoload/server.php`:

```php
return [
    'settings' => [
        'document_root' => BASE_PATH . '/public',
        'enable_static_handler' => true,
    ],
];
```
