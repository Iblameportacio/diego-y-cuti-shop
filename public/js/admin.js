// public/js/admin.js - Lógica del Panel de Administración

const PASSWORD_KEY = 'admin_password';
const API_URL = '/api'; // Base para todas las llamadas API

document.addEventListener('DOMContentLoaded', initAdminPanel);

// ========================================
// 1. INICIALIZACIÓN Y SEGURIDAD
// ========================================

function initAdminPanel() {
    // A. Verificar Autenticación al cargar la página
    const password = sessionStorage.getItem(PASSWORD_KEY);
    if (!password) {
        alert('Acceso no autorizado. Por favor, inicie sesión.');
        window.location.href = 'index.html';
        return;
    }

    // B. Configurar eventos
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('uploadProductForm').addEventListener('submit', handleProductUpload);

    // C. Cargar productos
    loadAdminProducts(password);
}

function handleLogout() {
    sessionStorage.removeItem(PASSWORD_KEY);
    alert('Sesión cerrada.');
    window.location.href = 'index.html';
}

// ========================================
// 2. CARGA DE PRODUCTOS (LISTADO PARA EL ADMIN)
// ========================================

/**
 * Carga los productos para mostrarlos en el panel de administración
 * @param {string} password - Contraseña de administrador (para autenticar la API)
 */
async function loadAdminProducts(password) {
    const listContainer = document.getElementById('adminProductList');
    listContainer.innerHTML = 'Cargando lista de repuestos...';

    try {
        // Usamos el endpoint público, ya que en el panel solo necesitamos listarlos.
        // Si tuvieras campos sensibles, crearíamos un endpoint privado.
        const response = await fetch(`${API_URL}/products-public`, {
            // Aunque la API pública no requiere autenticación,
            // si tuvieras una API de lectura privada, la autenticarías así:
            // headers: { 'X-Professor-Password': password } 
        });

        if (!response.ok) throw new Error('Error al obtener la lista de productos del servidor.');
        
        const products = await response.json();
        listContainer.innerHTML = '';
        
        if (products.length === 0) {
            listContainer.innerHTML = '<p>No hay productos registrados.</p>';
            return;
        }

        // Creamos la tabla/lista de productos con botones de eliminar
        products.forEach(product => {
            const item = createAdminProductItem(product);
            listContainer.appendChild(item);
        });

    } catch (error) {
        console.error('Error al cargar productos para admin:', error);
        listContainer.innerHTML = `<p class="error-message">Error: ${error.message}</p>`;
    }
}


/**
 * Crea la fila de producto para el panel de administración (con botón Eliminar)
 */
function createAdminProductItem(product) {
    const div = document.createElement('div');
    div.className = 'admin-product-item';
    div.setAttribute('data-id', product.id);

    //  guardar el file_path, aunque no venga de products-public.js, 
    // por simplicidad y dado que upload.js lo guarda, lo cargaremos si hiciera falta.
    // Como products-public.js NO devuelve el file_path por seguridad, 
    // para el borrado necesitaremos modificar products-public.js para que SÍ lo devuelva, 
    // pero solo si la llamada está autenticada.
    
    // Simplificamos: Asumiremos que products-public.js devuelve file_path, 
    // y CONFIAREMOS en que el RLS de Supabase lo proteja si no hay Service Key.
    // PARA QUE FUNCIONE EL BORRADO, DEBEMOS EDITAR products-public.js para que haga:
    // .select('id, titulo, descripcion_corta, precio, imagen_url, file_path')

    div.innerHTML = `
        <img src="${product.imagen_url}" alt="${product.titulo}" class="admin-thumbnail">
        <div class="product-details">
            <p><strong>ID ${product.id}</strong>: ${product.titulo}</p>
            <p>$${product.precio}</p>
        </div>
        <button class="delete-btn secondary-button" data-id="${product.id}" data-path="${product.file_path || 'unknown'}">
            <i class="fas fa-trash"></i> Eliminar
        </button>
    `;

    div.querySelector('.delete-btn').addEventListener('click', handleDeleteProduct);
    return div;
}

// ========================================
// 3. MANEJO DE SUBIDA (CREATE)
// ========================================

async function handleProductUpload(event) {
    event.preventDefault();
    
    const form = document.getElementById('uploadProductForm');
    const message = document.getElementById('uploadMessage');
    const submitBtn = document.getElementById('uploadSubmitBtn');

    const password = sessionStorage.getItem(PASSWORD_KEY);
    if (!password) return; // Ya se verificó al inicio, pero por seguridad

    const formData = new FormData(form);
    
    // Agregar la contraseña al FormData no es seguro. Usaremos el Header.
    
    message.textContent = 'Subiendo producto e imagen...';
    message.style.color = 'orange';
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            // CRÍTICO: Usar el header para la autenticación
            headers: { 'X-Professor-Password': password }, 
            // NO establecemos Content-Type, FormData lo hace automáticamente para el archivo.
            body: formData 
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Fallo la subida del producto.');
        }

        message.textContent = `Producto "${result.titulo}" (ID: ${result.id}) subido con éxito.`;
        message.style.color = 'green';
        
        form.reset(); // Limpiar el formulario
        loadAdminProducts(password); // Recargar la lista

    } catch (error) {
        console.error('Error al subir producto:', error);
        message.textContent = `Error al subir: ${error.message}`;
        message.style.color = 'red';
    } finally {
        submitBtn.disabled = false;
    }
}

// ========================================
// 4. MANEJO DE ELIMINACIÓN (DELETE)
// ========================================

async function handleDeleteProduct(event) {
    const password = sessionStorage.getItem(PASSWORD_KEY);
    if (!password) return;

    const btn = event.currentTarget;
    const id = btn.getAttribute('data-id');
    const filePath = btn.getAttribute('data-path');
    
    if (!confirm(`¿Estás seguro de que quieres eliminar el Producto ID ${id}? Esta acción es irreversible.`)) {
        return;
    }

    btn.disabled = true;
    btn.textContent = 'Eliminando...';

    try {
        const response = await fetch(`${API_URL}/delete`, {
            method: 'POST',
            headers: { 
                'X-Professor-Password': password, // Autenticación
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify({
                id: parseInt(id), // ID del registro en DB
                file_path: filePath // Ruta del archivo en Storage
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Fallo la eliminación.');
        }

        alert(`✅ ${result.message}`);
        // Eliminar el elemento de la vista sin recargar toda la lista
        document.querySelector(`.admin-product-item[data-id="${id}"]`).remove();
        
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        alert(`Error al eliminar: ${error.message}`);
        btn.disabled = false;
        btn.textContent = 'Eliminar';
    }
}
