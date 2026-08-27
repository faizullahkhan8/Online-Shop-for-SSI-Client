module.exports = {
  apps: [
    {
      name: "backend",
      cwd: "./backend",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
      },
      autorestart: true,
      max_memory_restart: "300M",
    },
    {
      name: "frontend",
      cwd: "./frontend",
      script: "npm",
      args: "run dev",
      env: {
        NODE_ENV: "development",
      },
      autorestart: true,
      max_memory_restart: "300M",
    },
  ],
};
