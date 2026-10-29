---
sourcePath: "en/view-engine.md"
---

# Движок шаблонов Blade (View Engine)

Пакет [hyperf/view-engine](https://github.com/hyperf/view-engine) — это переписанный и оптимизированный для корутинного окружения движок шаблонов **Laravel Blade**. 

В отличие от стандартных портов Blade, `hyperf/view-engine` поддерживает **синхронный режим рендеринга (`Mode::SYNC`)**, выполняя компиляцию шаблонов в нативный PHP прямо в Worker-процессе без накладных расходов на межпроцессное взаимодействие (IPC с Task Worker).

---

## Установка и генерация конфигурации

```bash
composer require hyperf/view-engine
php bin/hyperf.php vendor:publish hyperf/view-engine
```

Конфигурационный файл `config/autoload/view_engine.php`:

```php
<?php
return [
    'engine' => Hyperf\ViewEngine\HyperfViewEngine::class,
    'mode' => Hyperf\View\Mode::SYNC,
    'config' => [
        'view_path' => BASE_PATH . '/storage/view/',
        'cache_path' => BASE_PATH . '/runtime/view/',
    ],
    // Пользовательские компоненты:
    'components' => [
        // 'alert' => \App\View\Components\Alert::class,
    ],
];
```

---

## Синтаксис и возможности Blade в Hyperf

### 1. Наследование шаблонов

#### Главный макет (`storage/view/layouts/app.blade.php`):
```blade
<!DOCTYPE html>
<html lang="ru">
<head>
    <title>Приложение - @yield('title', 'Главная')</title>
</head>
<body>
    @section('sidebar')
        <nav>Главное меню</nav>
    @show

    <main class="container">
        @yield('content')
    </main>
</body>
</html>
```

#### Дочерняя страница (`storage/view/home.blade.php`):
```blade
@extends('layouts.app')

@section('title', 'Личный кабинет')

@section('sidebar')
    @parent
    <p>Дополнительная навигация личного кабинета</p>
@endsection

@section('content')
    <h2>Добро пожаловать, {{ $user['name'] }}!</h2>
@endsection
```

---

### 2. Отображение данных

* Экранированный вывод (защита от XSS): `{{ $variable }}`
* Неэкранированный вывод сырого HTML: `{!! $rawHtml !!}`
* Значение по умолчанию: `{{ $name ?? 'Гость' }}`
* Игнорирование синтаксиса Blade (для Vue/React): `@{{ message }}`

---

### 3. Управляющие конструкции и циклы

#### Условия `@if`:
```blade
@if (count($records) === 1)
    У вас одна запись.
@elseif (count($records) > 1)
    У вас несколько записей.
@else
    Записей нет.
@endif

@unless ($isSubscribed)
    <button>Подписаться</button>
@endunless
```

#### Цикл `@foreach` и переменная `$loop`:
```blade
<ul>
@forelse ($users as $user)
    <li class="{{ $loop->first ? 'active' : '' }}">
        {{ $loop->iteration }}. {{ $user->name }}
    </li>
@empty
    <li>Пользователей не найдено</li>
@endforelse
</ul>
```

Полезные свойства переменной `$loop`:
* `$loop->index` — индекс (с 0);
* `$loop->iteration` — номер итерации (с 1);
* `$loop->remaining` — сколько итераций осталось;
* `$loop->count` — общее число элементов;
* `$loop->first` / `$loop->last` — флаги первого/последнего элемента.

---

### 4. Рендеринг из контроллера

```php
use Hyperf\ViewEngine\Contract\FactoryInterface;

class HomeController
{
    public function index(FactoryInterface $view)
    {
        return $view->make('home', [
            'user' => ['name' => 'Алексей'],
            'users' => User::all(),
        ]);
    }
}
```
Или с помощью удобного хелпера:
```php
return view('home', ['user' => $user]);
```
