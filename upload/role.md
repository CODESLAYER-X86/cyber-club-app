# 🔐 Role-Based Access Control (RBAC) Plan – FINAL

---

## 🧭 Executive Summary

RBAC defines **who can do what in the system**.

👉 Key Principle:

* Role = Job responsibility
* Permission = Allowed action

⚠️ Special Note:

* Platform Admin is a **system-level role**, not a club role

---

# 🧱 RBAC STRUCTURE

User → Role → Permission → Action

---

# 👥 ROLES DEFINITION

## 🧠 0. 🛠️ Platform Admin (SYSTEM OWNER)

### Purpose

Full system control, maintenance, and recovery

### Permissions

* Full access to all data
* Override any role
* Assign/remove any role
* Access all dashboards
* Modify system settings
* Manage database-level operations
* View and manage audit logs
* Suspend/restore accounts

### ⚠️ CRITICAL RESTRICTIONS (VERY IMPORTANT)

* Actions must still be logged
* Should NOT be used for daily operations
* Used only for:

  * System maintenance
  * Emergency recovery
  * Debugging issues

### 🔥 Risk Control

* Limited to 1–2 trusted people only
* Requires strong authentication

---

## 1. 🏛️ President

Strategic control & oversight

Permissions:

* Assign roles
* Assign event verifiers
* Approve high-level decisions
* View all data
* Access audit logs

Restrictions:

* Cannot bypass logs

---

## 2. 🧑‍💼 Vice President

Monitoring & analytics

Permissions:

* View analytics
* Monitor system

Restrictions:

* No financial or approval control

---

## 3. 📋 General Secretary (GS)

Operations management

Permissions:

* Manage members
* Approve expenses
* Assist coordination

Restrictions:

* Cannot create financial entries

---

## 4. 💰 Treasurer

Financial management

Permissions:

* Add budgets
* Add expenses
* Verify payments

Restrictions:

* Cannot approve own entries

---

## 5. 🎨 Media Team

Content & events

Permissions:

* Create/edit events
* Manage content

Restrictions:

* No financial access

---

## 6. ✅ Event Verifier (Dynamic)

Event-based approval

Permissions:

* Approve event payments

Rules:

* Assigned per event

---

## 7. 👤 Member

Basic user

Permissions:

* Register events
* Submit payments
* View own data

---

## 8. 🌐 Guest (Non-Member)

Public user

Permissions:

* View public content
* Apply for membership

---

# 🔐 PERMISSION MATRIX (UPDATED)

| Action           | Platform Admin | President | VP | GS      | Treasurer | Media | Verifier | Member  | Guest |
| ---------------- | -------------- | --------- | -- | ------- | --------- | ----- | -------- | ------- | ----- |
| Full Control     | ✅              | ❌         | ❌  | ❌       | ❌         | ❌     | ❌        | ❌       | ❌     |
| Assign Roles     | ✅              | ✅         | ❌  | ❌       | ❌         | ❌     | ❌        | ❌       | ❌     |
| Create Event     | ✅              | ❌         | ❌  | ❌       | ❌         | ✅     | ❌        | ❌       | ❌     |
| Add Budget       | ✅              | ✅         | ❌  | ❌       | ✅         | ❌     | ❌        | ❌       | ❌     |
| Add Expense      | ✅              | ❌         | ❌  | ❌       | ✅         | ❌     | ❌        | ❌       | ❌     |
| Approve Expense  | ✅              | ✅         | ❌  | ✅       | ❌         | ❌     | ❌        | ❌       | ❌     |
| Verify Payment   | ✅              | ❌         | ❌  | ❌       | ✅         | ❌     | ✅        | ❌       | ❌     |
| Register Event   | ✅              | ❌         | ❌  | ❌       | ❌         | ❌     | ❌        | ✅       | ❌     |
| View Finance     | ✅              | ✅         | ❌  | Limited | ✅         | ❌     | ❌        | Limited | ❌     |
| View Public Data | ✅              | ✅         | ✅  | ✅       | ✅         | ✅     | ✅        | ✅       | ✅     |

---

# ⚠️ CRITICAL CONTROL RULES

## 1. Separation of Duties

No user can create and approve same item

## 2. Least Privilege

Minimum required access only

## 3. Audit Logging

Everything tracked (including Platform Admin)

## 4. Platform Admin Isolation

* Not used daily
* Only emergency/system use

## 5. Multi-Level Approval

Sensitive actions require more than one role

---

# 🔄 ROLE INTERACTION FLOW

Member → submits payment
↓
Verifier/Treasurer → verifies
↓
GS/President → approves
↓
Audit log records action

Platform Admin → only intervenes if system failure

---

# 🧠 DESIGN PRINCIPLES

* No single operational control
* System-level override exists (Platform Admin)
* Transparency enforced at all levels
* Emergency recovery possible

---

# 🧾 FINAL RECAP

This RBAC system now includes:

* Platform Admin (system-level control)
* Club roles (operational control)
* Clear separation of power
* Strong anti-fraud design

👉 Result: Secure, scalable, and recoverable system

---

# ⏭️ NEXT STEP OPTIONS

1. Micro-permission design
2. Backend RBAC enforcement
3. Security threat modeling
4. Edge-case handling
