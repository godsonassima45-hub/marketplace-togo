// Firebase Configuration - MarketPlace TG
// Configuration de production pour la marketplace togolaise

const firebaseConfig = {
  apiKey: "AIzaSyBcFxH9zei6SV_KZeEB20RB5d-MxXbjqBg",
  authDomain: "marketplace-togo.firebaseapp.com",
  projectId: "marketplace-togo",
  storageBucket: "marketplace-togo.firebasestorage.app",
  messagingSenderId: "999679495940",
  appId: "1:999679495940:web:1a2b0d8c371480d87c0a51"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized successfully');
} catch (error) {
    if (error.code === 'app/duplicate-app') {
        console.log('Firebase app already initialized');
    } else {
        console.error('Firebase initialization error:', error);
    }
}

// Initialize services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configure auth settings
auth.settings.appVerificationDisabledForTesting = false;

// Enable offline persistence with error handling
db.enablePersistence({ synchronizeTabs: true })
    .then(() => {
        console.log('Firestore persistence enabled');
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.warn('The current browser does not support persistence.');
        }
    });

// Collections with proper indexing
const COLLECTIONS = {
    USERS: 'users',
    PRODUCTS: 'products',
    ORDERS: 'orders',
    CARTS: 'carts',
    SALES: 'sales',
    COMMISSIONS: 'commissions'
};

// User types with validation
const USER_TYPES = {
    BUYER: 'buyer',
    SELLER: 'seller',
    ADMIN: 'admin'
};

// Order status with workflow
const ORDER_STATUS = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    PROCESSING: 'processing',
    SHIPPED: 'shipped',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled'
};

// Payment methods for Togo
const PAYMENT_METHODS = {
    FLOOZ: 'flooz',
    TMONEY: 'tmoney',
    ORANGE_MONEY: 'orange_money'
};

// Commission rates (configurable)
const COMMISSION_RATE = {
    PLATFORM: 0.10,
    SELLER: 0.90
};

// Product categories for Togo market
const PRODUCT_CATEGORIES = {
    CLOTHING: 'clothing',
    ACCESSORIES: 'accessories',
    SHOES: 'shoes',
    ELECTRONICS: 'electronics',
    HOME: 'home',
    BEAUTY: 'beauty',
    FOOD: 'food',
    SERVICES: 'services'
};

// Utility functions for data validation
const Validators = {
    email: (email) => {
        if (!email || typeof email !== 'string') return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    },
    phone: (phone) => {
        if (!phone || typeof phone !== 'string') return false;
        return /^\+228[0-9]{8}$/.test(phone.trim());
    },
    price: (price) => {
        if (typeof price !== 'number') return false;
        return price > 0 && price <= 10000000; // Max 10M FCFA
    },
    productName: (name) => {
        if (!name || typeof name !== 'string') return false;
        const trimmed = name.trim();
        return trimmed.length >= 3 && trimmed.length <= 100;
    },
    description: (desc) => {
        if (!desc || typeof desc !== 'string') return false;
        const trimmed = desc.trim();
        return trimmed.length >= 10 && trimmed.length <= 2000;
    }
};

// Error messages in French
const ERROR_MESSAGES = {
    AUTH_REQUIRED: 'Vous devez être connecté pour effectuer cette action',
    INVALID_EMAIL: 'Email invalide',
    INVALID_PHONE: 'Numéro de téléphone invalide (format: +228XXXXXXXX)',
    INVALID_PRICE: 'Le prix doit être positif et inférieur à 10 000 000 FCFA',
    NETWORK_ERROR: 'Erreur de connexion. Vérifiez votre internet',
    PERMISSION_DENIED: 'Vous n\'avez pas la permission d\'effectuer cette action',
    PRODUCT_NOT_FOUND: 'Produit non trouvé',
    STOCK_INSUFFICIENT: 'Stock insuffisant',
    INVALID_QUANTITY: 'Quantité invalide'
};

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

// Firebase error handler
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        firebase,
        auth,
        db,
        storage,
        COLLECTIONS,
        USER_TYPES,
        ORDER_STATUS,
        PAYMENT_METHODS,
        COMMISSION_RATE,
        PRODUCT_CATEGORIES,
        Validators,
        ERROR_MESSAGES
    };
}
