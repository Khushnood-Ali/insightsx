const sequelize = require('../config/database');
const { DataTypes } = require('sequelize');

// Import all models
const Tenant = require('./tenant');
const User = require('./user');
const Customer = require('./customer');
const Order = require('./order');
const Product = require('./product');

// Initialize models
const models = {
  Tenant: Tenant(sequelize, DataTypes),
  User: User(sequelize, DataTypes),
  Customer: Customer(sequelize, DataTypes),
  Order: Order(sequelize, DataTypes),
  Product: Product(sequelize, DataTypes)
};

// Define associations
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

// Set up associations
models.User.belongsToMany(models.Tenant, { through: 'UserTenants', as: 'tenants' });
models.Tenant.belongsToMany(models.User, { through: 'UserTenants', as: 'users' });

models.Customer.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
models.Tenant.hasMany(models.Customer, { foreignKey: 'tenant_id' });

models.Order.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
models.Order.belongsTo(models.Customer, { foreignKey: 'customer_id' });
models.Tenant.hasMany(models.Order, { foreignKey: 'tenant_id' });
models.Customer.hasMany(models.Order, { foreignKey: 'customer_id' });

models.Product.belongsTo(models.Tenant, { foreignKey: 'tenant_id' });
models.Tenant.hasMany(models.Product, { foreignKey: 'tenant_id' });

// Add sequelize instance and Sequelize constructor to models
models.sequelize = sequelize;
models.Sequelize = require('sequelize');

module.exports = models;