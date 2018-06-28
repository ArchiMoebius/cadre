const Sequelize = require('sequelize');
const Op = Sequelize.Op;

const sequelize = new Sequelize('sqlite:/root/cadre.today/backend.db', { operatorsAliases: false });

const User = sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER(10).UNSIGNED,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: Sequelize.STRING(64)
  },
  password: {
    type: Sequelize.STRING(64)
  }
});

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
  user: {
    findOrCreate: async (usernameHash, passwordHash) => {
      const queryResult = await User.findOrCreate({
        where: {
          username: usernameHash,
          password: passwordHash
        }
      });

      return queryResult;
    }
  },
  sequelize: sequelize
};
