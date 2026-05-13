Proyecto en desarrollo: Sistema de gestión de inventario profesional con FastAPI y PostgreSQL. Actualmente cuenta con la base de datos configurada y CRUD de productos funcionando.

## ⚙️ Configuration

This project uses environment variables to manage database connections and security settings.

1. Create a `.env` file in the root directory.
2. Add the following variables (adjust with your local credentials):

| Variable      | Description                                  | Example                                |
|---------------|----------------------------------------------|----------------------------------------|
| DATABASE_URL  | Connection string for PostgreSQL             | postgresql://user:pass@db:5432/db_name |
| SECRET_KEY    | Secret key for JWT/Security                  | your_super_secret_key_here            |

> **Note:** The `db` hostname in `DATABASE_URL` is used because the API and Database run within the same Docker network.

## 🛠️ Utility Scripts

To facilitate testing and data intelligence, the project includes:

*   **`seed_data.py`**: Automatically populates the database with mock products and stock movements.
*   **`stock_analysis.py`**: Uses **Pandas** to calculate sales velocity and predict when stock will run out based on recent history.

**To run the analysis inside the container:**
```bash
docker compose exec api python stock_analysis.py
````
----------------------------------------------------------------------------------------------------------------------------------
## ⚙️ Configuración

Este proyecto utiliza variables de entorno para gestionar la conexión a la base de datos y la seguridad.

1. Crea un archivo `.env` en la raíz del proyecto.
2. Añade las siguientes variables (ajústalas con tus credenciales locales):

| Variable      | Descripción                                      | Ejemplo                                |
|---------------|--------------------------------------------------|----------------------------------------|
| `DATABASE_URL`| Cadena de conexión para PostgreSQL               | `postgresql://user:pass@db:5432/db_name` |
| `SECRET_KEY`  | Clave secreta para la seguridad (JWT)            | `tu_clave_secreta_aqui`                |

> **Nota:** El nombre de host `db` en la URL se utiliza porque la API y la base de datos corren dentro de la misma red de Docker.

## 🛠️ Scripts de Utilidad

Para facilitar las pruebas y la inteligencia de datos, el proyecto incluye:

*   **`seed_data.py`**: Puebla la base de datos automáticamente con productos y movimientos de stock ficticios.
*   **`stock_analysis.py`**: Utiliza la librería **Pandas** para calcular la velocidad de ventas y predecir cuándo se agotará el stock basándose en el historial reciente.

**Para ejecutar el análisis en el contenedor:**
```bash
docker compose exec api python stock_analysis.py
