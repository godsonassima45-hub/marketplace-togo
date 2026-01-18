// Main Application JavaScript - MarketPlace TG
class MarketplaceApp {
    constructor() {
        this.products = [];
        this.cart = [];
        this.authManager = window.authManager;
        this.init();
    }

    async init() {
        try {
            console.log('Initializing MarketplaceApp...');
            await this.loadProducts();
            this.setupEventListeners();
            this.updateCartUI();
            this.checkAuthState();
            console.log('MarketplaceApp initialized successfully');
        } catch (error) {
            console.error('Error initializing MarketplaceApp:', error);
            this.showNotification('Erreur lors du chargement de l\'application', 'error');
        }
    }

    setupEventListeners() {
        try {
            // Cart button
            const cartBtn = document.getElementById('cartBtn');
            if (cartBtn) {
                cartBtn.addEventListener('click', () => this.openCartModal());
            }

            // Cart modal close
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

            // Load more button
            const loadMoreBtn = document.getElementById('loadMoreBtn');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => this.loadMoreProducts());
            }

            // Close modal on outside click
            window.addEventListener('click', (e) => {
                if (e.target.classList.contains('modal')) {
                    this.closeCartModal();
                }
            });

            console.log('Event listeners setup completed');
        } catch (error) {
            console.error('Error setting up event listeners:', error);
        }
    }

    async loadProducts() {
        try {
            console.log('Loading products...');
            const snapshot = await db.collection(COLLECTIONS.PRODUCTS)
                .where('isActive', '==', true)
                .orderBy('createdAt', 'desc')
                .limit(12)
                .get();

            this.products = [];
            snapshot.forEach(doc => {
                this.products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderProducts();
            console.log(`Loaded ${this.products.length} products`);
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Erreur lors du chargement des produits', 'error');
        }
    }

    async loadMoreProducts() {
        try {
            const lastProduct = this.products[this.products.length - 1];
            if (!lastProduct) return;

            console.log('Loading more products...');
            const snapshot = await db.collection(COLLECTIONS.PRODUCTS)
                .where('isActive', '==', true)
                .orderBy('createdAt', 'desc')
                .startAfter(lastProduct.createdAt)
                .limit(12)
                .get();

            const newProducts = [];
            snapshot.forEach(doc => {
                newProducts.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            if (newProducts.length === 0) {
                const loadMoreBtn = document.getElementById('loadMoreBtn');
                if (loadMoreBtn) {
                    loadMoreBtn.textContent = 'Plus de produits';
                    loadMoreBtn.disabled = true;
                }
                return;
            }

            this.products.push(...newProducts);
            this.renderProducts();
            console.log(`Loaded ${newProducts.length} more products`);
        } catch (error) {
            console.error('Error loading more products:', error);
        }
    }

    renderProducts() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        if (this.products.length === 0) {
            productsGrid.innerHTML = `
                <div class="no-products">
                    <i class="fas fa-box-open"></i>
                    <p>Aucun produit disponible pour le moment</p>
                </div>
            `;
            return;
        }

        productsGrid.innerHTML = this.products.map(product => `
            <div class="product-card" onclick="app.viewProduct('${product.id}')">
                <div class="product-image">
                    <img src="${product.imageUrl || 'https://via.placeholder.com/300x200/16a34a/ffffff?text=Produit'}" 
                         alt="${product.name}" 
                         onerror="this.src='https://via.placeholder.com/300x200/16a34a/ffffff?text=Produit'">
                </div>
                <div class="product-info">
                    <h3 class="product-title">${this.escapeHtml(product.name)}</h3>
                    <div class="product-price">${this.formatPrice(product.price)}</div>
                    <div class="product-seller">
                        <i class="fas fa-store"></i> ${this.escapeHtml(product.sellerName || 'Vendeur')}
                    </div>
                    <button class="btn btn-primary btn-small" onclick="event.stopPropagation(); app.addToCart('${product.id}')">
                        <i class="fas fa-cart-plus"></i> Ajouter
                    </button>
                </div>
            </div>
        `).join('');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    viewProduct(productId) {
        if (!productId) {
            console.error('Product ID is missing');
            return;
        }
        window.location.href = `product.html?id=${productId}`;
    }

    async addToCart(productId) {
        if (!this.authManager.isAuthenticated()) {
            this.showNotification('Veuillez vous connecter pour ajouter au panier', 'error');
            window.location.href = 'login.html';
            return;
        }

        const product = this.products.find(p => p.id === productId);
        if (!product) {
            this.showNotification('Produit non trouvé', 'error');
            return;
        }

        try {
            // Check stock
            if (product.stock <= 0) {
                this.showNotification('Produit en rupture de stock', 'error');
                return;
            }

            const existingItem = this.cart.find(item => item.productId === productId);
            
            if (existingItem) {
                const newQuantity = existingItem.quantity + 1;
                if (newQuantity > product.stock) {
                    this.showNotification('Stock insuffisant', 'error');
                    return;
                }
                existingItem.quantity = newQuantity;
            } else {
                this.cart.push({
                    productId: productId,
                    name: product.name,
                    price: product.price,
                    imageUrl: product.imageUrl,
                    sellerId: product.sellerId,
                    sellerName: product.sellerName,
                    quantity: 1,
                    addedAt: new Date()
                });
            }

            this.saveCart();
            this.updateCartUI();
            this.showNotification('Produit ajouté au panier', 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Erreur lors de l\'ajout au panier', 'error');
        }
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.productId !== productId);
        this.saveCart();
        this.updateCartUI();
        this.showNotification('Produit retiré du panier', 'success');
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.productId === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(productId);
            } else {
                this.saveCart();
                this.updateCartUI();
            }
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

    saveCart() {
        if (this.authManager.isAuthenticated()) {
            try {
                localStorage.setItem('cart', JSON.stringify(this.cart));
            } catch (error) {
                console.error('Error saving cart:', error);
            }
        }
    }

    loadCart() {
        if (this.authManager.isAuthenticated()) {
            try {
                const savedCart = localStorage.getItem('cart');
                if (savedCart) {
                    this.cart = JSON.parse(savedCart);
                }
            } catch (error) {
                console.error('Error loading cart:', error);
                this.cart = [];
            }
        }
    }

    updateCartUI() {
        // Update cart count
        const cartCount = document.querySelector('.cart-count');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'block' : 'none';
        }

        // Update cart modal
        this.renderCartItems();
        this.updateCartTotal();
    }

    renderCartItems() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        if (this.cart.length === 0) {
            cartItems.innerHTML = '<p>Votre panier est vide</p>';
            return;
        }

        cartItems.innerHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.imageUrl || 'https://via.placeholder.com/50x50/16a34a/ffffff?text=P'}" 
                         alt="${item.name}"
                         onerror="this.src='https://via.placeholder.com/50x50/16a34a/ffffff?text=P'">
                </div>
                <div class="cart-item-details">
                    <h4>${this.escapeHtml(item.name)}</h4>
                    <p>${this.formatPrice(item.price)}</p>
                    <p>Vendeur: ${this.escapeHtml(item.sellerName)}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="app.updateQuantity('${item.productId}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="app.updateQuantity('${item.productId}', 1)">+</button>
                    </div>
                    <button class="btn btn-outline btn-small" onclick="app.removeFromCart('${item.productId}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateCartTotal() {
        const cartTotal = document.getElementById('cartTotal');
        if (!cartTotal) return;

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        cartTotal.textContent = this.formatPrice(total);
    }

    openCartModal() {
        const cartModal = document.getElementById('cartModal');
        if (cartModal) {
            cartModal.classList.add('active');
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
            console.log('Processing checkout...');
            
            // Create order
            const order = {
                userId: this.authManager.currentUser.uid,
                items: this.cart,
                totalAmount: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
                status: ORDER_STATUS.PENDING,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                paymentMethod: null,
                shippingAddress: '',
                commission: {
                    platform: 0,
                    seller: 0
                }
            };

            // Calculate commission for each item
            order.items.forEach(item => {
                const itemTotal = item.price * item.quantity;
                item.commission = {
                    platform: itemTotal * COMMISSION_RATE.PLATFORM,
                    seller: itemTotal * COMMISSION_RATE.SELLER
                };
            });

            order.commission.platform = order.items.reduce((sum, item) => sum + item.commission.platform, 0);
            order.commission.seller = order.items.reduce((sum, item) => sum + item.commission.seller, 0);

            // Save order to Firestore
            const orderRef = await db.collection(COLLECTIONS.ORDERS).add(order);

            console.log('Order created:', orderRef.id);

            // Clear cart
            this.cart = [];
            this.saveCart();
            this.updateCartUI();
            this.closeCartModal();

            // Redirect to payment page
            window.location.href = `payment.html?orderId=${orderRef.id}`;
        } catch (error) {
            console.error('Checkout error:', error);
            this.showNotification('Erreur lors du traitement de la commande', 'error');
        }
    }

    checkAuthState() {
        if (this.authManager.isAuthenticated()) {
            this.loadCart();
        }
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    window.app = new MarketplaceApp();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MarketplaceApp;
}
