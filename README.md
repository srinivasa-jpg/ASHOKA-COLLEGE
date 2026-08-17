# CampusExam — College Examination Management System

A GitHub-ready, responsive **College Management System — Examination Section** built with **HTML, CSS and JavaScript**.

## Features

- Examination dashboard
- Student master with Add / Edit / Delete
- **Bulk student upload from CSV / Excel (.xlsx / .xls)**
- Bulk upload preview, validation and duplicate handling
- Downloadable student CSV template
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

## Bulk Student Upload

Open **Students → Bulk Upload**.

Supported file types:

- CSV
- Excel `.xlsx`
- Excel `.xls`

Recommended column headings:

`Hall Ticket, Name, Branch, Year, Semester, Regulation, Status`

Duplicate hall-ticket options:

- **Skip existing students**
- **Update existing students**

The upload screen validates each row before import. Invalid rows are not imported.

A ready-to-use template is included as `student_bulk_upload_template.csv`.

> Excel import uses the SheetJS browser library from a CDN. CSV import works without it.

## Run locally

No installation is required.

1. Download the project.
2. Open `index.html` in Chrome / Edge / Firefox.

For a better local development workflow, use VS Code + Live Server.

## Publish on GitHub Pages

1. Upload all project files to the repository.
2. Open **Settings → Pages**.
3. Under **Build and deployment**, choose:
   - Source: `Deploy from a branch`
   - Branch: `main`
   - Folder: `/ (root)`
4. Save.

## Important

This project is a **working front-end prototype** designed to run on GitHub Pages.

Data is saved only in the browser using `localStorage`. It is **not suitable for storing real confidential student/examination data in production**.

For a real college deployment, the next version should add secure login, role-based permissions, a backend API, PostgreSQL/MySQL, audit logs, backups, server-side validation, encrypted credentials and university-specific regulation rules.

## Project structure

```text
ASHOKA-COLLEGE/
├── index.html
├── styles.css
├── app.js
├── bulk-upload.css
├── bulk-upload.js
├── student_bulk_upload_template.csv
└── README.md
```
