// api/products-public.js (Para la tienda pública)
import { createClient } from '@supabase/supabase-js';

// Usamos la CLAVE ANÓNIMA (pública) porque solo vamos a leer (SELECT)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY 
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido.' });
  }

  try {
    const { data, error } = await supabase
      .from('productos') // ¡Tu tabla de repuestos!
      .select('id, titulo, descripcion_corta, precio, imagen_url') // Solo los campos públicos
      .order('id', { ascending: false });

    if (error) {
      console.error('Supabase Error:', error);
      return res.status(500).json({ error: error.message || 'Error al obtener productos.' });
    }

    res.status(200).json(data);

  } catch (err) {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
}