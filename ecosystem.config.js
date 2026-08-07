module.exports = {
  apps: [
    {
      name: "successor-crm",
      script: "npm",
      args: "start",
      cwd: __dirname,
      env: {
        NODE_ENV: "production",
      },
      autorestart: true,
      max_restarts: 10,
      watch: false,
    },
  ],
};
