# CampusExam — College Examination Management System

A GitHub-ready, responsive **College Management System — Examination Section** built with **HTML, CSS and JavaScript**.

## Features

- Examination dashboard
- Student master with Add / Edit / Delete
- Search and branch filter
- Subject master
- Examination scheduling
- Marks entry
- Automatic grades and grade points
- SGPA calculation
- Optional rule: SGPA = 0 when any subject is failed
- Result processing
- Hall ticket generator
- Printable hall ticket
- Student / result / examination / backlog reports
- CSV export
- Dark mode
- Responsive mobile layout
- Browser `localStorage` database for demo use

## Run locally

No installation is required.

1. Download the project.
2. Open `index.html` in Chrome / Edge / Firefox.

For a better local development workflow, use VS Code + Live Server.

## Publish on GitHub Pages

1. Create a new GitHub repository, for example: `college-exam-management`.
2. Upload all files from this project to the repository.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
5. Save.

Your site will be available at:

`https://YOUR-USERNAME.github.io/college-exam-management/`

## Important

This project is a **working front-end prototype** designed to run on GitHub Pages.

Data is saved only in the browser using `localStorage`. It is **not suitable for storing real confidential student/examination data in production**.

For a real college deployment, the next version should add:

- Secure staff login
- Role-based permissions
- Backend API
- PostgreSQL / MySQL database
- Audit logs
- HTTPS deployment
- Database backups
- Server-side validation
- Encrypted credentials
- PDF marks memos and certificates
- Bulk Excel import
- University-specific regulation rules

## Project structure

```text
college_exam_management_system/
├── index.html
├── styles.css
├── app.js
└── README.md
```

## Suggested production upgrade

Recommended stack:

- Frontend: React
- Backend: Node.js + Express
- Database: PostgreSQL
- Authentication: Secure session/JWT + role permissions
- Deployment: Vercel/Netlify + Render/Railway/Supabase

---

You can freely replace the sample college name and demo data in the Settings screen and JavaScript seed data.
