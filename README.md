# Database Final Project


## Backend Setup

We will go through the steps on how to set up a local database that can interact with the frontend, as well as start the server in GO


### Requirements

Before getting started, make sure you have the following installed:

* **Go** (>= 1.21 recommended)
  [Download](https://go.dev/dl/)

  ```bash
  # Verify installation
  go version
  ```

* **PostgreSQL** (>= 14 recommended)
  [Download](https://www.postgresql.org/download/)

  ```bash
  # Example installation on Ubuntu/Debian
  sudo apt update
  sudo apt install postgresql postgresql-contrib


  ```

  
  Verify installation
  ```
  psql --version
  ```
  
  For linux/WSL only

  ```
  sudo passwd postgres
  ```

---
After cloning the repository, go to the backend directory

```bash
cd backend

```


1. Enter PostgreSQL shell:

```bash
sudo -u postgres psql
```

2. Create the database:
```sql
CREATE DATABASE otupark;
```
Connect to database
```sql
\c otupark
```

3. Create or alter the user (example credentials, this step is optional if you want to create a user but highly reccomended to do this step):

```sql
ALTER USER postgres PASSWORD 'postgres';
```
**Default example setup:**

* Database: `otupark`
* Username: `postgres`
* Password: `postgres`


quit from the Psql terminal
```sql
\q
```


---
## Install Goose (for Migrations)

We use **Goose** to manage database migrations: [Goose GitHub](https://github.com/pressly/goose)

```bash
go install github.com/pressly/goose/v3/cmd/goose@latest
```
## Run Database Migrations

Navigate to the schema directory:

```bash
cd sql/schema
```
Connection string examples:

* With username and password (use this if you did step 3 as your connection string):
  `postgres://postgres:postgres@localhost:5432/otupark?sslmode=disable`

* With username but no password:
  `postgres://postgres@localhost:5432/otupark?sslmode=disable`

* With no username/password (trust mode):
  `postgres://localhost:5432/otupark?sslmode=disable`

Run migrations with the connection string that is you decided to use accordingly:

```bash
goose postgres "<connection_string>" up
```

Should see something like this in the terminal
```bash
@localhost:5432/otupark?sslmode=disable" up
2025/11/20 01:13:24 OK   001_test.sql (5.37ms)
2025/11/20 01:13:24 OK   002_parkingLots.sql (10.22ms)
2025/11/20 01:13:24 OK   003_users.sql (9.95ms)
2025/11/20 01:13:24 OK   004_reviews.sql (5.54ms)
2025/11/20 01:13:24 OK   005_refresh_tokens.sql (5.12ms)
2025/11/20 01:13:24 OK   006_parking_logs.sql (5.54ms)
2025/11/20 01:13:24 OK   007_scoreConstraint.sql (1.18ms)
2025/11/20 01:13:24 OK   008_views.sql (17.86ms)
2025/11/20 01:13:24 OK   009_occupiedSlotsConstraint.sql (1.23ms)
2025/11/20 01:13:24 goose: successfully migrated database to version: 9
```


4. Insert some parking data

connect back to the database in the psql terminal

```bash
psql "<connection_string>" 
```


Insert this command into the psql terminal

```sql
INSERT INTO parkinglots (id, name, slots, occupiedslots)
VALUES 
(gen_random_uuid(), 'Commencement', 950, 0),
(gen_random_uuid(), 'Founders 4', 225, 0),
(gen_random_uuid(), 'Founders 3', 150, 0),
(gen_random_uuid(), 'Founders 5', 225, 0),
(gen_random_uuid(), 'Founders 2', 880, 0),
(gen_random_uuid(), 'Founders 1', 180, 0);

```

Make sure the data is inserted by calling this command, and seeing all the rows that were created
```sql
SELECT * FROM parkinglots;
```

quit from the Psql terminal
```sql
\q
```

Go back to the backend directory
```bash
cd ./../..
```

5. Create the .env file

In the backend directory, create a file named .env

In the .env file, paste the following
```bash
DB_URL = "<connection_string>"
JWTSecret = "nsnCEWq5SwMiY2e6g6jSp8cMtwdV6suTZcoyHXESbLxOunkv/AsGXbk/uw5y9cw+eXJ0iVn2FJt8XsQsfd7hGw=="
ADMINCODE = "admin123"
```

6. Run the Server
Now everything is set up, you can run the server with the command in the backend directory:
```bash
go run .
```

The server should be running now. Stop the server by Ctrl + C, and rerun the command to restart the server



