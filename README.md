# GIFT COIN deployment

## What this repo contains
- `Qwen_html_20260725_8vxtp8ags.html` - frontend for Vercel / Telegram Mini App.
- `Qwen_js_20260725_tgmuaryvu.txt` - backend source.
- `server.js` - Node entry point that loads the backend file.
- `api/[...path].js` - Vercel proxy to the backend server.
- `vercel.json` - routes the Vercel root to the HTML file.

## Local run
1. Start backend:
   ```bash
   npm start
   ```
2. Open the HTML file in a browser.
3. For local testing, use:
   ```text
   file:///D:/ProjectM/coin/Qwen_html_20260725_8vxtp8ags.html?api=http://localhost:3001
   ```

## Deploy backend to your server
Use a normal VPS or dedicated server with Node.js 20+ and HTTPS. Do not try to store `data.json` on Vercel; the backend must keep state on the server disk.

### 1) Install dependencies on the server
```bash
sudo apt update
sudo apt install -y git nginx
```

Install Node.js 20+ with `nvm`, NodeSource, or your provider image.

### 2) Upload the repo
```bash
git clone https://github.com/Gerodot921/coin.git
cd coin
```

### 3) Set environment variables
Create `/var/www/coin/.env` or export them in your service:
```bash
PORT=3001
BOT_TOKEN=your_bot_token
SERVER_SECRET=some_long_random_string
AUTH_DEV=0
CORS_ORIGIN=https://your-vercel-domain.vercel.app
DATA_FILE=/var/www/coin/data.json
```

### 4) Run backend
```bash
npm start
```

### 5) Keep it running with systemd
Create `/etc/systemd/system/gift-coin.service`:
```ini
[Unit]
Description=GIFT COIN backend
After=network.target

[Service]
WorkingDirectory=/var/www/coin
EnvironmentFile=/var/www/coin/.env
ExecStart=/usr/bin/node /var/www/coin/server.js
Restart=always
User=www-data

[Install]
WantedBy=multi-user.target
```

Then run:
```bash
sudo systemctl daemon-reload
sudo systemctl enable --now gift-coin
sudo systemctl status gift-coin
```

### 6) Put nginx + HTTPS in front
Example nginx config for `api.your-domain.com`:
```nginx
server {
   server_name api.your-domain.com;

   location / {
      proxy_pass http://127.0.0.1:3001;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;
   }
}
```

Then issue SSL with Certbot:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.your-domain.com
```

## Deploy frontend to Vercel
- Import this folder into Vercel as a project.
- Set the environment variable `BACKEND_URL` to your backend base URL, for example `https://api.your-domain.com`.
- Vercel serves the HTML file as the root page and proxies `/api/*` requests to your backend.

## Telegram Mini App
- In BotFather, set the Web App URL to your Vercel domain, for example `https://your-project.vercel.app`.
- The frontend calls `/api/*` on the same Vercel domain, and Vercel forwards those requests to the backend.
- For local file testing only, use the `?api=http://localhost:3001` override.

## Production checklist
- Backend is reachable on `https://api.your-domain.com`.
- Vercel env var `BACKEND_URL` points to that backend.
- BotFather Web App URL points to the Vercel domain.
- `AUTH_DEV=0` in production.
- `data.json` exists on the server and is writable by the service user.
