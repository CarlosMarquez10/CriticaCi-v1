module.exports = {
  apps: [
    {
      name: 'criticaci-api',
      script: './src/server.js',
      instances: 1,
      exec_mode: 'fork',

      env: {
        NODE_ENV: 'development',
        HOST: '127.0.0.1',
        PORT: 3005,
      },
      env_production: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 3005,
      },

      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      out_file: './logs/out.log',
      error_file: './logs/error.log',

      max_memory_restart: '500M',
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      kill_timeout: 5000,

      watch: false,
      ignore_watch: ['node_modules', 'logs', 'data'],
    },
  ],
};