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
 * @returns {Promise<void>} Archivo Excel guardado en carpeta Reportes
 * @description
 * Endpoint: GET /api/excel/generate
 * Lee el archivo RegistrosEnriquecidos.json y genera un archivo Excel completo
 * con todos los registros, incluyendo datos de medidores, empleados y lecturas históricas.
 * El archivo se guarda en la carpeta src/Reportes.
 * 
 * @throws {404} Cuando no se encuentra el archivo RegistrosEnriquecidos.json
 * @throws {400} Cuando no hay registros para exportar
 * @throws {500} Error interno del servidor
 */
export const generateExcel = asyncHandler(async (req, res) => {
  try {
    // Leer los datos de RegistrosEnriquecidos.json
    const dataPath = path.resolve(process.cwd(), 'src', 'fileJson', 'RegistrosEnriquecidos.json');
    
    if (!fs.existsSync(dataPath)) {
      console.log('⚠️ Archivo RegistrosEnriquecidos.json no encontrado');
      return res.status(404).json({ 
        ok: false, 
        message: 'No se encontraron datos para generar el reporte' 
      });
    }

    const registros = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    if (!Array.isArray(registros) || registros.length === 0) {
      console.log('⚠️ No hay registros disponibles para exportar');
      return res.status(400).json({ 
        ok: false, 
        message: 'No hay datos disponibles para generar el reporte' 
      });
    }

    // Crear un nuevo libro de Excel
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registros Enriquecidos');

    // Definir las columnas del Excel
    worksheet.columns = [
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

    // Estilo para el encabezado
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4472C4' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Agregar los datos
    registros.forEach(registro => {
      const rowData = {
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
      };
      worksheet.addRow(rowData);
    });

    // Aplicar bordes a todas las celdas con datos
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // Configurar la respuesta
    const fileName = `Reporte_Critica_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${new Date().toTimeString().slice(0, 8).replace(/:/g, '')}.xlsx`;
    
    try {
      // Asegurarse de que la carpeta Reportes existe
      const reportesDir = path.resolve(process.cwd(), 'src', 'Reportes');
      fs.mkdirSync(reportesDir, { recursive: true });
      
      // Guardar el archivo en la carpeta src/Reportes
      const reportPath = path.join(reportesDir, fileName);
      
      console.log(`Guardando Excel en: ${reportPath}`);
      await workbook.xlsx.writeFile(reportPath);
      console.log(`✅ Excel guardado correctamente en: ${reportPath}`);
      
      // Redireccionar a la vista de Reportes en lugar de enviar JSON
      return res.redirect('/reportes');
    } catch (error) {
      console.error('Error guardando el archivo Excel:', error);
      return res.status(500).json({
        ok: false,
        message: 'Error al guardar el reporte'
      });
    }
  } catch (error) {
    console.error('Error generando Excel:', error);
    return res.status(500).json({ 
      ok: false, 
      message: 'Error interno al generar el reporte'
    });
  }
});

/**
 * Genera un archivo Excel personalizado con columnas específicas
 * @async
 * @function generateCustomExcel
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<void>} Archivo Excel con columnas personalizadas
 */
export const generateCustomExcel = asyncHandler(async (req, res) => {
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
    const worksheet = workbook.addWorksheet('Registros Personalizados');

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
    console.error('Error generando Excel personalizado:', error);
    res.status(500).json({ 
      ok: false, 
      message: 'Error interno del servidor al generar el Excel personalizado',
      error: error.message 
    });
  }
});