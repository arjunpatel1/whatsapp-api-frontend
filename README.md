# WhatsApp Business SaaS Platform

A full-stack WhatsApp Business Platform powered by the Meta Cloud API. This platform allows you to manage multiple WhatsApp Numbers, create/sync message templates, launch bulk campaigns, and handle automated opt-outs.

## Tech Stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **API:** Meta WhatsApp Cloud API (v21.0)

---

## 🚀 Quick Start (Local Development)

### 1. Backend Setup
1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your environment file:
   ```bash
   cp .env.example .env
   ```
   *Edit `.env` and configure your `MONGODB_URI`.*
4. Start the backend server:
   ```bash
   npm run dev
   ```

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open http://localhost:5173 in your browser.

---

## 🌍 Production Deployment (Main Server)

When deploying to your main server (e.g., Ubuntu VPS), follow these steps to serve both the frontend and backend from the same Express server.

### 1. Clone & Install
```bash
git clone your-repo-url
cd wa-business-platform

# Install Backend
cd backend
npm install --production

# Install Frontend
cd ../frontend
npm install
```

### 2. Build the Frontend
You must compile the React code into static files for production.
```bash
cd frontend
npm run build
```
This will generate a `dist` folder.

### 3. Copy Build to Backend
Copy the generated frontend build into the backend's `public` folder so Express can serve it.
```bash
# From the frontend folder:
mkdir -p ../backend/public
cp -R dist/* ../backend/public/
```

### 4. Start the Server with PM2
```bash
cd ../backend

# Ensure you have your .env file configured!
nano .env 

# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start server.js --name wa-platform
pm2 save
pm2 startup
```

### 5. Reverse Proxy (Nginx)
Point Nginx or Apache to `http://localhost:3000` (or whatever `PORT` you specified in your `.env` file).

---

## 🔗 Meta API Configuration

To receive delivery statuses (Sent, Delivered, Read, Failed) and handle incoming messages (Opt-outs, Bot replies), you must configure a Webhook in your Meta App Dashboard.

1. Go to **Meta App Dashboard → WhatsApp → Configuration**
2. Click **Edit Webhook**
3. **Webhook URL:** `https://your-domain.com/webhook`
4. **Verify Token:** Must match the `WEBHOOK_VERIFY_TOKEN` in your backend `.env` file.
5. Under **Webhook Fields**, click **Manage** and subscribe to:
   - `messages`

## 🔒 Security
- Always use HTTPS on your main server. Meta webhooks **require** a valid SSL certificate.
- Ensure your MongoDB instance is secured with authentication.
- Keep your Meta `System User Token` strictly confidential.
