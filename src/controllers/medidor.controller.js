// src/controllers/medidores.controller.js
import {
  fetchMedidorByCliente,
  fetchMedidoresByClientes,
} from '../services/medidor.service.js';

/**
 * Obtiene información de medidores para un cliente específico
 * @async
 * @function getMedidor
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.params - Parámetros de la URL
 * @param {string} req.params.cliente_medidor - ID del cliente medidor (opcional)
 * @param {Object} req.query - Parámetros de consulta
 * @param {string} req.query.cliente_medidor - ID del cliente medidor (opcional)
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Respuesta JSON con información del medidor
 * @description
 * Endpoint: GET /api/medidores/:cliente_medidor o GET /api/medidores?cliente_medidor=...
 * Busca medidores asociados a un cliente específico en la base de datos.
 * El cliente_medidor puede venir como parámetro de URL o query parameter.
 * 
 * @example
 * // Respuesta exitosa
 * {
 *   "ok": true,
 *   "cliente_medidor": "202957",
 *   "total": 1,
 *   "rows": [
 *     {
 *       "id": 1,
 *       "cliente_medidor": "202957",
 *       "num_medidor": "12345678",
 *       "marca_medidor": "ELSTER",
 *       "tecnologia_medidor": "ELECTRONICO",
 *       "tipo_medidor": "MONOFASICO"
 *     }
 *   ]
 * }
 */
export async function getMedidor(req, res) {
  try {
    const fromParam = req.params?.cliente_medidor;
    const fromQuery = req.query?.cliente_medidor;
    const cliente = String(fromParam ?? fromQuery ?? '').trim();

    if (!cliente) {
      return res.status(400).json({
        ok: false,
        message:
          "Falta 'cliente_medidor'. Usa /api/medidores/:cliente_medidor o /api/medidores?cliente_medidor=...",
      });
    }

    const result = await fetchMedidorByCliente(cliente);

    if (!result || result.total === 0) {
      return res.status(404).json({
        ok: false,
        message: `No se encontraron registros para cliente_medidor='${cliente}'.`,
        cliente_medidor: cliente,
        rows: [],
        total: 0,
      });
    }

    return res.json({ ok: true, ...result });
  } catch (err) {
    console.error('getMedidor error:', err);
    return res.status(500).json({ ok: false, message: 'Error interno consultando medidor.' });
  }
}

/**
 * Busca medidores para uno o múltiples clientes
 * @async
 * @function searchMedidores
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud
 * @param {string} [req.body.cliente_medidor] - ID de un cliente específico
 * @param {string[]} [req.body.clientes] - Array de IDs de clientes
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Respuesta JSON con medidores encontrados
 * @description
 * Endpoint: POST /api/medidores/search
 * Permite buscar medidores para uno o múltiples clientes en una sola consulta.
 * Acepta tanto un cliente individual como un array de clientes.
 * Limita la búsqueda a máximo 10,000 clientes por razones de rendimiento.
 * 
 * @example
 * // Body para un cliente
 * {
 *   "cliente_medidor": "202957"
 * }
 * 
 * @example
 * // Body para múltiples clientes
 * {
 *   "clientes": ["202957", "123456", "789012"]
 * }
 */
export async function searchMedidores(req, res) {
  try {
    const body = req.body ?? {};
    let clientes = [];

    if (Array.isArray(body.clientes)) clientes = body.clientes;
    else if (body.cliente_medidor) clientes = [body.cliente_medidor];
    else {
      return res.status(400).json({
        ok: false,
        message: "Envía 'cliente_medidor' (string) o 'clientes' (array).",
        ejemplo: { uno: { cliente_medidor: '202957' }, varios: { clientes: ['202957','123456'] } },
      });
    }

    clientes = clientes.map(v => String(v ?? '').trim()).filter(Boolean);
    if (!clientes.length) {
      return res.status(400).json({ ok: false, message: 'Valores vacíos después de normalizar.' });
    }

    if (clientes.length === 1) {
      const result = await fetchMedidorByCliente(clientes[0]);
      return res.json({ ok: true, ...result });
    }

    const { rows, grouped } = await fetchMedidoresByClientes(clientes, { chunkSize: 800 });
    return res.json({
      ok: true,
      totalConsultados: clientes.length,
      totalEncontrados: rows.length,
      rows,
      grouped,
      clientesBuscados: clientes,
    });
  } catch (err) {
    console.error('searchMedidores error:', err);
    return res.status(500).json({ ok: false, message: 'Error interno buscando medidores.' });
  }
}
