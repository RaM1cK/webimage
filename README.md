# WebImage — графический веб-редактор

Учебный проект по требованиям `REQUIRENMENTS.md`: веб-редактор растровых изображений, SVG (векторной) и 3D-графики с системой пользователей, хранением работ в S3 и REST API.

## Стек

- **Frontend:** React, react-router-dom, Bootstrap, opencv-js (`@techstark/opencv-js`), Three.js (3D-редактор)
- **Backend:** Python, Flask, Flask-JWT-Extended, SQLAlchemy, Redis, boto3 (S3), trimesh
- **Хранилище/инфраструктура:** PostgreSQL, Redis, LocalStack S3 (S3-compatible, можно заменить на MinIO), Docker / docker-compose

## Возможности

- Регистрация/авторизация пользователей (JWT + Redis), настройки автосохранения
- Главная страница: список работ пользователя, создание/открытие/удаление работ, настройка автосохранения
- **Растровый редактор (opencv-js):** загрузка изображений, изменение размера (интерполяция: ближайший сосед/билинейная/бикубическая/авто), вырезка по координатам, зеркальное отражение (H/V/оба), поворот на произвольный угол, яркость/контраст, цветовой баланс RGB, шум (гауссов/соль-перец), размытие (среднее/гауссово/медианное), экспорт PNG/JPEG (качество)/TIFF, сохранение в S3
- **SVG редактор:** создание холста, базовые примитивы (прямоугольник, эллипс, линия, ломаная, многоугольник, звезда, текст), заливка/обводка/толщина/скругление/пунктир, трансформации (перемещение, масштаб, поворот, наклон, отражение), слои, импорт/экспорт SVG, сохранение проекта/холста, Undo/Redo (до 10 шагов), сохранение в S3
- **3D редактор (Three.js):** редактирование сцены на Three.js: примитивы, выбор, перемещение/поворот/масштаб мышью (gizmo) и горячими клавишами, Undo/Redo, экспорт JSON/GLB, сохранение в S3. Инструменты в панели имеют подсказки при наведении.

## Архитектура фронтенда (по требованиям)

- `AbstractCanvasFactory` — фабрика для типа полотна (`getCanvas()`, `getToolBar()`)
- `BaseCanvas` / конкретные canvas-классы для raster/svg/3d
- `ToolStrategy` — стратегии инструментов с методом `process(context, params)`
- `ToolBar` — композиция инструментов

## Быстрый запуск (Docker)

1. Скопируйте переменные окружения:
   ```bash
   cp .env.example .env
   ```
2. Запустите сервисы:
   ```bash
   docker compose up --build
   ```
3. Откройте:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api/health
   - LocalStack S3 endpoint: http://localhost:4566

Сервисы: `client`, `server`, `postgres`, `redis`, `localstack` (S3).

## Локальный запуск без Docker

### Backend
```bash
cd server
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
# задайте переменные окружения (Postgres, Redis, S3/MinIO)
python wsgi.py
```

### Frontend
```bash
cd client
npm install
npm start
```
Переменная `REACT_APP_API_URL` (по умолчанию `http://localhost:5000/api`).

## REST API (основное)

- `POST /api/auth/register` — регистрация
- `POST /api/auth/login` — вход (JWT)
- `POST /api/auth/refresh` — обновление access token
- `POST /api/auth/logout` — выход (revocation в Redis)
- `GET /api/auth/me` — текущий пользователь
- `PATCH /api/auth/settings` — настройки автосохранения
- `GET /api/works` — список работ
- `POST /api/works` — создать работу
- `GET /api/works/:id` — получить работу
- `PUT /api/works/:id` — обновить/сохранить работу
- `POST /api/works/:id/autosave` — автосохранение
- `DELETE /api/works/:id` — удалить работу
- `POST /api/3d/scene`, `POST /api/3d/primitives/:kind`, `POST /api/3d/transform`, `POST /api/3d/export`

## Примечания

- Растровая обработка выполняется на клиенте с помощью `opencv-js`. Backend отвечает за пользователей, работы, автосохранение и хранение файлов в S3.
- SVG и 3D работы сохраняются как файлы (SVG/JSON) в S3 для последующего открытия.
- 3D-редактор реализован на клиенте с использованием **Three.js** (OrbitControls/TransformControls, raycasting).
- Требования из `Практическая работа 07/10/13.docx` учтены в реализованных инструментах и интерфейсах (часть возможностей может быть развита дополнительно).
