const path = require('path');

const express = require('express');
const serveStatic = require('serve-static');
const morgan = require('morgan');
const helmet = require('helmet');

const SCWorker = require('socketcluster/scworker');
const healthChecker = require('sc-framework-health-check');

const database = require('./database.js');
const messages = require('./messages.js');
const authentication = require('./authentication.js');
const acs = require('./acs.js');

database.setup();

class Worker extends SCWorker {
  run() {
    console.log('   >> Worker PID:', process.pid);
    const environment = this.options.environment;

    const app = express();

    app.use(helmet({
      maxAge: 31536000000,
      includeSubdomains: true,
      force: true
    }));

    app.disable('x-powered-by')

    const httpServer = this.httpServer;
    const scServer = this.scServer;

    if (environment === 'dev') {
      // Log every HTTP request. See https://github.com/expressjs/morgan for other
      app.use(morgan('dev'));
    }
    app.use(serveStatic(path.resolve(__dirname, 'public')));

    // Add GET /health-check express route
    healthChecker.attach(this, app);

    httpServer.on('request', app);

    scServer.on('badSocketAuthToken', function(socket, err) {
      console.log(err.authError, err.signedAuthToken);
    });

    scServer.on('connection', function(socket) {
       authentication.attach(scServer, socket);
       acs.attach(scServer, socket);
    });
  }
}

new Worker();
