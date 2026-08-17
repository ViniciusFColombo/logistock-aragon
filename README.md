# LogiStock Aragón 📦🚀

**Sistema inteligente de gestão de inventários para e-commerce**, desenvolvido com **FastAPI, PostgreSQL, React.js e Inteligência Artificial**.

O projeto utiliza uma arquitetura baseada no padrão **Service-Repository**, autenticação com **JWT**, dashboard interativo, análise inteligente de estoque e integração com um banco de dados PostgreSQL hospedado na nuvem através do **Neon**.

O backend é executado em **Docker**, enquanto o frontend é desenvolvido com **React.js + Vite** e executado localmente durante o desenvolvimento.

---

## 📺 Video Demo / Vídeo de Demonstración


> 🎬 **[Haga clic aquí para ver la demostración completa del proyecto en YouTube](https://www.youtube.com/watch?v=05OLCd_BDcI)**


---

# 🇪🇸 Versión en Español

LogiStock Aragón es un sistema inteligente e integral (**Full-Stack**) de gestión de inventarios para comercio electrónico, desarrollado con **FastAPI, PostgreSQL, React.js y un Agente de IA Integrado**.

El proyecto utiliza una arquitectura escalable basada en el patrón **Service-Repository**, autenticación segura mediante **JWT**, un panel de control interactivo y un motor de recomendación de stock impulsado por Inteligencia Artificial.

El backend está contenedorizado mediante **Docker**, mientras que el frontend se ejecuta localmente utilizando **React.js y Vite** durante el desarrollo.

La base de datos PostgreSQL está alojada en la nube mediante **Neon**.

## ✨ Características Principales

* **Frontend Interactivo:** Desarrollado con React.js, Tailwind CSS, Lucide Icons y soporte multi-idioma mediante i18n.
* **Panel de Control Inteligente:** Estado del inventario en tiempo real, alertas de stock bajo, métricas e historial de movimientos.
* **Agente de IA:** Análisis inteligente del inventario y recomendaciones de reposición basadas en consultas en tiempo real a la base de datos.
* **Backend Robusto:** Endpoints asíncronos con FastAPI, validaciones mediante Pydantic e integración con PostgreSQL.
* **Arquitectura Service-Repository:** Separación entre rutas de API, lógica de negocio y acceso a datos.
* **Autenticación JWT:** Sistema seguro de autenticación y autorización.
* **PostgreSQL en Neon:** Base de datos PostgreSQL alojada en la nube mediante Neon.
* **Backend con Docker:** API de FastAPI ejecutada dentro de un contenedor Docker.
* **Pruebas Automatizadas:** Suite de pruebas utilizando Pytest y análisis de cobertura.

---

# ⚙️ Configuración

La aplicación utiliza variables de entorno para gestionar las conexiones a la base de datos y las configuraciones de seguridad.

Las credenciales sensibles, como la conexión a PostgreSQL y la clave secreta de la aplicación, **no forman parte del código fuente ni se almacenan en el repositorio**.

## 1. Crear el archivo `.env`

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://user:password@your-neon-host/your-database
SECRET_KEY=tu_clave_secreta_aqui
```

> **Nota:** `DATABASE_URL` debe contener la cadena de conexión PostgreSQL proporcionada por Neon.

El archivo `.env` debe mantenerse fuera del control de versiones:

```gitignore
.env
```

---

# 🐳 Backend con Docker

El backend desarrollado con FastAPI está contenedorizado mediante **Docker y Docker Compose**.

Desde la carpeta raíz del proyecto:

```bash
docker compose up -d
```

Para reconstruir el contenedor:

```bash
docker compose up --build -d
```

La documentación interactiva de la API estará disponible en:

* 📑 **Swagger UI:** http://localhost:8000/docs

Para detener los servicios:

```bash
docker compose down
```

---

# 💻 Frontend

El frontend está desarrollado con **React.js y Vite** y actualmente se ejecuta localmente, fuera de Docker.

Accede a la carpeta del frontend:

```bash
cd frontend
```

Instala las dependencias:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

El frontend estará normalmente disponible en:

* 💻 **Aplicación Web:** http://localhost:5173

El frontend se comunica con el backend mediante la API REST de FastAPI.

---

# 🗺️ Project Architecture Blueprint / Estructura del Proyecto

```text
LogiStock-Aragon/
│
├── frontend/                  # React.js + Vite Web Application
│   ├── src/
│   │   ├── components/        # UI Components, Drawers, Modals, Sidebar
│   │   ├── pages/             # Dashboard, Products, Movements
│   │   └── services/          # Axios API integrations
│
├── app/                       # FastAPI Backend Application
│   ├── constants.py           # Global configurations
│   ├── database.py            # Database connection
│   ├── main.py                # API entry point
│   ├── models.py              # SQLAlchemy models
│   ├── schemas.py             # Pydantic schemas and validation
│   │
│   ├── repositories/           # Data Access Layer
│   ├── services/               # Business Logic & AI Agent Integration
│   └── routes/                 # API Routes / Endpoints
│
├── docker-compose.yml          # Backend container orchestration
├── .env                        # Environment variables (not committed)
├── .gitignore                  # Git ignore rules
└── README.md                   # Project documentation
```

---

# 🏗️ Arquitectura

La aplicación sigue el patrón **Service-Repository**, separando las responsabilidades para facilitar el mantenimiento, las pruebas y la escalabilidad del backend.

```text
                    ┌─────────────────────┐
                    │      React.js       │
                    │   Frontend / Vite   │
                    │    Desarrollo       │
                    └──────────┬──────────┘
                               │
                               │ HTTP / REST API
                               ▼
                    ┌─────────────────────┐
                    │       FastAPI       │
                    │       Backend       │
                    │       Docker        │
                    └──────────┬──────────┘
                               │
                               │ DATABASE_URL
                               ▼
                    ┌─────────────────────┐
                    │        Neon         │
                    │     PostgreSQL      │
                    │       Cloud         │
                    └─────────────────────┘
```

### Arquitectura del Backend

```text
                    ┌─────────────────────┐
                    │       Routes        │
                    │    API Endpoints    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Services       │
                    │   Lógica de negocio │
                    │    + Agente IA      │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    Repositories     │
                    │   Acceso a datos    │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │        Neon         │
                    │     PostgreSQL      │
                    └─────────────────────┘
```

Esta separación mantiene independientes la **capa de API**, la **lógica de negocio** y el **acceso a datos**, facilitando el mantenimiento y permitiendo que cada componente evolucione de forma independiente.

---

# 🛠️ Stack Tecnológico

| Categoría                     | Tecnología                 |
| ----------------------------- | -------------------------- |
| Backend                       | FastAPI                    |
| Lenguaje                      | Python                     |
| Frontend                      | React.js                   |
| Build Tool                    | Vite                       |
| Estilos                       | Tailwind CSS               |
| Iconos                        | Lucide Icons               |
| Base de Datos                 | PostgreSQL                 |
| Hosting de Base de Datos      | Neon                       |
| ORM                           | SQLAlchemy                 |
| Validación                    | Pydantic                   |
| Autenticación                 | JWT                        |
| Inteligencia Artificial       | AI Agent                   |
| Cliente API                   | Axios                      |
| Testing                       | Pytest                     |
| Contenedorización del Backend | Docker                     |
| Orquestación                  | Docker Compose             |
| Arquitectura                  | Service-Repository Pattern |

---

# 🔐 Seguridad

La configuración sensible de la aplicación se gestiona mediante **variables de entorno**.

La siguiente información **no se incluye en el repositorio**:

* Credenciales de PostgreSQL.
* Cadena de conexión de la base de datos Neon.
* Clave secreta utilizada para JWT.
* Otras credenciales y secretos de la aplicación.

El archivo `.env` está excluido del control de versiones mediante `.gitignore`.

De esta forma, las credenciales permanecen separadas del código fuente y no se exponen en el repositorio público.

---

# 🎯 Objetivos del Proyecto

Los principales objetivos de LogiStock Aragón son:

* Automatizar la gestión de inventarios.
* Proporcionar una visión del stock en tiempo real.
* Reducir el riesgo de falta de productos.
* Facilitar las decisiones de compra mediante recomendaciones basadas en Inteligencia Artificial.
* Mantener una arquitectura backend limpia y escalable.
* Proporcionar una interfaz moderna y responsive.
* Aplicar conocimientos prácticos de desarrollo Full-Stack, APIs, bases de datos, Docker, testing e Inteligencia Artificial.

---

# 🌎 English Version

An English version of the project documentation is available below.

> **LogiStock Aragón** is an intelligent full-stack inventory management system built with **FastAPI, PostgreSQL, React.js, and AI**.
>
> The project follows the **Service-Repository Pattern**, uses JWT authentication, a React.js frontend, a FastAPI backend running in Docker, and a PostgreSQL database hosted on Neon.
>
> The system includes inventory monitoring, stock alerts, movement tracking, AI-powered replenishment recommendations, automated testing, and a REST API.

---

LogiStock Aragón is an intelligent full-stack inventory management system designed for e-commerce, built with **FastAPI, PostgreSQL, React.js, and an Integrated AI Agent**.

The project uses a scalable architecture based on the **Service-Repository Pattern**, secure JWT authentication, an interactive dashboard, and an AI-powered stock recommendation engine based on real-time database information.

The backend is containerized using **Docker**, while the frontend runs locally using **React.js and Vite** during development.

The PostgreSQL database is hosted remotely on **Neon**, allowing the application to use a managed cloud database while keeping sensitive credentials outside the source code.

## ✨ Key Features

* **Interactive Frontend:** Built with React.js, Tailwind CSS, Lucide Icons, and internationalization (i18n).
* **Smart Dashboard:** Real-time inventory status, low-stock alerts, stock metrics, and movement history.
* **AI Agent Assistant:** AI-powered inventory analysis and stock replenishment recommendations based on real-time database queries.
* **Robust Backend:** Asynchronous FastAPI endpoints, Pydantic validation, and PostgreSQL integration.
* **Service-Repository Architecture:** Separation between API routes, business logic, and data access layers.
* **JWT Authentication:** Secure authentication and authorization system.
* **PostgreSQL on Neon:** Cloud-hosted PostgreSQL database used as the application's persistent data layer.
* **Dockerized Backend:** FastAPI backend configured to run inside a Docker container.
* **Automated Testing:** Test suite using Pytest and coverage analysis.

---

# ⚙️ Configuration & Environment

The application uses environment variables to manage database connections and security settings.

Sensitive credentials such as the database connection string and application secret key are **not committed to the repository**.

## 1. Create the `.env` file

Create a `.env` file in the root directory:

```env
DATABASE_URL=postgresql://user:password@your-neon-host/your-database
SECRET_KEY=your_super_secret_key_here
```

> **Note:** `DATABASE_URL` should contain the PostgreSQL connection string provided by Neon.

The `.env` file should remain local and must not be committed to Git.

A typical `.gitignore` configuration should include:

```gitignore
.env
```

The application reads these environment variables when the FastAPI backend starts.

---

# 🐳 Backend with Docker

The FastAPI backend is containerized using **Docker and Docker Compose**.

From the root directory of the project, start the backend with:

```bash
docker compose up -d
```

To rebuild the backend after making changes to the Docker configuration or dependencies:

```bash
docker compose up --build -d
```

The API will be available at:

* 📑 **Interactive API Documentation (Swagger UI):** http://localhost:8000/docs

To stop the Docker services:

```bash
docker compose down
```

---

# 💻 Frontend

The frontend is developed with **React.js and Vite** and currently runs locally rather than inside Docker.

Navigate to the frontend directory:

```bash
cd frontend
```

Install the dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

The frontend will normally be available at:

* 💻 **Web Application:** http://localhost:5173

The frontend communicates with the FastAPI backend through its REST API.

---

# 🧪 Testing & Quality Assurance

The project includes an automated test suite using **Pytest** to validate application workflows.

Tests can be executed inside the API container:

```bash
docker compose exec api pytest -v
```

To generate a test coverage report:

```bash
docker compose exec api pytest --cov=app
```

---

# 👨‍💻 Autor

**Vinicius Ferreira Colombo**

Desarrollador Full-Stack enfocado en **Python, FastAPI, automatización, APIs, bases de datos e integración de Inteligencia Artificial**.

---

## 📄 Licencia

Este proyecto ha sido desarrollado con fines educativos y como proyecto de portafolio.

