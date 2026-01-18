// Product Detail Page JavaScript - MarketPlace TG
class ProductDetail {
    constructor() {
        this.product = null;
        this.productId = null;
        this.authManager = window.authManager;
        this.init();
    }

    init() {
        this.getProductIdFromURL();
        this.loadProduct();
        this.setupEventListeners();
    }

    getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.productId = urlParams.get('id');
        
        if (!this.productId) {
            this.showNotification('Produit non trouvé', 'error');
            window.location.href = 'index.html';
        }
    }

    async loadProduct() {
        try {
            const doc = await db.collection(COLLECTIONS.PRODUCTS).doc(this.productId).get();
            
            if (!doc.exists) {
                this.showNotification('Produit non trouvé', 'error');
                window.location.href = 'index.html';
                return;
            }

            this.product = {
                id: doc.id,
                ...doc.data()
            };

            this.renderProduct();
        } catch (error) {
            console.error('Error loading product:', error);
            this.showNotification('Erreur lors du chargement du produit', 'error');
        }
    }

    renderProduct() {
        if (!this.product) return;

        // Update product title
        const productTitle = document.getElementById('productTitle');
        if (productTitle) {
            productTitle.textContent = this.product.name;
        }

        // Update product price
        const productPrice = document.getElementById('productPrice');
        if (productPrice) {
            productPrice.textContent = this.formatPrice(this.product.price);
        }

        // Update original price if exists
        const originalPrice = document.getElementById('originalPrice');
        if (originalPrice && this.product.originalPrice) {
            originalPrice.textContent = this.formatPrice(this.product.originalPrice);
            originalPrice.style.display = 'inline';
        }

        // Update seller info
        const sellerName = document.getElementById('sellerName');
        if (sellerName) {
            sellerName.textContent = this.product.sellerName || 'Vendeur';
        }

        // Update product description
        const productDescription = document.getElementById('productDescription');
        if (productDescription) {
            productDescription.textContent = this.product.description || 'Pas de description disponible';
        }

        // Update product rating
        const productRating = document.getElementById('productRating');
        if (productRating && this.product.rating) {
            productRating.textContent = this.product.rating.toFixed(1);
        }

        // Update main image
        const mainProductImage = document.getElementById('mainProductImage');
        if (mainProductImage) {
            mainProductImage.src = this.product.imageUrl || '/images/placeholder-product.jpg';
            mainProductImage.alt = this.product.name;
        }

        // Update image thumbnails
        this.renderImageThumbnails();

        // Update stock info
        this.updateStockInfo();
    }

    renderImageThumbnails() {
        const imageThumbnails = document.getElementById('imageThumbnails');
        if (!imageThumbnails) return;

        const images = this.product.images || [this.product.imageUrl];
        
        imageThumbnails.innerHTML = images.map((image, index) => `
            <div class="thumbnail ${index === 0 ? 'active' : ''}" onclick="productDetail.changeMainImage('${image}', this)">
                <img src="${image || '/images/placeholder-product.jpg'}" 
                     alt="Image ${index + 1}"
                     onerror="this.src='/images/placeholder-product.jpg'">
            </div>
        `).join('');
    }

    changeMainImage(imageUrl, thumbnailElement) {
        const mainProductImage = document.getElementById('mainProductImage');
        if (mainProductImage) {
            mainProductImage.src = imageUrl;
        }

        // Update active thumbnail
        document.querySelectorAll('.thumbnail').forEach(thumb => {
            thumb.classList.remove('active');
        });
        thumbnailElement.classList.add('active');
    }

    updateStockInfo() {
        const quantityInput = document.getElementById('quantity');
        if (quantityInput && this.product.stock !== undefined) {
            quantityInput.max = this.product.stock;
            
            if (this.product.stock <= 0) {
                quantityInput.disabled = true;
                this.showNotification('Ce produit est en rupture de stock', 'error');
                
                // Disable add to cart and buy now buttons
                const addToCartBtn = document.getElementById('addToCartBtn');
                const buyNowBtn = document.getElementById('buyNowBtn');
                
                if (addToCartBtn) {
                    addToCartBtn.disabled = true;
                    addToCartBtn.textContent = 'Rupture de stock';
                }
                
                if (buyNowBtn) {
                    buyNowBtn.disabled = true;
                    buyNowBtn.textContent = 'Rupture de stock';
                }
            }
        }
    }

    setupEventListeners() {
        // Quantity controls
        const decreaseQty = document.getElementById('decreaseQty');
        const increaseQty = document.getElementById('increaseQty');
        const quantityInput = document.getElementById('quantity');

        if (decreaseQty) {
            decreaseQty.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value) || 1;
                if (currentValue > 1) {
                    quantityInput.value = currentValue - 1;
                }
            });
        }

        if (increaseQty) {
            increaseQty.addEventListener('click', () => {
                const currentValue = parseInt(quantityInput.value) || 1;
                const maxValue = parseInt(quantityInput.max) || 10;
                if (currentValue < maxValue) {
                    quantityInput.value = currentValue + 1;
                }
            });
        }

        // Add to cart button
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.addEventListener('click', () => this.addToCart());
        }

        // Buy now button
        const buyNowBtn = document.getElementById('buyNowBtn');
        if (buyNowBtn) {
            buyNowBtn.addEventListener('click', () => this.buyNow());
        }

        // Fitting room button
        const openFittingRoom = document.getElementById('openFittingRoom');
        if (openFittingRoom) {
            openFittingRoom.addEventListener('click', () => this.openFittingRoom());
        }

        // Cart modal controls
        this.setupCartModal();
    }

    setupCartModal() {
        const cartBtn = document.getElementById('cartBtn');
        const closeCart = document.getElementById('closeCart');
        const checkoutBtn = document.getElementById('checkoutBtn');
        const clearCartBtn = document.getElementById('clearCartBtn');

        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.openCartModal());
        }

        if (closeCart) {
            closeCart.addEventListener('click', () => this.closeCartModal());
        }

        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => this.handleCheckout());
        }

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

    async addToCart() {
        if (!this.authManager.isAuthenticated()) {
            this.showNotification('Veuillez vous connecter pour ajouter au panier', 'error');
            window.location.href = 'login.html';
            return;
        }

        if (!this.product || this.product.stock <= 0) {
            this.showNotification('Produit non disponible', 'error');
            return;
        }

        const quantity = parseInt(document.getElementById('quantity').value) || 1;
        const size = document.getElementById('size').value;

        try {
            // Get existing cart or create new one
            let cart = JSON.parse(localStorage.getItem('cart') || '[]');
            
            const existingItem = cart.find(item => 
                item.productId === this.productId && item.size === size
            );

            if (existingItem) {
                const newQuantity = existingItem.quantity + quantity;
                if (newQuantity <= this.product.stock) {
                    existingItem.quantity = newQuantity;
                } else {
                    this.showNotification('Stock insuffisant', 'error');
                    return;
                }
            } else {
                cart.push({
                    productId: this.productId,
                    name: this.product.name,
                    price: this.product.price,
                    imageUrl: this.product.imageUrl,
                    sellerId: this.product.sellerId,
                    sellerName: this.product.sellerName,
                    quantity: quantity,
                    size: size,
                    addedAt: new Date()
                });
            }

            localStorage.setItem('cart', JSON.stringify(cart));
            this.updateCartUI();
            this.showNotification('Produit ajouté au panier', 'success');
        } catch (error) {
            console.error('Error adding to cart:', error);
            this.showNotification('Erreur lors de l\'ajout au panier', 'error');
        }
    }

    async buyNow() {
        if (!this.authManager.isAuthenticated()) {
            this.showNotification('Veuillez vous connecter pour continuer', 'error');
            window.location.href = 'login.html';
            return;
        }

        if (!this.product || this.product.stock <= 0) {
            this.showNotification('Produit non disponible', 'error');
            return;
        }

        // Add to cart first
        await this.addToCart();
        
        // Then proceed to checkout
        setTimeout(() => {
            this.handleCheckout();
        }, 500);
    }

    openFittingRoom() {
        if (!this.authManager.isAuthenticated()) {
            this.showNotification('Veuillez vous connecter pour utiliser la cabine d\'essayage', 'error');
            window.location.href = 'login.html';
            return;
        }

        const fittingRoomModal = document.getElementById('fittingRoomModal');
        if (fittingRoomModal) {
            fittingRoomModal.classList.add('active');
            
            // Initialize fitting room with current product
            if (window.fittingRoom) {
                window.fittingRoom.loadProduct(this.product);
            }
        }
    }

    closeFittingRoom() {
        const fittingRoomModal = document.getElementById('fittingRoomModal');
        if (fittingRoomModal) {
            fittingRoomModal.classList.remove('active');
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

    updateCartUI() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartCount = document.querySelector('.cart-count');
        
        if (cartCount) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
            cartCount.style.display = totalItems > 0 ? 'block' : 'none';
        }
    }

    renderCartItems() {
        const cartItems = document.getElementById('cartItems');
        if (!cartItems) return;

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p>Votre panier est vide</p>';
            return;
        }

        cartItems.innerHTML = cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-image">
                    <img src="${item.imageUrl || '/images/placeholder-product.jpg'}" 
                         alt="${item.name}"
                         onerror="this.src='/images/placeholder-product.jpg'">
                </div>
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>${this.formatPrice(item.price)}</p>
                    <p>Taille: ${item.size || 'Standard'}</p>
                    <p>Vendeur: ${item.sellerName}</p>
                </div>
                <div class="cart-item-actions">
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="productDetail.updateCartQuantity('${item.productId}', '${item.size}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="quantity-btn" onclick="productDetail.updateCartQuantity('${item.productId}', '${item.size}', 1)">+</button>
                    </div>
                    <button class="btn btn-outline btn-small" onclick="productDetail.removeFromCart('${item.productId}', '${item.size}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateCartQuantity(productId, size, change) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const item = cart.find(item => item.productId === productId && item.size === size);
        
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                this.removeFromCart(productId, size);
            } else {
                localStorage.setItem('cart', JSON.stringify(cart));
                this.renderCartItems();
                this.updateCartTotal();
            }
        }
    }

    removeFromCart(productId, size) {
        let cart = JSON.parse(localStorage.getItem('cart') || '[]');
        cart = cart.filter(item => !(item.productId === productId && item.size === size));
        localStorage.setItem('cart', JSON.stringify(cart));
        this.renderCartItems();
        this.updateCartTotal();
        this.updateCartUI();
        this.showNotification('Produit retiré du panier', 'success');
    }

    clearCart() {
        if (confirm('Voulez-vous vraiment vider votre panier?')) {
            localStorage.removeItem('cart');
            this.renderCartItems();
            this.updateCartTotal();
            this.updateCartUI();
            this.showNotification('Panier vidé', 'success');
        }
    }

    updateCartTotal() {
        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        const cartTotal = document.getElementById('cartTotal');
        
        if (cartTotal) {
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = this.formatPrice(total);
        }
    }

    async handleCheckout() {
        if (!this.authManager.isAuthenticated()) {
            this.showNotification('Veuillez vous connecter pour continuer', 'error');
            window.location.href = 'login.html';
            return;
        }

        const cart = JSON.parse(localStorage.getItem('cart') || '[]');
        
        if (cart.length === 0) {
            this.showNotification('Votre panier est vide', 'error');
            return;
        }

        try {
            // Create order
            const order = {
                userId: this.authManager.currentUser.uid,
                items: cart,
                totalAmount: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
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

            // Clear cart
            localStorage.removeItem('cart');
            this.updateCartUI();
            this.closeCartModal();

            // Redirect to payment page
            window.location.href = `payment.html?orderId=${orderRef.id}`;
        } catch (error) {
            console.error('Checkout error:', error);
            this.showNotification('Erreur lors du traitement de la commande', 'error');
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

// Initialize product detail page
document.addEventListener('DOMContentLoaded', () => {
    window.productDetail = new ProductDetail();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductDetail;
}
