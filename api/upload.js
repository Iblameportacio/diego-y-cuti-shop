// api/upload.js - ADAPTADO para PRODUCTOS e IMÁGENES
import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy'; 
// Importar la nueva función de validación que lee el HASH
import { validateAdminPassword } from './auth.js'; 

// --- CONFIGURACIÓN DE SUPABASE (Variables de Entorno) ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
// Usamos la clave de ROL DE SERVICIO para bypass RLS y subir seguro
const supabase = createClient(supabaseUrl, supabaseKey);

// Cambiamos los nombres de las variables
const BUCKET_NAME = 'imagenes_productos'; 
const TABLE_NAME = 'productos'; 

// Función auxiliar para verificar tipos de imagen
const ALLOWED_MIME_TYPES = [
    'image/jpeg', 
    'image/png', 
    'image/webp'
];

export default (req, res) => {
    // Solo permitir método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Use POST.' });
    }

    // 1. VALIDACIÓN DE AUTENTICACIÓN
    const password = req.headers['x-professor-password']; 
    
    // 🚨 CORRECCIÓN: Se añade 'await' ya que validateAdminPassword es asíncrona.
    if (!password || !await validateAdminPassword(password)) { 
        return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    // 2. PROCESAMIENTO MULTIPART (Subida de archivos)
    const busboy = Busboy({ headers: req.headers });
    const fileData = {};
    const fields = {}; // Guardaremos título, descripción y precio aquí

    return new Promise((resolve) => {
        
        // Manejar la parte del archivo (la imagen)
        busboy.on('file', (fieldname, file, info) => {
            const { filename, mimeType } = info;
            
            // Validar que es una IMAGEN
            if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
                busboy.destroy(new Error('Tipo de archivo no permitido. Solo imágenes (JPEG, PNG, WEBP).'));
                return;
            }
            
            fileData.buffer = [];
            fileData.mimeType = mimeType;
            fileData.originalName = filename;
            file.on('data', (data) => fileData.buffer.push(data));
            file.on('end', () => { fileData.buffer = Buffer.concat(fileData.buffer); });
        });

        // Manejar las partes de texto (titulo, descripcion_corta, precio)
        busboy.on('field', (fieldname, val) => { fields[fieldname] = val; });

        // Cuando el procesamiento del formulario termina
        busboy.on('finish', async () => {
            
            // Validar que tenemos el buffer del archivo y los campos requeridos
            if (!fileData.buffer || !fields.titulo || !fields.descripcion_corta || !fields.precio) {
                res.status(400).json({ error: 'Faltan datos: Imagen, Título, Descripción o Precio.' });
                return resolve();
            }

            try {
                // A. Subir Archivo a Storage
                
                // Crear un nombre de archivo único para el STORAGE
                const fileExtension = fileData.originalName.split('.').pop();
                const cleanTitle = fields.titulo.replace(/[^a-zA-Z0-9]/g, '_');
                const filePath = `${Date.now()}_${cleanTitle}.${fileExtension}`; 

                const { data: uploadData, error: storageError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, fileData.buffer, { contentType: fileData.mimeType });

                if (storageError) throw new Error(`Error en Storage: ${storageError.message}`);

                // Obtener URL pública para guardar en la base de datos
                const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);

                // B. Insertar Metadata en la Base de Datos
                const { data: dbData, error: dbError } = await supabase
                    .from(TABLE_NAME)
                    .insert([{
                        titulo: fields.titulo,
                        descripcion_corta: fields.descripcion_corta, 
                        precio: parseFloat(fields.precio), // Convertir a número flotante
                        imagen_url: publicUrl,
                        file_path: uploadData.path // Guardar la ruta del archivo en Storage
                        }])
                    .select()
                    .single();

                if (dbError) {
                    // Si falla el registro en la DB, intentar borrar la imagen de Storage
                    await supabase.storage.from(BUCKET_NAME).remove([uploadData.path]);
                    throw new Error(`Error en DB: ${dbError.message}`);
                }

                // Éxito
                res.status(200).json({ 
                    message: 'Producto subido y registrado exitosamente.', 
                    titulo: dbData.titulo, 
                    id: dbData.id 
                });
                resolve();

            } catch (err) {
                // Manejo de errores internos
                console.error('Error interno de subida:', err.message);
                res.status(500).json({ error: err.message || 'Error interno del servidor durante la subida.' });
                resolve();
            }
        });

        // Manejo de errores de Busboy
        busboy.on('error', (err) => {
            res.status(400).json({ error: err.message || 'Error en el procesamiento del formulario.' });
            resolve();
        });

        // Iniciar el procesamiento del request
        req.pipe(busboy);
    });
};
