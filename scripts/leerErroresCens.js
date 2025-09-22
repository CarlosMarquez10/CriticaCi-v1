import 'dotenv/config';
import util from 'node:util';
import fs from 'node:fs';
import path from 'node:path';


import { leerErroresCens } from './leer-errores-cens.js';
import { fetchRecordsByClientes } from '../src/services/clientes.service.js';
import { fetchMedidoresByClientes } from "../src/services/medidor.service.js";
import { mapearClienteAMedidor } from "../src/utils/medidores.util.js";         // de lecturas (ya lo tenías)
import { mapearClienteAMedidorDB } from "../src/utils/medidores-db.util.js";    // de BD medidores

// Configuración que solo se ejecutará cuando se llame a main()
const getConfig = () => {
  // 1) Carpeta destino absoluta (desde la raíz del proyecto)
  const outDir = path.resolve(process.cwd(), 'src', 'fileJson'); // O 'fileJson' si así se llama

  // 2) Crear la carpeta si no existe
  fs.mkdirSync(outDir, { recursive: true });

  // 3) Nombre del archivo (puedes personalizarlo)
  const outFile = path.join(outDir, 'DatosConsulta.json');
  
  const fechas = { desde: 202401, hasta: 202512 };
  
  return { outDir, outFile, fechas };
};

/**
 * Función principal para ejecutar desde línea de comandos o importar desde otro módulo
 * @returns {Promise<Object>} Resultado del procesamiento
 */
export async function main() {
  // Obtener configuración solo cuando se ejecuta la función
  const { outDir, outFile, fechas } = getConfig();
  
  // 1) Leer archivo
  const data = await leerErroresCens();
  if (!Array.isArray(data)) {
    throw new Error('leerErroresCens() debe devolver un arreglo.');
  }

  // 2) Extraer clientes
  const clientesError = data
    .map((e) => (e?.USUARIO ?? '').toString().trim())
    .filter(Boolean);

  // 3) Procesar (ahora podemos pedir medidores y registros)
  const result = await procesarDatos(clientesError, fechas, {
    incluirRegistros: true, // ✅ también quiero los registros
    soloPlano: false,       // si true → devuelve rows en vez de grouped
  });

  // 4) Mostrar en consola
  console.log('✅ Resultado procesado:');
  //console.log(util.inspect(result, { depth: null, maxArrayLength: null, colors: true }));

  // 5) Guardar para revisión
  fs.writeFileSync(
  outFile,
  JSON.stringify(
    result,
    (_k, v) => (typeof v === 'bigint' ? v.toString() : v),
    2
  ),
  'utf8'
  );
  console.log('📂 Resultado guardado en salida.json');
  
  return result;
}

async function procesarDatos(
  clientesError,
  fechas,
  { incluirRegistros = false, soloPlano = false } = {}
) {
  // 1) Trae lecturas (tu servicio existente)
  const { total = 0, rows = [], grouped = {} } =
    await fetchRecordsByClientes(clientesError, fechas);

  // 2) Mapa { cliente: medidor } según lecturas (periodo más reciente)
  const medidoresPorCliente = mapearClienteAMedidor(grouped);

  // 3) Consulta medidores de BD para TODOS los clientes involucrados
  //    (puedes optar por usar clientesError o las keys del grouped; aquí uso ambas por si acaso)
  const universeClientes = [
    ...new Set([
      ...clientesError.map(v => String(v).trim()).filter(Boolean),
      ...Object.keys(grouped),
    ]),
  ];

  const { grouped: medidoresBDGrouped } = await fetchMedidoresByClientes(universeClientes);

  // 4) Mapa { cliente: num_medidor } desde BD (uno preferido por cliente)
  const medidoresBDUnico = mapearClienteAMedidorDB(medidoresBDGrouped);

  // 5) Decide si adjuntar registros de lecturas
  const registros = incluirRegistros ? (soloPlano ? rows : grouped) : undefined;
  const datosRegistros = await leerErroresCens();
  return {
    ok: true,
    total,
    desde: fechas?.desde ?? null,
    hasta: fechas?.hasta ?? null,
    clientes: Object.keys(grouped).length,

    // 🔹 Mapa desde lecturas (lo que ya tenías)
    medidores: medidoresPorCliente,              // { "1122073": "21143476", ... }

    // 🔹 Datos desde la BD de medidores
    medidores_db: medidoresBDGrouped,            // { "202957": [ {id,cliente_medidor,num_medidor,...}, ... ], ... }
    medidores_db_unico: medidoresBDUnico,  
    data: datosRegistros,      // { "202957": "7647545", ... }

    // 🔹 (opcional) lecturas crudas
    registros,
  };

}

main().catch((err) => {
  console.error('❌ Error en main:', err);
  process.exit(1);
});
