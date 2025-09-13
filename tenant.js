module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    domain: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'suspended'),
      defaultValue: 'active'
    },
    shopify_domain: {
      type: DataTypes.STRING,
      allowNull: true
    },
    shopify_access_token: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    webhook_secret: {
      type: DataTypes.STRING,
      allowNull: true
    }
  }, {
    tableName: 'tenants',
    indexes: [
      { fields: ['domain'] },
      { fields: ['status'] }
    ]
  });

  return Tenant;
};