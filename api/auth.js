
/**
 * Función modular para validar la contraseña del profesor.
 * @param {string} password - La contraseña proporcionada por el cliente.
 * @returns {boolean} - true si la contraseña es correcta.
 */
export function validateProfessorPassword(password) {
    // Usar la variable de entorno PROFESSOR_PASSWORD
    const PROFESSOR_PASSWORD = process.env.PROFESSOR_PASSWORD; 

    // Mensaje de error interno para depuración.
    if (!PROFESSOR_PASSWORD) {
        console.error("PROFESSOR_PASSWORD no está configurada en las variables de entorno de Vercel.");
        return false;
    }

    // Comparación estricta de cadenas.
    return password === PROFESSOR_PASSWORD;
}

/**
 * Endpoint de Vercel para /api/auth.js. Responde si la contraseña es válida.
 */
export default (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: "Método no permitido. Use POST." });
    }
    
    // X-Professor-Password
    const password = req.headers['x-professor-password'];
    
    if (!password) {
        // Mensaje de error para el header
        return res.status(400).json({ error: "Falta el encabezado 'X-Professor-Password'." });
    }

    // Llamar a la función con el nombre correcto
    if (validateProfessorPassword(password)) { 
        res.status(200).json({ message: "Autenticación exitosa." });
    } else {
        res.status(401).json({ error: "Credenciales inválidas." });
    }
};