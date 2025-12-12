// api/products-public.js (ADAPTADO para permitir la eliminación en el Panel Admin)
import { createClient } from '@supabase/supabase-js';

// Usamos la CLAVE ANÓNIMA (pública)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY 
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido. Use GET.' });
  }

  try {
    const { data, error } = await supabase
      .from('productos') // La tabla de repuestos
      // Añadimos 'file_path' para que el admin pueda borrar la imagen
      .select('id, titulo, descripcion_corta, precio, imagen_url, file_path') 
      .order('id', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(500).json({ error: error.message || 'Error al obtener productos. Verifica la política RLS (READ).' });
    }

    // Si no hay error, enviamos los datos
    res.status(200).json(data);

  } catch (err) {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}
