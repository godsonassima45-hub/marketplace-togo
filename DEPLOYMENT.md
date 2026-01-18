# Déploiement MarketPlace TG sur Netlify

## 🚀 Instructions Complètes de Déploiement

### 1. Prérequis

- Compte GitHub avec le projet cloné
- Compte Netlify (gratuit)
- Compte Firebase avec projet créé
- Node.js installé (pour le déploiement)

### 2. Configuration Firebase

1. **Créer le projet Firebase** :
   - Aller sur [Firebase Console](https://console.firebase.google.com/)
   - Cliquer sur "Ajouter un projet"
   - Nom : `marketplace-togo`
   - Activer Google Analytics (optionnel)

2. **Activer les services** :
   ```
   Authentication → Email/Password → Activer
   Firestore Database → Créer une base de données
   Storage → Commencer
   ```

3. **Configurer les règles Firestore** :
   - Copier le contenu de `firestore.rules`
   - Coller dans les règles Firestore
   - Publier

4. **Configurer les règles Storage** :
   - Copier le contenu de `storage.rules`
   - Coller dans les règles Storage
   - Publier

5. **Récupérer les clés Firebase** :
   - Paramètres du projet → Configuration
   - Copier toutes les clés Firebase

### 3. Préparation du Déploiement

1. **Installer les dépendances** :
   ```bash
   cd marketplace-togo
   npm install
   ```

2. **Préparer la configuration** :
   ```bash
   node deploy.js
   ```

3. **Mettre à jour firebase-config.js** :
   - Remplacer les clés de démonstration par vos vraies clés
   - Vérifier que toutes les configurations sont correctes

4. **Initialiser les données (optionnel)** :
   ```bash
   node firebase-init.js
   ```

### 4. Déploiement sur Netlify

1. **Créer le repository GitHub** :
   ```bash
   git init
   git add .
   git commit -m "Initial commit - MarketPlace TG"
   git branch -M main
   git remote add origin https://github.com/votre-username/marketplace-togo.git
   git push -u origin main
   ```

2. **Connecter à Netlify** :
   - Se connecter sur [Netlify](https://netlify.com)
   - Cliquer sur "New site from Git"
   - Choisir GitHub
   - Sélectionner le repository `marketplace-togo`

3. **Configuration du build** :
   ```
   Build command: (laisser vide)
   Publish directory: public
   ```

4. **Variables d'environnement** :
   Dans Netlify → Site settings → Build & deploy → Environment :
   ```
   FIREBASE_API_KEY=votre_api_key
   FIREBASE_AUTH_DOMAIN=votre_auth_domain
   FIREBASE_PROJECT_ID=votre_project_id
   FIREBASE_STORAGE_BUCKET=votre_storage_bucket
   FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
   FIREBASE_APP_ID=votre_app_id
   FIREBASE_MEASUREMENT_ID=votre_measurement_id
   ```

5. **Déployer** :
   - Cliquer sur "Deploy site"
   - Attendre le déploiement (2-3 minutes)

### 5. Vérification du Déploiement

1. **Tester l'URL** :
   - Ouvrir l'URL Netlify fournie
   - Vérifier que la page d'accueil charge
   - Tester l'inscription/connexion

2. **Tester les fonctionnalités** :
   - Créer un compte acheteur
   - Créer un compte vendeur
   - Ajouter un produit (vendeur)
   - Ajouter au panier (acheteur)
   - Tester le paiement (code OTP: 123456)

3. **Vérifier la console** :
   - Ouvrir les outils de développement
   - Vérifier qu'il n'y a pas d'erreurs Firebase
   - Confirmer que toutes les fonctionnalités marchent

### 6. Comptes de Démonstration

Après déploiement, utiliser ces comptes pour tester :

- **Admin** : admin@marketplace-togo.tg / demo123456
- **Vendeur** : vendeur@marketplace-togo.tg / demo123456  
- **Acheteur** : acheteur@marketplace-togo.tg / demo123456

### 7. Dépannage

**Erreurs courantes** :

1. **"Firebase initialization error"** :
   - Vérifier les clés Firebase dans firebase-config.js
   - S'assurer que le projet Firebase existe

2. **"permission-denied"** :
   - Vérifier les règles Firestore
   - S'assurer que les règles sont publiées

3. **Images ne s'affichent pas** :
   - Vérifier les règles Storage
   - S'assurer que Firebase Storage est activé

4. **Déploiement échoue** :
   - Vérifier les variables d'environnement Netlify
   - S'assurer que netlify.toml est à la racine

**Logs de débogage** :
```javascript
// Dans la console du navigateur
firebase.auth().onAuthStateChanged(user => {
    console.log('Auth state changed:', user);
});

// Vérifier la connexion Firebase
firebase.firestore().enableNetwork()
    .then(() => console.log('Firestore online'))
    .catch(err => console.error('Firestore error:', err));
```

### 8. Maintenance

**Mises à jour** :
1. Modifier le code localement
2. Tester les modifications
3. Commit et push vers GitHub
4. Netlify déploie automatiquement

**Sauvegarde** :
- Les données sont dans Firebase (automatiquement sauvegardées)
- Le code est dans GitHub (versionné)
- Configuration Netlify sauvegardée

### 9. Sécurité

**En production** :
- HTTPS obligatoire (automatique avec Netlify)
- Variables d'environnement sécurisées
- Règles Firestore configurées
- Validation des données côté client

**Bonnes pratiques** :
- Ne jamais exposer les clés Firebase dans le code client
- Utiliser les variables d'environnement Netlify
- Surveiller les logs d'erreurs
- Maintenir les dépendances à jour

---

## 🎉 Résultat Final

Une fois déployé, vous aurez :

- ✅ Marketplace 100% fonctionnelle
- ✅ URL HTTPS sécurisée
- ✅ Authentification complète
- ✅ Gestion des produits
- ✅ Paiement Mobile Money
- ✅ Cabine d'essayage virtuelle
- ✅ Dashboard vendeur
- ✅ Administration
- ✅ Déploiement automatique

**MarketPlace TG sera prêt pour les utilisateurs togolais !** 🇹🇬
