# Manual Credential & Secret Rotation Guide

This document provides step-by-step instructions for manually rotating database credentials and JWT signing keys for **Mini Operations ERP**.

> 🛑 **IMPORTANT**: Do not perform credential rotation programmatically or automatically in code. Always follow these manual procedures when updating passwords or secrets in production or development environments.

---

## 📋 Table of Contents
1. [Rotating PostgreSQL / Supabase Database Passwords](#1-rotating-postgresql--supabase-database-passwords)
2. [Updating Local Environment Variables](#2-updating-local-environment-variables)
3. [Updating Database Connection Variables in Render / Cloud Hosting](#3-updating-database-connection-variables-in-render--cloud-hosting)
4. [Generating a New JWT Secret](#4-generating-a-new-jwt-secret)
5. [Updating `JWT_SECRET` in Deployment Host](#5-updating-jwt_secret-in-deployment-host)
6. [Redeploying Backend Services](#6-redeploying-backend-services)
7. [Invalidating Existing User Sessions](#7-invalidating-existing-user-sessions)
8. [Verifying Application Health Post-Rotation](#8-verifying-application-health-post-rotation)

---

## 🔑 1. Rotating PostgreSQL / Supabase Database Passwords

If using **Supabase**:
1. Log into your Supabase Dashboard at [supabase.com](https://supabase.com).
2. Select your project -> Go to **Project Settings** -> **Database**.
3. Under **Database Password**, click **Reset Database Password**.
4. Enter a strong, randomly generated new password and save changes.
5. Copy the updated Connection String URI under **Connection String** -> **URI**.

If using **Self-Hosted PostgreSQL**:
1. Connect to your PostgreSQL instance using `psql`:
   ```bash
   psql -U postgres -h localhost
   ```
2. Execute password rotation SQL command:
   ```sql
   ALTER USER postgres WITH PASSWORD 'NEW_SECURE_PASSWORD_HERE';
   ```

---

## 💻 2. Updating Local Environment Variables

1. Open your local `backend/.env` file.
2. Update the `DATABASE_URL` and `DIRECT_URL` variables with the new connection string:
   ```env
   DATABASE_URL="postgresql://postgres:NEW_SECURE_PASSWORD_HERE@localhost:5432/mini_erp_db"
   DIRECT_URL="postgresql://postgres:NEW_SECURE_PASSWORD_HERE@localhost:5432/mini_erp_db"
   ```
3. Save the file. Ensure `.env` is listed in `.gitignore` so it is not tracked by Git.

---

## ☁️ 3. Updating Database Connection Variables in Render / Cloud Hosting

1. Log into your Render dashboard at [render.com](https://render.com).
2. Select your backend Web Service (`mini-operations-erp-backend`).
3. Click on **Environment** in the left navigation menu.
4. Locate `DATABASE_URL` (and `DIRECT_URL` if configured).
5. Edit the variable value to reflect your new database connection URI.
6. Click **Save Changes**.

---

## 🔐 4. Generating a New JWT Secret

Generate a cryptographically secure 256-bit (32+ byte) random string using OpenSSL or Node.js in your terminal:

Using **OpenSSL**:
```bash
openssl rand -base64 32
```

Using **Node.js**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Save the generated string securely for update in deployment environments.

---

## 🔒 5. Updating `JWT_SECRET` in Deployment Host

1. In your Render or Cloud Web Service Environment Settings, find `JWT_SECRET`.
2. Replace the existing secret string with the newly generated random secret key.
3. Click **Save Changes**.

---

## 🚀 6. Redeploying Backend Services

After updating environment variables in your deployment dashboard:
1. In Render, click **Manual Deploy** -> **Clear Build Cache & Deploy**.
2. Monitor the deployment build log until the process completes:
   ```text
   ==> Building service...
   ==> Deploying service...
   ==> Server listening on port 5000
   ```

---

## 👤 7. Invalidating Existing User Sessions

> ℹ️ **Note on JWT Behavior**: Changing `JWT_SECRET` instantly renders all previously issued user JWT tokens invalid. When users send existing tokens, the server's `jwt.verify()` check will throw an authentication error (`401 Unauthorized`).

1. Users will be automatically prompted to log back in with their email and password upon their next REST API request.
2. No manual database session cleanup is needed because the system uses stateless JWT signatures.

---

## ✅ 8. Verifying Application Health Post-Rotation

Confirm that the API and database connection are fully operational:

1. **Query API Health Endpoint**:
   ```bash
   curl -i http://localhost:5000/api/health
   # Or query production endpoint:
   curl -i https://your-backend-domain.com/api/health
   ```
   *Expected Response*: `200 OK` with JSON payload `{"status":"OK","database":"CONNECTED"}`.

2. **Verify User Login Workflow**:
   Test authenticating with a valid seed account (`admin@example.com` / `Password123!`) to confirm JWT generation and database access are working cleanly.
