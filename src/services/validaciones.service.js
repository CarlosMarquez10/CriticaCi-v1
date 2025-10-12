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
  } else if (numeroSoloEncontrado) {
    registro.Validacion = "SI";
    registro.obsValidacion =
      "Confirmacion incompleta de la lectura en alfanumérica";
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
    // Verificar LECTURATOMADA
    const lecturaTomada = parseFloat(registro.LECTURATOMADA);
    if (
      isNaN(lecturaTomada) ||
      registro.LECTURATOMADA === null ||
      registro.LECTURATOMADA === undefined ||
      registro.LECTURATOMADA === ""
    ) {
      // No modificar los campos, dejar como están
      return registro;
    }

    // Recopilar lecturas válidas en orden
    const lecturas = [];
    const lecturasConIndice = [];

    for (let i = 1; i <= 6; i++) {
      const lectura = registro[`Lectura_${i}`];
      if (lectura !== null && lectura !== undefined && lectura !== "") {
        const lecturaNum = parseFloat(lectura);
        if (!isNaN(lecturaNum)) {
          lecturas.push(lecturaNum);
          lecturasConIndice.push({ valor: lecturaNum, indice: i });
        }
      }
    }

    // Verificar que tengamos al menos 2 lecturas válidas
    if (lecturas.length < 2) {
      // No modificar los campos, dejar como están
      return registro;
    }

    // Verificar secuencia descendente (Lectura_1 > Lectura_2 > ... > Lectura_6)
    for (let i = 0; i < lecturasConIndice.length - 1; i++) {
      if (lecturasConIndice[i].valor <= lecturasConIndice[i + 1].valor) {
        // No modificar los campos, dejar como están
        return registro;
      }
    }

    // Calcular promedio de las lecturas válidas
    const promedioLecturas =
      lecturas.reduce((sum, lectura) => sum + lectura, 0) / lecturas.length;

    // Encontrar la posición de LECTURATOMADA en las lecturas
    let posicionLecturaTomada = -1;
    let lecturaAnterior = null;

    for (let i = 0; i < lecturasConIndice.length; i++) {
      if (lecturasConIndice[i].valor === lecturaTomada) {
        posicionLecturaTomada = i;
        // La lectura anterior sería la siguiente en el array (porque están en orden descendente)
        if (i + 1 < lecturasConIndice.length) {
          lecturaAnterior = lecturasConIndice[i + 1].valor;
        }
        break;
      }
    }

    // Si no encontramos LECTURATOMADA exactamente, buscar la más cercana
    if (posicionLecturaTomada === -1) {
      // Buscar entre qué lecturas está LECTURATOMADA
      for (let i = 0; i < lecturasConIndice.length - 1; i++) {
        if (
          lecturaTomada <= lecturasConIndice[i].valor &&
          lecturaTomada >= lecturasConIndice[i + 1].valor
        ) {
          lecturaAnterior = lecturasConIndice[i + 1].valor;
          break;
        }
      }

      // Si LECTURATOMADA es menor que todas las lecturas, usar la última
      if (
        lecturaAnterior === null &&
        lecturaTomada < lecturasConIndice[lecturasConIndice.length - 1].valor
      ) {
        lecturaAnterior = lecturasConIndice[lecturasConIndice.length - 1].valor;
      }
    }

    // Verificar que tengamos una lectura anterior para calcular el consumo
    if (lecturaAnterior === null) {
      // No modificar los campos, dejar como están
      return registro;
    }

    // Calcular consumo actual
    const consumoActual = lecturaTomada - lecturaAnterior;

    // Verificar que el consumo sea positivo
    if (consumoActual < 0) {
      // No modificar los campos, dejar como están
      return registro;
    }

    // Calcular límites del ±20% del promedio de lecturas
    const limiteInferior = promedioLecturas * 0.8;
    const limiteSuperior = promedioLecturas * 1.2;

    // Comparar consumo actual con el ±20% del promedio de lecturas
    // SOLO modificar los campos cuando el consumo esté dentro del rango
    if (consumoActual >= limiteInferior && consumoActual <= limiteSuperior) {
      registro.Validacion = "NO";
      registro.obsValidacion = "Consumo dentro del rango del 20%";
    }
    // Para todos los demás casos (fuera del rango), no modificar los campos
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

  // Validar que KWAJUSTADOS sea 10
  if (TIPOLECTURA === "10") {
    // Analizar KWAJUSTADOS para determinar la posición del dígito con error
    if (
      KWAJUSTADOS !== null &&
      KWAJUSTADOS !== undefined &&
      KWAJUSTADOS !== "" &&
      KWAJUSTADOS !== 0
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
  const {
    Lectura_1,
    Lectura_2,
    Lectura_3,
    Lectura_4,
    Lectura_5,
    Lectura_6,
    LECTURATOMADA,
    UbicacionError,
  } = registro;

  // Recopilar todas las lecturas válidas (no null, no undefined, números válidos)
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
        lectura !== null && lectura !== undefined && !isNaN(Number(lectura))
    )
    .map((lectura) => Number(lectura));

  // Si no hay lecturas válidas o menos de 2, no se puede determinar el rango
  if (lecturas.length < 2) {
    return registro;
  }

  // Determinar el rango mínimo y máximo de las lecturas válidas
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

  const lecturaTomadasNum = Number(LECTURATOMADA);

  if (UbicacionError == "") {
    // Verificar si LECTURATOMADA está fuera del rango de las lecturas válidas
    if (lecturaTomadasNum < minLectura || lecturaTomadasNum > maxLectura) {
      registro.UbicacionError = "Lectura Diferente";
    }
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
};
