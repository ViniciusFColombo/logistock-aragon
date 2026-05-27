# LogiStock Aragón 📦🚀

Proyecto en desarrollo: Sistema de gestión de inventario profesional con **FastAPI** y **PostgreSQL**. Actualmente cuenta con la base de datos configurada, arquitectura de servicios y CRUD de productos funcionando.

---

# 🇺🇸 English Version

An intelligent and professional inventory management system designed for e-commerce, built with **FastAPI**, **PostgreSQL**, and **Pandas**.

This project implements a scalable architecture using the **Service-Repository Pattern**, secure authentication, data intelligence for stock prediction, and an automated testing suite fully containerized with **Docker**.

---

# ⚙️ Configuration

This project uses environment variables to manage database connections and security settings.

## 1. Create a `.env` file in the root directory

## 2. Add the following variables

| Variable       | Description                  | Example                                  |
| :------------- | :--------------------------- | :--------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@db:5432/db_name` |
| `SECRET_KEY`   | Secret key for JWT/Security  | `your_super_secret_key_here`             |

> **Note:** The `db` hostname in `DATABASE_URL` is used because the API and Database run inside the same Docker network.

---

# 🐳 Quick Start with Docker

The entire ecosystem is containerized. To start the database and run the FastAPI server:

```bash
docker compose up --build -d
```

Once running, access the interactive API documentation (Swagger UI):

```text
http://localhost:8000/docs
```

---

# 🧪 Testing Suite & Quality Assurance

The test suite uses **Pytest** to simulate full application workflows without affecting the production database.

We maintain an **81% code coverage threshold**.

## Run tests inside the container

```bash
docker compose exec api pytest -v
```

## Generate coverage report summary

```bash
docker compose exec api pytest --cov=app
```

---

# 🛠️ Utility Scripts

To facilitate testing and data intelligence, the project includes:

* `seed_data.py`
  Automatically populates the database with mock products and stock movements.

* `stock_analysis.py`
  Uses **Pandas** to calculate sales velocity and predict when stock will run out based on recent history.

## Run the analysis inside the container

```bash
docker compose exec api python stock_analysis.py
```

---

# 🇪🇸 Versión en Español

Un sistema inteligente y profesional de gestión de inventarios diseñado para el comercio electrónico, desarrollado con **FastAPI**, **PostgreSQL** y **Pandas**.

Este proyecto implementa una arquitectura escalable utilizando el patrón **Service-Repository**, autenticación segura, inteligencia de datos para la predicción de stock y una suite de pruebas automatizadas completamente contenedorizada con **Docker**.

---

# ⚙️ Configuración

Este proyecto utiliza variables de entorno para gestionar la conexión a la base de datos y la seguridad.

## 1. Crear un archivo `.env` en la raíz del proyecto

## 2. Añadir las siguientes variables

| Variable       | Descripción                      | Ejemplo                                  |
| :------------- | :------------------------------- | :--------------------------------------- |
| `DATABASE_URL` | Cadena de conexión PostgreSQL    | `postgresql://user:pass@db:5432/db_name` |
| `SECRET_KEY`   | Clave secreta para JWT/Seguridad | `tu_clave_secreta_aqui`                  |

> **Nota:** El hostname `db` en la URL se utiliza porque la API y la base de datos corren dentro de la misma red de Docker.

---

# 🐳 Inicio Rápido con Docker

Todo el ecosistema está contenedorizado. Para levantar la base de datos y ejecutar el servidor FastAPI:

```bash
docker compose up --build -d
```

Una vez en ejecución, puedes acceder a la documentación interactiva de la API (Swagger UI):

```text
http://localhost:8000/docs
```

---

# 🧪 Suite de Pruebas y Control de Calidad

La suite de pruebas utiliza **Pytest** para simular flujos completos de la aplicación sin afectar la base de datos de producción.

Se mantiene un umbral de **81% de cobertura de código**.

## Ejecutar pruebas dentro del contenedor

```bash
docker compose exec api pytest -v
```

## Verificar el resumen de cobertura

```bash
docker compose exec api pytest --cov=app
```

---

# 🛠️ Scripts de Utilidad

Para facilitar las pruebas y el análisis de datos, el proyecto incluye:

* `seed_data.py`
  Puebla automáticamente la base de datos con productos y movimientos de stock ficticios.

* `stock_analysis.py`
  Utiliza **Pandas** para calcular la velocidad de ventas y predecir cuándo se agotará el stock basándose en el historial reciente.

## Ejecutar el análisis dentro del contenedor

```bash
docker compose exec api python stock_analysis.py
```

---

# 🗺️ Project Architecture Blueprint / Estructura del Proyecto

```plaintext
app/
├── constants.py       # Global configurations / Configuraciones globales
├── database.py        # Database initialization / Inicialización de la base de datos
├── main.py            # API entry point / Punto de entrada de la API
├── models.py          # SQLAlchemy models / Modelos de la Base de Datos
├── schemas.py         # Pydantic validation / Validación de Datos
├── repositories/      # Data Access Layer / Capa de Acceso a Datos
│   ├── auth_repo.py
│   └── inventory_repo.py
├── services/          # Business Logic & Pandas / Lógica de Negocio y Pandas
│   ├── auth_service.py
│   └── inventory_service.py
└── routes/            # API Routes / Endpoints
    ├── auth.py
    └── inventory.py
```
