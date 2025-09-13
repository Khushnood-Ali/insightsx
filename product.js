module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
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
    shopify_product_id: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    inventory: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sales: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: true
    },
    vendor: {
      type: DataTypes.STRING,
      allowNull: true
    },
    product_type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('active', 'archived', 'draft'),
      defaultValue: 'active'
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'products',
    indexes: [
      { fields: ['tenant_id'] },
      { fields: ['tenant_id', 'category'] },
      { fields: ['tenant_id', 'status'] },
      { fields: ['tenant_id', 'sales'] },
      { unique: true, fields: ['tenant_id', 'shopify_product_id'] }
    ],
    scopes: {
      byTenant: (tenantId) => ({
        where: { tenant_id: tenantId }
      }),
      byCategory: (tenantId, category) => ({
        where: { 
          tenant_id: tenantId,
          category: category 
        }
      }),
      active: (tenantId) => ({
        where: { 
          tenant_id: tenantId,
          status: 'active' 
        }
      })
    }
  });

  return Product;
};