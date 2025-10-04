# HR Management System

The **HR Management System** is a comprehensive web-based platform designed to streamline employee management, attendance tracking, payroll processing, task supervision, and internal communication within an organization.  
It combines a structured **PHP–MySQL backend** with a clean, modular **HTML//TAILWINDCSS/JavaScript frontend**.  
This project aims to centralize HR operations and provide managers, HR staff, and employees with efficient, accessible tools for daily workflows.

---
note : there is hierarchy in permissions and what u can do  hr can't access their self or their colleagues hr manager is the highest hierarchy with admin , managers in the other hand has thetpermissions of alert and assign meetings,tasks and targets for their employees.
---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [System Architecture](#system-architecture)
- [Database Structure](#database-structure)
- [Installation Guide](#installation-guide)
- [File Structure](#file-structure)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [License](#license)

---

## Overview

This HR Management System provides a unified solution for managing human resources data — including employee profiles, attendance logs, leave requests, targets, sales, payroll, meetings, alerts, and notifications.  
It is designed for small to medium-sized organizations that need an easily deployable and scalable HR platform.

The backend uses **PHP** and **MySQL**, while the frontend is composed of static **HTML**, **CSS**, and **JavaScript** pages.  
The included database initialization script automatically creates all required tables with relationships and constraints.

---

## Features

### Employee Management
- Maintain detailed employee profiles and credentials.  
- Define user roles: Employee, Manager, HR, HR Manager, Admin, Sales, Team Lead, Intern.  
- Manage departments, positions, and contact information.

### Attendance & Breaks
- Track clock-in and clock-out times.  
- Record total working hours and shift types.  
- Log coffee, lunch, or other break sessions.

### Tasks & Targets
- Assign and track progress on employee tasks.  
- Create performance targets and monitor achievements.  
- Link sales to targets for goal tracking.

### Payroll & Expenses
- Generate monthly payrolls with salary breakdowns.  
- Handle additions, deductions, and taxes.  
- Manage expense requests and approval workflows.

### Leave Management
- Submit and process leave requests.  
- HR or managers can approve, reject, or comment.  
- Maintain a clear leave history for each user.

### Alerts & Notifications
- Send company-wide alerts or department-specific messages.  
- Notify users of approvals, announcements, and meetings.  
- Track read/unread notification status.

### Meetings & Events
- Schedule and organize meetings.  
- Add participants and set meeting times.  
- Manage company events and attendance.

### Analytics & Reporting
- Provide visual HR analytics (attendance, performance, payroll).  
- Display and export reports via dashboard pages.

---

## System Architecture

**Frontend**
- Built with HTML5, CSS3, and vanilla JavaScript.  
- Responsive layout for desktop and mobile.  
- Organized structure for modular page management.

**Backend**
- PHP 8+ for server-side logic.  
- MySQL database with InnoDB engine for relational integrity.  
- Database initialization script for quick setup.

---

## Database Structure

The database (`hr_system`) includes multiple interrelated tables:

- `users` — Core employee data and credentials  
- `attendance`, `breaks` — Time tracking and shift management  
- `targets`, `sales` — Goal tracking and performance metrics  
- `tasks` — Employee task assignments  
- `expenses`, `leaves` — Expense and leave management  
- `alerts`, `alert_recipients`, `notifications` — Communication and alerts  
- `meetings` — Scheduling of meetings and participants  
- `user_states` — Employee state tracking (check-in, on break, etc.)  
- `payrolls` — Salary and payment details  

All foreign keys are properly linked with cascading updates and deletions for data consistency.

---
---

## Screenshots

Below are some preview images of the HR Management System interface, showing both **desktop** and **mobile** layouts.

### Desktop View

<p align="center">
  <img src="screenshot/desktop/Screenshot%202025-10-04%20224349.png" width="45%" alt="Desktop Screenshot 1" />
  <img src="screenshot/desktop/Screenshot%202025-10-04%20224432.png" width="45%" alt="Desktop Screenshot 2" />
</p>
<p align="center">
  <img src="screenshot/desktop/Screenshot%202025-10-04%20224449.png" width="45%" alt="Desktop Screenshot 3" />
  <img src="screenshot/desktop/Screenshot%202025-10-04%20224655.png" width="45%" alt="Desktop Screenshot 4" />
</p>

### Mobile (Phone) View

<p align="center">
  <img src="screenshot/phone/Screenshot%202025-10-04%20224010.png" width="30%" alt="Phone Screenshot 1" />
  <img src="screenshot/phone/Screenshot%202025-10-04%20224133.png" width="30%" alt="Phone Screenshot 2" />
  <img src="screenshot/phone/Screenshot%202025-10-04%20224212.png" width="30%" alt="Phone Screenshot 3" />
</p>
<p align="center">
  <img src="screenshot/phone/Screenshot%202025-10-04%20224305.png" width="30%" alt="Phone Screenshot 4" />
  <img src="screenshot/phone/Screenshot%202025-10-04%20224324.png" width="30%" alt="Phone Screenshot 5" />
</p>

---

### Full Gallery

You can view all screenshots in:
- [Desktop Screenshots](screenshot/desktop/)
- [Phone Screenshots](screenshot/phone/)

---

## Installation Guide

### Requirements
- PHP 8.0 or newer  
- MySQL 5.7 or newer  
- Web server (Apache or Nginx)  
- Modern web browser (Chrome, Firefox, Edge)

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Omar-Aldabbas/HR-management-system.git
   cd HR-management-system

---
