---
sourcePath: "en/component-guide/create.md"
---

# Создание нового компонента

Hyperf предоставляет готовый генератор для быстрого создания скелета нового компонента.

```bash
# Создание компонента для актуальной версии Hyperf
composer create-project hyperf/component-creator your_component dev-master

# Создание компонента для конкретной ветки Hyperf (например, 3.1.*)
composer create-project hyperf/component-creator your_component "3.1.*"
```

## Подключение локального неопубликованного компонента в проект

Предположим, у вас есть следующая структура каталогов на машине:

```
/opt/project        # Каталог основного проекта
/opt/your_component # Каталог разрабатываемого компонента
```

Если компонент называется `your_vendor/your_component`, добавьте его локальный путь в `composer.json` проекта `/opt/project/composer.json`:

```json
{
    "require": {
        "your_vendor/your_component": "dev-master"
    },
    "repositories": {
        "your_component": {
            "type": "path",
            "url": "/opt/your_component"
        }
    }
}
```

После этого перейдите в `/opt/project` и выполните установку:

```bash
composer update your_vendor/your_component -o
```
