# Vistagram Deployment Guide (Vercel)

This project is configured as a Monorepo (Backend + Frontend) suitable for deployment on Vercel.

## 1. Prerequisites

- A [Vercel](https://vercel.com) account.
- A [GitHub](https://github.com) account.
- Project pushed to a GitHub repository.

## 2. Configuration Check

The project already includes a `vercel.json` file in the root directory that handles the routing and build configuration for both the Python/FastAPI backend and React frontend.

**Key Files:**

- `vercel.json`: Orchestrates the monorepo build and routing.
- `backend/requirements.txt`: Python dependencies.
- `frontend/package.json`: Frontend dependencies and build script.

## 3. Environment Variables

Vercel requires environment variables to be set in the Project Dashboard. You cannot just upload the `.env` file.

**Go to Vercel > Project > Settings > Environment Variables** and add the following:

| Key                     | Value Description                       |
| ----------------------- | --------------------------------------- |
| `MONGO_URL`             | Your MongoDB Connection String (Atlas)  |
| `DB_NAME`               | `vistagram` (or your preferred DB name) |
| `JWT_SECRET`            | A strong random string for security     |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name              |
| `CLOUDINARY_API_KEY`    | Your Cloudinary API Key                 |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API Secret              |
| `REACT_APP_BACKEND_URL` | **Leave Empty** (or set to `/`)         |

> **Note on `REACT_APP_BACKEND_URL`**: Since the frontend and backend are on the same Vercel domain (e.g., `vistagram.vercel.app`), the frontend can simply request `/api/...` without a full domain. Setting this variable to an empty value or just `/` ensures it uses the relative path.

## 4. Deployment Steps

### Option A: Deploy via GitHub Integration (Recommended)

1.  Push your code to a GitHub repository.
2.  Log in to Vercel and click **"Add New..."** > **"Project"**.
3.  Import your `Vistagram` repository.
4.  **Configure Project**:
    - **Root Directory**: Leave as `./` (default).
    - **Framework Preset**: It might detect Create React App or Others. "Other" is fine because `vercel.json` handles the builds.
    - **Build & Development Settings**: Leave default. The `vercel.json` file will override these.
    - **Environment Variables**: Add the variables listed above.
5.  Click **Deploy**.

### Option B: Deploy via Vercel CLI

1.  Install Vercel CLI: `npm install -g vercel`
2.  Run `vercel login`
3.  Run `vercel` in the project root.
4.  Follow the prompts:
    - Set up and deploy? **Yes**
    - Link to existing project? **No**
    - Project name? **vistagram**
    - Directory? **./**
    - Want to modify settings? **No** (It will detect `vercel.json`)
    - _Note: You still need to add Env Vars in the dashboard or via `vercel env add`._

## 5. Troubleshooting

- **404 on API**: Check `backend/server.py` logs in Vercel. Ensure `MONGO_URL` is correct.
- **Frontend Build Fail**: Check if `frontend/build` is being generated.
- **CORS Issues**: Usually not an issue on Monorepo since they share the origin, but check `CORS_ORIGINS` in backend if you set it.
