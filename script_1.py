# Create the Shopify API service for integrating with Shopify
shopify_service = """
const Shopify = require('shopify-api-node');
const { Customer, Order, Product } = require('../models');
const cron = require('node-cron');

class ShopifyService {
    constructor(tenantId, shopifyConfig) {
        this.tenantId = tenantId;
        this.shopify = new Shopify({
            shopName: shopifyConfig.storeDomain.replace('.myshopify.com', ''),
            accessToken: shopifyConfig.accessToken,
            apiVersion: '2024-07'
        });
    }

    // Sync customers from Shopify
    async syncCustomers() {
        try {
            console.log(`Syncing customers for tenant: ${this.tenantId}`);
            let customers = [];
            let hasNextPage = true;
            let pageInfo = {};

            while (hasNextPage) {
                const response = await this.shopify.customer.list({
                    limit: 250,
                    ...pageInfo
                });
                
                customers = customers.concat(response);
                hasNextPage = response.length === 250;
                
                if (hasNextPage) {
                    pageInfo = { since_id: response[response.length - 1].id };
                }
            }

            for (const shopifyCustomer of customers) {
                await Customer.upsert({
                    tenant_id: this.tenantId,
                    shopify_customer_id: shopifyCustomer.id,
                    name: `${shopifyCustomer.first_name || ''} ${shopifyCustomer.last_name || ''}`.trim() || 'Unknown',
                    email: shopifyCustomer.email || '',
                    total_spent: parseFloat(shopifyCustomer.total_spent) || 0,
                    orders_count: shopifyCustomer.orders_count || 0,
                    location: shopifyCustomer.default_address ? 
                        `${shopifyCustomer.default_address.city}, ${shopifyCustomer.default_address.country}` : null,
                    segment: this.calculateCustomerSegment(shopifyCustomer.total_spent),
                    phone: shopifyCustomer.phone,
                    tags: shopifyCustomer.tags
                });
            }

            console.log(`Synced ${customers.length} customers for tenant: ${this.tenantId}`);
            return { success: true, count: customers.length };
        } catch (error) {
            console.error(`Customer sync error for tenant ${this.tenantId}:`, error);
            throw error;
        }
    }

    // Sync orders from Shopify
    async syncOrders() {
        try {
            console.log(`Syncing orders for tenant: ${this.tenantId}`);
            let orders = [];
            let hasNextPage = true;
            let pageInfo = {};

            while (hasNextPage) {
                const response = await this.shopify.order.list({
                    limit: 250,
                    status: 'any',
                    ...pageInfo
                });
                
                orders = orders.concat(response);
                hasNextPage = response.length === 250;
                
                if (hasNextPage) {
                    pageInfo = { since_id: response[response.length - 1].id };
                }
            }

            for (const shopifyOrder of orders) {
                const customer = await Customer.findOne({
                    where: {
                        tenant_id: this.tenantId,
                        shopify_customer_id: shopifyOrder.customer?.id
                    }
                });

                await Order.upsert({
                    tenant_id: this.tenantId,
                    shopify_order_id: shopifyOrder.id,
                    order_number: shopifyOrder.order_number,
                    customer_id: customer?.id,
                    customer_name: shopifyOrder.customer ? 
                        `${shopifyOrder.customer.first_name} ${shopifyOrder.customer.last_name}` : 'Guest',
                    amount: parseFloat(shopifyOrder.total_price) || 0,
                    status: this.mapOrderStatus(shopifyOrder.fulfillment_status, shopifyOrder.financial_status),
                    date: shopifyOrder.created_at,
                    items_count: shopifyOrder.line_items?.length || 0,
                    currency: shopifyOrder.currency || 'USD'
                });
            }

            console.log(`Synced ${orders.length} orders for tenant: ${this.tenantId}`);
            return { success: true, count: orders.length };
        } catch (error) {
            console.error(`Order sync error for tenant ${this.tenantId}:`, error);
            throw error;
        }
    }

    // Sync products from Shopify
    async syncProducts() {
        try {
            console.log(`Syncing products for tenant: ${this.tenantId}`);
            let products = [];
            let hasNextPage = true;
            let pageInfo = {};

            while (hasNextPage) {
                const response = await this.shopify.product.list({
                    limit: 250,
                    ...pageInfo
                });
                
                products = products.concat(response);
                hasNextPage = response.length === 250;
                
                if (hasNextPage) {
                    pageInfo = { since_id: response[response.length - 1].id };
                }
            }

            for (const shopifyProduct of products) {
                for (const variant of shopifyProduct.variants) {
                    await Product.upsert({
                        tenant_id: this.tenantId,
                        shopify_product_id: shopifyProduct.id,
                        shopify_variant_id: variant.id,
                        name: `${shopifyProduct.title}${variant.title !== 'Default Title' ? ` - ${variant.title}` : ''}`,
                        price: parseFloat(variant.price) || 0,
                        category: shopifyProduct.product_type || 'Uncategorized',
                        inventory: variant.inventory_quantity || 0,
                        sales: 0, // This would need to be calculated from orders
                        sku: variant.sku,
                        status: shopifyProduct.status === 'active' ? 'Active' : 'Inactive'
                    });
                }
            }

            console.log(`Synced ${products.length} products for tenant: ${this.tenantId}`);
            return { success: true, count: products.length };
        } catch (error) {
            console.error(`Product sync error for tenant ${this.tenantId}:`, error);
            throw error;
        }
    }

    // Full sync of all data
    async fullSync() {
        try {
            const results = await Promise.all([
                this.syncCustomers(),
                this.syncOrders(),
                this.syncProducts()
            ]);

            return {
                success: true,
                customers: results[0].count,
                orders: results[1].count,
                products: results[2].count,
                timestamp: new Date()
            };
        } catch (error) {
            console.error(`Full sync error for tenant ${this.tenantId}:`, error);
            throw error;
        }
    }

    // Helper methods
    calculateCustomerSegment(totalSpent) {
        if (totalSpent >= 1000) return 'VIP';
        if (totalSpent >= 100) return 'Regular';
        return 'New';
    }

    mapOrderStatus(fulfillmentStatus, financialStatus) {
        if (fulfillmentStatus === 'fulfilled') return 'Fulfilled';
        if (fulfillmentStatus === 'partial') return 'Processing';
        if (financialStatus === 'pending') return 'Pending';
        if (financialStatus === 'voided' || financialStatus === 'refunded') return 'Cancelled';
        return 'Processing';
    }
}

// Scheduler for automatic syncing
class ShopifySyncScheduler {
    static scheduleSync(tenantConfigs) {
        // Run sync every hour
        cron.schedule('0 * * * *', async () => {
            console.log('Running scheduled Shopify sync...');
            
            for (const config of tenantConfigs) {
                try {
                    const service = new ShopifyService(config.tenantId, config.shopifyConfig);
                    await service.fullSync();
                } catch (error) {
                    console.error(`Scheduled sync failed for tenant ${config.tenantId}:`, error);
                }
            }
        });

        console.log('Shopify sync scheduler initialized - running every hour');
    }
}

module.exports = { ShopifyService, ShopifySyncScheduler };
"""

print("Created comprehensive Shopify API service with:")
print("- Customer, Order, and Product syncing")
print("- Pagination handling for large datasets")
print("- Error handling and logging")
print("- Automatic scheduling with cron jobs")
print("- Data mapping and transformation")

# Save the service to a file
with open('shopify_service.js', 'w') as f:
    f.write(shopify_service)