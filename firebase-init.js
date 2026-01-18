// Firebase Initialization Script
// Run this script once to initialize your Firebase project with sample data

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, createUserWithEmailAndPassword } = require('firebase/auth');

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDemoKeyReplaceWithYourOwn",
    authDomain: "marketplace-togo.firebaseapp.com",
    projectId: "marketplace-togo",
    storageBucket: "marketplace-togo.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345678"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Sample data for initialization
const sampleUsers = [
    {
        uid: 'admin-demo',
        firstName: 'Admin',
        lastName: 'MarketPlace',
        email: 'admin@marketplace-togo.tg',
        phone: '+22812345678',
        userType: 'admin',
        isActive: true,
        emailVerified: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
    },
    {
        uid: 'seller-demo',
        firstName: 'Jean',
        lastName: 'Koffi',
        email: 'vendeur@marketplace-togo.tg',
        phone: '+22887654321',
        userType: 'seller',
        shopName: 'Boutique Koffi',
        shopDescription: 'Vêtements traditionnels et modernes',
        shopRating: 4.5,
        totalSales: 0,
        totalProducts: 0,
        isActive: true,
        emailVerified: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
    },
    {
        uid: 'buyer-demo',
        firstName: 'Marie',
        lastName: 'Aho',
        email: 'acheteur@marketplace-togo.tg',
        phone: '+22811223344',
        userType: 'buyer',
        isActive: true,
        emailVerified: true,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
    }
];

const sampleProducts = [
    {
        name: 'Boubou Traditionnel Homme',
        category: 'clothing',
        price: 15000,
        stock: 10,
        description: 'Magnifique boubou traditionnel togolais en tissu wax de haute qualité. Idéal pour les cérémonies et événements spéciaux.',
        sellerId: 'seller-demo',
        sellerName: 'Boutique Koffi',
        imageUrl: 'https://via.placeholder.com/400x300/16a34a/ffffff?text=Boubou+Traditionnel',
        images: ['https://via.placeholder.com/400x300/16a34a/ffffff?text=Boubou+Traditionnel'],
        isActive: true,
        rating: 4.5,
        reviewCount: 12,
        viewCount: 0,
        soldCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    },
    {
        name: 'Robe Wax Femme',
        category: 'clothing',
        price: 12000,
        stock: 15,
        description: 'Robe élégante en tissu wax, parfaite pour le quotidien et les occasions spéciales. Coupe moderne et confortable.',
        sellerId: 'seller-demo',
        sellerName: 'Boutique Koffi',
        imageUrl: 'https://via.placeholder.com/400x300/22c55e/ffffff?text=Robe+Wax',
        images: ['https://via.placeholder.com/400x300/22c55e/ffffff?text=Robe+Wax'],
        isActive: true,
        rating: 4.8,
        reviewCount: 8,
        viewCount: 0,
        soldCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    },
    {
        name: 'T-Shirt MarketPlace TG',
        category: 'clothing',
        price: 5000,
        stock: 50,
        description: 'T-shirt officiel MarketPlace TG en coton de qualité. Disponible en plusieurs tailles. Montrez votre soutien à la marketplace togolaise!',
        sellerId: 'seller-demo',
        sellerName: 'Boutique Koffi',
        imageUrl: 'https://via.placeholder.com/400x300/15803d/ffffff?text=T-Shirt+MarketPlace',
        images: ['https://via.placeholder.com/400x300/15803d/ffffff?text=T-Shirt+MarketPlace'],
        isActive: true,
        rating: 5.0,
        reviewCount: 3,
        viewCount: 0,
        soldCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
    }
];

// Initialize function
async function initializeFirebase() {
    console.log('🚀 Initialisation de Firebase avec les données de démonstration...');
    
    try {
        // Create sample users
        for (const user of sampleUsers) {
            await setDoc(doc(db, 'users', user.uid), user);
            console.log(`✅ Utilisateur créé: ${user.email} (${user.userType})`);
        }

        // Create sample products
        for (const product of sampleProducts) {
            await setDoc(doc(db, 'products'), product);
            console.log(`✅ Produit créé: ${product.name}`);
        }

        console.log('🎉 Initialisation terminée avec succès!');
        console.log('\n📝 Comptes de démonstration:');
        console.log('👨‍💼 Admin: admin@marketplace-togo.tg');
        console.log('🏪 Vendeur: vendeur@marketplace-togo.tg');
        console.log('🛍️ Acheteur: acheteur@marketplace-togo.tg');
        console.log('\n🔑 Mot de passe: demo123456');
        console.log('\n⚠️  Pensez à changer les mots de passe en production!');
        
    } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
    }
}

// Export for use
module.exports = { initializeFirebase };

// Run if called directly
if (require.main === module) {
    initializeFirebase();
}
