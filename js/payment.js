// Payment Processing Module - MarketPlace TG
class PaymentManager {
    constructor() {
        this.order = null;
        this.orderId = null;
        this.selectedPaymentMethod = null;
        this.authManager = window.authManager;
        this.init();
    }

    async init() {
        await this.checkAuth();
        this.getOrderIdFromURL();
        this.loadOrder();
        this.setupEventListeners();
    }

    async checkAuth() {
        if (!this.authManager.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
    }

    getOrderIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.orderId = urlParams.get('orderId');
        
        if (!this.orderId) {
            this.showNotification('Commande non trouvée', 'error');
            window.location.href = 'index.html';
        }
    }

    async loadOrder() {
        try {
            const doc = await db.collection(COLLECTIONS.ORDERS).doc(this.orderId).get();
            
            if (!doc.exists) {
                this.showNotification('Commande non trouvée', 'error');
                window.location.href = 'index.html';
                return;
            }

            this.order = {
                id: doc.id,
                ...doc.data()
            };

            // Verify order belongs to current user
            if (this.order.userId !== this.authManager.currentUser.uid) {
                this.showNotification('Accès non autorisé', 'error');
                window.location.href = 'index.html';
                return;
            }

            this.renderOrderDetails();
            this.loadUserInfo();
        } catch (error) {
            console.error('Error loading order:', error);
            this.showNotification('Erreur lors du chargement de la commande', 'error');
        }
    }

    async loadUserInfo() {
        try {
            const userDoc = await db.collection(COLLECTIONS.USERS).doc(this.authManager.currentUser.uid).get();
            const userData = userDoc.data();
            
            if (userData) {
                // Pre-fill shipping form
                const fullNameInput = document.getElementById('fullName');
                if (fullNameInput) {
                    fullNameInput.value = `${userData.firstName} ${userData.lastName}`;
                }
                
                const phoneInput = document.getElementById('phoneNumber');
                if (phoneInput && userData.phone) {
                    phoneInput.value = userData.phone;
                }
                
                const userNameElement = document.getElementById('userName');
                if (userNameElement) {
                    userNameElement.textContent = `${userData.firstName} ${userData.lastName}`;
                }
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    renderOrderDetails() {
        const orderDetails = document.getElementById('orderDetails');
        if (!orderDetails || !this.order) return;

        const subtotal = this.order.totalAmount;
        const shipping = this.calculateShipping();
        const commission = this.order.commission.platform;
        const total = subtotal + shipping;

        orderDetails.innerHTML = this.order.items.map(item => `
            <div class="order-item">
                <div class="item-image">
                    <img src="${item.imageUrl || '/images/placeholder-product.jpg'}" 
                         alt="${item.name}"
                         onerror="this.src='/images/placeholder-product.jpg'">
                </div>
                <div class="item-details">
                    <h4>${item.name}</h4>
                    <p>Vendeur: ${item.sellerName}</p>
                    <p>Quantité: ${item.quantity}</p>
                    ${item.options ? this.renderItemOptions(item.options) : ''}
                </div>
                <div class="item-price">
                    <span>${this.formatPrice(item.price * item.quantity)}</span>
                </div>
            </div>
        `).join('');

        // Update totals
        document.getElementById('subtotal').textContent = this.formatPrice(subtotal);
        document.getElementById('shipping').textContent = this.formatPrice(shipping);
        document.getElementById('commission').textContent = this.formatPrice(commission);
        document.getElementById('totalAmount').textContent = this.formatPrice(total);
    }

    renderItemOptions(options) {
        if (!options || Object.keys(options).length === 0) return '';
        
        return Object.entries(options).map(([key, value]) => {
            const label = this.getOptionLabel(key);
            return `<span class="item-option">${label}: ${value}</span>`;
        }).join(' | ');
    }

    getOptionLabel(key) {
        const labels = {
            'size': 'Taille',
            'color': 'Couleur',
            'material': 'Matériau'
        };
        return labels[key] || key;
    }

    calculateShipping() {
        // Simple shipping calculation based on city
        const citySelect = document.getElementById('city');
        if (!citySelect || !citySelect.value) return 1000; // Default shipping

        const shippingRates = {
            'lome': 500,
            'kara': 1500,
            'sokode': 1500,
            'palimero': 2000,
            'atsapame': 2000,
            'aného': 1000,
            'bassar': 2000,
            'tsévié': 1000,
            'mango': 2500,
            'bafilo': 2000
        };

        return shippingRates[citySelect.value] || 1000;
    }

    setupEventListeners() {
        // Payment method selection
        const paymentOptions = document.querySelectorAll('.payment-option');
        paymentOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.selectPaymentMethod(option.dataset.method);
            });
        });

        // Request OTP button
        const requestOtpBtn = document.getElementById('requestOtpBtn');
        if (requestOtpBtn) {
            requestOtpBtn.addEventListener('click', () => {
                this.requestOTP();
            });
        }

        // Payment form submission
        const mobileMoneyForm = document.getElementById('mobileMoneyForm');
        if (mobileMoneyForm) {
            mobileMoneyForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.processPayment();
            });
        }

        // Cancel payment
        const cancelPayment = document.getElementById('cancelPayment');
        if (cancelPayment) {
            cancelPayment.addEventListener('click', () => {
                this.cancelPayment();
            });
        }

        // City change for shipping calculation
        const citySelect = document.getElementById('city');
        if (citySelect) {
            citySelect.addEventListener('change', () => {
                this.updateShippingCost();
            });
        }
    }

    selectPaymentMethod(method) {
        this.selectedPaymentMethod = method;
        
        // Update UI
        const paymentOptions = document.querySelectorAll('.payment-option');
        paymentOptions.forEach(option => {
            option.classList.remove('selected');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('selected');

        // Show payment form
        const paymentForm = document.getElementById('paymentForm');
        if (paymentForm) {
            paymentForm.style.display = 'block';
        }

        // Update form title based on method
        const formTitle = paymentForm.querySelector('h3');
        if (formTitle) {
            const methodNames = {
                'flooz': 'Flooz',
                'tmoney': 'TMoney',
                'orange-money': 'Orange Money'
            };
            formTitle.textContent = `Paiement par ${methodNames[method]}`;
        }
    }

    async requestOTP() {
        const phoneNumber = document.getElementById('phoneNumber').value;
        const confirmPhone = document.getElementById('confirmPhone').value;

        // Validation
        if (!phoneNumber || !confirmPhone) {
            this.showNotification('Veuillez remplir tous les champs', 'error');
            return;
        }

        if (phoneNumber !== confirmPhone) {
            this.showNotification('Les numéros de téléphone ne correspondent pas', 'error');
            return;
        }

        if (!this.validatePhoneNumber(phoneNumber)) {
            this.showNotification('Numéro de téléphone invalide', 'error');
            return;
        }

        try {
            this.showLoading(document.getElementById('requestOtpBtn'));

            // Mock OTP request - In production, this would call actual Mobile Money API
            await this.mockOTPRequest(phoneNumber);

            // Show OTP input field
            document.getElementById('otpCode').style.display = 'block';
            document.getElementById('confirmPaymentBtn').style.display = 'inline-flex';
            document.getElementById('requestOtpBtn').style.display = 'none';

            // Mock OTP received
            this.showNotification(`Code OTP envoyé au ${phoneNumber}`, 'success');
            
            // For demo purposes, log the mock OTP
            console.log('Mock OTP for testing: 123456');

        } catch (error) {
            console.error('Error requesting OTP:', error);
            this.showNotification('Erreur lors de l\'envoi du code OTP', 'error');
        } finally {
            this.hideLoading(document.getElementById('requestOtpBtn'));
        }
    }

    async mockOTPRequest(phoneNumber) {
        // Simulate API delay
        return new Promise((resolve) => {
            setTimeout(resolve, 2000);
        });
    }

    async processPayment() {
        const otpCode = document.getElementById('otpCode').value;
        const phoneNumber = document.getElementById('phoneNumber').value;

        // Validation
        if (!otpCode || otpCode.length !== 6) {
            this.showNotification('Code OTP invalide', 'error');
            return;
        }

        // Validate shipping information
        if (!this.validateShippingForm()) {
            return;
        }

        try {
            this.showProcessingModal();

            // Mock payment processing - In production, this would call actual Mobile Money API
            const paymentResult = await this.mockPaymentProcessing(phoneNumber, otpCode);

            if (paymentResult.success) {
                await this.handleSuccessfulPayment(paymentResult);
            } else {
                this.handleFailedPayment(paymentResult.error);
            }

        } catch (error) {
            console.error('Payment processing error:', error);
            this.handleFailedPayment('Erreur lors du traitement du paiement');
        } finally {
            this.hideProcessingModal();
        }
    }

    async mockPaymentProcessing(phoneNumber, otpCode) {
        // Simulate payment processing delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Mock validation - accept "123456" as valid OTP for demo
        if (otpCode === '123456') {
            return {
                success: true,
                transactionId: `TXN${Date.now()}`,
                amount: this.order.totalAmount + this.calculateShipping()
            };
        } else {
            return {
                success: false,
                error: 'Code OTP invalide'
            };
        }
    }

    async handleSuccessfulPayment(paymentResult) {
        try {
            // Update order with payment information
            await db.collection(COLLECTIONS.ORDERS).doc(this.orderId).update({
                status: ORDER_STATUS.CONFIRMED,
                paymentMethod: this.selectedPaymentMethod,
                paymentStatus: 'paid',
                transactionId: paymentResult.transactionId,
                paidAmount: paymentResult.amount,
                paymentDate: firebase.firestore.FieldValue.serverTimestamp(),
                shippingAddress: this.getShippingAddress()
            });

            // Update commission records
            await this.updateCommissionRecords();

            // Show success modal
            this.showSuccessModal(paymentResult);

        } catch (error) {
            console.error('Error updating order:', error);
            this.handleFailedPayment('Erreur lors de la mise à jour de la commande');
        }
    }

    async updateCommissionRecords() {
        try {
            const snapshot = await db.collection(COLLECTIONS.COMMISSIONS)
                .where('orderId', '==', this.orderId)
                .get();

            const batch = db.batch();
            snapshot.forEach(doc => {
                batch.update(doc.ref, {
                    status: 'paid',
                    paidAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            });

            await batch.commit();
        } catch (error) {
            console.error('Error updating commission records:', error);
        }
    }

    handleFailedPayment(error) {
        this.hideProcessingModal();
        this.showErrorModal(error);
    }

    validatePhoneNumber(phoneNumber) {
        // Simple validation for Togolese phone numbers
        const phoneRegex = /^\+228[0-9]{8}$/;
        return phoneRegex.test(phoneNumber);
    }

    validateShippingForm() {
        const fullName = document.getElementById('fullName').value;
        const address = document.getElementById('address').value;
        const city = document.getElementById('city').value;

        if (!fullName || !address || !city) {
            this.showNotification('Veuillez remplir toutes les informations de livraison', 'error');
            return false;
        }

        return true;
    }

    getShippingAddress() {
        return {
            fullName: document.getElementById('fullName').value,
            address: document.getElementById('address').value,
            city: document.getElementById('city').value,
            postalCode: document.getElementById('postalCode').value,
            deliveryNotes: document.getElementById('deliveryNotes').value
        };
    }

    updateShippingCost() {
        const shipping = this.calculateShipping();
        const subtotal = this.order.totalAmount;
        const commission = this.order.commission.platform;
        const total = subtotal + shipping;

        document.getElementById('shipping').textContent = this.formatPrice(shipping);
        document.getElementById('totalAmount').textContent = this.formatPrice(total);
    }

    cancelPayment() {
        if (confirm('Êtes-vous sûr de vouloir annuler le paiement?')) {
            window.location.href = 'index.html';
        }
    }

    showProcessingModal() {
        const modal = document.getElementById('processingModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    hideProcessingModal() {
        const modal = document.getElementById('processingModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showSuccessModal(paymentResult) {
        const modal = document.getElementById('successModal');
        if (modal) {
            document.getElementById('orderNumber').textContent = this.orderId.substring(0, 8).toUpperCase();
            document.getElementById('paidAmount').textContent = this.formatPrice(paymentResult.amount);
            modal.classList.add('active');
        }
    }

    showErrorModal(error) {
        const modal = document.getElementById('errorModal');
        if (modal) {
            document.getElementById('errorMessage').textContent = error;
            modal.classList.add('active');
        }
    }

    closeErrorModal() {
        const modal = document.getElementById('errorModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    showLoading(button) {
        if (button) {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Traitement...';
        }
    }

    hideLoading(button) {
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-sms"></i> Recevoir le code OTP';
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

// Initialize payment manager
document.addEventListener('DOMContentLoaded', () => {
    window.paymentManager = new PaymentManager();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentManager;
}
