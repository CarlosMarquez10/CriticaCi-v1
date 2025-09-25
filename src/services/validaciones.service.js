/**
 * Servicios de validación para registros
 */

/**
 * Valida y corrige el campo Validacion
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campo Validacion validado
 */
const validarCampoValidacion = (registro) => {
  if (!registro) return registro;
  
  // Si no existe el campo Validacion, lo inicializamos
  if (registro.Validacion === null || registro.Validacion === undefined) {
    registro.Validacion = "PENDIENTE";
  }
  
  return registro;
};

/**
 * Valida y corrige el campo obsValidacion
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campo obsValidacion validado
 */
const validarCampoObsValidacion = (registro) => {
  if (!registro) return registro;
  
  // Si no existe el campo obsValidacion, lo inicializamos
  if (registro.obsValidacion === null || registro.obsValidacion === undefined) {
    registro.obsValidacion = "";
  }
  
  return registro;
};

/**
 * Valida y corrige los campos de verificación que son [object Object]
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campos de verificación corregidos
 */
const validarCamposVerificacion = (registro) => {
  if (!registro) return registro;
  
  // Corregir campos de verificación que son strings "[object Object]"
  if (registro["VERIFICACIONC/CONSOLIDADO"] === "[object Object]") {
    registro["VERIFICACIONC/CONSOLIDADO"] = {};
  }
  
  if (registro["VERIFICACIONC/SEMANAANTERIOR"] === "[object Object]") {
    registro["VERIFICACIONC/SEMANAANTERIOR"] = {};
  }
  
  return registro;
};

/**
 * Valida y corrige los campos numéricos que deberían ser números y no strings
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campos numéricos corregidos
 */
const validarCamposNumericos = (registro) => {
  if (!registro) return registro;
  
  // Lista de campos que deberían ser numéricos
  const camposNumericos = [
    "LECTURATOMADA", 
    "LECTURAFACTURADA", 
    "KWAJUSTADOS",
    "Lectura_1",
    "Lectura_2",
    "Lectura_3",
    "Lectura_4"
  ];
  
  // Convertir strings a números donde corresponda
  camposNumericos.forEach(campo => {
    if (registro[campo] !== null && registro[campo] !== undefined) {
      if (typeof registro[campo] === 'string' && !isNaN(registro[campo])) {
        registro[campo] = Number(registro[campo]);
      }
    }
  });
  
  return registro;
};

/**
 * Valida si la lectura facturada aparece en alguno de los campos de observaciones
 * Si se encuentra, actualiza los campos Validacion y obsValidacion
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campos Validacion y obsValidacion actualizados
 */
const validarLecturasAlfanumerica = (registro) => {
  if (!registro || !registro.LECTURAFACTURADA) return registro;
  
  // Convertir la lectura facturada a string para buscarla en los textos
  const lecturaFacturada = String(registro.LECTURAFACTURADA);
  
  // Campos de observaciones a revisar
  const camposObservacion = [
    "Obs_Lectura_1",
    "Obs_Lectura_2",
    "Obs_Lectura_3",
    "Obs_Lectura_4"
  ];
  
  // Verificar si la lectura facturada aparece en alguna observación
  let lecturaEncontrada = false;
  
  for (const campo of camposObservacion) {
    if (registro[campo] && typeof registro[campo] === 'string') {
      if (registro[campo].includes(lecturaFacturada)) {
        lecturaEncontrada = true;
        break;
      }
    }
  }
  
  // Si se encontró la lectura en alguna observación, actualizar los campos de validación
  if (lecturaEncontrada) {
    registro.Validacion = "SI";
    registro.obsValidacion = "Confirma la lectura alfanumérica";
  }
  
  return registro;
};


/**
 * Valida la secuencia de lecturas (Lectura_1 > Lectura_2 > Lectura_3 > Lectura_4)
 * Si la secuencia no es correcta, verifica el mes de FECHALECTURA y OBSERVACIONDELECTURA
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campos Validacion y obsValidacion actualizados
 */
const validarSecuenciaLecturas = (registro) => {
  // Solo procesar registros pendientes de validación
  if (!registro || registro.Validacion !== "PENDIENTE") return registro;
  
  // Verificar que existan las lecturas para validar
  if (registro.Lectura_1 === undefined || registro.Lectura_2 === undefined || 
      registro.Lectura_3 === undefined || registro.Lectura_4 === undefined) {
    return registro;
  }
  
  // Convertir a números si son strings
  const lectura1 = Number(registro.Lectura_1);
  const lectura2 = Number(registro.Lectura_2);
  const lectura3 = Number(registro.Lectura_3);
  const lectura4 = Number(registro.Lectura_4);
  
  // Verificar si la secuencia es correcta (Lectura_1 > Lectura_2 > Lectura_3 > Lectura_4)
  const secuenciaCorrecta = 
    (!isNaN(lectura1) && !isNaN(lectura2) && lectura1 > lectura2) &&
    (!isNaN(lectura2) && !isNaN(lectura3) && lectura2 > lectura3) &&
    (!isNaN(lectura3) && !isNaN(lectura4) && lectura3 > lectura4);
  
  // Si la secuencia es correcta, no necesitamos hacer más validaciones
  if (secuenciaCorrecta) {
    return registro;
  }
  
  // Si la secuencia no es correcta, verificamos el mes de FECHALECTURA
  if (!registro.FECHALECTURA) {
    return registro;
  }
  
  // Extraer el mes de la fecha de lectura
  let mesLectura;
  try {
    const fechaLectura = new Date(registro.FECHALECTURA);
    mesLectura = fechaLectura.getMonth() + 1; // getMonth() devuelve 0-11
  } catch (error) {
    // Si hay error al parsear la fecha, no podemos continuar
    return registro;
  }
  
  // Obtener el mes actual para determinar qué lectura corresponde a qué mes
  const mesActual = new Date().getMonth() + 1;
  
  // Determinar qué lectura debería corresponder al mes de la lectura
  let lecturaProblematica = null;
  
  // Verificar qué lectura no sigue la secuencia
  if (!isNaN(lectura1) && !isNaN(lectura2) && lectura1 <= lectura2) {
    lecturaProblematica = "Lectura_2";
  } else if (!isNaN(lectura2) && !isNaN(lectura3) && lectura2 <= lectura3) {
    lecturaProblematica = "Lectura_3";
  } else if (!isNaN(lectura3) && !isNaN(lectura4) && lectura3 <= lectura4) {
    lecturaProblematica = "Lectura_4";
  }
  
  // Si encontramos una lectura problemática y el código de observación es 39,
  // el operario fue consciente del error
  if (lecturaProblematica && registro.OBSERVACIONDELECTURA === "39") {
    registro.Validacion = "SI";
    registro.obsValidacion = "El operario fue consciente del error";
  } 
  // Si el código de observación no es 39, el operario no fue consciente
  else if (lecturaProblematica) {
    registro.Validacion = "SI";
    registro.obsValidacion = "El operario no fue consciente del error";
  }
  
  return registro;
};

/**
 * Valida las observaciones de lecturas (Obs_Lectura_1, Obs_Lectura_2, Obs_Lectura_3, Obs_Lectura_4)
 * Si contienen "lectura real", "lectura confirmada" o "lectura", actualiza Validacion y obsValidacion
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campos Validacion y obsValidacion actualizados
 */
const validarObservacionesLecturas = (registro) => {
  // Solo procesar registros pendientes de validación
  if (!registro || registro.Validacion !== "PENDIENTE") return registro;
  
  // Verificar que existan las observaciones para validar
  const camposObservacion = ["Obs_Lectura_1", "Obs_Lectura_2", "Obs_Lectura_3", "Obs_Lectura_4"];
  
  // Palabras clave que indican confirmación de lectura
  const palabrasClave = ["lectura real", "lectura confirmada", "lectura"];
  
  // Verificar si alguna observación contiene las palabras clave
  let observacionConfirmada = false;
  
  for (const campo of camposObservacion) {
    if (!registro[campo]) continue;
    
    const observacion = registro[campo].toLowerCase();
    
    // Verificar si la observación contiene alguna de las palabras clave
    for (const palabra of palabrasClave) {
      if (observacion.includes(palabra)) {
        observacionConfirmada = true;
        break;
      }
    }
    
    if (observacionConfirmada) break;
  }
  
  // Si se encontró una observación que confirma la lectura
  if (observacionConfirmada) {
    registro.Validacion = "SI";
    registro.obsValidacion = "Confirma la lectura alfanumérica";
  }
  
  return registro;
};

export {
  validarCampoValidacion,
  validarCampoObsValidacion,
  validarCamposVerificacion,
  validarCamposNumericos,
  validarLecturasAlfanumerica,
  validarObservacionesLecturas,
  validarSecuenciaLecturas
};