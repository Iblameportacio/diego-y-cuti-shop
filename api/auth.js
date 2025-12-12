// api/auth.js - Endpoint de Autenticación
import { createClient } from '@supabase/supabase-js';

// No necesitamos Supabase aquí si solo comparamos la variable de entorno,
// pero lo mantenemos por si decides usar Hashing después.

/**
 * Función modular para validar la contraseña del admin.
 * @param {string} password - La contraseña proporcionada por el cliente.
 * @returns {boolean} - true si la contraseña es correcta.
 */
export function validateAdminPassword(password) {
    // USAMOS LA NUEVA VARIABLE DE ENTORNO: ADMIN_PASSWORD
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; 

    // Mensaje de error interno para depuración.
    if (!ADMIN_PASSWORD) {
        console.error("ADMIN_PASSWORD no está configurada en las variables de entorno de Vercel.");
        return false;
    }

    // Comparación estricta de cadenas (Método simple).
    return password === ADMIN_PASSWORD;
}

/**
 * Endpoint de Vercel para /api/auth.js. Responde si la contraseña es válida.
 */
export default (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Método no permitido. Use POST." });
    }
    
    // El cliente sigue enviando la contraseña en el header X-Professor-Password
    // Si quieres cambiar este nombre en el frontend, también deberías cambiarlo aquí.
    const password = req.headers['x-professor-password']; 
    
    if (!password) {
        return res.status(400).json({ error: "Falta el encabezado de contraseña." });
    }

    // Llamar a la función con el nombre correcto y la nueva variable de entorno
    if (validateAdminPassword(password)) { 
        res.status(200).json({ message: "Autenticación exitosa." });
    } else {
        res.status(401).json({ error: "Credenciales inválidas." });
    }
};
