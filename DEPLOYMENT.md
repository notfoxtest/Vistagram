# Vistagram Deployment Guide (Render)

This project is configured for **Render.com**, which supports the WebSockets required for Vistagram's real-time features.

## 1. Prerequisites

- A [Render](https://render.com) account.
- A [GitHub](https://github.com) account.
- Project pushed to a GitHub repository.

## 2. Setup Guide (The Easy Way)

We use a `render.yaml` "Blueprint" file to configure everything automatically.

1.  **Push your code** to GitHub (ensure `render.yaml` is in the root).
2.  Go to the [Render Dashboard](https://dashboard.render.com).
3.  Click **New +** and select **Blueprint**.
4.  Connect your GitHub repository.
5.  **Render will detect `render.yaml`** and ask you to approve the services.
6.  **Environment Variables**: It will ask you for values for the specific keys we defined (like `MONGO_URL`). Fill them in.
7.  Click **Apply**.

Render will now deploy both the Backend (Python) and Frontend (React Node service) automatically.

### Why "Node" for Frontend?

Unlike Vercel, Render Static Sites don't natively support dynamic client-side routing rewrites (`/*` -> `index.html`) easily without configuration. Using a simple Node service with `serve` ensures the app works perfectly on refresh.
_Note: I configured the frontend as a `web` service in `render.yaml` to make this easier._

## 3. Environment Variables

You will need to provide these during the Blueprint setup:

| Key                     | Description                             |
| ----------------------- | --------------------------------------- |
| `MONGO_URL`             | Your MongoDB Connection String (Atlas). |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary Cloud Name.             |
| `CLOUDINARY_API_KEY`    | Your Cloudinary API Key.                |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API Secret.             |

**Auto-Configured Variables:**

- `JWT_SECRET`: Render will generate a random secure key for you.
- `REACT_APP_BACKEND_URL`: The Blueprint automatically links the frontend to the backend's URL.

## 4. Troubleshooting

- **Backend Sleeps**: On the free tier, the backend sleeps after 15 mins of inactivity. It takes ~30-50s to wake up on the first request. This is normal for free plans.
- **Build Failures**: Check the logs in the Render dashboard.
