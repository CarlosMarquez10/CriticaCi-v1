import fs from 'fs';
import path from 'path';
import ExcelJS from 'exceljs';
import { asyncHandler } from '../middleware/asyncHandler.js';

/**
 * Genera un archivo Excel completo con todos los registros enriquecidos
 * @async
 * @function generateExcel
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Descarga directa del archivo Excel
 * @description
 * Endpoint: GET /api/excel/generate
 * Lee el archivo RegistrosEnriquecidos.json y genera un archivo Excel completo
 * con todos los registros, incluyendo datos de medidores, empleados y lecturas históricas.
 * El archivo se descarga automáticamente con formato profesional y estilos aplicados.
 * 
 * @throws {404} Cuando no se encuentra el archivo RegistrosEnriquecidos.json
 * @throws {400} Cuando no hay registros para exportar
 * @throws {500} Error interno del servidor
 * 
 * @example
 * // Respuesta exitosa: descarga directa del archivo Excel
 * // Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
 * // Content-Disposition: attachment; filename="registros_enriquecidos_YYYYMMDD_HHMMSS.xlsx"
 */
export const generateExcel = asyncHandler(async (req, res) => {
  try {
    // Leer los datos de RegistrosEnriquecidos.json
    const dataPath = path.resolve(process.cwd(), 'src', 'fileJson', 'RegistrosEnriquecidos.json');
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Archivo RegistrosEnriquecidos.json no encontrado. Ejecute primero el proceso de enriquecimiento.' 
      });
    }

    const registros = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'No hay registros para exportar' 
      });
    }

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registros Enriquecidos');

    // Definir las columnas del Excel
    const columns = [
      { header: 'USUARIO', key: 'USUARIO', width: 15 },
      { header: 'ZONA', key: 'ZONA', width: 10 },
      { header: 'CICLO', key: 'CICLO', width: 10 },
      { header: 'SOLUCION_CONSUMO', key: 'SOLUCION_CONSUMO', width: 20 },
      { header: 'FECHA_LECTURA', key: 'FECHALECTURA', width: 15 },
      { header: 'FECHA_FACTURA', key: 'FECHAFACTURA', width: 15 },
      { header: 'LECTURA_TOMADA', key: 'LECTURATOMADA', width: 15 },
      { header: 'OBSERVACION_LECTURA', key: 'OBSERVACIONDELECTURA', width: 25 },
      { header: 'TEXTO', key: 'TEXTO', width: 10 },
      { header: 'LECTURA_FACTURADA', key: 'LECTURAFACTURADA', width: 18 },
      { header: 'ACLARACIONES', key: 'ACLARACIONES', width: 30 },
      { header: 'TIPO_LECTURA', key: 'TIPOLECTURA', width: 15 },
      { header: 'TIPO_ERROR', key: 'TIPODEERROR', width: 15 },
      { header: 'KW_AJUSTADOS', key: 'KWAJUSTADOS', width: 15 },
      { header: 'NUE', key: 'NUE', width: 20 },
      { header: 'VERIF_CONSOLIDADO', key: 'VERIFICACIONC/CONSOLIDADO', width: 20 },
      { header: 'VERIF_SEMANA_ANTERIOR', key: 'VERIFICACIONC/SEMANAANTERIOR', width: 25 },
      { header: 'LECTURA_1', key: 'Lectura_1', width: 12 },
      { header: 'LECTURA_2', key: 'Lectura_2', width: 12 },
      { header: 'LECTURA_3', key: 'Lectura_3', width: 12 },
      { header: 'LECTURA_4', key: 'Lectura_4', width: 12 },
      { header: 'OBS_LECTURA_1', key: 'Obs_Lectura_1', width: 25 },
      { header: 'OBS_LECTURA_2', key: 'Obs_Lectura_2', width: 25 },
      { header: 'OBS_LECTURA_3', key: 'Obs_Lectura_3', width: 25 },
      { header: 'OBS_LECTURA_4', key: 'Obs_Lectura_4', width: 25 },
      { header: 'OPERARIO', key: 'Operario', width: 30 },
      { header: 'MEDIDOR', key: 'medidor', width: 15 },
      { header: 'MARCA_MEDIDOR', key: 'marcamedidor', width: 15 },
      { header: 'TIPO_MEDIDOR', key: 'tipomedidor', width: 15 },
      { header: 'CEDULA', key: 'cedula', width: 15 },
      { header: 'TIPO_EMPLEADO', key: 'tipo', width: 20 },
      { header: 'SEDE', key: 'sede', width: 20 },
      { header: 'VALIDACION', key: 'Validacion', width: 15 },
      { header: 'OBS_VALIDACION', key: 'obsValidacion', width: 25 }
    ];

    worksheet.columns = columns;

    // Estilo para el encabezado
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });

    // Agregar los datos
    registros.forEach((registro) => {
      const row = worksheet.addRow({
        USUARIO: registro.USUARIO,
        ZONA: registro.ZONA,
        CICLO: registro.CICLO,
        SOLUCION_CONSUMO: registro.SOLUCION_CONSUMO,
        FECHALECTURA: registro.FECHALECTURA,
        FECHAFACTURA: registro.FECHAFACTURA,
        LECTURATOMADA: registro.LECTURATOMADA,
        OBSERVACIONDELECTURA: registro.OBSERVACIONDELECTURA,
        TEXTO: registro.TEXTO,
        LECTURAFACTURADA: registro.LECTURAFACTURADA,
        ACLARACIONES: registro.ACLARACIONES,
        TIPOLECTURA: registro.TIPOLECTURA,
        TIPODEERROR: registro.TIPODEERROR,
        KWAJUSTADOS: registro.KWAJUSTADOS,
        NUE: registro.NUE,
        'VERIFICACIONC/CONSOLIDADO': registro['VERIFICACIONC/CONSOLIDADO'],
        'VERIFICACIONC/SEMANAANTERIOR': registro['VERIFICACIONC/SEMANAANTERIOR'],
        Lectura_1: registro.Lectura_1,
        Lectura_2: registro.Lectura_2,
        Lectura_3: registro.Lectura_3,
        Lectura_4: registro.Lectura_4,
        Obs_Lectura_1: registro.Obs_Lectura_1,
        Obs_Lectura_2: registro.Obs_Lectura_2,
        Obs_Lectura_3: registro.Obs_Lectura_3,
        Obs_Lectura_4: registro.Obs_Lectura_4,
        Operario: registro.Operario,
        medidor: registro.medidor,
        marcamedidor: registro.marcamedidor,
        tipomedidor: registro.tipomedidor,
        cedula: registro.cedula,
        tipo: registro.tipo,
        sede: registro.sede,
        Validacion: registro.Validacion,
        obsValidacion: registro.obsValidacion
      });

      // Aplicar bordes a todas las celdas de datos
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Configurar la respuesta HTTP para descargar el archivo
    const fileName = `RegistrosEnriquecidos_${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Escribir el archivo Excel al response
    await workbook.xlsx.write(res);
    
    // Finalizar la respuesta
    res.end();

  } catch (error) {
    console.error('Error generando Excel:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Error interno del servidor al generar el Excel',
      error: error.message 
    });
  }
});

/**
 * Genera un archivo Excel personalizado con filtros específicos
 * @async
 * @function generateCustomExcel
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.body - Cuerpo de la solicitud con filtros
 * @param {string} [req.body.zona] - Filtrar por zona específica
 * @param {number} [req.body.ciclo] - Filtrar por ciclo específico
 * @param {string} [req.body.tipoError] - Filtrar por tipo de error
 * @param {string} [req.body.operario] - Filtrar por operario (búsqueda parcial)
 * @param {boolean} [req.body.incluirLecturasHistoricas] - Incluir columnas de lecturas históricas
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Descarga directa del archivo Excel filtrado
 * @description
 * Endpoint: POST /api/excel/custom
 * Genera un archivo Excel personalizado aplicando filtros específicos a los registros.
 * Permite filtrar por zona, ciclo, tipo de error y operario.
 * Opcionalmente incluye columnas adicionales de lecturas históricas.
 * 
 * @throws {404} Cuando no se encuentra el archivo RegistrosEnriquecidos.json
 * @throws {400} Cuando no se encuentran registros con los filtros aplicados
 * @throws {500} Error interno del servidor
 * 
 * @example
 * // Body de ejemplo
 * {
 *   "zona": "A1",
 *   "ciclo": 1,
 *   "tipoError": "LECTURA_ERRONEA",
 *   "operario": "Juan",
 *   "incluirLecturasHistoricas": true
 * }
 */
export const generateCustomExcel = asyncHandler(async (req, res) => {
  try {
    const { 
      zona, 
      ciclo, 
      tipoError, 
      operario,
      incluirLecturasHistoricas = true 
    } = req.body || {};

    // Leer los datos de RegistrosEnriquecidos.json
    const dataPath = path.resolve(process.cwd(), 'src', 'fileJson', 'RegistrosEnriquecidos.json');
    
    if (!fs.existsSync(dataPath)) {
      return res.status(404).json({ 
        ok: false, 
        message: 'Archivo RegistrosEnriquecidos.json no encontrado. Ejecute primero el proceso de enriquecimiento.' 
      });
    }

    let registros = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    if (!Array.isArray(registros) || registros.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'No hay registros para exportar' 
      });
    }

    // Aplicar filtros si se proporcionan
    if (zona) {
      registros = registros.filter(r => r.ZONA === zona);
    }
    if (ciclo) {
      registros = registros.filter(r => r.CICLO === ciclo);
    }
    if (tipoError) {
      registros = registros.filter(r => r.TIPODEERROR === tipoError);
    }
    if (operario) {
      registros = registros.filter(r => 
        r.Operario && r.Operario.toLowerCase().includes(operario.toLowerCase())
      );
    }

    if (registros.length === 0) {
      return res.status(400).json({ 
        ok: false, 
        message: 'No se encontraron registros con los filtros aplicados' 
      });
    }

    // Crear el Excel con los registros filtrados
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registros Filtrados');

    // Definir columnas básicas
    let columns = [
      { header: 'USUARIO', key: 'USUARIO', width: 15 },
      { header: 'ZONA', key: 'ZONA', width: 10 },
      { header: 'CICLO', key: 'CICLO', width: 10 },
      { header: 'TIPO_ERROR', key: 'TIPODEERROR', width: 15 },
      { header: 'LECTURA_TOMADA', key: 'LECTURATOMADA', width: 15 },
      { header: 'LECTURA_FACTURADA', key: 'LECTURAFACTURADA', width: 18 },
      { header: 'KW_AJUSTADOS', key: 'KWAJUSTADOS', width: 15 },
      { header: 'OPERARIO', key: 'Operario', width: 30 },
      { header: 'MEDIDOR', key: 'medidor', width: 15 },
      { header: 'SEDE', key: 'sede', width: 20 }
    ];

    // Agregar columnas de lecturas históricas si se solicita
    if (incluirLecturasHistoricas) {
      columns.push(
        { header: 'LECTURA_1', key: 'Lectura_1', width: 12 },
        { header: 'LECTURA_2', key: 'Lectura_2', width: 12 },
        { header: 'LECTURA_3', key: 'Lectura_3', width: 12 },
        { header: 'LECTURA_4', key: 'Lectura_4', width: 12 },
        { header: 'OBS_LECTURA_1', key: 'Obs_Lectura_1', width: 25 },
        { header: 'OBS_LECTURA_2', key: 'Obs_Lectura_2', width: 25 },
        { header: 'OBS_LECTURA_3', key: 'Obs_Lectura_3', width: 25 },
        { header: 'OBS_LECTURA_4', key: 'Obs_Lectura_4', width: 25 }
      );
    }

    worksheet.columns = columns;

    // Estilo para el encabezado
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '366092' }
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Agregar los datos filtrados
    registros.forEach((registro) => {
      const rowData = {
        USUARIO: registro.USUARIO,
        ZONA: registro.ZONA,
        CICLO: registro.CICLO,
        TIPODEERROR: registro.TIPODEERROR,
        LECTURATOMADA: registro.LECTURATOMADA,
        LECTURAFACTURADA: registro.LECTURAFACTURADA,
        KWAJUSTADOS: registro.KWAJUSTADOS,
        Operario: registro.Operario,
        medidor: registro.medidor,
        sede: registro.sede
      };

      if (incluirLecturasHistoricas) {
        rowData.Lectura_1 = registro.Lectura_1;
        rowData.Lectura_2 = registro.Lectura_2;
        rowData.Lectura_3 = registro.Lectura_3;
        rowData.Lectura_4 = registro.Lectura_4;
        rowData.Obs_Lectura_1 = registro.Obs_Lectura_1;
        rowData.Obs_Lectura_2 = registro.Obs_Lectura_2;
        rowData.Obs_Lectura_3 = registro.Obs_Lectura_3;
        rowData.Obs_Lectura_4 = registro.Obs_Lectura_4;
      }

      worksheet.addRow(rowData);
    });

    // Configurar la respuesta
    const fileName = `RegistrosEnriquecidos_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}.xlsx`;
    
    // Verificar si la solicitud viene del proceso completo
    if (req.query.fromProcess === 'true') {
      try {
        // Asegurarse de que la carpeta Reportes existe
        const reportesDir = path.resolve(process.cwd(), 'src', 'Reportes');
        if (!fs.existsSync(reportesDir)) {
          fs.mkdirSync(reportesDir, { recursive: true });
        }
        
        // Guardar el archivo en la carpeta src/Reportes
        const fileName = `RegistrosEnriquecidos_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}.xlsx`;
        const reportPath = path.resolve(process.cwd(), 'src', 'Reportes', fileName);
        
        console.log(`Guardando Excel en: ${reportPath}`);
        await workbook.xlsx.writeFile(reportPath);
        console.log(`✅ Excel guardado correctamente en: ${reportPath}`);
        
        return res.json({
          ok: true,
          message: 'Excel generado correctamente',
          filePath: `/Reportes/${fileName}`
        });
      } catch (error) {
        console.error('Error guardando el archivo Excel:', error);
        return res.status(500).json({
          ok: false,
          message: `Error guardando el archivo Excel: ${error.message}`
        });
      }
    } else {
      // Configurar para descarga directa
      const fileName = `RegistrosEnriquecidos_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      
      await workbook.xlsx.write(res);
      res.end();
    }

  } catch (error) {
    console.error('Error generando Excel personalizado:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Error interno generando Excel personalizado' 
    });
  }
});