// Admin Dashboard JavaScript - MarketPlace TG
class AdminDashboard {
    constructor() {
        this.currentUser = null;
        this.users = [];
        this.products = [];
        this.orders = [];
        this.commissions = [];
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

        const isAdmin = await this.authManager.isAdmin();
        if (!isAdmin) {
            window.location.href = 'index.html';
            return;
        }

        this.currentUser = this.authManager.currentUser;
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

        // Search functionality
        this.setupSearchListeners();

        // Filter functionality
        this.setupFilterListeners();

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.authManager.handleLogout();
            });
        }
    }

    setupSearchListeners() {
        // User search
        const searchUserBtn = document.getElementById('searchUserBtn');
        const userSearch = document.getElementById('userSearch');
        
        if (searchUserBtn && userSearch) {
            searchUserBtn.addEventListener('click', () => {
                this.searchUsers(userSearch.value);
            });
            
            userSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchUsers(userSearch.value);
                }
            });
        }

        // Product search
        const searchProductBtn = document.getElementById('searchProductBtn');
        const productSearch = document.getElementById('productSearch');
        
        if (searchProductBtn && productSearch) {
            searchProductBtn.addEventListener('click', () => {
                this.searchProducts(productSearch.value);
            });
            
            productSearch.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.searchProducts(productSearch.value);
                }
            });
        }
    }

    setupFilterListeners() {
        // User type filter
        const userTypeFilter = document.getElementById('userTypeFilter');
        if (userTypeFilter) {
            userTypeFilter.addEventListener('change', () => {
                this.filterUsers(userTypeFilter.value);
            });
        }

        // Product status filter
        const productStatusFilter = document.getElementById('productStatusFilter');
        if (productStatusFilter) {
            productStatusFilter.addEventListener('change', () => {
                this.filterProducts(productStatusFilter.value);
            });
        }

        // Order status filter
        const orderStatusFilter = document.getElementById('orderStatusFilter');
        if (orderStatusFilter) {
            orderStatusFilter.addEventListener('change', () => {
                this.filterOrders(orderStatusFilter.value);
            });
        }
    }

    async loadDashboardData() {
        await Promise.all([
            this.loadUsers(),
            this.loadProducts(),
            this.loadOrders(),
            this.loadCommissions(),
            this.loadStats()
        ]);
    }

    async loadUsers() {
        try {
            const snapshot = await db.collection(COLLECTIONS.USERS).get();
            
            this.users = [];
            snapshot.forEach(doc => {
                this.users.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderUsersTable();
            this.renderSellersTable();
        } catch (error) {
            console.error('Error loading users:', error);
            this.showNotification('Erreur lors du chargement des utilisateurs', 'error');
        }
    }

    async loadProducts() {
        try {
            const snapshot = await db.collection(COLLECTIONS.PRODUCTS).get();
            
            this.products = [];
            snapshot.forEach(doc => {
                this.products.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderProductsTable();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Erreur lors du chargement des produits', 'error');
        }
    }

    async loadOrders() {
        try {
            const snapshot = await db.collection(COLLECTIONS.ORDERS).get();
            
            this.orders = [];
            snapshot.forEach(doc => {
                this.orders.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderOrdersTable();
        } catch (error) {
            console.error('Error loading orders:', error);
            this.showNotification('Erreur lors du chargement des commandes', 'error');
        }
    }

    async loadCommissions() {
        try {
            const snapshot = await db.collection(COLLECTIONS.COMMISSIONS).get();
            
            this.commissions = [];
            snapshot.forEach(doc => {
                this.commissions.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            this.renderCommissionsTable();
            this.updateCommissionsSummary();
        } catch (error) {
            console.error('Error loading commissions:', error);
            this.showNotification('Erreur lors du chargement des commissions', 'error');
        }
    }

    async loadStats() {
        try {
            const totalUsers = this.users.length;
            const totalSellers = this.users.filter(user => user.userType === USER_TYPES.SELLER).length;
            const totalProducts = this.products.length;
            const totalOrders = this.orders.length;
            
            const totalRevenue = this.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
            const totalCommissions = this.commissions.reduce((sum, commission) => sum + (commission.platformAmount || 0), 0);

            // Update stats
            this.updateStat('totalUsers', totalUsers);
            this.updateStat('totalSellers', totalSellers);
            this.updateStat('totalProducts', totalProducts);
            this.updateStat('totalOrders', totalOrders);
            this.updateStat('totalRevenue', totalRevenue);
            this.updateStat('totalCommissions', totalCommissions);

            // Load recent activity
            this.loadRecentActivity();

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

    loadRecentActivity() {
        const recentActivity = document.getElementById('recentActivity');
        if (!recentActivity) return;

        // Combine recent activities from different collections
        const activities = [];

        // Recent orders
        this.orders.slice(0, 5).forEach(order => {
            activities.push({
                type: 'order',
                text: `Nouvelle commande #${order.id.substring(0, 8)}`,
                date: order.createdAt,
                icon: 'fa-shopping-bag'
            });
        });

        // Recent products
        this.products.slice(0, 5).forEach(product => {
            activities.push({
                type: 'product',
                text: `Nouveau produit: ${product.name}`,
                date: product.createdAt,
                icon: 'fa-box'
            });
        });

        // Recent users
        this.users.slice(0, 5).forEach(user => {
            activities.push({
                type: 'user',
                text: `Nouvel utilisateur: ${user.firstName} ${user.lastName}`,
                date: user.createdAt,
                icon: 'fa-user'
            });
        });

        // Sort by date and display
        activities.sort((a, b) => b.date - a.date);
        
        recentActivity.innerHTML = activities.slice(0, 10).map(activity => `
            <div class="activity-item">
                <i class="fas ${activity.icon}"></i>
                <div class="activity-content">
                    <p>${activity.text}</p>
                    <small>${this.formatDate(activity.date)}</small>
                </div>
            </div>
        `).join('');
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

    renderUsersTable() {
        const tableBody = document.getElementById('usersTable');
        if (!tableBody) return;

        if (this.users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        <p>Aucun utilisateur trouvé</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.users.map(user => `
            <tr>
                <td>${user.id.substring(0, 8)}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>
                    <span class="user-type-badge ${user.userType}">
                        ${this.getUserTypeLabel(user.userType)}
                    </span>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                    <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                        ${user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.viewUser('${user.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.toggleUserStatus('${user.id}')">
                        <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderSellersTable() {
        const tableBody = document.getElementById('sellersTable');
        if (!tableBody) return;

        const sellers = this.users.filter(user => user.userType === USER_TYPES.SELLER);
        
        if (sellers.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem;">
                        <p>Aucun vendeur trouvé</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = sellers.map(seller => {
            const sellerProducts = this.products.filter(p => p.sellerId === seller.id);
            const sellerOrders = this.orders.filter(o => 
                o.items.some(item => item.sellerId === seller.id)
            );
            const sellerCommissions = this.commissions.filter(c => c.sellerId === seller.id);
            const totalEarnings = sellerCommissions.reduce((sum, c) => sum + (c.sellerAmount || 0), 0);

            return `
                <tr>
                    <td>${seller.firstName} ${seller.lastName}</td>
                    <td>${seller.shopName || 'N/A'}</td>
                    <td>${seller.email}</td>
                    <td>${seller.phone || 'N/A'}</td>
                    <td>${sellerProducts.length}</td>
                    <td>${sellerOrders.length}</td>
                    <td>
                        <div class="rating">
                            <i class="fas fa-star"></i>
                            ${seller.shopRating || 0}
                        </div>
                    </td>
                    <td>${this.formatPrice(totalEarnings)}</td>
                    <td>
                        <button class="btn btn-outline btn-small" onclick="adminDashboard.viewSeller('${seller.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    renderProductsTable() {
        const tableBody = document.getElementById('productsTable');
        if (!tableBody) return;

        if (this.products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem;">
                        <p>Aucun produit trouvé</p>
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
                <td>${product.sellerName || 'N/A'}</td>
                <td>${product.category || 'N/A'}</td>
                <td>${this.formatPrice(product.price)}</td>
                <td>${product.stock || 0}</td>
                <td>
                    <span class="status-badge ${product.isActive ? 'active' : 'inactive'}">
                        ${product.isActive ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td>${this.formatDate(product.createdAt)}</td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.viewProduct('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.toggleProductStatus('${product.id}')">
                        <i class="fas fa-${product.isActive ? 'eye-slash' : 'eye'}"></i>
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
                    <td colspan="8" style="text-align: center; padding: 2rem;">
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
                <td>${order.items.length} article(s)</td>
                <td>${this.formatPrice(order.totalAmount)}</td>
                <td>${order.paymentMethod || 'N/A'}</td>
                <td>${this.formatDate(order.createdAt)}</td>
                <td>
                    <span class="status-badge ${order.status}">
                        ${this.getOrderStatusLabel(order.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.updateOrderStatus('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderCommissionsTable() {
        const tableBody = document.getElementById('commissionsTable');
        if (!tableBody) return;

        if (this.commissions.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 2rem;">
                        <p>Aucune commission trouvée</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = this.commissions.map(commission => {
            const seller = this.users.find(u => u.id === commission.sellerId);
            const product = this.products.find(p => p.id === commission.productId);

            return `
                <tr>
                    <td>${this.formatDate(commission.createdAt)}</td>
                    <td>${seller ? `${seller.firstName} ${seller.lastName}` : 'N/A'}</td>
                    <td>${product ? product.name : 'N/A'}</td>
                    <td>${this.formatPrice(commission.totalAmount)}</td>
                    <td>${this.formatPrice(commission.platformAmount)}</td>
                    <td>${this.formatPrice(commission.sellerAmount)}</td>
                    <td>
                        <span class="status-badge ${commission.status}">
                            ${commission.status === 'paid' ? 'Payé' : 'En attente'}
                        </span>
                    </td>
                </tr>
            `;
        }).join('');
    }

    updateCommissionsSummary() {
        const totalPlatformCommissions = this.commissions.reduce((sum, c) => sum + (c.platformAmount || 0), 0);
        const totalSellerEarnings = this.commissions.reduce((sum, c) => sum + (c.sellerAmount || 0), 0);
        const totalSalesVolume = this.commissions.reduce((sum, c) => sum + (c.totalAmount || 0), 0);

        this.updateStat('totalPlatformCommissions', totalPlatformCommissions);
        this.updateStat('totalSellerEarnings', totalSellerEarnings);
        this.updateStat('totalSalesVolume', totalSalesVolume);
    }

    // Action methods
    viewUser(userId) {
        // TODO: Implement user detail view
        this.showNotification('Détails utilisateur bientôt disponibles', 'info');
    }

    viewSeller(sellerId) {
        // TODO: Implement seller detail view
        this.showNotification('Détails vendeur bientôt disponibles', 'info');
    }

    viewProduct(productId) {
        // TODO: Implement product detail view
        this.showNotification('Détails produit bientôt disponibles', 'info');
    }

    viewOrder(orderId) {
        // TODO: Implement order detail view
        this.showNotification('Détails commande bientôt disponibles', 'info');
    }

    async toggleUserStatus(userId) {
        try {
            const user = this.users.find(u => u.id === userId);
            if (user) {
                await db.collection(COLLECTIONS.USERS).doc(userId).update({
                    isActive: !user.isActive
                });
                
                await this.loadUsers();
                this.showNotification(`Utilisateur ${user.isActive ? 'désactivé' : 'activé'}`, 'success');
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            this.showNotification('Erreur lors de la mise à jour', 'error');
        }
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

    updateOrderStatus(orderId) {
        // TODO: Implement order status update
        this.showNotification('Mise à jour de statut bientôt disponible', 'info');
    }

    // Search and filter methods
    searchUsers(query) {
        if (!query) {
            this.renderUsersTable();
            return;
        }

        const filteredUsers = this.users.filter(user => 
            user.firstName.toLowerCase().includes(query.toLowerCase()) ||
            user.lastName.toLowerCase().includes(query.toLowerCase()) ||
            user.email.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFilteredUsersTable(filteredUsers);
    }

    filterUsers(userType) {
        if (userType === 'all') {
            this.renderUsersTable();
            return;
        }

        const filteredUsers = this.users.filter(user => user.userType === userType);
        this.renderFilteredUsersTable(filteredUsers);
    }

    renderFilteredUsersTable(users) {
        const tableBody = document.getElementById('usersTable');
        if (!tableBody) return;

        if (users.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        <p>Aucun utilisateur trouvé</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = users.map(user => `
            <tr>
                <td>${user.id.substring(0, 8)}</td>
                <td>${user.firstName} ${user.lastName}</td>
                <td>${user.email}</td>
                <td>${user.phone || 'N/A'}</td>
                <td>
                    <span class="user-type-badge ${user.userType}">
                        ${this.getUserTypeLabel(user.userType)}
                    </span>
                </td>
                <td>${this.formatDate(user.createdAt)}</td>
                <td>
                    <span class="status-badge ${user.isActive ? 'active' : 'inactive'}">
                        ${user.isActive ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.viewUser('${user.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.toggleUserStatus('${user.id}')">
                        <i class="fas fa-${user.isActive ? 'ban' : 'check'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    searchProducts(query) {
        if (!query) {
            this.renderProductsTable();
            return;
        }

        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(query.toLowerCase()) ||
            product.description.toLowerCase().includes(query.toLowerCase())
        );

        this.renderFilteredProductsTable(filteredProducts);
    }

    filterProducts(status) {
        if (status === 'all') {
            this.renderProductsTable();
            return;
        }

        const filteredProducts = this.products.filter(product => 
            status === 'active' ? product.isActive : !product.isActive
        );
        this.renderFilteredProductsTable(filteredProducts);
    }

    renderFilteredProductsTable(products) {
        const tableBody = document.getElementById('productsTable');
        if (!tableBody) return;

        if (products.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 2rem;">
                        <p>Aucun produit trouvé</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <img src="${product.imageUrl || '/images/placeholder-product.jpg'}" 
                         alt="${product.name}" 
                         style="width: 50px; height: 50px; object-fit: cover; border-radius: 4px;"
                         onerror="this.src='/images/placeholder-product.jpg'">
                </td>
                <td>${product.name}</td>
                <td>${product.sellerName || 'N/A'}</td>
                <td>${product.category || 'N/A'}</td>
                <td>${this.formatPrice(product.price)}</td>
                <td>${product.stock || 0}</td>
                <td>
                    <span class="status-badge ${product.isActive ? 'active' : 'inactive'}">
                        ${product.isActive ? 'Actif' : 'Inactif'}
                    </span>
                </td>
                <td>${this.formatDate(product.createdAt)}</td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.viewProduct('${product.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.toggleProductStatus('${product.id}')">
                        <i class="fas fa-${product.isActive ? 'eye-slash' : 'eye'}"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    filterOrders(status) {
        if (status === 'all') {
            this.renderOrdersTable();
            return;
        }

        const filteredOrders = this.orders.filter(order => order.status === status);
        this.renderFilteredOrdersTable(filteredOrders);
    }

    renderFilteredOrdersTable(orders) {
        const tableBody = document.getElementById('ordersTable');
        if (!tableBody) return;

        if (orders.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        <p>Aucune commande trouvée</p>
                    </td>
                </tr>
            `;
            return;
        }

        tableBody.innerHTML = orders.map(order => `
            <tr>
                <td>#${order.id.substring(0, 8)}</td>
                <td>Client ID: ${order.userId.substring(0, 8)}</td>
                <td>${order.items.length} article(s)</td>
                <td>${this.formatPrice(order.totalAmount)}</td>
                <td>${order.paymentMethod || 'N/A'}</td>
                <td>${this.formatDate(order.createdAt)}</td>
                <td>
                    <span class="status-badge ${order.status}">
                        ${this.getOrderStatusLabel(order.status)}
                    </span>
                </td>
                <td>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.viewOrder('${order.id}')">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline btn-small" onclick="adminDashboard.updateOrderStatus('${order.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // Utility methods
    getUserTypeLabel(userType) {
        const labels = {
            'buyer': 'Acheteur',
            'seller': 'Vendeur',
            'admin': 'Admin'
        };
        return labels[userType] || userType;
    }

    getOrderStatusLabel(status) {
        const labels = {
            'pending': 'En attente',
            'confirmed': 'Confirmée',
            'shipped': 'Expédiée',
            'delivered': 'Livrée',
            'cancelled': 'Annulée'
        };
        return labels[status] || status;
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
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
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

// Initialize admin dashboard
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdminDashboard;
}
