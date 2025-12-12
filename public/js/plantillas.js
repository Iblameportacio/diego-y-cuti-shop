
// public/js/plantillas.js - Generador de Tarjetas de Producto

/**
 * Crea la tarjeta HTML para un producto en la tienda pública.
 * @param {Object} product - Objeto producto con id, titulo, descripcion_corta, precio, imagen_url.
 * @returns {HTMLElement} El elemento div de la tarjeta de producto.
 */
export function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in';
    card.setAttribute('data-id', product.id);

    // Formatear el precio a moneda local (ej. USD o tu moneda)
    const formattedPrice = new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP  ', /
        minimumFractionDigits: 0 // Si no quieres decimales, úsalo
    }).format(product.precio);
    
    card.innerHTML = `
        <img src="${product.imagen_url}" alt="${product.titulo}" class="product-image">
        <div class="product-info">
            <h3 class="product-title">${product.titulo}</h3>
            <p class="product-description">${product.descripcion_corta}</p>
            <span class="product-price">${formattedPrice}</span>
            <button class="primary-button add-to-cart-btn" disabled>
                Añadir al Carrito (Deshabilitado)
            </button>
        </div>
    `;

    // ⚠️ Si quieres la función de carrito de vuelta, aquí iría la lógica
    // Ejemplo: card.querySelector('.add-to-cart-btn').addEventListener('click', handleAddToCart);

    return card;
}
