# Finance Tracker Web Application

A full-stack MERN finance tracker with OTP-verified authentication and transaction management.

---

## Prerequisites

- Node.js v18+
- npm
- A MongoDB database (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- An [EmailJS](https://www.emailjs.com) account for sending OTP emails

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/Mohammedmt10/finance-tracker.git
cd finance-tracker
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create a `.env` file inside `server/` with the following variables:

```env
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority"
JWT_SECRET="your-secret-key-here"
PORT=3000

EMAIL_SERVICE_ID="your_emailjs_service_id"
EMAIL_TEMPLATE_ID="your_emailjs_template_id"
EMAIL_USER_ID="your_emailjs_public_key"
EMAIL_PRIVATE_KEY="your_emailjs_private_key"
```

| Variable | Source |
|---|---|
| `DATABASE_URL` | MongoDB Atlas > Connect > Drivers > connection string |
| `JWT_SECRET` | Any random string |
| `EMAIL_SERVICE_ID` | EmailJS Dashboard > Email Services |
| `EMAIL_TEMPLATE_ID` | EmailJS Dashboard > Email Templates |
| `EMAIL_USER_ID` | EmailJS Dashboard > Account > Public Key |
| `EMAIL_PRIVATE_KEY` | EmailJS Dashboard > Account > Private Key |

### 3. Start the backend

```bash
npm run dev
```

Runs on **http://localhost:3000**.

### 4. Start the frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

Runs on **http://localhost:3001**.

### 5. Open the app

Go to **http://localhost:3001** in your browser.
