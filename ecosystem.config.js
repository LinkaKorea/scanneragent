module.exports = {
  /**
   * Application configuration section
   * http://pm2.keymetrics.io/docs/usage/application-declaration/
   */
  apps : [

    {
      name      : 'scanneragent',
      script    : './bin/www',
      exec_model: 'cluster',
      instances: 1,
      env_dev: {
        ENV: 'dev'
      },
      env_production : {
        ENV: 'prod'
      }
    }
  ],

};
