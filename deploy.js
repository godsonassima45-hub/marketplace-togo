// Deployment Script for Netlify
// This script prepares the project for deployment

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing MarketPlace TG for deployment...');

// Create production-ready firebase config
const productionFirebaseConfig = `
// Firebase Configuration - MarketPlace TG (Production)
// Replace these values with your actual Firebase configuration

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789012",
    appId: process.env.FIREBASE_APP_ID || "1:123456789012:web:abcdef123456789012345678",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-XXXXXXXXXX"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('✅ Firebase initialized successfully');
} catch (error) {
    if (error.code === 'app/duplicate-app') {
        console.log('✅ Firebase app already initialized');
    } else {
        console.error('❌ Firebase initialization error:', error);
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
        console.log('✅ Firestore persistence enabled');
    })
    .catch((err) => {
        if (err.code == 'failed-precondition') {
            console.warn('⚠️ Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            console.warn('⚠️ The current browser does not support persistence.');
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
        return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim());
    },
    phone: (phone) => {
        if (!phone || typeof phone !== 'string') return false;
        return /^\\+228[0-9]{8}$/.test(phone.trim());
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
    PERMISSION_DENIED: 'Vous n\\'avez pas la permission d\\'effectuer cette action',
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
`;

// Write production firebase config
try {
    fs.writeFileSync(path.join(__dirname, 'js', 'firebase-config.js'), productionFirebaseConfig);
    console.log('✅ Production Firebase config created');
} catch (error) {
    console.error('❌ Error creating production config:', error);
}

// Create .gitignore if it doesn't exist
const gitignoreContent = `
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Build outputs
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# Temporary folders
tmp/
temp/
`;

try {
    if (!fs.existsSync(path.join(__dirname, '.gitignore'))) {
        fs.writeFileSync(path.join(__dirname, '.gitignore'), gitignoreContent.trim());
        console.log('✅ .gitignore created');
    }
} catch (error) {
    console.error('❌ Error creating .gitignore:', error);
}

// Verify deployment structure
const requiredFiles = [
    'public/index.html',
    'public/login.html',
    'public/register.html',
    'public/product.html',
    'public/dashboard-vendeur.html',
    'public/payment.html',
    'public/admin.html',
    'css/style.css',
    'js/firebase-config.js',
    'js/auth.js',
    'js/main.js',
    'js/product.js',
    'js/cart.js',
    'js/payment.js',
    'js/fitting-room.js',
    'js/dashboard-vendeur.js',
    'js/admin.js',
    'netlify.toml',
    'package.json'
];

console.log('🔍 Verifying deployment structure...');
let allFilesExist = true;

requiredFiles.forEach(file => {
    if (fs.existsSync(path.join(__dirname, file))) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ ${file} - MISSING!`);
        allFilesExist = false;
    }
});

if (allFilesExist) {
    console.log('🎉 All required files are present for deployment!');
    console.log('\n📋 Deployment Checklist:');
    console.log('1. ✅ Firebase configuration ready');
    console.log('2. ✅ All HTML files present');
    console.log('3. ✅ All JavaScript modules present');
    console.log('4. ✅ CSS styles present');
    console.log('5. ✅ Netlify configuration ready');
    console.log('6. ✅ Package.json ready');
    
    console.log('\n🚀 Ready for Netlify deployment!');
    console.log('\n📝 Next Steps:');
    console.log('1. Push to GitHub repository');
    console.log('2. Connect repository to Netlify');
    console.log('3. Set environment variables in Netlify');
    console.log('4. Deploy automatically');
    
} else {
    console.log('❌ Some required files are missing. Please check the structure.');
    process.exit(1);
}

console.log('\n✨ MarketPlace TG deployment preparation complete!');
