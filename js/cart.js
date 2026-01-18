// Shopping Cart Module - MarketPlace TG
class CartManager {
    constructor() {
        this.cart = [];
        this.authManager = window.authManager;
        this.init();
    }

    init() {
        this.loadCart();
        this.setupEventListeners();
        this.updateCartUI();
    }

    setupEventListeners() {
        // Cart button
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.openCartModal());
        }

        // Cart modal controls
        const closeCart = document.getElementById('closeCart');
        if (closeCart) {
            closeCart.addEventListener('click', () => this.closeCartModal());
        }

        // Checkout button
        const checkoutBtn = document.getElementById('checkoutBtn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }

        // Clear cart button
        const clearCartBtn = document.getElementById('clearCartBtn');
        if (clearCartBtn) {
            clearCartBtn.addEventListener('click', () => this.clearCart());
        }

        // Close modal on outside click
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.closeCartModal();
            }
        });
    }

    loadCart() {
        if (this.authManager.isAuthenticated()) {
            const savedCart = localStorage.getItem('cart');
            if (savedCart) {
                try {
                    this.cart = JSON.parse(savedCart);
                } catch (error) {
                    console.error('Error parsing cart:', error);
                    this.cart = [];
                }
            }
        }
    }

    saveCart() {
        if (this.authManager.isAuthenticated()) {
            localStorage.setItem('cart', JSON.stringify(this.cart));
        }
    }

    async addToCart(productId, quantity = 1, options = {}) {
        if (!this.authManager.isAuthenticated()) {
            this.showNotification('Veuillez vous connecter pour ajouter au panier', 'error');
            return false;
        }

        try {
            // Get product details
            const productDoc = await db.collection(COLLECTIONS.PRODUCTS).doc(productId).get();
            if (!productDoc.exists) {
                this.showNotification('Produit non trouvé', 'error');
                return false;
            }

            const product = {
                id: productDoc.id,
                ...productDoc.data()
            };

            // Check stock
            if (product.stock <= 0) {
                this.showNotification('Produit en rupture de stock', 'error');
                return false;
            }

            // Check if item already exists in cart
            const existingItem = this.cart.find(item => 
                item.productId === productId && 
                JSON.stringify(item.options) === JSON.stringify(options)
            );

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity > product.stock) {
                    this.showNotification('Stock insuffisant', 'error');
                    return false;
                }
                existingItem.quantity = newQuantity;
            } else {
                if (quantity > product.stock) {
                    this.showNotification('Stock insuffisant', 'error');
                    return false;
                }

                this.cart.push({
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    sellerId: product.sellerId,
                    sellerName: product.sellerName,
                    quantity: quantity,
                    options: options,
                    addedAt: new Date()
                });
            }

            this.saveCart();
            this.updateCartUI();
            this.showNotification('Produit ajouté au panier', 'success');
            return true;

        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Erreur lors de l\'ajout au panier', 'error');
            return false;
        }
    }

    removeFromCart(productId, options = {}) {
        this.cart = this.cart.filter(item => 
            !(item.productId === productId && JSON.stringify(item.options) === JSON.stringify(options))
        );
        this.saveCart();
        this.updateCartUI();
        this.showNotification('Produit retiré du panier', 'success');
    }

    updateQuantity(productId, change, options = {}) {
        const item = this.cart.find(item => 
            item.productId === productId && 
            JSON.stringify(item.options) === JSON.stringify(options)
        );

        if (item) {
            const newQuantity = item.quantity + change;
            
            if (newQuantity <= 0) {
                this.removeFromCart(productId, options);
            } else {
                // Check stock availability
                this.checkStockAvailability(productId, newQuantity).then((available) => {
                    if (available) {
                        item.quantity = newQuantity;
                        this.saveCart();
                        this.updateCartUI();
                    } else {
                        this.showNotification('Stock insuffisant', 'error');
                    }
                });
            }
        }
    }

    async checkStockAvailability(productId, requestedQuantity) {
        try {
            const productDoc = await db.collection(COLLECTIONS.PRODUCTS).doc(productId).get();
            if (productDoc.exists) {
                const product = productDoc.data();
                return product.stock >= requestedQuantity;
            }
            return false;
        } catch (error) {
            console.error('Error checking stock:', error);
            return false;
        }
    }

    clearCart() {
        if (confirm('Voulez-vous vraiment vider votre panier?')) {
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            this.showNotification('Panier vidé', 'success');
        }
    }

    getCartTotal() {
        return this.cart.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getCartItemCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    updateCartUI() {
        // Update cart count badge
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const itemCount = this.getCartItemCount();
            cartCount.textContent = itemCount;
            cartCount.style.display = itemCount > 0 ? 'block' : 'none';
        }

        // Update cart modal content
        this.renderCartItems();
        this.updateCartTotal();
    }

    renderCartItems() {
        const cartItemsContainer = document.getElementById('cartItems');
        if (!cartItemsContainer) return;

        if (this.cart.length === 0) {
            cartItemsContainer.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Votre panier est vide</p>
                    <a href="index.html" class="btn btn-primary">Continuer vos achats</a>
                </div>
            `;
            return;
        }

        cartItemsContainer.innerHTML = this.cart.map((item, index) => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.imageUrl || '/images/placeholder-product.jpg'}" 
                         alt="${item.name}"
                         onerror="this.src='/images/placeholder-product.jpg'">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="item-price">${this.formatPrice(item.price)}</p>
                    <p class="item-seller">
                        <i class="fas fa-store"></i> ${item.sellerName}
                    </p>
                    ${this.renderItemOptions(item.options)}
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.productId}', -1, ${JSON.stringify(item.options).replace(/"/g, '&quot;')})">
                            <i class="fas fa-minus"></i>
                        </button>
                        <span class="quantity">${item.quantity}</span>
                        <button class="quantity-btn" onclick="cartManager.updateQuantity('${item.productId}', 1, ${JSON.stringify(item.options).replace(/"/g, '&quot;')})">
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="item-total">
                        ${this.formatPrice(item.price * item.quantity)}
                    </div>
                    <button class="btn btn-outline btn-small" onclick="cartManager.removeFromCart('${item.productId}', ${JSON.stringify(item.options).replace(/"/g, '&quot;')})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    renderItemOptions(options) {
        if (!options || Object.keys(options).length === 0) {
            return '';
        }

        const optionsHtml = Object.entries(options).map(([key, value]) => {
            const label = this.getOptionLabel(key);
            return `<span class="item-option">${label}: ${value}</span>`;
        }).join(' | ');

        return `<div class="item-options">${optionsHtml}</div>`;
    }

    getOptionLabel(key) {
        const labels = {
            'size': 'Taille',
            'color': 'Couleur',
            'material': 'Matériau'
        };
        return labels[key] || key;
    }

    updateCartTotal() {
        const cartTotalElement = document.getElementById('cartTotal');
        if (cartTotalElement) {
            const total = this.getCartTotal();
            cartTotalElement.textContent = this.formatPrice(total);
        }
    }

    openCartModal() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.add('active');
            this.renderCartItems();
            this.updateCartTotal();
        }
    }

    closeCartModal() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.remove('active');
        }
    }

    async handleCheckout() {
        if (!this.authManager.isAuthenticated()) {
            this.showNotification('Veuillez vous connecter pour continuer', 'error');
            window.location.href = 'login.html';
            return;
        }

        if (this.cart.length === 0) {
            this.showNotification('Votre panier est vide', 'error');
            return;
        }

        try {
            // Validate stock for all items
            const stockValidation = await this.validateCartStock();
            if (!stockValidation.valid) {
                this.showNotification(stockValidation.message, 'error');
                return;
            }

            // Create order
            const order = await this.createOrder();
            
            if (order) {
                // Clear cart
                this.cart = [];
                this.saveCart();
                this.updateCartUI();
                this.closeCartModal();

                // Redirect to payment page
                window.location.href = `payment.html?orderId=${order.id}`;
            }
        } catch (error) {
            console.error('Checkout error:', error);
            this.showNotification('Erreur lors du traitement de la commande', 'error');
        }
    }

    async validateCartStock() {
        for (const item of this.cart) {
            const available = await this.checkStockAvailability(item.productId, item.quantity);
            if (!available) {
                return {
                    valid: false,
                    message: `Stock insuffisant pour ${item.name}`
                };
            }
        }
        return { valid: true };
    }

    async createOrder() {
        try {
            const totalAmount = this.getCartTotal();
            
            // Calculate commission for each item
            const itemsWithCommission = this.cart.map(item => {
                const itemTotal = item.price * item.quantity;
                return {
                    ...item,
                    commission: {
                        platform: itemTotal * COMMISSION_RATE.PLATFORM,
                        seller: itemTotal * COMMISSION_RATE.SELLER
                    }
                };
            });

            const totalCommission = itemsWithCommission.reduce((sum, item) => sum + item.commission.platform, 0);

            const order = {
                userId: this.authManager.currentUser.uid,
                items: itemsWithCommission,
                totalAmount: totalAmount,
                commission: {
                    platform: totalCommission,
                    seller: totalAmount - totalCommission
                },
                status: ORDER_STATUS.PENDING,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                paymentMethod: null,
                shippingAddress: '',
                trackingNumber: null
            };

            const orderRef = await db.collection(COLLECTIONS.ORDERS).add(order);
            
            // Create commission records
            await this.createCommissionRecords(orderRef.id, itemsWithCommission);

            return { id: orderRef.id, ...order };
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    }

    async createCommissionRecords(orderId, items) {
        const commissionRecords = items.map(item => ({
            orderId: orderId,
            sellerId: item.sellerId,
            productId: item.productId,
            platformAmount: item.commission.platform,
            sellerAmount: item.commission.seller,
            totalAmount: item.price * item.quantity,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            status: 'pending'
        }));

        // Batch write commission records
        const batch = db.batch();
        commissionRecords.forEach(record => {
            const docRef = db.collection(COLLECTIONS.COMMISSIONS).doc();
            batch.set(docRef, record);
        });

        await batch.commit();
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(price);
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        const icon = notification.querySelector('i');

        if (notification && notificationMessage) {
            notificationMessage.textContent = message;
            
            if (type === 'error') {
                icon.className = 'fas fa-exclamation-circle';
                notification.style.backgroundColor = '#ef4444';
            } else {
                icon.className = 'fas fa-check-circle';
                notification.style.backgroundColor = '#16a34a';
            }

            notification.classList.add('show');

            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }
}

// Initialize cart manager
document.addEventListener('DOMContentLoaded', () => {
    window.cartManager = new CartManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManager;
}
