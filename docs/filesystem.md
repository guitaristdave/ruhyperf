---
sourcePath: "en/filesystem.md"
---

# Файловая система (Filesystem)

Компонент [hyperf/filesystem](https://github.com/hyperf/filesystem) интегрирует стандартный для PHP-экосистемы пакет [League\Flysystem](https://flysystem.thephpleague.com). Он абстрагирует работу с хранилищем, позволяя вашему приложению прозрачно работать как с локальным диском, так и с облачными S3-совместимыми хранилищами (AWS S3, MinIO, Yandex Cloud Object Storage) через единый унифицированный интерфейс.

---

## Установка

```bash
composer require hyperf/filesystem
```

### Подключение облачных адаптеров:

* **AWS S3 / MinIO / Yandex Cloud Object Storage / Selectel**:
  ```bash
  composer require "league/flysystem-aws-s3-v3:^3.0"
  composer require hyperf/guzzle
  ```
* **Хранилище в оперативной памяти (Memory Driver)**:
  ```bash
  composer require "league/flysystem-memory:^3.0"
  ```

Публикация конфигурационного файла:
```bash
php bin/hyperf.php vendor:publish hyperf/filesystem
```
Файл настроек будет создан в `config/autoload/file.php`.

---

## Конфигурация драйверов (`config/autoload/file.php`)

```php
<?php
return [
    'default' => 'local',
    'storage' => [
        // Локальный диск:
        'local' => [
            'driver' => \Hyperf\Filesystem\Adapter\LocalAdapterFactory::class,
            'root' => BASE_PATH . '/storage/uploads',
        ],
        // Облачное хранилище S3 / MinIO:
        's3' => [
            'driver' => \Hyperf\Filesystem\Adapter\AwsS3AdapterFactory::class,
            'credentials' => [
                'key' => env('S3_KEY'),
                'secret' => env('S3_SECRET'),
            ],
            'region' => env('S3_REGION', 'us-east-1'),
            'version' => 'latest',
            'bucket_endpoint' => false,
            'use_path_style_endpoint' => true,
            'endpoint' => env('S3_ENDPOINT', 'http://127.0.0.1:9000'),
            'bucket' => env('S3_BUCKET', 'my-bucket'),
        ],
    ],
];
```

---

## Использование файловой системы

### 1. Внедрение файловой системы по умолчанию

Внедрите интерфейс `League\Flysystem\FilesystemOperator` (или `League\Flysystem\Filesystem`):

```php
<?php
declare(strict_types=1);

namespace App\Service;

use League\Flysystem\FilesystemOperator;

class FileStorageService
{
    public function __construct(private FilesystemOperator $filesystem)
    {
    }

    public function saveAvatar(int $userId, string $fileContent): string
    {
        $path = "avatars/{$userId}.jpg";

        // Запись файла:
        $this->filesystem->write($path, $fileContent);

        return $path;
    }
}
```

---

### 2. Работа с несколькими хранилищами (`FilesystemFactory`)

Если вам нужно одновременно сохранять локальные временные файлы и загружать итоговые медиа в облако S3, используйте `FilesystemFactory`:

```php
<?php
declare(strict_types=1);

namespace App\Service;

use Hyperf\Filesystem\FilesystemFactory;

class MediaService
{
    public function __construct(private FilesystemFactory $factory)
    {
    }

    public function backup(string $fileName): void
    {
        $local = $this->factory->get('local');
        $s3 = $this->factory->get('s3');

        // Читаем локальный файл:
        $content = $local->read($fileName);

        // Загружаем в S3:
        $s3->write("backups/{$fileName}", $content);
    }
}
```

---

## Популярные методы API Flysystem

```php
// 1. Проверка существования:
$exists = $filesystem->fileExists('documents/report.pdf');

// 2. Чтение файла:
$content = $filesystem->read('documents/report.pdf');

// 3. Запись через потоки (Streams) для больших файлов:
$stream = fopen($uploadedFile->getRealPath(), 'r+');
$filesystem->writeStream('videos/large.mp4', $stream);
if (is_resource($stream)) {
    fclose($stream);
}

// 4. Удаление файла:
$filesystem->delete('documents/old_report.pdf');

// 5. Копирование и перемещение:
$filesystem->copy('source.txt', 'target.txt');
$filesystem->move('old_path.txt', 'new_path.txt');

// 6. Получение списка файлов в папке:
$listing = $filesystem->listContents('documents/', deep: false);
foreach ($listing as $item) {
    echo $item->path();
}

// 7. Размер и время изменения:
$fileSize = $filesystem->fileSize('documents/report.pdf');
$lastModified = $filesystem->lastModified('documents/report.pdf');
```
