// src/controllers/medidores.controller.js
import {
  fetchMedidorByCliente,
  fetchMedidoresByClientes,
} from '../services/medidor.service.js';

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
