// Virtual Fitting Room - MarketPlace TG
class FittingRoom {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.currentProduct = null;
        this.userImage = null;
        this.productImage = null;
        this.init();
    }

    init() {
        this.canvas = document.getElementById('fittingCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            this.setupEventListeners();
            this.setupCanvas();
        }
    }

    setupCanvas() {
        // Set canvas background
        this.ctx.fillStyle = '#f3f4f6';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw placeholder text
        this.ctx.fillStyle = '#6b7280';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Téléchargez votre photo pour commencer', this.canvas.width / 2, this.canvas.height / 2);
    }

    setupEventListeners() {
        // User photo upload
        const userPhotoInput = document.getElementById('userPhoto');
        const uploadPhotoBtn = document.getElementById('uploadPhotoBtn');
        
        if (userPhotoInput && uploadPhotoBtn) {
            uploadPhotoBtn.addEventListener('click', () => {
                userPhotoInput.click();
            });

            userPhotoInput.addEventListener('change', (e) => {
                this.handleUserPhotoUpload(e);
            });
        }

        // Size adjustment
        const sizeAdjustment = document.getElementById('sizeAdjustment');
        if (sizeAdjustment) {
            sizeAdjustment.addEventListener('input', () => {
                this.updateFitting();
            });
        }

        // Position adjustment
        const positionAdjustment = document.getElementById('positionAdjustment');
        if (positionAdjustment) {
            positionAdjustment.addEventListener('input', () => {
                this.updateFitting();
            });
        }

        // Save fitting
        const saveFittingBtn = document.getElementById('saveFittingBtn');
        if (saveFittingBtn) {
            saveFittingBtn.addEventListener('click', () => {
                this.saveFitting();
            });
        }

        // Close fitting room
        const closeFittingRoom = document.getElementById('closeFittingRoom');
        if (closeFittingRoom) {
            closeFittingRoom.addEventListener('click', () => {
                this.closeFittingRoom();
            });
        }
    }

    async handleUserPhotoUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            this.showNotification('Veuillez sélectionner une image valide', 'error');
            return;
        }

        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.userImage = img;
                    this.updateFitting();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error loading user photo:', error);
            this.showNotification('Erreur lors du chargement de la photo', 'error');
        }
    }

    loadProduct(product) {
        this.currentProduct = product;
        
        if (product && product.imageUrl) {
            const img = new Image();
            img.onload = () => {
                this.productImage = img;
                this.updateFitting();
            };
            img.src = product.imageUrl;
        }
    }

    updateFitting() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Set background
        this.ctx.fillStyle = '#f3f4f6';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw user photo
        if (this.userImage) {
            this.drawImageCentered(this.userImage, 0, 0, this.canvas.width, this.canvas.height);
        }

        // Draw product overlay
        if (this.productImage && this.userImage) {
            this.drawProductOverlay();
        }
    }

    drawImageCentered(img, x, y, width, height) {
        const scale = Math.min(width / img.width, height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const centerX = x + (width - scaledWidth) / 2;
        const centerY = y + (height - scaledHeight) / 2;

        this.ctx.drawImage(img, centerX, centerY, scaledWidth, scaledHeight);
    }

    drawProductOverlay() {
        const sizeAdjustment = document.getElementById('sizeAdjustment');
        const positionAdjustment = document.getElementById('positionAdjustment');
        
        const sizeScale = (sizeAdjustment ? sizeAdjustment.value : 100) / 100;
        const positionOffset = positionAdjustment ? parseInt(positionAdjustment.value) : 0;

        // Calculate product position and size
        const productWidth = 150 * sizeScale;
        const productHeight = 200 * sizeScale;
        const productX = (this.canvas.width - productWidth) / 2 + positionOffset;
        const productY = 100; // Position on upper body

        // Save context state
        this.ctx.save();

        // Apply transparency for overlay effect
        this.ctx.globalAlpha = 0.8;

        // Draw product image
        this.ctx.drawImage(
            this.productImage,
            productX,
            productY,
            productWidth,
            productHeight
        );

        // Restore context state
        this.ctx.restore();

        // Draw fitting guides (optional)
        this.drawFittingGuides(productX, productY, productWidth, productHeight);
    }

    drawFittingGuides(x, y, width, height) {
        this.ctx.save();
        this.ctx.strokeStyle = '#16a34a';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);

        // Draw border around product
        this.ctx.strokeRect(x, y, width, height);

        // Draw center lines
        this.ctx.beginPath();
        this.ctx.moveTo(x + width / 2, y);
        this.ctx.lineTo(x + width / 2, y + height);
        this.ctx.moveTo(x, y + height / 2);
        this.ctx.lineTo(x + width, y + height / 2);
        this.ctx.stroke();

        this.ctx.restore();
    }

    saveFitting() {
        if (!this.canvas) {
            this.showNotification('Aucun ajustement à sauvegarder', 'error');
            return;
        }

        try {
            // Create download link
            const link = document.createElement('a');
            link.download = `fitting-${Date.now()}.png`;
            link.href = this.canvas.toDataURL();
            link.click();

            this.showNotification('Image sauvegardée avec succès', 'success');
        } catch (error) {
            console.error('Error saving fitting:', error);
            this.showNotification('Erreur lors de la sauvegarde', 'error');
        }
    }

    closeFittingRoom() {
        const fittingRoomModal = document.getElementById('fittingRoomModal');
        if (fittingRoomModal) {
            fittingRoomModal.classList.remove('active');
        }
    }

    // Future AI-ready functions (placeholders for future implementation)
    
    /**
     * Future AI body detection function
     * This will be implemented with TensorFlow.js or MediaPipe
     */
    async detectBody(image) {
        // TODO: Implement body detection using AI
        // Will use TensorFlow.js PoseNet or MediaPipe
        console.log('Future AI body detection will be implemented here');
        return {
            bodyPoints: [],
            boundingBox: null
        };
    }

    /**
     * Future AI-based clothes resizing function
     */
    async resizeClothes(clothesImage, bodyData) {
        // TODO: Implement intelligent clothes resizing
        // Will use AI to match clothes to body dimensions
        console.log('Future AI clothes resizing will be implemented here');
        return {
            resizedImage: clothesImage,
            adjustments: {}
        };
    }

    /**
     * Future AI-based fit application function
     */
    async applyFit(clothesImage, userImage, bodyData) {
        // TODO: Implement intelligent fit application
        // Will use AI to realistically apply clothes to body
        console.log('Future AI fit application will be implemented here');
        return {
            resultImage: null,
            confidence: 0
        };
    }

    /**
     * Future AI-based color matching function
     */
    async analyzeColors(image) {
        // TODO: Implement color analysis
        // Will analyze user skin tone and suggest matching colors
        console.log('Future color analysis will be implemented here');
        return {
            dominantColors: [],
            skinTone: null,
            recommendations: []
        };
    }

    /**
     * Future AI-based style recommendation function
     */
    async getStyleRecommendations(userPreferences, bodyType) {
        // TODO: Implement style recommendations
        // Will use AI to suggest styles based on user preferences and body type
        console.log('Future style recommendations will be implemented here');
        return {
            recommendations: [],
            confidence: 0
        };
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

// Initialize fitting room
document.addEventListener('DOMContentLoaded', () => {
    window.fittingRoom = new FittingRoom();
});

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FittingRoom;
}
