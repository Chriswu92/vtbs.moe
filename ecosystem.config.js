module.exports = {
  apps: [{
    name: 'api.vtbs.moe',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
  }],
}
