# Lexora

Lexora is split into two parts:

- Backend: Python app in `backend/`
- Frontend: Vite app in `frontend/lexora/`

## Required versions

- Python: `3.13.7`
- Node.js: `v20.20.2`
- npm: `10.8.2`
- nvm: any recent `nvm` or `nvm-windows` version that can select Node 20.x

If you use `nvm`, switch to the Node version first, then install dependencies.

## Setup

### 1. Backend environment

From the project root, activate the Python virtual environment:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
& .\.venv\Scripts\Activate.ps1
```

If you need to create the environment again, use the Python version above and install the backend requirements from `backend/requirements.txt`.

### 2. Frontend dependencies

Install frontend dependencies in `frontend/lexora`:

```powershell
cd frontend\lexora
npm install
```

## Run the project

### Backend

From the repository root with the virtual environment activated:

```powershell
cd backend
python main.py
```

### Frontend

In a separate terminal:

```powershell
cd frontend\lexora
npm run dev
```

## Notes

- Keep secrets in environment variables or a local `.env` file that is not committed.
- The backend expects `OPENAI_API_KEY` and `GOOGLE_API_KEY` from the environment when those providers are used.
- The frontend uses Vite, so `npm run dev` starts the local development server.
