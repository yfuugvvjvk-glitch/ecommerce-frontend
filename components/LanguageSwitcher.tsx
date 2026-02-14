'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const translations = {
  ro: {
    // Navbar
    home: 'Acasă',
    products: 'Produse',
    cart: 'Coș',
    favorites: 'Favorite',
    profile: 'Profil',
    orders: 'Comenzi',
    logout: 'Deconectare',
    login: 'Autentificare',
    search: 'Caută produse...',
    contact: 'Contact',
    about: 'Despre',
    admin: 'Admin Panel',
    vouchers: 'Vouchere',
    orderHistory: 'Istoric Comenzi',
    profileSettings: 'Setări Profil',
    myOrders: 'Comenzile Mele',
    myVouchers: 'Voucherele Mele',
    
    // Dashboard
    allProducts: 'Toate Produsele',
    viewAllProducts: 'Vezi Toate Produsele',
    allCategories: 'Toate Categoriile',
    offers: 'Oferte',
    offer: 'Ofertă',
    discount: 'Reducere',
    category: 'Categorie',
    navigationHistory: 'Istoric Navigare',
    recentlyViewed: 'Vizualizate Recent',
    noOffersAvailable: 'Nu există oferte disponibile',
    discountLabel: 'REDUCERE',
    
    // Products
    addToCart: 'Adaugă în coș',
    addToFavorites: 'Adaugă la favorite',
    removeFromFavorites: 'Șterge din favorite',
    outOfStock: 'Stoc epuizat',
    inStock: 'În stoc',
    price: 'Preț',
    description: 'Descriere',
    reviews: 'Recenzii',
    
    // Cart
    emptyCart: 'Coșul tău este gol',
    continueShopping: 'Continuă cumpărăturile',
    total: 'Total',
    checkout: 'Finalizează comanda',
    clearCart: 'Golește coșul',
    quantity: 'Cantitate',
    
    // Favorites
    myFavorites: 'Produsele Mele Favorite',
    noFavorites: 'Nu ai produse favorite',
    addFavoritesText: 'Adaugă produse la favorite pentru a le găsi mai ușor!',
    exploreProducts: 'Explorează Produsele',
    
    // Admin
    adminPanel: 'Panou Administrator',
    users: 'Utilizatori',
    manageProducts: 'Gestionare Produse',
    manageUsers: 'Gestionare Utilizatori',
    manageOrders: 'Gestionare Comenzi',
    manageVouchers: 'Gestionare Vouchere',
    manageOffers: 'Gestionare Oferte',
    reports: 'Rapoarte',
    viewReports: 'Vezi Rapoarte',
    
    // Shop & Filters
    filtersAndSort: 'Filtre și Sortare',
    searchLabel: 'Caută',
    searchProducts: 'Caută produse...',
    categoryLabel: 'Categorie',
    sortBy: 'Sortează după',
    newest: 'Cele mai noi',
    priceAsc: 'Preț crescător',
    priceDesc: 'Preț descrescător',
    rating: 'Rating',
    nameAZ: 'Nume (A-Z)',
    minRating: 'Rating minim',
    all: 'Toate',
    priceRange: 'Interval preț',
    reset: 'Reset',
    noProductsFound: 'Nu s-au găsit produse.',
    inStockCount: 'În stoc',
    
    // Auth
    loginTitle: 'Autentificare',
    registerTitle: 'Înregistrare',
    email: 'Email',
    password: 'Parolă',
    name: 'Nume',
    loggingIn: 'Se autentifică...',
    registering: 'Se înregistrează...',
    dontHaveAccount: 'Nu ai cont?',
    alreadyHaveAccount: 'Ai deja cont?',
    register: 'Înregistrare',
    
    // Chat
    chat: 'Chat',
    chatWithUsers: 'Chat cu utilizatori',
    quickActions: 'Acțiuni rapide',
    refreshConversations: 'Reîmprospătează conversațiile',
    contactSupport: 'Contact Support',
    createGroup: 'Creează Grup',
    creating: 'Se creează...',
    noConversations: 'Nu ai conversații încă.',
    startNewConversation: 'Începe o conversație nouă!',
    typeMessage: 'Type a message...',
    uploadingFile: 'Uploading file...',
    send: 'Send',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    conversationOptions: 'Opțiuni conversație',
    leaveGroup: 'Părăsește grupul',
    deleteConversation: 'Șterge conversația',
    markAsRead: 'Marchează ca citit',
    close: 'Închide',
    members: 'membri',
    member: 'membru',
    startNewChat: 'Start New Chat',
    noUsersAvailable: 'No users available for new chats',
    refreshUsers: 'Refresh Users',
    createGroupChat: 'Create Group Chat',
    groupName: 'Group name',
    selectMembers: 'Select Members:',
    createGroupButton: 'Create Group',
    creating: 'Creating...',
    conversationHidden: 'Conversația ascunsă',
    
    // Common
    loading: 'Se încarcă...',
    error: 'Eroare',
    success: 'Succes',
    back: 'Înapoi',
    next: 'Următorul',
    previous: 'Anterior',
  },
  en: {
    // Navbar
    home: 'Home',
    products: 'Products',
    cart: 'Cart',
    favorites: 'Favorites',
    profile: 'Profile',
    orders: 'Orders',
    logout: 'Logout',
    login: 'Login',
    search: 'Search products...',
    contact: 'Contact',
    about: 'About',
    admin: 'Admin Panel',
    vouchers: 'Vouchers',
    orderHistory: 'Order History',
    profileSettings: 'Profile Settings',
    myOrders: 'My Orders',
    myVouchers: 'My Vouchers',
    
    // Dashboard
    allProducts: 'All Products',
    viewAllProducts: 'View All Products',
    allCategories: 'All Categories',
    offers: 'Offers',
    offer: 'Offer',
    discount: 'Discount',
    category: 'Category',
    navigationHistory: 'Navigation History',
    recentlyViewed: 'Recently Viewed',
    noOffersAvailable: 'No offers available',
    discountLabel: 'OFF',
    
    // Products
    addToCart: 'Add to Cart',
    addToFavorites: 'Add to Favorites',
    removeFromFavorites: 'Remove from Favorites',
    outOfStock: 'Out of Stock',
    inStock: 'In Stock',
    price: 'Price',
    description: 'Description',
    reviews: 'Reviews',
    
    // Cart
    emptyCart: 'Your cart is empty',
    continueShopping: 'Continue Shopping',
    total: 'Total',
    checkout: 'Checkout',
    clearCart: 'Clear Cart',
    quantity: 'Quantity',
    
    // Favorites
    myFavorites: 'My Favorite Products',
    noFavorites: 'No favorite products',
    addFavoritesText: 'Add products to favorites to find them easier!',
    exploreProducts: 'Explore Products',
    
    // Admin
    adminPanel: 'Admin Panel',
    users: 'Users',
    manageProducts: 'Manage Products',
    manageUsers: 'Manage Users',
    manageOrders: 'Manage Orders',
    manageVouchers: 'Manage Vouchers',
    manageOffers: 'Manage Offers',
    reports: 'Reports',
    viewReports: 'View Reports',
    
    // Shop & Filters
    filtersAndSort: 'Filters and Sort',
    searchLabel: 'Search',
    searchProducts: 'Search products...',
    categoryLabel: 'Category',
    sortBy: 'Sort by',
    newest: 'Newest',
    priceAsc: 'Price ascending',
    priceDesc: 'Price descending',
    rating: 'Rating',
    nameAZ: 'Name (A-Z)',
    minRating: 'Minimum rating',
    all: 'All',
    priceRange: 'Price range',
    reset: 'Reset',
    noProductsFound: 'No products found.',
    inStockCount: 'In stock',
    
    // Auth
    loginTitle: 'Login',
    registerTitle: 'Register',
    email: 'Email',
    password: 'Password',
    name: 'Name',
    loggingIn: 'Logging in...',
    registering: 'Registering...',
    dontHaveAccount: "Don't have an account?",
    alreadyHaveAccount: 'Already have an account?',
    register: 'Register',
    
    // Chat
    chat: 'Chat',
    chatWithUsers: 'Chat with users',
    quickActions: 'Quick actions',
    refreshConversations: 'Refresh conversations',
    contactSupport: 'Contact Support',
    createGroup: 'Create Group',
    creating: 'Creating...',
    noConversations: 'No conversations yet.',
    startNewConversation: 'Start a new conversation!',
    typeMessage: 'Type a message...',
    uploadingFile: 'Uploading file...',
    send: 'Send',
    edit: 'Edit',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    conversationOptions: 'Conversation options',
    leaveGroup: 'Leave group',
    deleteConversation: 'Delete conversation',
    markAsRead: 'Mark as read',
    close: 'Close',
    members: 'members',
    member: 'member',
    startNewChat: 'Start New Chat',
    noUsersAvailable: 'No users available for new chats',
    refreshUsers: 'Refresh Users',
    createGroupChat: 'Create Group Chat',
    groupName: 'Group name',
    selectMembers: 'Select Members:',
    createGroupButton: 'Create Group',
    conversationHidden: 'Conversation hidden',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
  },
  fr: {
    // Navbar
    home: 'Accueil',
    products: 'Produits',
    cart: 'Panier',
    favorites: 'Favoris',
    profile: 'Profil',
    orders: 'Commandes',
    logout: 'Déconnexion',
    login: 'Connexion',
    search: 'Rechercher des produits...',
    contact: 'Contact',
    about: 'À propos',
    admin: 'Panneau Admin',
    vouchers: 'Bons',
    orderHistory: 'Historique des Commandes',
    profileSettings: 'Paramètres du Profil',
    myOrders: 'Mes Commandes',
    myVouchers: 'Mes Bons',
    
    // Dashboard
    allProducts: 'Tous les Produits',
    viewAllProducts: 'Voir Tous les Produits',
    allCategories: 'Toutes les Catégories',
    offers: 'Offres',
    offer: 'Offre',
    discount: 'Réduction',
    category: 'Catégorie',
    navigationHistory: 'Historique de Navigation',
    recentlyViewed: 'Récemment Consultés',
    noOffersAvailable: 'Aucune offre disponible',
    discountLabel: 'RÉDUCTION',
    
    // Products
    addToCart: 'Ajouter au Panier',
    addToFavorites: 'Ajouter aux Favoris',
    removeFromFavorites: 'Retirer des Favoris',
    outOfStock: 'Rupture de Stock',
    inStock: 'En Stock',
    price: 'Prix',
    description: 'Description',
    reviews: 'Avis',
    
    // Cart
    emptyCart: 'Votre panier est vide',
    continueShopping: 'Continuer les Achats',
    total: 'Total',
    checkout: 'Passer la Commande',
    clearCart: 'Vider le Panier',
    quantity: 'Quantité',
    
    // Favorites
    myFavorites: 'Mes Produits Favoris',
    noFavorites: 'Aucun produit favori',
    addFavoritesText: 'Ajoutez des produits aux favoris pour les retrouver facilement!',
    exploreProducts: 'Explorer les Produits',
    
    // Admin
    adminPanel: 'Panneau Administrateur',
    users: 'Utilisateurs',
    manageProducts: 'Gérer les Produits',
    manageUsers: 'Gérer les Utilisateurs',
    manageOrders: 'Gérer les Commandes',
    manageVouchers: 'Gérer les Bons',
    manageOffers: 'Gérer les Offres',
    reports: 'Rapports',
    viewReports: 'Voir les Rapports',
    
    // Shop & Filters
    filtersAndSort: 'Filtres et Tri',
    searchLabel: 'Rechercher',
    searchProducts: 'Rechercher des produits...',
    categoryLabel: 'Catégorie',
    sortBy: 'Trier par',
    newest: 'Plus récents',
    priceAsc: 'Prix croissant',
    priceDesc: 'Prix décroissant',
    rating: 'Note',
    nameAZ: 'Nom (A-Z)',
    minRating: 'Note minimale',
    all: 'Tous',
    priceRange: 'Fourchette de prix',
    reset: 'Réinitialiser',
    noProductsFound: 'Aucun produit trouvé.',
    inStockCount: 'En stock',
    
    // Auth
    loginTitle: 'Connexion',
    registerTitle: 'Inscription',
    email: 'Email',
    password: 'Mot de passe',
    name: 'Nom',
    loggingIn: 'Connexion...',
    registering: 'Inscription...',
    dontHaveAccount: "Vous n'avez pas de compte?",
    alreadyHaveAccount: 'Vous avez déjà un compte?',
    register: 'S\'inscrire',
    
    // Chat
    chat: 'Chat',
    chatWithUsers: 'Chat avec les utilisateurs',
    quickActions: 'Actions rapides',
    refreshConversations: 'Actualiser les conversations',
    contactSupport: 'Contacter le Support',
    createGroup: 'Créer un Groupe',
    creating: 'Création...',
    noConversations: 'Aucune conversation pour le moment.',
    startNewConversation: 'Commencez une nouvelle conversation!',
    typeMessage: 'Tapez un message...',
    uploadingFile: 'Téléchargement du fichier...',
    send: 'Envoyer',
    edit: 'Modifier',
    delete: 'Supprimer',
    save: 'Enregistrer',
    cancel: 'Annuler',
    conversationOptions: 'Options de conversation',
    leaveGroup: 'Quitter le groupe',
    deleteConversation: 'Supprimer la conversation',
    markAsRead: 'Marquer comme lu',
    close: 'Fermer',
    members: 'membres',
    member: 'membre',
    startNewChat: 'Démarrer un Nouveau Chat',
    noUsersAvailable: 'Aucun utilisateur disponible pour de nouveaux chats',
    refreshUsers: 'Actualiser les Utilisateurs',
    createGroupChat: 'Créer un Chat de Groupe',
    groupName: 'Nom du groupe',
    selectMembers: 'Sélectionner les Membres:',
    createGroupButton: 'Créer le Groupe',
    conversationHidden: 'Conversation masquée',
    
    // Common
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
  },
  de: {
    // Navbar
    home: 'Startseite',
    products: 'Produkte',
    cart: 'Warenkorb',
    favorites: 'Favoriten',
    profile: 'Profil',
    orders: 'Bestellungen',
    logout: 'Abmelden',
    login: 'Anmelden',
    search: 'Produkte suchen...',
    contact: 'Kontakt',
    about: 'Über uns',
    admin: 'Admin-Panel',
    vouchers: 'Gutscheine',
    orderHistory: 'Bestellverlauf',
    profileSettings: 'Profileinstellungen',
    myOrders: 'Meine Bestellungen',
    myVouchers: 'Meine Gutscheine',
    
    // Dashboard
    allProducts: 'Alle Produkte',
    viewAllProducts: 'Alle Produkte Anzeigen',
    allCategories: 'Alle Kategorien',
    offers: 'Angebote',
    offer: 'Angebot',
    discount: 'Rabatt',
    category: 'Kategorie',
    navigationHistory: 'Navigationsverlauf',
    recentlyViewed: 'Kürzlich Angesehen',
    noOffersAvailable: 'Keine Angebote verfügbar',
    discountLabel: 'RABATT',
    
    // Products
    addToCart: 'In den Warenkorb',
    addToFavorites: 'Zu Favoriten Hinzufügen',
    removeFromFavorites: 'Aus Favoriten Entfernen',
    outOfStock: 'Nicht Vorrätig',
    inStock: 'Auf Lager',
    price: 'Preis',
    description: 'Beschreibung',
    reviews: 'Bewertungen',
    
    // Cart
    emptyCart: 'Ihr Warenkorb ist leer',
    continueShopping: 'Weiter Einkaufen',
    total: 'Gesamt',
    checkout: 'Zur Kasse',
    clearCart: 'Warenkorb Leeren',
    quantity: 'Menge',
    
    // Favorites
    myFavorites: 'Meine Lieblingsprodukte',
    noFavorites: 'Keine Lieblingsprodukte',
    addFavoritesText: 'Fügen Sie Produkte zu Favoriten hinzu, um sie leichter zu finden!',
    exploreProducts: 'Produkte Erkunden',
    
    // Admin
    adminPanel: 'Administrator-Panel',
    users: 'Benutzer',
    manageProducts: 'Produkte Verwalten',
    manageUsers: 'Benutzer Verwalten',
    manageOrders: 'Bestellungen Verwalten',
    manageVouchers: 'Gutscheine Verwalten',
    manageOffers: 'Angebote Verwalten',
    reports: 'Berichte',
    viewReports: 'Berichte Anzeigen',
    
    // Shop & Filters
    filtersAndSort: 'Filter und Sortierung',
    searchLabel: 'Suchen',
    searchProducts: 'Produkte suchen...',
    categoryLabel: 'Kategorie',
    sortBy: 'Sortieren nach',
    newest: 'Neueste',
    priceAsc: 'Preis aufsteigend',
    priceDesc: 'Preis absteigend',
    rating: 'Bewertung',
    nameAZ: 'Name (A-Z)',
    minRating: 'Mindestbewertung',
    all: 'Alle',
    priceRange: 'Preisspanne',
    reset: 'Zurücksetzen',
    noProductsFound: 'Keine Produkte gefunden.',
    inStockCount: 'Auf Lager',
    
    // Auth
    loginTitle: 'Anmelden',
    registerTitle: 'Registrieren',
    email: 'E-Mail',
    password: 'Passwort',
    name: 'Name',
    loggingIn: 'Anmelden...',
    registering: 'Registrieren...',
    dontHaveAccount: 'Noch kein Konto?',
    alreadyHaveAccount: 'Bereits ein Konto?',
    register: 'Registrieren',
    
    // Chat
    chat: 'Chat',
    chatWithUsers: 'Chat mit Benutzern',
    quickActions: 'Schnellaktionen',
    refreshConversations: 'Konversationen aktualisieren',
    contactSupport: 'Support Kontaktieren',
    createGroup: 'Gruppe Erstellen',
    creating: 'Erstellen...',
    noConversations: 'Noch keine Konversationen.',
    startNewConversation: 'Starten Sie eine neue Konversation!',
    typeMessage: 'Nachricht eingeben...',
    uploadingFile: 'Datei wird hochgeladen...',
    send: 'Senden',
    edit: 'Bearbeiten',
    delete: 'Löschen',
    save: 'Speichern',
    cancel: 'Abbrechen',
    conversationOptions: 'Konversationsoptionen',
    leaveGroup: 'Gruppe verlassen',
    deleteConversation: 'Konversation löschen',
    markAsRead: 'Als gelesen markieren',
    close: 'Schließen',
    members: 'Mitglieder',
    member: 'Mitglied',
    startNewChat: 'Neuen Chat Starten',
    noUsersAvailable: 'Keine Benutzer für neue Chats verfügbar',
    refreshUsers: 'Benutzer Aktualisieren',
    createGroupChat: 'Gruppenchat Erstellen',
    groupName: 'Gruppenname',
    selectMembers: 'Mitglieder Auswählen:',
    createGroupButton: 'Gruppe Erstellen',
    conversationHidden: 'Konversation ausgeblendet',
    
    // Common
    loading: 'Lädt...',
    error: 'Fehler',
    success: 'Erfolg',
    back: 'Zurück',
    next: 'Weiter',
    previous: 'Vorherige',
  },
  es: {
    // Navbar
    home: 'Inicio',
    products: 'Productos',
    cart: 'Carrito',
    favorites: 'Favoritos',
    profile: 'Perfil',
    orders: 'Pedidos',
    logout: 'Cerrar Sesión',
    login: 'Iniciar Sesión',
    search: 'Buscar productos...',
    contact: 'Contacto',
    about: 'Acerca de',
    admin: 'Panel Admin',
    vouchers: 'Cupones',
    orderHistory: 'Historial de Pedidos',
    profileSettings: 'Configuración del Perfil',
    myOrders: 'Mis Pedidos',
    myVouchers: 'Mis Cupones',
    
    // Dashboard
    allProducts: 'Todos los Productos',
    viewAllProducts: 'Ver Todos los Productos',
    allCategories: 'Todas las Categorías',
    offers: 'Ofertas',
    offer: 'Oferta',
    discount: 'Descuento',
    category: 'Categoría',
    navigationHistory: 'Historial de Navegación',
    recentlyViewed: 'Vistos Recientemente',
    noOffersAvailable: 'No hay ofertas disponibles',
    discountLabel: 'DESCUENTO',
    
    // Products
    addToCart: 'Añadir al Carrito',
    addToFavorites: 'Añadir a Favoritos',
    removeFromFavorites: 'Eliminar de Favoritos',
    outOfStock: 'Agotado',
    inStock: 'En Stock',
    price: 'Precio',
    description: 'Descripción',
    reviews: 'Reseñas',
    
    // Cart
    emptyCart: 'Tu carrito está vacío',
    continueShopping: 'Continuar Comprando',
    total: 'Total',
    checkout: 'Finalizar Compra',
    clearCart: 'Vaciar Carrito',
    quantity: 'Cantidad',
    
    // Favorites
    myFavorites: 'Mis Productos Favoritos',
    noFavorites: 'No hay productos favoritos',
    addFavoritesText: '¡Añade productos a favoritos para encontrarlos más fácilmente!',
    exploreProducts: 'Explorar Productos',
    
    // Admin
    adminPanel: 'Panel de Administrador',
    users: 'Usuarios',
    manageProducts: 'Gestionar Productos',
    manageUsers: 'Gestionar Usuarios',
    manageOrders: 'Gestionar Pedidos',
    manageVouchers: 'Gestionar Cupones',
    manageOffers: 'Gestionar Ofertas',
    reports: 'Informes',
    viewReports: 'Ver Informes',
    
    // Common
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    cancel: 'Cancelar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    close: 'Cerrar',
    
    // Shop & Filters
    filtersAndSort: 'Filtros y Ordenar',
    searchLabel: 'Buscar',
    searchProducts: 'Buscar productos...',
    categoryLabel: 'Categoría',
    sortBy: 'Ordenar por',
    newest: 'Más recientes',
    priceAsc: 'Precio ascendente',
    priceDesc: 'Precio descendente',
    rating: 'Valoración',
    nameAZ: 'Nombre (A-Z)',
    minRating: 'Valoración mínima',
    all: 'Todos',
    priceRange: 'Rango de precio',
    reset: 'Restablecer',
    noProductsFound: 'No se encontraron productos.',
    inStockCount: 'En stock',
    
    // Auth
    loginTitle: 'Iniciar Sesión',
    registerTitle: 'Registrarse',
    email: 'Correo',
    password: 'Contraseña',
    name: 'Nombre',
    loggingIn: 'Iniciando sesión...',
    registering: 'Registrando...',
    dontHaveAccount: '¿No tienes cuenta?',
    alreadyHaveAccount: '¿Ya tienes cuenta?',
    register: 'Registrarse',
  },
  it: {
    // Navbar
    home: 'Home',
    products: 'Prodotti',
    cart: 'Carrello',
    favorites: 'Preferiti',
    profile: 'Profilo',
    orders: 'Ordini',
    logout: 'Disconnetti',
    login: 'Accedi',
    search: 'Cerca prodotti...',
    contact: 'Contatto',
    about: 'Chi Siamo',
    admin: 'Pannello Admin',
    vouchers: 'Buoni',
    orderHistory: 'Storico Ordini',
    profileSettings: 'Impostazioni Profilo',
    myOrders: 'I Miei Ordini',
    myVouchers: 'I Miei Buoni',
    
    // Dashboard
    allProducts: 'Tutti i Prodotti',
    viewAllProducts: 'Vedi Tutti i Prodotti',
    allCategories: 'Tutte le Categorie',
    offers: 'Offerte',
    offer: 'Offerta',
    discount: 'Sconto',
    category: 'Categoria',
    navigationHistory: 'Cronologia Navigazione',
    recentlyViewed: 'Visti di Recente',
    noOffersAvailable: 'Nessuna offerta disponibile',
    discountLabel: 'SCONTO',
    
    // Products
    addToCart: 'Aggiungi al Carrello',
    addToFavorites: 'Aggiungi ai Preferiti',
    removeFromFavorites: 'Rimuovi dai Preferiti',
    outOfStock: 'Esaurito',
    inStock: 'Disponibile',
    price: 'Prezzo',
    description: 'Descrizione',
    reviews: 'Recensioni',
    
    // Cart
    emptyCart: 'Il tuo carrello è vuoto',
    continueShopping: 'Continua gli Acquisti',
    total: 'Totale',
    checkout: 'Procedi al Pagamento',
    clearCart: 'Svuota Carrello',
    quantity: 'Quantità',
    
    // Favorites
    myFavorites: 'I Miei Prodotti Preferiti',
    noFavorites: 'Nessun prodotto preferito',
    addFavoritesText: 'Aggiungi prodotti ai preferiti per trovarli più facilmente!',
    exploreProducts: 'Esplora Prodotti',
    
    // Admin
    adminPanel: 'Pannello Amministratore',
    users: 'Utenti',
    manageProducts: 'Gestisci Prodotti',
    manageUsers: 'Gestisci Utenti',
    manageOrders: 'Gestisci Ordini',
    manageVouchers: 'Gestisci Buoni',
    manageOffers: 'Gestisci Offerte',
    reports: 'Rapporti',
    viewReports: 'Visualizza Rapporti',
    
    // Common
    loading: 'Caricamento...',
    error: 'Errore',
    success: 'Successo',
    cancel: 'Annulla',
    save: 'Salva',
    delete: 'Elimina',
    edit: 'Modifica',
    back: 'Indietro',
    next: 'Successivo',
    previous: 'Precedente',
    close: 'Chiudi',
    
    // Shop & Filters
    filtersAndSort: 'Filtri e Ordinamento',
    searchLabel: 'Cerca',
    searchProducts: 'Cerca prodotti...',
    categoryLabel: 'Categoria',
    sortBy: 'Ordina per',
    newest: 'Più recenti',
    priceAsc: 'Prezzo crescente',
    priceDesc: 'Prezzo decrescente',
    rating: 'Valutazione',
    nameAZ: 'Nome (A-Z)',
    minRating: 'Valutazione minima',
    all: 'Tutti',
    priceRange: 'Fascia di prezzo',
    reset: 'Ripristina',
    noProductsFound: 'Nessun prodotto trovato.',
    inStockCount: 'Disponibile',
    
    // Auth
    loginTitle: 'Accedi',
    registerTitle: 'Registrati',
    email: 'Email',
    password: 'Password',
    name: 'Nome',
    loggingIn: 'Accesso...',
    registering: 'Registrazione...',
    dontHaveAccount: 'Non hai un account?',
    alreadyHaveAccount: 'Hai già un account?',
    register: 'Registrati',
  },
};

export type Language = 'ro' | 'en' | 'fr' | 'de' | 'es' | 'it';

export function useTranslation() {
  const [language, setLanguage] = useState<Language>('ro');

  useEffect(() => {
    const saved = localStorage.getItem('language') as Language;
    const validLanguages: Language[] = ['ro', 'en', 'fr', 'de', 'es', 'it'];
    if (saved && validLanguages.includes(saved)) {
      setLanguage(saved);
    }

    // Listen for language changes
    const handleLanguageChange = () => {
      const newLang = localStorage.getItem('language') as Language;
      if (newLang && validLanguages.includes(newLang)) {
        setLanguage(newLang);
      }
    };

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
    // Trigger re-render of all components using translations
    window.dispatchEvent(new Event('languageChange'));
  };

  const t = (key: keyof typeof translations.ro): string => {
    return translations[language][key] || key;
  };

  return { language, changeLanguage, t };
}

export default function LanguageSwitcher() {
  const { language, changeLanguage } = useTranslation();

  return (
    <div className="relative group">
      <button className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors">
        <Globe className="h-5 w-5 text-gray-700" />
        <span className="text-sm font-medium text-gray-700 uppercase">{language}</span>
      </button>
      
      <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all max-h-80 overflow-y-auto">
        <button
          onClick={() => changeLanguage('ro')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'ro' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇷🇴 Română
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'en' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇬🇧 English
        </button>
        <button
          onClick={() => changeLanguage('fr')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'fr' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇫🇷 Français
        </button>
        <button
          onClick={() => changeLanguage('de')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'de' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇩🇪 Deutsch
        </button>
        <button
          onClick={() => changeLanguage('es')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'es' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇪🇸 Español
        </button>
        <button
          onClick={() => changeLanguage('it')}
          className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
            language === 'it' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
          }`}
        >
          🇮🇹 Italiano
        </button>
      </div>
    </div>
  );
}
