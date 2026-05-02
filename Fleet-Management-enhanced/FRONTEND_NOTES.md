# Frontend Notes

This repository contains the backend API only.

## What belongs here
- Express server
- PostgreSQL configuration
- Redis / BullMQ queue configuration
- WebSocket backend
- API endpoints
- Worker / job processing

## What does not belong here
- React/Vite/Next frontend source code
- Static website assets
- Frontend build pipelines

## Recommended setup
- Keep the frontend in a separate repository or separate folder, such as `frontend/`.
- Use this backend repository for API and server logic only.
- Set the frontend to consume the backend API via environment variables:
  - `REACT_APP_API_URL`
  - `NEXT_PUBLIC_API_URL`

## Why this separation helps
- Avoids confusion between backend and frontend responsibilities
- Keeps deployment and hosting setups independent
- Makes the backend easier to maintain and secure
- Prevents accidental inclusion of frontend build tooling in the API repo
