// Seller Dashboard JavaScript - MarketPlace TG
class SellerDashboard {
    constructor() {
        this.currentUser = null;
        this.userData = null;
        this.products = [];
        this.orders = [];
        this.sales = [];
        this.authManager = window.authManager;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.setupEventListeners();
        this.loadDashboardData();
    }

    async checkAuth() {
        if (!this.authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }

        const isSeller = await this.authManager.isSeller();
        if (!isSeller) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = this.authManager.currentUser;
        this.userData = await this.authManager.getCurrentUserData();
        
        if (this.userData) {
            this.updateSellerInfo();
        }
    }

    setupEventListeners() {
        // Navigation
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.dataset.section;
                this.showSection(section);
                
                // Update active nav
                navLinks.forEach(l => l.classList.remove('active'));
                link.classList.add('active');
            });
        });

        // Add product button
        const addProductBtn = document.getElementById('addProductBtn');
        if (addProductBtn) {
            addProductBtn.addEventListener('click', () => {
                this.showSection('add-product');
            });
        }

        // Product form
        const addProductForm = document.getElementById('addProductForm');
        if (addProductForm) {
            addProductForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddProduct(e.target);
            });
        }

        // Product image upload
        const productImage = document.getElementById('productImage');
        if (productImage) {
            productImage.addEventListener('change', (e) => {
                this.previewImage(e.target);
            });
        }

        // Cancel add product
        const cancelAddProduct = document.getElementById('cancelAddProduct');
        if (cancelAddProduct) {
            cancelAddProduct.addEventListener('click', () => {
                this.showSection('products');
            });
        }

        // Profile form
        const profileForm = document.getElementById('profileForm');
        if (profileForm) {
            profileForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpdateProfile(e.target);
            });
        }

        // Order status filter
        const orderStatus = document.getElementById('orderStatus');
        if (orderStatus) {
            orderStatus.addEventListener('change', () => {
                this.filterOrders(orderStatus.value);
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.authManager.handleLogout();
            });
        }
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadProducts(),
            this.loadOrders(),
            this.loadSales(),
            this.loadStats()
        ]);
    }

    async loadProducts() {
        try {
            const snapshot = await db.collection(COLLECTIONS.PRODUCTS)
                .where('sellerId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            this.products = [];
            snapshot.forEach(doc => {
                this.products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderProducts();
            this.renderProductsTable();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Erreur lors du chargement des produits', 'error');
        }
    }

    async loadOrders() {
        try {
            const snapshot = await db.collection(COLLECTIONS.ORDERS)
                .where('items', 'array-contains', { sellerId: this.currentUser.uid })
                .orderBy('createdAt', 'desc')
                .get();

            this.orders = [];
            snapshot.forEach(doc => {
                const order = {
                    id: doc.id,
                    ...doc.data()
                };
                
                // Filter items for this seller
                order.sellerItems = order.items.filter(item => item.sellerId === this.currentUser.uid);
                this.orders.push(order);
            });

            this.renderOrdersTable();
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Erreur lors du chargement des commandes', 'error');
        }
    }

    async loadSales() {
        try {
            const snapshot = await db.collection(COLLECTIONS.COMMISSIONS)
                .where('sellerId', '==', this.currentUser.uid)
                .orderBy('createdAt', 'desc')
                .get();

            this.sales = [];
            snapshot.forEach(doc => {
                this.sales.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderSalesTable();
            this.updateSalesSummary();
        } catch (error) {
            console.error('Error loading sales:', error);
            this.showNotification('Erreur lors du chargement des ventes', 'error');
        }
    }

    async loadStats() {
        try {
            const totalProducts = this.products.length;
            const totalOrders = this.orders.length;
            
            const totalRevenue = this.sales.reduce((sum, sale) => sum + sale.sellerAmount, 0);
            const netEarnings = totalRevenue; // Already after commission

            // Update stats
            this.updateStat('totalProducts', totalProducts);
            this.updateStat('totalOrders', totalOrders);
            this.updateStat('totalRevenue', totalRevenue);
            this.updateStat('netEarnings', netEarnings);

        } catch (error) {
            console.error('Error loading stats:', error);
        }
    }

    updateStat(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            if (typeof value === 'number') {
                element.textContent = this.formatPrice(value);
            } else {
                element.textContent = value;
            }
        }
    }

    updateSellerInfo() {
        const sellerNameElement = document.getElementById('sellerName');
        if (sellerNameElement && this.userData) {
            sellerNameElement.textContent = this.userData.shopName || `${this.userData.firstName} ${this.userData.lastName}`;
        }

        // Update profile form
        const shopNameInput = document.getElementById('shopName');
        if (shopNameInput && this.userData) {
            shopNameInput.value = this.userData.shopName || '';
        }

        const shopDescriptionInput = document.getElementById('shopDescription');
        if (shopDescriptionInput && this.userData) {
            shopDescriptionInput.value = this.userData.shopDescription || '';
        }

        const shopEmailInput = document.getElementById('shopEmail');
        if (shopEmailInput && this.userData) {
            shopEmailInput.value = this.userData.email || '';
        }

        const shopPhoneInput = document.getElementById('shopPhone');
        if (shopPhoneInput && this.userData) {
            shopPhoneInput.value = this.userData.phone || '';
        }
    }

    showSection(sectionName) {
        // Hide all sections
        const sections = document.querySelectorAll('.dashboard-section-content');
        sections.forEach(section => {
            section.style.display = 'none';
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}-section`);
        if (targetSection) {
            targetSection.style.display = 'block';
        }
    }

    async handleAddProduct(form) {
        const formData = new FormData(form);
        
        try {
            this.showLoading(form.querySelector('button[type="submit"]'));

            // Enhanced validation
            const productName = formData.get('productName').trim();
            const productPrice = parseFloat(formData.get('productPrice'));
            const productStock = parseInt(formData.get('productStock'));
            const productDescription = formData.get('productDescription').trim();

            if (!Validators.productName(productName)) {
                this.showNotification('Le nom du produit doit contenir entre 3 et 100 caractères', 'error');
                return;
            }

            if (!Validators.price(productPrice)) {
                this.showNotification(ERROR_MESSAGES.INVALID_PRICE, 'error');
                return;
            }

            if (productStock < 0 || productStock > 1000) {
                this.showNotification('Le stock doit être entre 0 et 1000 unités', 'error');
                return;
            }

            if (!Validators.description(productDescription)) {
                this.showNotification('La description doit contenir entre 10 et 2000 caractères', 'error');
                return;
            }

            // Upload image if exists
            let imageUrl = '/images/placeholder-product.jpg';
            const imageFile = formData.get('productImage');
            if (imageFile && imageFile.size > 0) {
                if (imageFile.size > 5 * 1024 * 1024) { // 5MB limit
                    this.showNotification('L\'image ne doit pas dépasser 5MB', 'error');
                    return;
                }
                imageUrl = await this.uploadImage(imageFile);
            }

            // Create product with enhanced data
            const product = {
                sellerId: this.currentUser.uid,
                sellerName: this.userData.shopName || `${this.userData.firstName} ${this.userData.lastName}`,
                name: productName,
                category: formData.get('productCategory'),
                price: productPrice,
                stock: productStock,
                description: productDescription,
                imageUrl: imageUrl,
                images: [imageUrl], // For now, just one image
                isActive: true,
                rating: 0,
                reviewCount: 0,
                viewCount: 0,
                soldCount: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Save to Firestore with error handling
            await db.collection(COLLECTIONS.PRODUCTS).add(product);

            // Update seller stats
            await db.collection(COLLECTIONS.USERS).doc(this.currentUser.uid).update({
                totalProducts: firebase.firestore.FieldValue.increment(1),
                lastActivity: firebase.firestore.FieldValue.serverTimestamp()
            });

            this.showNotification('Produit ajouté avec succès', 'success');
            form.reset();
            this.clearImagePreview();
            
            // Reload products and go to products section
            await this.loadProducts();
            this.showSection('products');

        } catch (error) {
            console.error('Error adding product:', error);
            this.showNotification('Erreur lors de l\'ajout du produit', 'error');
        } finally {
            this.hideLoading(form.querySelector('button[type="submit"]'));
        }
    }

    async uploadImage(file) {
        const storageRef = storage.ref(`products/${this.currentUser.uid}/${Date.now()}_${file.name}`);
        const uploadTask = storageRef.put(file);

        return new Promise((resolve, reject) => {
            uploadTask.on('state_changed', 
                (snapshot) => {
                    // Progress indicator could be added here
                },
                (error) => {
                    reject(error);
                },
                async () => {
                    const downloadUrl = await uploadTask.snapshot.ref.getDownloadURL();
                    resolve(downloadUrl);
                }
            );
        });
    }

    previewImage(input) {
        const file = input.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('imagePreview');
                if (preview) {
                    preview.innerHTML = `
                        <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
                    `;
                }
            };
            reader.readAsDataURL(file);
        }
    }

    clearImagePreview() {
        const preview = document.getElementById('imagePreview');
        if (preview) {
            preview.innerHTML = `
                <i class="fas fa-image"></i>
                <span>Aucune image sélectionnée</span>
            `;
        }
    }

    renderProductsTable() {
        const tableBody = document.getElementById('sellerProductsTable');
        if (!tableBody) return;

        if (this.products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; padding: 2rem;">
                        <p>Aucun produit trouvé</p>
                        <button class="btn btn-primary" onclick="sellerDashboard.showSection('add-product')">
                            Ajouter votre premier produit
                        </button>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.products.map(product => `
            <tr>
                <td>
                    <img src="${product.imageUrl || '/images/placeholder-product.jpg'}" 
                         alt="${product.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                         onerror="this.src='/images/placeholder-product.jpg'">
                </td>
                <td>${product.name}</td>
                <td>${this.formatPrice(product.price)}</td>
                <td>${product.stock}</td>
                <td>
                    <span class="status-badge ${product.isActive ? 'active' : 'inactive'}">
                        ${product.isActive ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="sellerDashboard.editProduct('${product.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="sellerDashboard.toggleProductStatus('${product.id}')">
                        <i class="fas fa-${product.isActive ? 'eye-slash' : 'eye'}"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="sellerDashboard.deleteProduct('${product.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderOrdersTable() {
        const tableBody = document.getElementById('ordersTable');
        if (!tableBody) return;

        if (this.orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem;">
                        <p>Aucune commande trouvée</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.orders.map(order => `
            <tr>
                <td>#${order.id.substring(0, 8)}</td>
                <td>Client ID: ${order.userId.substring(0, 8)}</td>
                <td>${order.sellerItems.length} article(s)</td>
                <td>${this.formatPrice(order.sellerItems.reduce((sum, item) => sum + (item.price * item.quantity), 0))}</td>
                <td>${this.formatDate(order.createdAt)}</td>
                <td>
                    <span class="status-badge ${order.status}">
                        ${this.getStatusLabel(order.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="sellerDashboard.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="sellerDashboard.updateOrderStatus('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderSalesTable() {
        const tableBody = document.getElementById('salesTable');
        if (!tableBody) return;

        if (this.sales.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 2rem;">
                        <p>Aucune vente trouvée</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.sales.map(sale => `
            <tr>
                <td>${this.formatDate(sale.createdAt)}</td>
                <td>Produit ID: ${sale.productId.substring(0, 8)}</td>
                <td>${this.formatPrice(sale.totalAmount)}</td>
                <td>${this.formatPrice(sale.platformAmount)}</td>
                <td class="earnings">${this.formatPrice(sale.sellerAmount)}</td>
            </tr>
        `).join('');
    }

    updateSalesSummary() {
        const grossSales = this.sales.reduce((sum, sale) => sum + sale.totalAmount, 0);
        const platformCommission = this.sales.reduce((sum, sale) => sum + sale.platformAmount, 0);
        const sellerEarnings = this.sales.reduce((sum, sale) => sum + sale.sellerAmount, 0);

        this.updateStat('grossSales', grossSales);
        this.updateStat('platformCommission', platformCommission);
        this.updateStat('sellerEarnings', sellerEarnings);
    }

    async toggleProductStatus(productId) {
        try {
            const product = this.products.find(p => p.id === productId);
            if (product) {
                await db.collection(COLLECTIONS.PRODUCTS).doc(productId).update({
                    isActive: !product.isActive
                });
                
                await this.loadProducts();
                this.showNotification(`Produit ${product.isActive ? 'désactivé' : 'activé'}`, 'success');
            }
        } catch (error) {
            console.error('Error toggling product status:', error);
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
    }

    async deleteProduct(productId) {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit?')) {
            return;
        }

        try {
            await db.collection(COLLECTIONS.PRODUCTS).doc(productId).delete();
            await this.loadProducts();
            this.showNotification('Produit supprimé', 'success');
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showNotification('Erreur lors de la suppression', 'error');
        }
    }

    editProduct(productId) {
        // TODO: Implement edit product functionality
        this.showNotification('Fonctionnalité d\'édition bientôt disponible', 'info');
    }

    viewOrder(orderId) {
        // TODO: Implement order view functionality
        this.showNotification('Détails de la commande bientôt disponibles', 'info');
    }

    updateOrderStatus(orderId) {
        // TODO: Implement order status update functionality
        this.showNotification('Mise à jour de statut bientôt disponible', 'info');
    }

    filterOrders(status) {
        // TODO: Implement order filtering
        console.log('Filtering orders by status:', status);
    }

    async handleUpdateProfile(form) {
        try {
            this.showLoading(form.querySelector('button[type="submit"]'));

            const updateData = {
                shopName: form.shopName.value,
                shopDescription: form.shopDescription.value,
                phone: form.shopPhone.value
            };

            await db.collection(COLLECTIONS.USERS).doc(this.currentUser.uid).update(updateData);

            // Update local data
            this.userData = { ...this.userData, ...updateData };
            this.updateSellerInfo();

            this.showNotification('Profil mis à jour avec succès', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            this.showNotification('Erreur lors de la mise à jour du profil', 'error');
        } finally {
            this.hideLoading(form.querySelector('button[type="submit"]'));
        }
    }

    showLoading(button) {
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Chargement...';
        }
    }

    hideLoading(button) {
        if (button) {
            button.disabled = false;
            button.innerHTML = button.textContent.includes('Ajouter') ? 'Ajouter le produit' : 'Mettre à jour';
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'XOF',
            minimumFractionDigits: 0
        }).format(price);
    }

    formatDate(timestamp) {
        if (!timestamp) return 'N/A';
        
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

    getStatusLabel(status) {
        const labels = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'shipped': 'Expédiée',
            'delivered': 'Livrée',
            'cancelled': 'Annulée'
        };
        return labels[status] || status;
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
            } else if (type === 'info') {
                icon.className = 'fas fa-info-circle';
                notification.style.backgroundColor = '#3b82f6';
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

// Initialize seller dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.sellerDashboard = new SellerDashboard();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SellerDashboard;
}
