module.exports = {
  apps: [
    {
      name: "engagd-backoffice",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3015",
      cwd: "/root/jackpot/engagd-backoffice",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 3015,
        NEXT_PUBLIC_API_ENDPOINT: "https://backoffice.hintx.org/api",
        NEXT_PUBLIC_HOST: "https://backoffice.hintx.org",
        NEXT_PUBLIC_API_JWT_NAME: "engagd-jwt-token",
      },
      error_file: "/var/log/engagd/backoffice-error.log",
      out_file: "/var/log/engagd/backoffice-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      autorestart: true,
      max_memory_restart: "1G",
    },
  ],
};
