# WhatsApp Business Platform — Production Backend

Real-time WhatsApp Business API platform using Meta Cloud API.

## Architecture

```
Browser (Frontend)
      ↓ REST API calls
Express Server (server.js)
      ↓ Meta Cloud API calls
graph.facebook.com/v21.0
      ↓ Webhook delivery updates
Express Server (/webhook endpoint)
      ↓ Store in database
SQLite (data.db)
```

## Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Configure credentials
```bash
cp .env.example .env
# Edit .env and fill in your Meta credentials
```

### 3. Get Meta credentials
1. Go to https://developers.facebook.com/apps/
2. Create app → Add WhatsApp product
3. WhatsApp → API Setup → get:
   - **Phone Number ID** (numeric)
   - **Temporary Access Token** (use System User for production)
4. WhatsApp Manager → get:
   - **WhatsApp Business Account ID (WABA ID)**

### 4. Start the server
```bash
npm start
# or for development:
npm run dev
```

### 5. Open the app
```
http://localhost:3000
```

### 6. Configure webhook (for delivery updates)
1. Expose your server publicly using ngrok:
   ```bash
   npx ngrok http 3000
   ```
2. Copy the ngrok HTTPS URL
3. Set in .env: `PUBLIC_URL=https://xxxx.ngrok.io`
4. In Meta App Dashboard → WhatsApp → Configuration:
   - Webhook URL: `https://xxxx.ngrok.io/webhook`
   - Verify Token: same as `WEBHOOK_VERIFY_TOKEN` in .env
   - Subscribe to: **messages** field

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/send/template | Send template message |
| POST | /api/send/text | Send text message |
| POST | /api/send/media | Send media message |
| GET | /api/templates | List all templates |
| POST | /api/templates | Create/save template |
| POST | /api/templates/sync | Sync from Meta |
| DELETE | /api/templates/:id | Delete template |
| GET | /api/logs | Message logs |
| DELETE | /api/logs | Clear logs |
| GET | /api/logs/export | Export CSV |
| POST | /api/campaigns/launch | Launch bulk campaign |
| GET | /api/campaigns/:id/progress | Campaign progress |
| POST | /api/campaigns/upload-csv | Upload contacts CSV |
| GET | /api/dashboard | Stats & health |
| GET | /api/webhook/events | Webhook event log |
| GET | /api/blacklist | Blacklisted numbers |
| POST | /api/blacklist | Add to blacklist |
| DELETE | /api/blacklist/:phone | Remove from blacklist |
| GET | /api/optout/keywords | Opt-out keywords |
| POST | /api/optout/keywords | Add keyword |
| GET | /api/bots | Auto-reply rules |
| POST | /api/bots | Create bot rule |
| GET | /health | Server health check |
| GET | /webhook | Meta webhook verification |
| POST | /webhook | Receive Meta events |

## CSV Format for Campaigns

```csv
phone,var1,var2,var3
919876543210,Ravi Kumar,ORD001,₹500
918765432109,Priya Sharma,ORD002,₹1200
```

## Production Deployment

### On a VPS (Ubuntu)
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your code
git clone your-repo && cd wa-business-platform
npm install --production

# Use PM2 for process management
npm install -g pm2
pm2 start server.js --name wa-platform
pm2 save && pm2 startup

# Setup nginx reverse proxy
sudo apt install nginx
# Point nginx to http://localhost:3000
```

### Environment Variables
All in `.env` file:
- `META_ACCESS_TOKEN` — Your permanent System User token
- `META_PHONE_NUMBER_ID` — Numeric Phone Number ID from Meta
- `META_WABA_ID` — WhatsApp Business Account ID
- `WEBHOOK_VERIFY_TOKEN` — Any string you set in Meta Dashboard
- `API_SECRET_KEY` — Random string to protect your API endpoints
- `PUBLIC_URL` — Your public HTTPS URL (for webhook display)
- `PORT` — Server port (default 3000)

## Security Notes
- Credentials stored in SQLite on server — never sent to browser
- API key protection on all `/api/*` routes in production
- Rate limiting: 120 req/min general, 60 sends/min
- Blacklist checked before every message
- Opt-out handled server-side via webhook
