# React Frontend
A minimal, production-ready React application with sensible defaults for development, testing, and deployment.

## Getting started
1. Install dependencies:
```
npm install
```
2. Start development server:
```
npm start
```
3. Build for production:
```
npm run build
```
## Deployment
Build the app and deploy the contents of the build output: S3 + CloudFront.

| Feature               | Location              | Execution                 |
| --------------------- | --------------------- | ------------------------- |
| Upload PDF            | Home/EditorPage       | Backend (S3 + Lambda)     |
| View PDF              | Editor                | Client                    |
| Rotate/Delete/Reorder | Editor                | Client-side using pdf-lib |
| Compress              | Sidebar → Lambda      | Server-side               |
| Recent Files          | RecentFiles Component | Backend (DynamoDB)        |
| Download PDF          | Topbar                | S3 Presigned URL          |
