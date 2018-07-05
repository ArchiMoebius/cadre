const crypto = require('crypto');

const Database = require('./database.js');
const Messages = require('./messages.js');
const Config = require('./config.js');

const tokenExpiresInSeconds = 10 * 60;
const tokenRenewalIntervalInMilliseconds = Math.round(1000 * tokenExpiresInSeconds / 3);

module.exports.attach = function(scServer, socket) {

  // Keep renewing the token (if there is one) at a predefined interval to make sure that
  // it doesn't expire while the connection is active.
  const renewAuthTokenInterval = setInterval(() => {
    const currentToken = socket.getAuthToken();

    if (currentToken) {
      currentToken.exp = Math.round(Date.now() / 1000) + tokenExpiresInSeconds;
      socket.setAuthToken(currentToken);
    }
  }, tokenRenewalIntervalInMilliseconds);

  const deauthenticate = () => {
    clearInterval(renewAuthTokenInterval);
    socket.deauthenticate();
  };

  socket.once('disconnect', () => {
    deauthenticate();
  });

  socket.once('logout', () => {
    deauthenticate();
  });

  socket.on('register', async function(user, respond) {
    const passwordHash = crypto.createHash('sha256').update(user.password + Config.crypto.salt).digest('hex');
    user.password = null;
    const emailHash = crypto.createHash('sha256').update(user.email + Config.crypto.salt).digest('hex');
    user.username = null;

    try {
      const queryResult = await Database.user.register(emailHash, passwordHash, user.displayname);
      user.displayname = null;
      user = null;

      if (queryResult) {
        respond();
      } else {
        respond({
          error: Messages.REGISTRATION_FAILED
        });
      }
    } catch (e) {
      console.log(e);
      respond({
        error: Messages.REGISTRATION_FAILED
      });
    }
  });

  socket.on('login', async function(user, respond) {
    const passwordHash = crypto.createHash('sha256').update(user.password + Config.crypto.salt).digest('hex');
    user.password = null;
    const emailHash = crypto.createHash('sha256').update(user.email + Config.crypto.salt).digest('hex');
    user.username = null;
    user = null;

    try {
      const queryResult = await Database.user.authenticate(emailHash, passwordHash);

      if (queryResult) {
        socket.setAuthToken({
          verified: queryResult.verified,
          username: queryResult.displayname,
          channels: [
            '/user/' + emailHash
          ] // TODO: get users channels and append them here?
        }, {
          expiresIn: tokenExpiresInSeconds
        });
        respond();
      } else {
        respond({
          error: Messages.AUTHENTICATION_FAILED
        });
      }
    } catch (e) {
      console.log(e);
      respond({
        error: Messages.AUTHENTICATION_FAILED
      });
    }
  });
};
