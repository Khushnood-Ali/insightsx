module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.BIGINT,
      autoIncrement: true,
      primaryKey: true
    },
    tenant_id: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'tenants',
        key: 'id'
      }
    },
    shopify_customer_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    total_spent: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    orders_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    location: {
      type: DataTypes.STRING,
      allowNull: true
    },
    segment: {
      type: DataTypes.ENUM('VIP', 'Regular', 'New'),
      defaultValue: 'New'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'customers',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['tenant_id', 'email'] },
      { fields: ['tenant_id', 'total_spent'] },
      { fields: ['tenant_id', 'segment'] },
      { unique: true, fields: ['tenant_id', 'shopify_customer_id'] }
    ],
    defaultScope: {
      attributes: { exclude: [] }
    },
    scopes: {
      byTenant: (tenantId) => ({
        where: { tenant_id: tenantId }
      })
    }
  });

  return Customer;
};