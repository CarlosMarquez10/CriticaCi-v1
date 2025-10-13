/**
 * Servicios de validación para registros
 */

/**
 * Valida la fecha de factura para verificar si está dentro del rango de 4 meses permitidos
 * Esta validación debe ejecutarse PRIMERA antes que cualquier otra
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campos Validacion y obsValidacion actualizados si la fecha está fuera del rango
 */
const validarFechaFactura = (registro) => {
  if (!registro || !registro.FECHAFACTURA) return registro;

  try {
    // Parsear la fecha de factura (formato DD/MM/YYYY)
    const fechaFacturaParts = registro.FECHAFACTURA.split("/");
    if (fechaFacturaParts.length !== 3) return registro;

    const dia = parseInt(fechaFacturaParts[0]);
    const mes = parseInt(fechaFacturaParts[1]);
    const año = parseInt(fechaFacturaParts[2]);

    // Crear objeto Date con la fecha de factura
    const fechaFactura = new Date(año, mes - 1, dia); // mes - 1 porque Date usa 0-11 para meses

    // Obtener fecha actual
    const fechaActual = new Date();

    // Calcular el mes de referencia (mes actual - 1)
    const mesReferencia = new Date(
      fechaActual.getFullYear(),
      fechaActual.getMonth() - 1,
      1
    );

    // Calcular la fecha límite (4 meses atrás desde el mes de referencia)
    const fechaLimite = new Date(
      mesReferencia.getFullYear(),
      mesReferencia.getMonth() - 4,
      1
    );

    // Si la fecha de factura es anterior a la fecha límite, marcar como "No"
    if (fechaFactura < fechaLimite) {
      registro.Validacion = "No";
      registro.obsValidacion = "error fuera de los meses 4 meses establecidos";
      return registro;
    }

    // Si la fecha está dentro del rango, inicializar como PENDIENTE si no tiene valor
    if (registro.Validacion === null || registro.Validacion === undefined) {
      registro.Validacion = "PENDIENTE";
    }
  } catch (error) {
    console.error("Error al validar fecha de factura:", error);
    // En caso de error, no modificar el registro
  }

  return registro;
};

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
    "Lectura_4",
    "Lectura_5",
    "Lectura_6",
  ];

  // Convertir strings a números donde corresponda
  camposNumericos.forEach((campo) => {
    if (registro[campo] !== null && registro[campo] !== undefined) {
      if (typeof registro[campo] === "string" && !isNaN(registro[campo])) {
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
    "Obs_Lectura_4",
    "Obs_Lectura_5",
    "Obs_Lectura_6",
  ];

  // Verificar si la lectura facturada aparece en alguna observación
  let lecturaEncontrada = false;

  for (const campo of camposObservacion) {
    if (registro[campo] && typeof registro[campo] === "string") {
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
 * Valida si hay números en los campos de observaciones
 * Distingue entre números solos y números acompañados de texto explicativo
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campos Validacion y obsValidacion actualizados
 */
const validarNumerosEnObservaciones = (registro) => {
  if (!registro) return registro;

  // Solo procesar registros pendientes de validación
  if (registro.Validacion !== "PENDIENTE") return registro;

  // Campos de observaciones a revisar
  const camposObservacion = [
    "Obs_Lectura_1",
    "Obs_Lectura_2",
    "Obs_Lectura_3",
    "Obs_Lectura_4",
    "Obs_Lectura_5",
    "Obs_Lectura_6",
  ];

  // Expresión regular para encontrar números en el texto
  const regexNumeros = /\d+/;

  // Expresión regular para verificar si hay texto explicativo junto con el número
  const regexTextoConNumero = /[a-zA-Z]+.*\d+|\d+.*[a-zA-Z]+/;

  // Variables para controlar el tipo de observación encontrada
  let numeroSoloEncontrado = false;
  let numeroConTextoEncontrado = false;

  for (const campo of camposObservacion) {
    if (registro[campo] && typeof registro[campo] === "string") {
      const observacion = registro[campo];

      // Verificar si hay números en la observación
      if (regexNumeros.test(observacion)) {
        // Verificar si el número está acompañado de texto explicativo
        if (regexTextoConNumero.test(observacion)) {
          numeroConTextoEncontrado = true;
          break;
        } else {
          numeroSoloEncontrado = true;
          // No hacemos break aquí para seguir buscando si hay alguna observación con texto
        }
      }
    }
  }

  // Priorizar la validación con texto explicativo sobre la validación con solo números
  if (numeroConTextoEncontrado) {
    registro.Validacion = "SI";
    registro.obsValidacion = "Confirma la lectura alfanumérica";
   } //else if (numeroSoloEncontrado) {
  //   registro.Validacion = "SI";
  //   registro.obsValidacion =
  //     "Confirmacion incompleta de la lectura en alfanumérica";
  // }
 
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
  if (
    registro.Lectura_1 === undefined ||
    registro.Lectura_2 === undefined ||
    registro.Lectura_3 === undefined ||
    registro.Lectura_4 === undefined ||
    registro.Lectura_5 === undefined ||
    registro.Lectura_6 === undefined
  ) {
    return registro;
  }

  // Convertir a números si son strings
  const lectura1 = Number(registro.Lectura_1);
  const lectura2 = Number(registro.Lectura_2);
  const lectura3 = Number(registro.Lectura_3);
  const lectura4 = Number(registro.Lectura_4);
  const lectura5 = Number(registro.Lectura_5);
  const lectura6 = Number(registro.Lectura_6);

  // Verificar si la secuencia es correcta (Lectura_1 > Lectura_2 > Lectura_3 > Lectura_4)
  const secuenciaCorrecta =
    !isNaN(lectura1) &&
    !isNaN(lectura2) &&
    lectura1 > lectura2 &&
    !isNaN(lectura2) &&
    !isNaN(lectura3) &&
    lectura2 > lectura3 &&
    !isNaN(lectura3) &&
    !isNaN(lectura4) &&
    lectura3 > lectura4 &&
    !isNaN(lectura4) &&
    !isNaN(lectura5) &&
    lectura4 > lectura5 &&
    !isNaN(lectura5) &&
    !isNaN(lectura6) &&
    lectura5 > lectura6;

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
  } else if (!isNaN(lectura4) && !isNaN(lectura5) && lectura4 <= lectura5) {
    lecturaProblematica = "Lectura_5";
  } else if (!isNaN(lectura5) && !isNaN(lectura6) && lectura5 <= lectura6) {
    lecturaProblematica = "Lectura_6";
  }

  // Si encontramos una lectura problemática y el código de observación es 39,
  // el operario fue consciente del error
  if (lecturaProblematica && registro.OBSERVACIONDELECTURA === "39") {
    registro.Validacion = "SI";
    registro.obsValidacion = "El operario fue consciente del error";
  }
  // Si el código de observación no es 39, el operario no fue consciente
  // else if (lecturaProblematica) {
  //   registro.Validacion = "SI";
  //   registro.obsValidacion = "El operario no fue consciente del error";
  // }

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
  const camposObservacion = [
    "Obs_Lectura_1",
    "Obs_Lectura_2",
    "Obs_Lectura_3",
    "Obs_Lectura_4",
    "Obs_Lectura_5",
    "Obs_Lectura_6",
  ];

  // Palabras clave que indican confirmación de lectura
  const palabrasClave = [
    "lectura real",
    "lectura confirmada",
    "lectura",
    "real",
    "confirmada",
    "error",
    "correcta",
    "corrige",
    "periodos anteriores",
    "genera",
    "desviacion",
  ];

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

// Function que valide que haga lo mismo de validar la secuencia de la lectura,
// pero para las lecturas numéricas (Lectura_1, Lectura_2, Lectura_3, Lectura_4, Lectura_5, Lectura_6)
// y si la secuencia es correcta, sumar solo las lecturas numericas que sea diferentes a cero y a null, por que necesito hacer un promedio solo con las lectura que si tiene valor, el nuemro por el que tiene que dividir el promedio es la cantidad de lecturas que si tiene valor, por ejemplo si tiene 3 lecturas con valor, el promedio es la suma de las 3 lecturas dividido por 3, si tiene 2 lecturas con valor, el promedio es la suma de las 2 lecturas dividido por 2, etc.
// sacar el consumo de la lectura que se tomada, tenemos un campo en el json que se llama  "LECTURATOMADA" esta lectura tenemos que ver donde se encuentra en las lectura numericas  "Lectura_1", "Lectura_2",  "Lectura_3",  "Lectura_4",  "Lectura_5",  "Lectura_6", si la lectura tomada, ejemplo esta en la lectura_4 ha que hacer la resta con la lectura_5. ejemplo : lectura_4 - lectura_5, esto  nos data el consumo actual.
//devemos validar con el promedio de las lecturas nuemericas, con el consumo que se calculo con la resta de  lectura tomada. el promedio del consumo calculado debe mantenerse dentro de un rango de +- 20% del promedio de las lecturas nuemericas. si se mantiene, ahora si actualizamos el campo de "Validacion" con el valor "No", y el campo "obsValidacion" con el valor, "Consumo dentro del mas o menos el 20%"

function validarConsumoPromedio(registro) {
  if (!registro) return registro;

  try {
    // Primera validación: Solo procesar registros con Validacion null o "PENDIENTE"
    if (registro.Validacion !== null && registro.Validacion !== "PENDIENTE") {
      return registro;
    }

    // Verificar LECTURATOMADA y LECTURAFACTURADA
    const lecturaTomada = parseFloat(registro.LECTURATOMADA);
    const lecturaFacturada = parseFloat(registro.LECTURAFACTURADA);
    
    if (isNaN(lecturaTomada) || registro.LECTURATOMADA === null || 
        registro.LECTURATOMADA === undefined || registro.LECTURATOMADA === "") {
      return registro;
    }

    // Segunda validación: Verificar secuencia descendente excluyendo LECTURATOMADA y valores null
    const lecturasParaSecuencia = [];
    
    for (let i = 1; i <= 6; i++) {
      const lectura = registro[`Lectura_${i}`];
      if (lectura !== null && lectura !== undefined && lectura !== "") {
        const lecturaNum = parseFloat(lectura);
        if (!isNaN(lecturaNum)) {
          // Excluir LECTURATOMADA y LECTURAFACTURADA de la validación de secuencia
          if (lecturaNum !== lecturaTomada && (isNaN(lecturaFacturada) || lecturaNum !== lecturaFacturada)) {
            lecturasParaSecuencia.push(lecturaNum);
          }
        }
      }
    }

    // Verificar que tengamos al menos 2 lecturas para validar secuencia
    if (lecturasParaSecuencia.length < 2) {
      return registro;
    }

    // Verificar secuencia descendente
    for (let i = 0; i < lecturasParaSecuencia.length - 1; i++) {
      if (lecturasParaSecuencia[i] <= lecturasParaSecuencia[i + 1]) {
        // Si la secuencia no es descendente, no continuar
        return registro;
      }
    }

    // Obtener fecha de lectura para determinar posición
    const fechaLectura = registro.FECHALECTURA;
    if (!fechaLectura) {
      return registro;
    }

    // Extraer mes de la fecha (formato DD/MM/YYYY)
    const mesActual = parseInt(fechaLectura.split('/')[1]);
    
    // Identificar qué posición corresponde a LECTURATOMADA
    let posicionLecturaTomada = -1;
    for (let i = 1; i <= 6; i++) {
      const lectura = registro[`Lectura_${i}`];
      if (lectura !== null && lectura !== undefined) {
        const lecturaNum = parseFloat(lectura);
        if (!isNaN(lecturaNum) && lecturaNum === lecturaTomada) {
          posicionLecturaTomada = i;
          break;
        }
      }
    }

    // Si no encontramos la posición de LECTURATOMADA, no podemos continuar
    if (posicionLecturaTomada === -1) {
      return registro;
    }

    // Recopilar consumos válidos excluyendo null, cero, undefined, Consumo_6 y el consumo de LECTURATOMADA
    const consumosValidos = [];
    let consumoActual = null;

    for (let i = 1; i <= 5; i++) { // Solo Consumo_1 a Consumo_5 (excluir Consumo_6)
      const consumo = registro[`Consumo_${i}`];
      
      // Si esta posición corresponde a LECTURATOMADA, guardar como consumo actual
      if (i === posicionLecturaTomada) {
        if (consumo !== null && consumo !== undefined) {
          const consumoNum = parseFloat(consumo);
          if (!isNaN(consumoNum)) {
            consumoActual = consumoNum;
          }
        }
        continue; // No incluir en consumos válidos para el promedio
      }
      
      // Para las demás posiciones, incluir en consumos válidos si cumplen criterios
      if (consumo !== null && consumo !== undefined && consumo !== 0) {
        const consumoNum = parseFloat(consumo);
        if (!isNaN(consumoNum) && consumoNum > 0) {
          consumosValidos.push(Math.abs(consumoNum)); // Valor absoluto
        }
      }
    }

    // Verificar que tengamos consumos válidos para calcular promedio
    if (consumosValidos.length === 0) {
      return registro;
    }

    // Verificar que tengamos el consumo actual identificado
    if (consumoActual === null) {
      return registro;
    }

    // Calcular promedio absoluto de consumos válidos
    const promedioAbsoluto = consumosValidos.reduce((sum, consumo) => sum + consumo, 0) / consumosValidos.length;

    // Calcular límites del ±20% del promedio
    const limiteInferior = promedioAbsoluto * 0.8;
    const limiteSuperior = promedioAbsoluto * 1.2;

    // Usar valor absoluto del consumo actual para la comparación
    const consumoActualAbsoluto = Math.abs(consumoActual);

    // Comparar consumo actual contra el promedio ± 20%
    if (consumoActualAbsoluto >= limiteInferior && consumoActualAbsoluto <= limiteSuperior) {
      registro.Validacion = "NO";
      registro.obsValidacion = `Consumo dentro del rango del 20% (${consumoActualAbsoluto} vs promedio ${promedioAbsoluto.toFixed(2)})`;
    }else {
      registro.Validacion = "SI";
      registro.obsValidacion = `Consumo fuera del rango del 20% (${consumoActualAbsoluto} vs promedio ${promedioAbsoluto.toFixed(2)})`;
    }
    // Para consumos fuera del rango, no modificar los campos

  } catch (error) {
    console.error("Error en validación de consumo promedio:", error);
    // No modificar los campos en caso de error, dejar como están
  }

  return registro;
}

// Utilidad para comparar dígito a dígito y anotar UbicacionError/DigitoError
function anotarDiferenciaDigitos(registro, valorTomada, valorReferencia) {
  const sTomada = String(valorTomada);
  const sRef = String(valorReferencia);
  const maxLen = Math.max(sTomada.length, sRef.length);
  const a = sTomada.padStart(maxLen, "0");
  const b = sRef.padStart(maxLen, "0");

  for (let i = 0; i < maxLen; i++) {
    if (a[i] !== b[i]) {
      const posicion = i + 1;
      const desdeDerecha = maxLen - i;
      const ordenMap = {
        1: "unidad",
        2: "decena",
        3: "centena",
        4: "unidad de mil",
        5: "decena de mil",
        6: "centena de mil",
        7: "unidad de millón",
        8: "decena de millón",
      };
      const orden = ordenMap[desdeDerecha] || `${desdeDerecha}º lugar`;
      registro.UbicacionError = `${orden}`;
      registro.DigitoError = {
        posicion,
        desdeDerecha,
        orden,
        tomada: a[i],
        referencia: b[i],
      };
      break;
    }
  }
}

function conocerUbicacionError(registro) {
  // validar si la lectura tomada se encuentra en la lecutra 1, 2, 3, 4, 5, 6

  if (registro.LECTURATOMADA === registro.Lectura_1) {
    registro.UbicacionError = "falta lectura posterior";
  } else if (registro.LECTURATOMADA === registro.Lectura_2) {
    // Si el patrón 1 == 3 se cumple, comparar contra Lectura_3
    if (registro.Lectura_1 === registro.Lectura_3) {
      anotarDiferenciaDigitos(
        registro,
        registro.LECTURATOMADA,
        registro.Lectura_3
      );
    }
  } else if (registro.LECTURATOMADA === registro.Lectura_3) {
    // Si el patrón 2 == 4 se cumple, comparar contra Lectura_4
    if (registro.Lectura_2 === registro.Lectura_4) {
      anotarDiferenciaDigitos(
        registro,
        registro.LECTURATOMADA,
        registro.Lectura_4
      );
    } else {
      if (registro.Lectura_1 === registro.Lectura_2) {
        anotarDiferenciaDigitos(
          registro,
          registro.LECTURATOMADA,
          registro.Lectura_2
        );
      }
    }
  } else if (registro.LECTURATOMADA === registro.Lectura_4) {
    // Si el patrón 3 == 5 se cumple, comparar contra Lectura_5
    if (registro.Lectura_3 === registro.Lectura_5) {
      anotarDiferenciaDigitos(
        registro,
        registro.LECTURATOMADA,
        registro.Lectura_5
      );
    } else {
      if (registro.Lectura_2 === registro.Lectura_3) {
        anotarDiferenciaDigitos(
          registro,
          registro.LECTURATOMADA,
          registro.Lectura_3
        );
      }
    }
  } else if (registro.LECTURATOMADA === registro.Lectura_5) {
    // Si el patrón 4 == 6 se cumple, comparar contra Lectura_6
    if (registro.Lectura_4 === registro.Lectura_6) {
      anotarDiferenciaDigitos(
        registro,
        registro.LECTURATOMADA,
        registro.Lectura_6
      );
    } else {
      if (registro.Lectura_3 === registro.Lectura_4) {
        anotarDiferenciaDigitos(
          registro,
          registro.LECTURATOMADA,
          registro.Lectura_4
        );
      }
    }
  } else if (registro.LECTURATOMADA === registro.Lectura_6) {
    if (registro.Lectura_4 === registro.Lectura_5) {
      anotarDiferenciaDigitos(
        registro,
        registro.LECTURATOMADA,
        registro.Lectura_5
      );
    } else {
      registro.UbicacionError = "falta lectura anterior";
    }
  } else {
    registro.UbicacionError = "Lectura no encontrada";
  }

  return registro;
}

function validarNumerosLecturas(registro) {
  // Validar que las lecturas sean números
  const { TIPOLECTURA, KWAJUSTADOS } = registro;

  // Validar que TIPOLECTURA sea 10
  if (TIPOLECTURA === "10") {
    // Analizar KWAJUSTADOS para determinar la posición del dígito con error
    if (
      KWAJUSTADOS !== null &&
      KWAJUSTADOS !== undefined &&
      KWAJUSTADOS !== ""
    ) {
      // Convertir a número y quitar decimales usando Math.trunc para mantener el signo
      const kwValueWithoutDecimals = Math.trunc(Number(KWAJUSTADOS));
      const kwValue = Math.abs(kwValueWithoutDecimals); // Obtener valor absoluto para contar dígitos
      const digitCount = kwValue.toString().length;

      // Determinar la unidad basada en el número de dígitos
      switch (digitCount) {
        case 1:
          registro.UbicacionError = "unidad";
          break;
        case 2:
          registro.UbicacionError = "decena";
          break;
        case 3:
          registro.UbicacionError = "centena";
          break;
        case 4:
          registro.UbicacionError = "unidad de mil";
          break;
        case 5:
          registro.UbicacionError = "decena de mil";
          break;
        case 6:
          registro.UbicacionError = "centena de mil";
          break;
        default:
          registro.UbicacionError = "valor fuera de rango esperado";
          break;
      }
    }
  }

  return registro;
}

function lecturaFueraDeRango(registro) {
  // Solo aplicar si UbicacionError está vacío, es null o undefined
  if (registro.UbicacionError === null || registro.UbicacionError === '' || registro.UbicacionError === undefined) {
    const {
      Lectura_1,
      Lectura_2,
      Lectura_3,
      Lectura_4,
      Lectura_5,
      Lectura_6,
      LECTURATOMADA,
      LECTURAFACTURADA,
    } = registro;

    // Convertir LECTURATOMADA y LECTURAFACTURADA a números para comparación
    const lecturaTomadasNum = Number(LECTURATOMADA);
    const lecturaFacturadaNum = Number(LECTURAFACTURADA);

    // Recopilar todas las lecturas válidas excluyendo LECTURATOMADA y LECTURAFACTURADA
    const lecturas = [
      Lectura_1,
      Lectura_2,
      Lectura_3,
      Lectura_4,
      Lectura_5,
      Lectura_6,
    ]
      .filter(
        (lectura) =>
          lectura !== null && 
          lectura !== undefined && 
          !isNaN(Number(lectura)) &&
          Number(lectura) !== lecturaTomadasNum &&
          Number(lectura) !== lecturaFacturadaNum
      )
      .map((lectura) => Number(lectura));

    // Si no hay lecturas válidas o menos de 2, no se puede determinar el rango
    if (lecturas.length < 2) {
      return registro;
    }

    // Determinar el rango mínimo y máximo de las lecturas válidas (excluyendo LECTURATOMADA y LECTURAFACTURADA)
    const minLectura = Math.min(...lecturas);
    const maxLectura = Math.max(...lecturas);

    // Validar que LECTURATOMADA sea un número válido
    if (
      LECTURATOMADA === null ||
      LECTURATOMADA === undefined ||
      isNaN(Number(LECTURATOMADA))
    ) {
      return registro;
    }

    // Verificar si LECTURATOMADA está fuera del rango de las lecturas válidas
    if (lecturaTomadasNum < minLectura || lecturaTomadasNum > maxLectura) {
      registro.UbicacionError = "Lectura Diferente";
    }
  }

  return registro;
}

/**
 * Valida si la LECTURATOMADA es igual a las lecturas de meses adyacentes
 * Detecta cuando el operario no es consciente del error y no critica
 * @param {Object} registro - Registro a validar
 * @returns {Object} - Registro con campos Validacion y obsValidacion actualizados si se detecta error
 */
const validarLecturasRepetidas = (registro) => {
  if (!registro) return registro;

  // 1. Verificar que Validacion esté en PENDIENTE
  if (registro.Validacion !== "PENDIENTE") {
    return registro;
  }

  // 2. Verificar que OBSERVACIONDELECTURA esté vacío o null
  if (registro.OBSERVACIONDELECTURA && registro.OBSERVACIONDELECTURA.trim() !== "") {
    return registro;
  }

  // 3. Verificar que todas las Obs_Lectura_* sean null
  for (let i = 1; i <= 6; i++) {
    if (registro[`Obs_Lectura_${i}`] !== null) {
      return registro;
    }
  }

  // 4. Obtener LECTURATOMADA y FECHALECTURA
  const lecturaTomada = registro.LECTURATOMADA;
  const fechaLectura = registro.FECHALECTURA;

  if (!lecturaTomada || !fechaLectura) {
    return registro;
  }

  // 5. Determinar el mes actual basado en FECHALECTURA
  const fechaParts = fechaLectura.split("/");
  if (fechaParts.length !== 3) {
    return registro;
  }

  const mesActual = parseInt(fechaParts[1]); // Mes de la fecha de lectura
  const añoActual = parseInt(fechaParts[2]);

  // 6. Buscar LECTURATOMADA en las posiciones de lecturas
  let posicionEncontrada = -1;
  for (let i = 1; i <= 6; i++) {
    const lectura = registro[`Lectura_${i}`];
    if (lectura !== null && lectura !== undefined) {
      const lecturaNum = parseFloat(lectura);
      if (!isNaN(lecturaNum) && lecturaNum === parseFloat(lecturaTomada)) {
        posicionEncontrada = i;
        break;
      }
    }
  }

  if (posicionEncontrada === -1) {
    return registro; // No se encontró LECTURATOMADA en las lecturas
  }

  // 7. Calcular qué mes corresponde a la posición encontrada
  // Lectura_1 = mes actual, Lectura_2 = mes anterior, Lectura_3 = 2 meses atrás, etc.
  const mesLecturaTomada = mesActual - (posicionEncontrada - 1);
  
  // 8. Identificar las lecturas del mes anterior y posterior a LECTURATOMADA
  const mesAnterior = mesLecturaTomada - 1;
  const mesPosterior = mesLecturaTomada + 1;
  
  // Calcular las posiciones correspondientes a esos meses
  const posicionAnterior = (mesActual - mesAnterior) + 1;
  const posicionPosterior = (mesActual - mesPosterior) + 1;

  let lecturaAnterior = null;
  let lecturaPosterior = null;

  // Obtener lectura del mes anterior (si existe)
  if (posicionAnterior >= 1 && posicionAnterior <= 6) {
    const lectura = registro[`Lectura_${posicionAnterior}`];
    if (lectura !== null && lectura !== undefined) {
      lecturaAnterior = parseFloat(lectura);
    }
  }

  // Obtener lectura del mes posterior (si existe)
  if (posicionPosterior >= 1 && posicionPosterior <= 6) {
    const lectura = registro[`Lectura_${posicionPosterior}`];
    if (lectura !== null && lectura !== undefined) {
      lecturaPosterior = parseFloat(lectura);
    }
  }

  // 9. Comparar LECTURATOMADA con las lecturas adyacentes
  const lecturaTomadasNum = parseFloat(lecturaTomada);
  let errorDetectado = false;

  // Verificar si es igual a la lectura anterior
  if (lecturaAnterior !== null && !isNaN(lecturaAnterior) && lecturaTomadasNum === lecturaAnterior) {
    errorDetectado = true;
  }

  // Verificar si es igual a la lectura posterior
  if (lecturaPosterior !== null && !isNaN(lecturaPosterior) && lecturaTomadasNum !== lecturaPosterior) {
    errorDetectado = true;
  }

  // 10. Si se detectó error, actualizar los campos de validación
  if (errorDetectado) {
    registro.Validacion = "SI";
    registro.obsValidacion = "El Operario no es conciente del error, no critica";
  }

  return registro;
}

// lectura para 
const validarLecturasDistintas = (registro) => {
   if (!registro) return registro;

  // 1. Verificar que Validacion esté en PENDIENTE
  if (registro.Validacion !== "PENDIENTE") {
    return registro;
  }

  // 2. Verificar que OBSERVACIONDELECTURA NO tenga valores específicos
  if (registro.OBSERVACIONDELECTURA && registro.OBSERVACIONDELECTURA.trim()) {
    const obsValue = registro.OBSERVACIONDELECTURA.trim();
    const valoresPermitidos = ["21", "34", "35", "88", "91", "92", "93", "94", "98"];
    if (!valoresPermitidos.includes(obsValue)) {
      return registro;
    }
  } else {
    // Si OBSERVACIONDELECTURA está vacío o null, no procesar
    return registro;
  }

  // 3. Verificar que todas las Obs_Lectura_* sean null
  for (let i = 1; i <= 6; i++) {
    if (registro[`Obs_Lectura_${i}`] !== null) {
      return registro;
    }
  }

  // 4. Obtener LECTURATOMADA y FECHALECTURA
  const lecturaTomada = registro.LECTURATOMADA;
  const fechaLectura = registro.FECHALECTURA;

  if (!lecturaTomada || !fechaLectura) {
    return registro;
  }

  // 5. Determinar el mes actual basado en FECHALECTURA
  const fechaParts = fechaLectura.split("/");
  if (fechaParts.length !== 3) {
    return registro;
  }

  const mesActual = parseInt(fechaParts[1]); // Mes de la fecha de lectura
  const añoActual = parseInt(fechaParts[2]);

  // 6. Buscar LECTURATOMADA en las posiciones de lecturas
  let posicionEncontrada = -1;
  for (let i = 1; i <= 6; i++) {
    const lectura = registro[`Lectura_${i}`];
    if (lectura !== null && lectura !== undefined) {
      const lecturaNum = parseFloat(lectura);
      if (!isNaN(lecturaNum) && lecturaNum === parseFloat(lecturaTomada)) {
        posicionEncontrada = i;
        break;
      }
    }
  }

  if (posicionEncontrada === -1) {
    return registro; // No se encontró LECTURATOMADA en las lecturas
  }

  // 7. Calcular qué mes corresponde a la posición encontrada
  // Lectura_1 = mes actual, Lectura_2 = mes anterior, Lectura_3 = 2 meses atrás, etc.
  const mesLecturaTomada = mesActual - (posicionEncontrada - 1);
  
  // 8. Identificar las lecturas del mes anterior y posterior a LECTURATOMADA
  const mesAnterior = mesLecturaTomada - 1;
  const mesPosterior = mesLecturaTomada + 1;
  
  // Calcular las posiciones correspondientes a esos meses
  const posicionAnterior = (mesActual - mesAnterior) + 1;
  const posicionPosterior = (mesActual - mesPosterior) + 1;

  let lecturaAnterior = null;
  let lecturaPosterior = null;

  // Obtener lectura del mes anterior (si existe)
  if (posicionAnterior >= 1 && posicionAnterior <= 6) {
    const lectura = registro[`Lectura_${posicionAnterior}`];
    if (lectura !== null && lectura !== undefined) {
      lecturaAnterior = parseFloat(lectura);
    }
  }

  // Obtener lectura del mes posterior (si existe)
  if (posicionPosterior >= 1 && posicionPosterior <= 6) {
    const lectura = registro[`Lectura_${posicionPosterior}`];
    if (lectura !== null && lectura !== undefined) {
      lecturaPosterior = parseFloat(lectura);
    }
  }

  // 9. Comparar LECTURATOMADA con las lecturas adyacentes
  const lecturaTomadasNum = parseFloat(lecturaTomada);
  let errorDetectado = false;

  // Verificar si es igual a la lectura anterior
  if (lecturaAnterior !== null && !isNaN(lecturaAnterior) && lecturaTomadasNum === lecturaAnterior) {
    errorDetectado = true;
  }

  // Verificar si es igual a la lectura posterior
  if (lecturaPosterior !== null && !isNaN(lecturaPosterior) && lecturaTomadasNum !== lecturaPosterior) {
    errorDetectado = true;
  }

  // 10. Si se detectó error, actualizar los campos de validación
  if (errorDetectado) {
    registro.Validacion = "SI";
    registro.obsValidacion = "El Operario no es conciente del error, no critica";
  }

  return registro;
}

export {
  validarFechaFactura,
  validarCampoValidacion,
  validarCampoObsValidacion,
  validarCamposVerificacion,
  validarCamposNumericos,
  validarLecturasAlfanumerica,
  validarObservacionesLecturas,
  validarSecuenciaLecturas,
  validarNumerosEnObservaciones,
  validarConsumoPromedio,
  conocerUbicacionError,
  validarNumerosLecturas,
  lecturaFueraDeRango,
  validarLecturasRepetidas,
  validarLecturasDistintas,
};
