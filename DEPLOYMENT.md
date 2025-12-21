# Deployment Guide

This guide describes how to deploy the Library Management System using Docker.

## Prerequisites

-   [Docker](https://docs.docker.com/get-docker/) installed on your machine.
-   [Git](https://git-scm.com/) to clone the repository.

## Environment Variables

The application comes with default values for local development in `docker-compose.yml`, but for production, you should set these environment variables.

Create a `.env` file in the root directory (or use your CI/CD secrets manager):

```env
# Database
DB_USER=postgres
DB_PASSWORD=securepassword
DB_NAME=lms
DB_PORT=5432

# API
JWT_SECRET=complex_jwt_secret_key
JWT_REFRESH_SECRET=complex_refresh_secret_key
# API runs on port 3002 internally, exposed on 3001 by default

# Web
# Points to the API location accessible by the browser
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Running with Docker Compose

1.  **Build and Start Services**

    ```bash
    docker-compose up --build -d
    ```

    This command will:
    -   Build the `api` and `web` images using the multi-stage Dockerfiles.
    -   Start the Postgres database.
    -   Start the API service (accessible at `http://localhost:3001`).
    -   Start the Web service (accessible at `http://localhost:3003`).

2.  **Verify Deployment**

    -   **Web Interface**: Open [http://localhost:3003](http://localhost:3003) in your browser.
    -   **API Health**: Check [http://localhost:3001/api/docs](http://localhost:3001/api/docs) for Swagger documentation (if enabled).

3.  **Stopping the Services**

    ```bash
    docker-compose down
    ```

## Database Migrations

When running in production for the first time, you might need to apply migrations.

Since the API container runs the application, you can execute migrations from within the `api` container:

```bash
docker exec -it lms_api npx prisma migrate deploy
```

Or, if you have `npm` installed locally and want to run it against the dockerized DB:

```bash
# Ensure DATABASE_URL in .env points to localhost:5432
npx prisma migrate deploy
```

## Troubleshooting

-   **Database Connection**: If the API fails to connect to the DB, ensure the `db` service is healthy. Docker Compose `depends_on` waits for the container to start, but not necessarily for the DB to be ready to accept connections. The API (NestJS) should retry connections automatically.
-   **Ports in Use**: If ports 3001, 3003, or 5432 are busy, change the mapping in `docker-compose.yml` or `.env`.

