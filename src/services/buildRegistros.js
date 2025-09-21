// src/scripts/buildRegistros.js  (o donde prefieras)
import fs from 'fs';
import path from 'path';
import { CrearRegistro } from '../services/crearRegistro.js';

// Rutas (ajústalas a tu proyecto)
const basePath = process.cwd();
const inFile = path.resolve(basePath, 'src', 'fileJson', 'DatosConsulta.json');
const outDir = path.resolve(basePath, 'src', 'fileJson');
const outFile = path.join(outDir, 'RegistrosEnriquecidos.json');

// Lee el JSON base
const datos = JSON.parse(fs.readFileSync(inFile, 'utf8'));

// Opcional: carga empleados para llenar cedula/tipo/sede si tienes un archivo así
let empleados = [];
try {
  const empleadosPath = path.resolve(basePath, 'src', 'fileJson', 'empleados.json');
  if (fs.existsSync(empleadosPath)) {
    empleados = JSON.parse(fs.readFileSync(empleadosPath, 'utf8'));
  }
} catch {}

// Indexa empleados por nombre (normalizado)
const empleadosIdx = CrearRegistro.indexEmpleados(empleados);

// Mapas para medidor
const medidoresMap = datos.medidores || {};    // cliente -> num_medidor
const medidoresDb  = datos.medidores_db || {}; // cliente -> [{num_medidor, marca_medidor, tipo_medidor, ...}]

// Obtener lecturas históricas desde los registros
const lecturasHistoricas = [];
if (datos.registros) {
  // Si registros está agrupado por cliente
  if (typeof datos.registros === 'object' && !Array.isArray(datos.registros)) {
    Object.values(datos.registros).forEach(clienteRegistros => {
      if (Array.isArray(clienteRegistros)) {
        lecturasHistoricas.push(...clienteRegistros);
      }
    });
  } 
  // Si registros es un array plano
  else if (Array.isArray(datos.registros)) {
    lecturasHistoricas.push(...datos.registros);
  }
}

console.log(`📊 Lecturas históricas cargadas: ${lecturasHistoricas.length}`);

// Crea instancias por cada registro del arreglo `data`
const data = Array.isArray(datos.data) ? datos.data : [];
const registros = data.map(row =>
  CrearRegistro.fromRaw(row, { 
    medidoresMap, 
    medidoresDb, 
    empleadosIndexByNombre: empleadosIdx,
    lecturasHistoricas,
    empleadosArray: empleados
  })
);

// Guarda el resultado
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, JSON.stringify(registros, null, 2), 'utf8');

console.log(`Listo: ${registros.length} registros -> ${outFile}`);
