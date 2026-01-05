# Vistagram

## Prerequisites

- **Node.js**: v18+
- **Python**: v3.9+
- **MongoDB**: Local or Atlas URI
- **Cloudinary Account**: For media uploads

## Backend Setup

The backend is built with Python and FastAPI.

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Create a virtual environment (recommended):**

    ```bash
    python -m venv venv
    # Windows
    venv\Scripts\activate
    # macOS/Linux
    source venv/bin/activate
    ```

3.  **Install dependencies:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the `backend` directory with the following keys:

    ```env
    MONGO_URL=mongodb://localhost:27017 # or your Atlas URI
    DB_NAME=vistagram
    JWT_SECRET=your_super_secret_key
    CLOUDINARY_CLOUD_NAME=your_cloud_name
    CLOUDINARY_API_KEY=your_api_key
    CLOUDINARY_API_SECRET=your_api_secret
    ```

5.  **Run the Server:**
    ```bash
    uvicorn server:app --reload --port 8000
    ```
    The API will be available at `http://localhost:8000`.

## Frontend Setup

The frontend is built with React.

1.  **Navigate to the frontend directory:**

    ```bash
    cd frontend
    ```

2.  **Install dependencies:**

    ```bash
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env` file in the `frontend` directory:

    ```env
    REACT_APP_BACKEND_URL=http://localhost:8000
    ```

4.  **Run the Application:**
    ```bash
    yarn start
    ```
    The app will open at `http://localhost:3000`.

## Project Structure

- `backend/`: FastAPI server and database logic
- `frontend/`: React application using Craco and TailwindCSS
