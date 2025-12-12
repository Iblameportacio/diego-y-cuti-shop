import { createClient } from '@supabase/supabase-js';
import Busboy from 'busboy'; 
import { validateProfessorPassword } from './auth.js';

// --- CONFIGURACIÓN DE SUPABASE (Variables de Entorno) ---
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
// Usamos la clave de ROL DE SERVICIO para bypass RLS y escribir/subir seguro
const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'proyectos-institucionales';
const TABLE_NAME = 'pdfs';

export default (req, res) => {
    // Solo permitir método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método no permitido. Use POST.' });
    }

    // 1. VALIDACIÓN DE AUTENTICACIÓN
    const password = req.headers['x-professor-password'];
    if (!password || !validateProfessorPassword(password)) {
        return res.status(401).json({ error: 'Acceso no autorizado.' });
    }

    // 2. PROCESAMIENTO MULTIPART (Subida de archivos)
    const busboy = Busboy({ headers: req.headers });
    const fileData = {};
    const fields = {}; // Usaremos esto para guardar el campo 'nombre'

    return new Promise((resolve) => {
        
        // Manejar la parte del archivo (el PDF)
        busboy.on('file', (fieldname, file, info) => {
            const { filename, mimeType } = info;
            
            // Validar que es un PDF
            if (mimeType !== 'application/pdf') {
                busboy.destroy(new Error('Tipo de archivo no permitido. Solo PDFs.'));
                return;
            }
            
            fileData.buffer = [];
            fileData.mimeType = mimeType;
            fileData.originalName = filename;
            file.on('data', (data) => fileData.buffer.push(data));
            file.on('end', () => { fileData.buffer = Buffer.concat(fileData.buffer); });
        });

        // Manejar la parte del texto (el nombre público del documento)
        busboy.on('field', (fieldname, val) => { fields[fieldname] = val; });

        // Cuando el procesamiento del formulario termina
        busboy.on('finish', async () => {
            // Validar que tenemos el buffer del archivo y el nombre
            if (!fileData.buffer || !fields.nombre) {
                res.status(400).json({ error: 'Faltan datos: Archivo PDF o Nombre del documento.' });
                return resolve();
            }

            try {
                // A. Subir Archivo a Storage
                
                // Crear un nombre de archivo único para el STORAGE basado en el nombre público
                const cleanFileName = fields.nombre.replace(/[^a-zA-Z0-9]/g, '_');
                const filePath = `${Date.now()}_${cleanFileName}.pdf`; 

                const { data: uploadData, error: storageError } = await supabase.storage
                    .from(BUCKET_NAME)
                    .upload(filePath, fileData.buffer, { contentType: fileData.mimeType });

                if (storageError) throw new Error(`Error en Storage: ${storageError.message}`);

                // Obtener URL pública para guardar en la base de datos
                const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(uploadData.path);

                // B. Insertar Metadata en la Base de Datos
                const { data: dbData, error: dbError } = await supabase
                    .from(TABLE_NAME)
                    // Insertamos el nombre legible (fields.nombre) y la URL pública
                    .insert([{
                        nombre: fields.nombre,
                        url: publicUrl,
                        file_path: uploadData.path
                        }])
                    .select()
                    .single();

                if (dbError) {
                    // Si falla el registro en la DB, intentar borrar el archivo subido de Storage
                    await supabase.storage.from(BUCKET_NAME).remove([uploadData.path]);
                    throw new Error(`Error en DB: ${dbError.message}`);
                }

                // Éxito
                res.status(200).json({ 
                    message: 'Archivo subido y registrado exitosamente.', 
                    nombre: dbData.nombre, 
                    id: dbData.id 
                });
                resolve();

            } catch (err) {
                // Manejo de errores internos (Supabase o Vercel)
                console.error('Error interno de subida:', err.message);
                res.status(500).json({ error: err.message || 'Error interno del servidor durante la subida.' });
                resolve();
            }
        });

        // Manejo de errores de Busboy (ej: archivo muy grande)
        busboy.on('error', (err) => {
            res.status(400).json({ error: err.message || 'Error en el procesamiento del formulario.' });
            resolve();
        });

        // Iniciar el procesamiento del request
        req.pipe(busboy);
    });
};



