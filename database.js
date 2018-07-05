const moment = require('moment');

const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const utils = require('./utils');

const sequelize = new Sequelize('sqlite:/root/cadre.today/backend.db', { operatorsAliases: false });

const User = sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER(10).UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  verified: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  email: {
    type: Sequelize.STRING(64),
    allowNull: false
  },
  displayname: {
    type: Sequelize.STRING(64),
    allowNull: false,
    validate: {
        is: /^[a-zA-Z1-9 ]+$/i
    }
  },
  password: {
    type: Sequelize.STRING(64),
    allowNull: false
  }
});

User.register = async (emailHash, passwordHash, displayname) => {
  const executionTimestamp = moment().unix();

  let success = false;

  try {
    let queryResult = await User.findOne({
      where:
      {
        email: emailHash
      }
    });

    if (!queryResult) {
      queryResult = await new User({
        email: emailHash,
        password: passwordHash,
        displayname: displayname
      });
      success = await queryResult.save();
    }
  } catch (e) {
    console.log(e);//TODO: implement a real logger?
  }

  await utils.delayIfFasterThan(1000, executionTimestamp);// laymans attempt to defeat timing attacks

  return success;
};

User.authenticate = async (emailHash, passwordHash) => {
  const executionTimestamp = moment().unix();

  let authenticatedUser = false;

  try {
    let queryResult = await User.findOne({
      where: {
        email: emailHash,
        password: passwordHash
      }
    });

    if (queryResult) {
      authenticatedUser = queryResult;
    }

  } catch (e) {
    console.log(e); // TODO: add logging?
  }

  await utils.delayIfFasterThan(1000, executionTimestamp);// laymans attempt to defeat timing attacks

  return authenticatedUser;
};

//TODO: finishing creating datamodel and expose
const Channels = sequelize.define('channel', {
  id: {
    type: Sequelize.INTEGER(10).UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: Sequelize.INTEGER(10).UNSIGNED
  }
});

module.exports = {
  setup: async () => {
    await User.sync();
    // TODO: await Channels.sync();
  },
  user: User,
  sequelize: sequelize
};
