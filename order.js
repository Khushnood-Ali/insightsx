module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
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
    customer_id: {
      type: DataTypes.BIGINT,
      allowNull: true,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    shopify_order_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    order_number: {
      type: DataTypes.STRING,
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    subtotal: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true
    },
    tax_amount: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.ENUM('Fulfilled', 'Processing', 'Pending', 'Cancelled'),
      defaultValue: 'Pending'
    },
    financial_status: {
      type: DataTypes.ENUM('paid', 'pending', 'refunded', 'cancelled'),
      defaultValue: 'pending'
    },
    fulfillment_status: {
      type: DataTypes.ENUM('fulfilled', 'partial', 'unfulfilled', 'restocked'),
      defaultValue: 'unfulfilled'
    },
    currency: {
      type: DataTypes.STRING,
      defaultValue: 'USD'
    },
    customer_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    tableName: 'orders',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['tenant_id', 'customer_id'] },
      { fields: ['tenant_id', 'status'] },
      { fields: ['tenant_id', 'date'] },
      { fields: ['tenant_id', 'financial_status'] },
      { unique: true, fields: ['tenant_id', 'shopify_order_id'] }
    ],
    scopes: {
      byTenant: (tenantId) => ({
        where: { tenant_id: tenantId }
      }),
      byStatus: (tenantId, status) => ({
        where: { 
          tenant_id: tenantId,
          status: status 
        }
      })
    }
  });

  return Order;
};