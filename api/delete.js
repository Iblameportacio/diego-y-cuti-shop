// api/delete.js - ADAPTADO para PRODUCTOS e IMÁGENES
import { createClient } from '@supabase/supabase-js';
// La función en auth.js ahora es asíncrona y se llama validateAdminPassword
import { validateAdminPassword } from './auth.js'; 

// USAMOS LA CLAVE DE ROL DE SERVICIO para eliminar
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const supabase = createClient(supabaseUrl, supabaseKey);

// 🛠️ Cambios de configuración:
const BUCKET_NAME = 'imagenes_productos'; // Nuevo bucket
const TABLE_NAME = 'productos'; // Nueva tabla

export default async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Use POST.' });
    }

    // 1. VALIDACIÓN DE AUTENTICACIÓN
    const password = req.headers['x-professor-password'];

    // 🛠️ Usamos la función asíncrona de autenticación
    if (!password || !await validateAdminPassword(password)) { 
        return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    // 2. OBTENER DATOS
    const { id, file_path } = req.body;

    if (!id || !file_path) { 
        return res.status(400).json({ error: 'Faltan parámetros: ID y ruta del archivo (file_path).' });
    }

    try {
        // A. Eliminar Archivo del Storage (Imagen del producto)
        const { error: storageError } = await supabase.storage
            .from(BUCKET_NAME)
            .remove([file_path]); 

        // Manejar el error de borrado, pero continuar si el archivo ya no existe (404)
        if (storageError && storageError.statusCode !== '404') {
            console.error("Error Supabase Storage:", storageError);
            // Advertencia: Se continúa para limpiar la BD si el archivo falla
        }

        // B. Eliminar Registro de la Base de Datos (Producto)
        const { error: dbError } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);

        if (dbError) {
            throw new Error(`Error en DB: ${dbError.message}`);
        }

        res.status(200).json({ message: `Producto ID ${id} eliminado.` });

    } catch (err) {
        console.error('Error interno de eliminación:', err.message);
        res.status(500).json({ error: err.message || 'Error interno del servidor durante la eliminación.' });
    }
};

