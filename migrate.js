const { sequelize } = require('../models');
(async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('DB migrated');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
