# MarketPlace TG - Marketplace Togolaise

Une marketplace moderne et fonctionnelle pour le marché togolais avec paiement Mobile Money, cabine d'essayage virtuelle et système de commission automatique.

## 🚀 Fonctionnalités

### 🛍️ Pour les Acheteurs
- **Parcours d'achat complet** : Navigation, recherche, panier, paiement
- **Authentification sécurisée** : Inscription et connexion avec email vérifié
- **Cabine d'essayage virtuelle** : Essayez les vêtements avec votre photo
- **Paiement Mobile Money** : Support Flooz, TMoney, Orange Money
- **Historique des commandes** : Suivi de vos achats en temps réel

### 🏪 Pour les Vendeurs
- **Espace vendeur dédié** : Tableau de bord complet avec statistiques
- **Gestion des produits** : Ajout, modification, suppression avec validation
- **Suivi des ventes** : Statistiques détaillées et rapports de commissions
- **Commission automatique** : 90% pour le vendeur, 10% pour la plateforme
- **Gestion des commandes** : Traitement et suivi en temps réel

### 🎨 Design & UX
- **Style Alibaba moderne** : Interface épurée et professionnelle
- **Thème vert togolais** : Couleurs adaptées au marché local
- **Mode sombre/clair** : Basculement avec localStorage
- **Responsive Design** : Optimisé mobile et desktop
- **Animations fluides** : Transitions et micro-interactions

### 🛠️ Technique
- **Frontend** : HTML5, CSS3, JavaScript (ES6+)
- **Backend** : Firebase (Auth, Firestore, Storage)
- **Architecture** : Modular, scalable, maintenable
- **Sécurité** : Règles Firestore, validation des données
- **Performance** : Optimisé pour le web togolais

## 📋 Prérequis

- Un compte Firebase (Google)
- Un éditeur de code (VS Code recommandé)
- Git installé
- Navigateur web moderne

## 🛠️ Installation et Configuration

### 1. Cloner le projet

```bash
git clone https://github.com/votre-username/marketplace-togo.git
cd marketplace-togo
```

### 2. Configuration Firebase

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/)
2. Activer les services :
   - **Authentication** (Email/Password)
   - **Firestore Database**
   - **Storage**
3. Configurer les règles Firestore (copier le contenu de `firestore.rules`)
4. Configurer les règles Storage (copier le contenu de `storage.rules`)
5. Activer l'indexation composite pour les requêtes complexes

### 3. Mettre à jour la configuration Firebase

Ouvrir `js/firebase-config.js` et remplacer avec vos configurations :

```javascript
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "votre-projet.firebaseapp.com",
    projectId: "votre-projet-id",
    storageBucket: "votre-projet.appspot.com",
    messagingSenderId: "123456789012",
    appId: "1:123456789012:web:abcdef123456789012345678"
};
```

### 4. Initialiser les données (optionnel)

```bash
# Installer les dépendances
npm install

# Exécuter le script d'initialisation
node firebase-init.js
```

### 5. Lancer le projet localement

```bash
# Avec Python (recommandé)
cd public
python -m http.server 8000

# Ou avec Node.js
npm start
```

Ouvrir `http://localhost:8000` dans votre navigateur.

## 🚀 Déploiement sur Netlify

### 1. Préparer le déploiement

1. Créer un compte sur [Netlify](https://netlify.com)
2. Connecter votre repository GitHub

### 2. Configuration du déploiement

Dans les paramètres Netlify :

**Build settings:**
- **Publish directory**: `public`
- **Build command**: (laisser vide pour site statique)

**Environment variables:**
```
FIREBASE_API_KEY=votre_api_key
FIREBASE_AUTH_DOMAIN=votre_auth_domain
FIREBASE_PROJECT_ID=votre_project_id
FIREBASE_STORAGE_BUCKET=votre_storage_bucket
FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
FIREBASE_APP_ID=votre_app_id
```

### 3. Déployer automatiquement

Chaque `push` sur la branche principale déclenchera un déploiement automatique.

## 📁 Structure du Projet

```
marketplace-togo/
├── public/                 # Fichiers publics
│   ├── index.html         # Page d'accueil
│   ├── login.html         # Connexion
│   ├── register.html      # Inscription
│   ├── product.html       # Détail produit
│   ├── dashboard-vendeur.html # Dashboard vendeur
│   ├── payment.html       # Paiement
│   └── admin.html         # Administration
├── css/
│   └── style.css          # Styles principaux
├── js/
│   ├── firebase-config.js # Configuration Firebase
│   ├── auth.js           # Authentification
│   ├── main.js           # Logique principale
│   ├── product.js        # Gestion produits
│   ├── cart.js           # Panier d'achat
│   ├── payment.js        # Paiement Mobile Money
│   ├── fitting-room.js   # Cabine d'essayage
│   ├── dashboard-vendeur.js # Dashboard vendeur
│   └── admin.js          # Administration
├── firestore.rules        # Règles de sécurité Firestore
├── storage.rules          # Règles de sécurité Storage
├── netlify.toml          # Configuration Netlify
├── firebase-init.js       # Script d'initialisation
├── package.json          # Configuration du projet
└── README.md             # Documentation
```

## 🔧 Configuration

### Types d'utilisateurs

Le système gère trois types d'utilisateurs :

1. **Acheteur** (`buyer`) : Peut acheter des produits
2. **Vendeur** (`seller`) : Peut vendre des produits
3. **Admin** (`admin`) : Gère la plateforme

### Commission automatique

- **Plateforme** : 10% de chaque vente
- **Vendeur** : 90% de chaque vente
- Calcul automatique lors du paiement
- Suivi dans Firestore avec rapports détaillés

### Paiement Mobile Money

Le système simule le paiement Mobile Money :

1. **Flooz** : Simulation complète
2. **TMoney** : Simulation complète  
3. **Orange Money** : Simulation complète

**Code OTP de test** : `123456`

Pour la production, intégrer les APIs réelles des opérateurs.

### Sécurité

- **Règles Firestore** : Validation des accès par rôle
- **Validation des données** : Côté client et serveur
- **Email verification** : Obligatoire pour les vendeurs
- **Rate limiting** : Protection contre les abus

## 🎯 Utilisation

### Comptes de démonstration

Après initialisation avec `firebase-init.js` :

- **Admin** : admin@marketplace-togo.tg / demo123456
- **Vendeur** : vendeur@marketplace-togo.tg / demo123456
- **Acheteur** : acheteur@marketplace-togo.tg / demo123456

### Pour les acheteurs

1. **Créer un compte** : `register.html`
2. **Parcourir les produits** : `index.html`
3. **Ajouter au panier** : Bouton sur chaque produit
4. **Payer** : Panier → Paiement Mobile Money
5. **Suivre la commande** : Espace personnel

### Pour les vendeurs

1. **S'inscrire comme vendeur** : `register.html` (type Vendeur)
2. **Accéder au dashboard** : `dashboard-vendeur.html`
3. **Ajouter des produits** : Formulaire dans le dashboard
4. **Suivre les ventes** : Statistiques en temps réel
5. **Gérer les commandes** : Traitement et expédition

### Pour les administrateurs

1. **Accès admin** : `admin.html`
2. **Gérer les utilisateurs** : Activation/désactivation
3. **Superviser les ventes** : Vue d'ensemble
4. **Suivre les commissions** : Rapports détaillés

## 🚀 Évolutions Futures

### IA et Machine Learning

La cabine d'essayage est prête pour l'IA :

```javascript
// Fonctions prévues pour l'IA
await fittingRoom.detectBody(image);      // Détection corps
await fittingRoom.resizeClothes(bodyData); // Redimensionnement IA
await fittingRoom.applyFit(image, clothes); // Application réaliste
```

### Intégrations API

- **API Mobile Money réelles** : Flooz, TMoney, Orange Money
- **API de livraison** : Services de livraison togolais
- **API de paiement** : Intégrations bancaires

### Fonctionnalités avancées

- **Système d'évaluation** : Notes et avis
- **Chat intégré** : Communication vendeur-acheteur
- **Notifications push** : Alertes en temps réel
- **Analytics avancés** : Google Analytics, Firebase Analytics

## 🐛 Dépannage

### Problèmes courants

**1. Erreur Firebase "permission-denied"**
- Vérifier les règles Firestore
- S'assurer que l'utilisateur est connecté
- Vérifier la vérification email

**2. Images ne s'affichent pas**
- Vérifier la configuration Firebase Storage
- S'assurer que les règles Storage permettent la lecture
- Vérifier les tailles d'images (max 5MB)

**3. Paiement ne fonctionne pas**
- Utiliser le code OTP de test : `123456`
- Vérifier la console pour les erreurs JavaScript
- S'assurer que Firebase est correctement configuré

**4. Déploiement Netlify échoue**
- Vérifier les variables d'environnement
- S'assurer que `netlify.toml` est à la racine
- Vérifier les logs de déploiement

### Debug

```javascript
// Activer le debug Firebase
firebase.database().enableLogging(true);

// Vérifier l'état d'authentification
firebase.auth().onAuthStateChanged(user => {
    console.log('User:', user);
});

// Vérifier la connexion Firestore
firebase.firestore().enableNetwork()
    .then(() => console.log('Firestore online'))
    .catch(err => console.error('Firestore error:', err));
```

## 🔒 Sécurité

### Règles Firestore

Les règles implémentées assurent :
- **Isolation des données** : Chaque utilisateur ne voit que ses données
- **Validation des entrées** : Types et formats vérifiés
- **Contrôle d'accès** : Par rôle et par ressource
- **Protection contre les injections** : Requêtes sécurisées

### Bonnes pratiques

- **Email verification** : Obligatoire pour les vendeurs
- **Validation client/serveur** : Double couche de sécurité
- **Rate limiting** : Protection contre les abus
- **HTTPS obligatoire** : Toutes les communications chiffrées

## 🤝 Contribuer

1. Fork le projet
2. Créer une branche (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commit les changements (`git commit -am 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour détails.

## 📞 Support

Pour toute question ou support :

- **Email** : support@marketplace-togo.tg
- **GitHub Issues** : [Créer une issue](https://github.com/votre-username/marketplace-togo/issues)
- **Documentation** : [Wiki du projet](https://github.com/votre-username/marketplace-togo/wiki)

## 🙏 Remerciements

- **Firebase** : Backend as a Service
- **Font Awesome** : Icônes
- **Netlify** : Hébergement et déploiement
- **La communauté togolaise** : Inspiration et feedback

---

**MarketPlace TG** - La marketplace de confiance pour les togolais 🇹🇬

*Fait avec ❤️ au Togo*
