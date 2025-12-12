
// public/js/plantillas.js - Generador de Tarjetas de Producto

/**
 * Crea la tarjeta HTML para un producto en la tienda pública.
 * @param {Object} product - Objeto producto con id, titulo, descripcion_corta, precio, imagen_url.
 * @returns {HTMLElement} El elemento div de la tarjeta de producto.
 */
// public/js/plantillas.js - Generador de Tarjetas de Producto

export function createProductCard(product) {
    const card = document.createElement('div');
    // Clase principal para el estilo de la tarjeta
    card.className = 'product-card fade-in'; 
    card.setAttribute('data-id', product.id);

    // Formatear el precio (Asegúrate de que la moneda sea correcta)
    const formattedPrice = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'USD', // ⚠️ CORRIGE ESTO (e.g., 'COP', 'USD')
        minimumFractionDigits: 0 
    }).format(product.precio);
    
    card.innerHTML = `
        <div class="product-image-container">
            <img src="${product.imagen_url}" alt="${product.titulo}" class="product-image-fit">
        </div>
        <div class="product-info-body">
            <h3 class="product-title">${product.titulo}</h3>
            <p class="product-description">${product.descripcion_corta}</p>
        </div>
        <div class="product-footer">
            <span class="product-price-label">${formattedPrice}</span>
            <button class="cta-button primary-button add-to-cart-btn" disabled>
                Ver Detalle (Pronto)
            </button>
        </div>
    `;

    return card;
}
