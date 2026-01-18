// Authentication Module - MarketPlace TG
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Check auth state on load
        auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateUI();
        });

        // Setup form listeners
        this.setupFormListeners();
        this.setupThemeToggle();
    }

    setupFormListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e.target);
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e.target);
            });
        }

        // Account type selector
        const accountTypeBtns = document.querySelectorAll('.account-type-btn');
        accountTypeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectAccountType(btn.dataset.type);
            });
        });
    }

    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Load saved theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.updateThemeIcon(savedTheme);
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        this.updateThemeIcon(newTheme);
    }

    updateThemeIcon(theme) {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
    }

    selectAccountType(type) {
        const accountTypeBtns = document.querySelectorAll('.account-type-btn');
        accountTypeBtns.forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-type="${type}"]`).classList.add('active');

        // Show/hide seller-specific fields
        const sellerFields = document.querySelectorAll('.seller-only');
        sellerFields.forEach(field => {
            field.style.display = type === 'seller' ? 'block' : 'none';
        });
    }

    async handleLogin(form) {
        const email = form.email.value;
        const password = form.password.value;
        const remember = form.remember?.checked || false;

        try {
            this.showLoading(form.querySelector('button[type="submit"]'));
            
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            
            if (remember) {
                localStorage.setItem('rememberUser', 'true');
            }

            this.showNotification('Connexion réussie!', 'success');
            
            // Redirect based on user type
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(userCredential.user.uid).get();
            const userData = userDoc.data();
            
            if (userData.userType === USER_TYPES.SELLER) {
                window.location.href = 'dashboard-vendeur.html';
            } else {
                window.location.href = 'index.html';
            }
            
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            this.hideLoading(form.querySelector('button[type="submit"]'));
        }
    }

    async handleRegister(form) {
        const formData = new FormData(form);
        const password = formData.get('password');
        const confirmPassword = formData.get('confirmPassword');
        const accountType = document.querySelector('.account-type-btn.active').dataset.type;

        // Enhanced validation
        if (password !== confirmPassword) {
            this.showNotification('Les mots de passe ne correspondent pas', 'error');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Le mot de passe doit contenir au moins 6 caractères', 'error');
            return;
        }

        const email = formData.get('email');
        const phone = formData.get('phone');

        if (!Validators.email(email)) {
            this.showNotification(ERROR_MESSAGES.INVALID_EMAIL, 'error');
            return;
        }

        if (!Validators.phone(phone)) {
            this.showNotification(ERROR_MESSAGES.INVALID_PHONE, 'error');
            return;
        }

        try {
            this.showLoading(form.querySelector('button[type="submit"]'));

            // Create user account with email verification
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);

            // Send email verification
            await userCredential.user.sendEmailVerification();

            // Create user profile with validation
            const userProfile = {
                uid: userCredential.user.uid,
                firstName: formData.get('firstName').trim(),
                lastName: formData.get('lastName').trim(),
                email: email.toLowerCase().trim(),
                phone: phone.trim(),
                userType: accountType,
                isActive: true,
                emailVerified: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Add seller-specific data
            if (accountType === USER_TYPES.SELLER) {
                userProfile.shopName = formData.get('shopName')?.trim() || `${userProfile.firstName} ${userProfile.lastName}`;
                userProfile.shopDescription = '';
                userProfile.shopRating = 0;
                userProfile.totalSales = 0;
                userProfile.totalProducts = 0;
            }

            // Save to Firestore with error handling
            await db.collection(COLLECTIONS.USERS).doc(userCredential.user.uid).set(userProfile);

            this.showNotification('Inscription réussie! Vérifiez votre email.', 'success');

            // Redirect based on user type after verification
            setTimeout(() => {
                if (accountType === USER_TYPES.SELLER) {
                    window.location.href = 'dashboard-vendeur.html';
                } else {
                    window.location.href = 'index.html';
                }
            }, 2000);

        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification(this.getErrorMessage(error), 'error');
        } finally {
            this.hideLoading(form.querySelector('button[type="submit"]'));
        }
    }

    async handleLogout() {
        try {
            await auth.signOut();
            localStorage.removeItem('rememberUser');
            window.location.href = 'login.html';
        } catch (error) {
            console.error('Logout error:', error);
            this.showNotification('Erreur lors de la déconnexion', 'error');
        }
    }

    updateUI() {
        const authButtons = document.querySelector('.auth-buttons');
        const userMenu = document.getElementById('userMenu');
        const logoutBtn = document.getElementById('logoutBtn');

        if (this.currentUser) {
            // User is logged in
            if (authButtons) {
                authButtons.style.display = 'none';
            }
            if (userMenu) {
                userMenu.style.display = 'block';
            }
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => this.handleLogout());
            }
        } else {
            // User is logged out
            if (authButtons) {
                authButtons.style.display = 'flex';
            }
            if (userMenu) {
                userMenu.style.display = 'none';
            }
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
            button.innerHTML = button.id === 'loginForm' ? 'Se connecter' : "S'inscrire";
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.getElementById('notification');
        const notificationMessage = document.getElementById('notificationMessage');
        const icon = notification.querySelector('i');

        if (notification && notificationMessage) {
            notificationMessage.textContent = message;
            
            // Update icon based on type
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

    getErrorMessage(error) {
        switch (error.code) {
            case 'auth/email-already-in-use':
                return 'Cet email est déjà utilisé';
            case 'auth/invalid-email':
                return 'Email invalide';
            case 'auth/weak-password':
                return 'Le mot de passe est trop faible';
            case 'auth/user-not-found':
                return 'Utilisateur non trouvé';
            case 'auth/wrong-password':
                return 'Mot de passe incorrect';
            case 'auth/too-many-requests':
                return 'Trop de tentatives. Veuillez réessayer plus tard';
            default:
                return 'Une erreur est survenue. Veuillez réessayer';
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user data
    async getCurrentUserData() {
        if (!this.currentUser) return null;
        
        try {
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(this.currentUser.uid).get();
            return userDoc.data();
        } catch (error) {
            console.error('Error getting user data:', error);
            return null;
        }
    }

    // Check if user is seller
    async isSeller() {
        const userData = await this.getCurrentUserData();
        return userData?.userType === USER_TYPES.SELLER;
    }

    // Check if user is admin
    async isAdmin() {
        const userData = await this.getCurrentUserData();
        return userData?.userType === USER_TYPES.ADMIN;
    }
}

// Initialize auth manager
const authManager = new AuthManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AuthManager;
}
