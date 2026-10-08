// PM2 process definition for production. No secrets live here — real values (SESSION_SECRET, the
// first-run USER_*/ADMIN_* seed vars) come from .env.local in this same directory, which Next.js loads
// automatically and which is never committed to Git (see .gitignore). This file only sets NODE_ENV and the
// internal bind address/port; Nginx reverse-proxies public traffic to 127.0.0.1:3000.
module.exports = {
  apps: [
    {
      name: "c-n-dashboard",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000 -H 127.0.0.1",
      cwd: __dirname,
      exec_mode: "fork",
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      min_uptime: "10s",
      restart_delay: 3000,
      watch: false,
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
