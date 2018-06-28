const crypto = require('crypto');

const Database = require('./database.js');
const Messages = require('./messages.js');

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

  socket.once('disconnect', () => {
    clearInterval(renewAuthTokenInterval);
    socket.deauthenticate();
  });

  socket.once('logout', () => {
    clearInterval(renewAuthTokenInterval);
    socket.deauthenticate();
  });

  socket.on('login', async function(credentials, respond) {
    const passwordHash = crypto.createHash('sha256').update(credentials.password).digest('hex');
    const usernameHash = crypto.createHash('sha256').update(credentials.username).digest('hex');
    credentials.password = null;

    try {
      const queryResult = await Database.user.findOrCreate(usernameHash, passwordHash);// TODO: real login vs. auth all...

      if (queryResult) {
        respond();

        socket.setAuthToken({
          username: credentials.username,
          channels: [
            '/user/' + usernameHash
          ] // TODO: get users channels and append them here?
        }, {
          expiresIn: tokenExpiresInSeconds
        });
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
    credentials.username = null;
    credentials = null;
  });
};
