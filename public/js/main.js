// public/js/main.js - ADAPTADO para Tienda de Repuestos

// Asegúrate de que esta función exista en un módulo importado (ej. './utils.js' o './plantillas.js')
// La renombraremos para que cree tarjetas de productos, no de PDFs.
import { createProductCard } from './plantillas.js'; 

// ========================================
// GESTIÓN DEL TEMA (Lo dejamos intacto)
// ========================================

export function toggleTheme() {
    const html = document.documentElement;
    const themeIcon = document.querySelector('.theme-icon');
    const currentTheme = html.getAttribute('data-theme');
    // ... (El resto de la lógica de toggleTheme es igual) ...
    if (currentTheme === 'dark') {
        html.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    } else {
        html.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const html = document.documentElement;
    const themeIcon = document.querySelector('.theme-icon');

    if (savedTheme === 'dark') {
        html.setAttribute('data-theme', 'dark');
        themeIcon.textContent = '☀️';
    } else {
        html.removeAttribute('data-theme');
        themeIcon.textContent = '🌙';
    }
}
// ... (Otras funciones de UI/Animación: createBackgroundAnimation, hidePreloader, etc. son iguales) ...
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (!preloader) return;
    preloader.style.opacity = '0';
    setTimeout(() => {
        preloader.style.display = 'none';
    }, 500);
}

function initFadeInAnimations() {
    const elements = document.querySelectorAll('.fade-in');
    elements.forEach((el, index) => {
        el.style.animationDelay = (index * 0.2) + 's';
        el.classList.add('animated');
    });
}


// ========================================
// CARGA DINÁMICA DE PRODUCTOS (/api/products-public.js)
// ========================================

async function fetchProducts() {
    // Renombramos el ID del contenedor para reflejar "productos"
    const listContainer = document.getElementById('productListContainer'); 
    if (!listContainer) return;
    listContainer.innerHTML = 'Cargando repuestos...'; 

    try {
        // Llamamos al nuevo endpoint público
        const response = await fetch('/api/products-public'); 
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const products = await response.json();
        listContainer.innerHTML = ''; 

        if (products.length === 0) {
            listContainer.innerHTML = '<p>No hay repuestos disponibles por el momento.</p>';
            return;
        }

        products.forEach(product => {
            // 🛠️ Usamos la función adaptada (la definiremos en plantillas.js)
            const card = createProductCard(product); 
            listContainer.appendChild(card);
        });

    } catch (error) {
        console.error('Error al obtener la lista de productos:', error);
        listContainer.innerHTML = `<p class="error-message">Error al cargar los repuestos. Inténtalo más tarde.</p>`;
    }
}

// ========================================
// LÓGICA DE AUTENTICACIÓN ADMINISTRADOR
// ========================================

function setupAuthModal() {
    const modal = document.getElementById('adminModal');
    const openBtn = document.getElementById('openAdminModal');
    const loginForm = document.getElementById('adminLoginForm');
    const passwordInput = document.getElementById('adminPassword');
    const message = document.getElementById('authMessage');
    
    if (!modal || !openBtn || !loginForm) return;

    // Abrir Modal
    openBtn.onclick = () => {
        modal.style.display = "flex";
        passwordInput.focus();
    }

    // Cerrar Modal (usando el botón de cerrar o click fuera)
    document.querySelector('.close-button').onclick = closeModal;
    window.onclick = (event) => {
        if (event.target == modal) closeModal();
    }

    function closeModal() {
        modal.style.display = "none";
        message.style.display = "none";
        passwordInput.value = "";
    }

    // Manejar el submit del login
    loginForm.addEventListener('submit', handleLogin);
}

async function handleLogin(event) {
    event.preventDefault();
    
    const passwordInput = document.getElementById('adminPassword');
    const message = document.getElementById('authMessage');
    const loginBtn = document.getElementById('loginSubmitBtn');
    
    const password = passwordInput.value;
    message.style.display = 'none';
    loginBtn.disabled = true;

    try {
        const response = await fetch('/api/auth', {
            method: 'POST',
            headers: {
                // El backend espera la contraseña aquí (mantenemos el nombre de header por compatibilidad)
                'X-Professor-Password': password, 
                'Content-Type': 'application/json' 
            },
        });

        if (response.ok) {
            // 🛠️ CRÍTICO: Guardar la contraseña bajo el nombre "admin_password" y no "professor_password"
            sessionStorage.setItem('admin_password', password); 
            
            message.textContent = "Acceso concedido. Redirigiendo al Panel de Administración...";
            message.style.color = 'green';
            message.style.display = 'block';
            
            setTimeout(() => {
                // Redirigir al panel de administración (admin.html)
                window.location.href = 'admin.html'; 
            }, 1000); 

        } else {
            const errorData = await response.json();
            message.textContent = ` ${errorData.error || 'Contraseña incorrecta.'}`;
            message.style.color = 'red';
            message.style.display = 'block';
            // Limpiar la sesión si falla
            sessionStorage.removeItem('admin_password');
        }
    } catch (error) {
        console.error('Error de red al autenticar:', error);
        message.textContent = ' Error de conexión con el servidor.';
        message.style.color = 'red';
        message.style.display = 'block';
    } finally {
        loginBtn.disabled = false;
    }
}


document.addEventListener('DOMContentLoaded', function() {
    hidePreloader();
    loadTheme();
    // createBackgroundAnimation(); // Puedes desactivar esta si no quieres la animación
    initFadeInAnimations();
    // detectSystemTheme(); // Puedes desactivar estas si no te interesan
    // listenSystemThemeChanges();
    
    // 🛠️ Llamamos a la nueva función
    fetchProducts(); 
    setupAuthModal();
});

window.toggleTheme = toggleTheme;
