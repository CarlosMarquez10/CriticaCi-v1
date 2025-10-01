

/**
 * Clase para crear y enriquecer registros de lecturas de medidores
 * @class CrearRegistro
 * @description
 * Clase principal para la creación y enriquecimiento de registros de lecturas.
 * Combina datos básicos de lecturas con información adicional de medidores,
 * empleados y lecturas históricas para generar registros completos.
 */
// src/service/CrearRegistro.js
export class CrearRegistro {
  /**
   * Constructor de la clase CrearRegistro
   * @constructor
   * @param {Object} datosBasicos - Datos básicos del registro de lectura
   * @param {string} datosBasicos.usuario - ID del usuario/cliente
   * @param {string} datosBasicos.zona - Zona geográfica
   * @param {number} datosBasicos.ciclo - Ciclo de facturación
   * @param {number} datosBasicos.intento - Intento de lectura
   * @param {string} datosBasicos.solucionConsumo - Solución de consumo aplicada
   * @param {string} datosBasicos.fechaLectura - Fecha de la lectura
   * @param {string} datosBasicos.fechaFactura - Fecha de facturación
   * @param {number} datosBasicos.lecturaTomada - Lectura tomada del medidor
   * @param {string} datosBasicos.observacionDeLectura - Observaciones de la lectura
   * @param {string} datosBasicos.texto - Texto adicional
   * @param {number} datosBasicos.lecturaFacturada - Lectura facturada
   * @param {string} datosBasicos.aclaraciones - Aclaraciones del registro
   * @param {string} datosBasicos.tipoLectura - Tipo de lectura realizada
   * @param {string} datosBasicos.tipoDeError - Tipo de error encontrado
   * @param {number} datosBasicos.kwAjustados - KW ajustados
   * @param {string} datosBasicos.nue - Número único de elemento
   * @param {string} datosBasicos.verifConsolidado - Verificación consolidada
   * @param {string} datosBasicos.verifSemanaAnterior - Verificación semana anterior
   * 
   * @param {Object} [datosExtras={}] - Datos adicionales enriquecidos
   * @param {number} [datosExtras.Lectura_1] - Primera lectura histórica
   * @param {number} [datosExtras.Lectura_2] - Segunda lectura histórica
   * @param {number} [datosExtras.Lectura_3] - Tercera lectura histórica
   * @param {number} [datosExtras.Lectura_4] - Cuarta lectura histórica
   * @param {number} [datosExtras.Lectura_5] - Quinta lectura histórica
   * @param {number} [datosExtras.Lectura_6] - Sexta lectura histórica
   * @param {string} [datosExtras.Obs_Lectura_1] - Observación primera lectura
   * @param {string} [datosExtras.Obs_Lectura_2] - Observación segunda lectura
   * @param {string} [datosExtras.Obs_Lectura_3] - Observación tercera lectura
   * @param {string} [datosExtras.Obs_Lectura_4] - Observación cuarta lectura
   * @param {string} [datosExtras.Obs_Lectura_5] - Observación quinta lectura
   * @param {string} [datosExtras.Obs_Lectura_6] - Observación sexta lectura
   * @param {string} [datosExtras.Operario] - Nombre del operario
   * @param {string} [datosExtras.medidor] - Número del medidor
   * @param {string} [datosExtras.marcamedidor] - Marca del medidor
   * @param {string} [datosExtras.tipomedidor] - Tipo del medidor
   * @param {string} [datosExtras.cedula] - Cédula del empleado
   * @param {string} [datosExtras.tipo] - Tipo de empleado
   * @param {string} [datosExtras.sede] - Sede del empleado
   * @param {string} [datosExtras.Validacion] - Estado de validación
   * @param {string} [datosExtras.obsValidacion] - Observaciones de validación
   * 
   * @param {Object} [raw={}] - Datos raw originales para referencia
   * 
   * @example
   * const registro = new CrearRegistro(
   *   {
   *     usuario: "1170143751",
   *     zona: "A1",
   *     ciclo: 1,
   *     solucionConsumo: "NORMAL",
   *     fechaLectura: "2024-01-15",
   *     lecturaTomada: 1250
   *   },
   *   {
   *     Operario: "Juan Pérez",
   *     medidor: "12345678",
   *     marcamedidor: "ELSTER"
   *   }
   * );
   */
  constructor(
    {
      usuario, zona, ciclo, solucionConsumo, fechaLectura, fechaFactura,
      lecturaTomada, observacionDeLectura, texto, lecturaFacturada,
      aclaraciones, tipoLectura, tipoDeError, kwAjustados, nue,
      verifConsolidado, verifSemanaAnterior
    },
    {
      // extras
      Lectura_1 = null, Lectura_2 = null, Lectura_3 = null, Lectura_4 = null, Lectura_5 = null, Lectura_6 = null, Consumo_1 = null, Consumo_2 = null, Consumo_3 = null, Consumo_4 = null, Consumo_5 = null, Consumo_6 = null,
      Obs_Lectura_1 = null, Obs_Lectura_2 = null, Obs_Lectura_3 = null, Obs_Lectura_4 = null, Obs_Lectura_5 = null, Obs_Lectura_6 = null,
      Operario = null, medidor = null, marcamedidor = null, tipomedidor = null,
      cedula = null, tipo = null, sede = null, Validacion = null, obsValidacion = null, intentos = null,
    } = {},
    raw = {}
  ) {
    // Campos originales (nombres iguales al JSON)
    this.USUARIO = usuario;
    this.ZONA = zona;
    this.CICLO = ciclo;
    this.SOLUCION_CONSUMO = solucionConsumo;
    this.FECHALECTURA = fechaLectura;
    this.FECHAFACTURA = fechaFactura;
    this.LECTURATOMADA = lecturaTomada;
    this.OBSERVACIONDELECTURA = observacionDeLectura;
    this.TEXTO = texto;
    this.LECTURAFACTURADA = lecturaFacturada;
    this.ACLARACIONES = aclaraciones;
    this.TIPOLECTURA = tipoLectura;
    this.TIPODEERROR = tipoDeError;
    this.KWAJUSTADOS = kwAjustados;
    this.NUE = nue;
    this["VERIFICACIONC/CONSOLIDADO"] = verifConsolidado;
    this["VERIFICACIONC/SEMANAANTERIOR"] = verifSemanaAnterior;
    

    // Campos nuevos
    this.Intentos = intentos;
    this.Lectura_1 = Lectura_1;
    this.Lectura_2 = Lectura_2;
    this.Lectura_3 = Lectura_3;
    this.Lectura_4 = Lectura_4;
    this.Lectura_5 = Lectura_5;
    this.Lectura_6 = Lectura_6;
    this.Consumo_1 = Lectura_1 !== null ? Lectura_1 - (Lectura_2 ?? 0) : null;
    this.Consumo_2 = Lectura_2 !== null ? Lectura_2 - (Lectura_3 ?? 0) : null;
    this.Consumo_3 = Lectura_3 !== null ? Lectura_3 - (Lectura_4 ?? 0) : null;
    this.Consumo_4 = Lectura_4 !== null ? Lectura_4 - (Lectura_5 ?? 0) : null;
    this.Consumo_5 = Lectura_5 !== null ? Lectura_5 - (Lectura_6 ?? 0) : null;
    this.Consumo_6 = Lectura_6 !== null ? Lectura_6 - (Lectura_1 ?? 0) : null;
    this.Obs_Lectura_1 = Obs_Lectura_1;
    this.Obs_Lectura_2 = Obs_Lectura_2;
    this.Obs_Lectura_3 = Obs_Lectura_3;
    this.Obs_Lectura_4 = Obs_Lectura_4;
    this.Obs_Lectura_5 = Obs_Lectura_5;
    this.Obs_Lectura_6 = Obs_Lectura_6;
    this.Operario = Operario;
    this.medidor = medidor;
    this.marcamedidor = marcamedidor;
    this.tipomedidor = tipomedidor;
    this.cedula = cedula;
    this.tipo = tipo; // p.ej. cargo
    this.sede = sede;
    this.Validacion = Validacion;
    this.obsValidacion = obsValidacion;

    // Guarda el registro original por si lo necesitas luego
    this._raw = raw;
  }

  static fromRaw(raw, { medidoresMap = {}, medidoresDb = {}, empleadosIndexByNombre = {}, lecturasHistoricas = [], empleadosArray = [] } = {}) {
    const usuario = String(raw.USUARIO ?? "").trim();

    // Busca información del medidor (prefiere DB, sino el mapa simple)
    const medidorDbRow = (medidoresDb[usuario] && medidoresDb[usuario][0]) || null;
    const medidorNum = medidorDbRow?.num_medidor ?? medidoresMap[usuario] ?? null;

    // Buscar cédula del lector en lecturas históricas
    const cedulaLector = CrearRegistro._buscarCedulaEnLecturas(usuario, raw.FECHALECTURA, lecturasHistoricas);
    
    // Buscar intentos en lecturas históricas
    const intentosLectura = CrearRegistro._buscarIntentosEnLecturas(usuario, raw.FECHAFACTURA, lecturasHistoricas);
    
    // Buscar operario por cédula en array de empleados
    const operarioPorCedula = CrearRegistro._buscarOperarioPorCedula(cedulaLector, empleadosArray);

    // El operario lo tomamos del campo ACLARACIONES si viene nombre ahí (fallback)
    const nombreOperario = (raw.ACLARACIONES || "").toString().trim();
    const emp = empleadosIndexByNombre[CrearRegistro._normalizeName(nombreOperario)] || null;

    // Fallback adicional: si no encontramos operario por cédula ni por nombre,
    // intentar buscar por cédula directamente en el array (en caso de que cedulaLector sea null)
    let operarioFinal = operarioPorCedula || emp;
    if (!operarioFinal && nombreOperario) {
      // Buscar por nombre parcial si el nombre exacto no funciona
      operarioFinal = empleadosArray.find(empleado => {
        const nombreEmpleado = CrearRegistro._normalizeName(empleado.nombre || "");
        const nombreBuscado = CrearRegistro._normalizeName(nombreOperario);
        return nombreEmpleado.includes(nombreBuscado) || nombreBuscado.includes(nombreEmpleado);
      });
    }

    // Procesar lecturas históricas para este usuario
    const lecturasUsuario = CrearRegistro._procesarLecturasHistoricas(usuario, raw.TIPOLECTURA, lecturasHistoricas);

    return new CrearRegistro({
      usuario,
      zona: raw.ZONA ?? null,
      ciclo: raw.CICLO ?? null,
      solucionConsumo: raw.SOLUCION_CONSUMO ?? null,
      fechaLectura: raw.FECHALECTURA ?? null,
      fechaFactura: raw.FECHAFACTURA ?? null,
      lecturaTomada: raw.LECTURATOMADA ?? null,
      observacionDeLectura: raw.OBSERVACIONDELECTURA ?? null,
      texto: raw.TEXTO ?? null,
      lecturaFacturada: raw.LECTURAFACTURADA ?? null,
      aclaraciones: nombreOperario || null,
      tipoLectura: raw.TIPOLECTURA ?? null,
      tipoDeError: raw.TIPODEERROR ?? null,
      kwAjustados: raw.KWAJUSTADOS ?? null,
      nue: raw.NUE ?? null,
      verifConsolidado: raw["VERIFICACIONC/CONSOLIDADO"] ?? null,
      verifSemanaAnterior: raw["VERIFICACIONC/SEMANAANTERIOR"] ?? null,
    }, {
      // Extras (con defaults)
      intentos: intentosLectura,
      Lectura_1: lecturasUsuario.Lectura_1,
      Lectura_2: lecturasUsuario.Lectura_2,
      Lectura_3: lecturasUsuario.Lectura_3,
      Lectura_4: lecturasUsuario.Lectura_4,
      Lectura_5: lecturasUsuario.Lectura_5,
      Lectura_6: lecturasUsuario.Lectura_6,
      Consumo_1: lecturasUsuario.Consumo_1,
      Consumo_2: lecturasUsuario.Consumo_2,
      Consumo_3: lecturasUsuario.Consumo_3,
      Consumo_4: lecturasUsuario.Consumo_4,
      Consumo_5: lecturasUsuario.Consumo_5,
      Consumo_6: lecturasUsuario.Consumo_6,
      Obs_Lectura_1: lecturasUsuario.Obs_Lectura_1,
      Obs_Lectura_2: lecturasUsuario.Obs_Lectura_2,
      Obs_Lectura_3: lecturasUsuario.Obs_Lectura_3,
      Obs_Lectura_4: lecturasUsuario.Obs_Lectura_4,
      Obs_Lectura_5: lecturasUsuario.Obs_Lectura_5,
      Obs_Lectura_6: lecturasUsuario.Obs_Lectura_6,
      Operario: operarioFinal?.nombre || nombreOperario || null,
      medidor: medidorNum,
      marcamedidor: medidorDbRow?.marca_medidor ?? null,
      tipomedidor: medidorDbRow?.tipo_medidor ?? null,
      cedula: cedulaLector || (operarioFinal?.cedula ?? null),
      tipo: operarioFinal?.cargo ?? null,
      sede: operarioFinal?.sede ?? null,
      Validacion: null,
      obsValidacion: null,
    }, raw);
  }

  // ——— Método para procesar lecturas históricas ———
  static _procesarLecturasHistoricas(usuario, tipoLectura, lecturasHistoricas = []) {
    const mesActual = new Date().getMonth() + 1; // Mes actual (1-12)
    const anoActual = new Date().getFullYear();
    
    // Filtrar lecturas para este usuario y tipo de lectura
    const lecturasUsuario = lecturasHistoricas.filter(lectura => {
      const clienteLectura = String(lectura.cliente || lectura.CLIENTE || "").trim();
      const codTarea = String(lectura.codtarea || lectura.CODTAREA || "").trim();
      
      return clienteLectura === usuario && codTarea === tipoLectura;
    });

    // Ordenar por año y mes descendente para obtener las más recientes
    lecturasUsuario.sort((a, b) => {
      const anoA = parseInt(a.ano || a.ANO || 0);
      const mesA = parseInt(a.mes || a.MES || 0);
      const anoB = parseInt(b.ano || b.ANO || 0);
      const mesB = parseInt(b.mes || b.MES || 0);
      
      if (anoA !== anoB) return anoB - anoA; // Año más reciente primero
      return mesB - mesA; // Mes más reciente primero
    });

    // Asignar lecturas a los campos correspondientes
    const resultado = {
      Intentos: null,
      Lectura_1: null, // Mes actual
      Lectura_2: null, // Mes anterior
      Lectura_3: null, // 2 meses atrás
      Lectura_4: null, // 3 meses atrás
      Lectura_5: null, // 4 meses atrás
      Lectura_6: null, // 5 meses atrás
      Consumo_1: null, // Consumo del mes actual
      Consumo_2: null, // Consumo del mes anterior
      Consumo_3: null, // Consumo de 2 meses atrás
      Consumo_4: null, // Consumo de 3 meses atrás
      Consumo_5: null, // Consumo de 4 meses atrás
      Consumo_6: null, // Consumo de 5 meses atrás
      Obs_Lectura_1: null, // Observación del mes actual
      Obs_Lectura_2: null, // Observación del mes anterior
      Obs_Lectura_3: null, // Observación de 2 meses atrás
      Obs_Lectura_4: null, // Observación de 3 meses atrás
      Obs_Lectura_5: null, // Observación de 4 meses atrás
      Obs_Lectura_6: null  // Observación de 5 meses atrás
    };

    // Mapear las lecturas según el mes objetivo
    const mesesObjetivo = [
      mesActual,     // Lectura_1: mes actual
      mesActual - 1, // Lectura_2: mes anterior
      mesActual - 2, // Lectura_3: 2 meses atrás
      mesActual - 3, // Lectura_4: 3 meses atrás
      mesActual - 4, // Lectura_5: 4 meses atrás
      mesActual - 5  // Lectura_6: 5 meses atrás
    ];

    mesesObjetivo.forEach((mesObjetivo, index) => {
      let anoObjetivo = anoActual;
      let mesAjustado = mesObjetivo;
      
      // Ajustar año si el mes es negativo
      if (mesAjustado <= 0) {
        anoObjetivo = anoActual - 1;
        mesAjustado = 12 + mesAjustado;
      }

      // Buscar la lectura correspondiente a este mes y año
      const lecturaEncontrada = lecturasUsuario.find(lectura => {
        const anoLectura = parseInt(lectura.ano || lectura.ANO || 0);
        const mesLectura = parseInt(lectura.mes || lectura.MES || 0);
        return anoLectura === anoObjetivo && mesLectura === mesAjustado;
      });

      if (lecturaEncontrada) {
        const valorLectura = lecturaEncontrada.lectura_actual || 
                           lecturaEncontrada.LECTURA_ACTUAL || 
                           lecturaEncontrada.lectura_act || 
                           lecturaEncontrada.LECTURA_ACT || 
                           null;
        
        const obsTexto = lecturaEncontrada.obs_texto || 
                        lecturaEncontrada.OBS_TEXTO || 
                        null;
        
        switch (index) {
          case 0: 
            resultado.Lectura_1 = valorLectura; 
            resultado.Obs_Lectura_1 = obsTexto;
            break;
          case 1: 
            resultado.Lectura_2 = valorLectura; 
            resultado.Obs_Lectura_2 = obsTexto;
            break;
          case 2: 
            resultado.Lectura_3 = valorLectura; 
            resultado.Obs_Lectura_3 = obsTexto;
            break;
          case 3: 
            resultado.Lectura_4 = valorLectura; 
            resultado.Obs_Lectura_4 = obsTexto;
            break;
          case 4: 
            resultado.Lectura_5 = valorLectura; 
            resultado.Obs_Lectura_5 = obsTexto;
            break;
          case 5: 
            resultado.Lectura_6 = valorLectura; 
            resultado.Obs_Lectura_6 = obsTexto;
            break;
        }
      }
    });

    return resultado;
  }

  // ——— Método para buscar cédula del lector en lecturas históricas ———
  static _buscarCedulaEnLecturas(usuario, fechaLectura, lecturasHistoricas = []) {
    if (!usuario || !fechaLectura || !lecturasHistoricas.length) {
      return null;
    }

    // Función para parsear fecha en formato DD/MM/YYYY
    const parsearFecha = (fechaStr) => {
      if (!fechaStr) return null;
      const partes = fechaStr.split('/');
      if (partes.length !== 3) return null;
      // Crear fecha: año, mes-1, día
      return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    };

    // Parsear la fecha de lectura
    const fechaLecturaObj = parsearFecha(fechaLectura);
    if (!fechaLecturaObj) return null;

    const mesLectura = fechaLecturaObj.getMonth() + 1; // Mes 1-12
    const anoLectura = fechaLecturaObj.getFullYear(); // Año completo

    // Buscar lecturas para este usuario
    const lecturasUsuario = lecturasHistoricas.filter(lectura => {
      const clienteLectura = String(lectura.cliente || lectura.CLIENTE || "").trim();
      return clienteLectura === usuario;
    });

    // Si no hay lecturas para este usuario, intentar buscar la más reciente
    if (lecturasUsuario.length === 0) {
      console.log(`⚠️  No se encontraron lecturas históricas para usuario ${usuario}`);
      return null;
    }

    // Buscar por mes y año exactos primero
    let lecturaEncontrada = lecturasUsuario.find(lectura => {
      const mesHistorico = parseInt(lectura.mes || lectura.MES || 0);
      const anoHistorico = parseInt(lectura.ano || lectura.ANO || 0);
      
      return mesHistorico === mesLectura && anoHistorico === anoLectura;
    });

    // Si no encuentra por fecha exacta, buscar la lectura más reciente del usuario
    if (!lecturaEncontrada) {
      console.log(`⚠️  No se encontró lectura exacta para usuario ${usuario} en ${mesLectura}/${anoLectura}`);
      console.log(`📊 Lecturas disponibles para usuario ${usuario}:`, 
        lecturasUsuario.map(l => `${l.mes || l.MES}/${l.ano || l.ANO}`).slice(0, 5)
      );
      
      // Ordenar por año y mes descendente para obtener la más reciente
      lecturasUsuario.sort((a, b) => {
        const anoA = parseInt(a.ano || a.ANO || 0);
        const anoB = parseInt(b.ano || b.ANO || 0);
        const mesA = parseInt(a.mes || a.MES || 0);
        const mesB = parseInt(b.mes || b.MES || 0);
        
        if (anoA !== anoB) return anoB - anoA; // Año más reciente primero
        return mesB - mesA; // Mes más reciente primero
      });
      
      lecturaEncontrada = lecturasUsuario[0]; // Tomar la más reciente
      
      if (lecturaEncontrada) {
        console.log(`✅ Usando lectura más reciente para usuario ${usuario}: ${lecturaEncontrada.mes || lecturaEncontrada.MES}/${lecturaEncontrada.ano || lecturaEncontrada.ANO}`);
      }
    }

    // Si la lectura encontrada tiene lector null, buscar la más reciente con lector válido
    if (lecturaEncontrada && !lecturaEncontrada.lector) {
      console.log(`⚠️  Lectura encontrada para usuario ${usuario} tiene lector null, buscando alternativa...`);
      
      // Buscar la lectura más reciente que tenga un lector válido
      const lecturaConLector = lecturasUsuario.find(lectura => {
        const lector = lectura.lector || lectura.LECTOR;
        return lector && lector.trim() !== '';
      });
      
      if (lecturaConLector) {
        lecturaEncontrada = lecturaConLector;
        console.log(`✅ Usando lectura con lector válido para usuario ${usuario}: ${lecturaEncontrada.mes || lecturaEncontrada.MES}/${lecturaEncontrada.ano || lecturaEncontrada.ANO}, lector: ${lecturaEncontrada.lector}`);
      }
    }

    // Retornar la cédula del lector si se encuentra
    const cedula = lecturaEncontrada?.lector || lecturaEncontrada?.LECTOR || null;
    
    if (cedula) {
      console.log(`✅ Cédula encontrada para usuario ${usuario}: ${cedula}`);
    } else {
      console.log(`❌ No se pudo obtener cédula para usuario ${usuario}`);
    }
    
    return cedula;
  }

  // ——— Método para buscar intentos en lecturas históricas ———
  static _buscarIntentosEnLecturas(usuario, fechaLectura, lecturasHistoricas = []) {
    if (!usuario || !fechaLectura || !lecturasHistoricas.length) {
      return null;
    }

    // Función para parsear fecha en formato DD/MM/YYYY
    const parsearFecha = (fechaStr) => {
      if (!fechaStr) return null;
      const partes = fechaStr.split('/');
      if (partes.length !== 3) return null;
      // Crear fecha: año, mes-1, día
      return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
    };

    // Parsear la fecha de lectura
    const fechaLecturaObj = parsearFecha(fechaLectura);
    if (!fechaLecturaObj) {
      return null;
    }

    const mesLectura = fechaLecturaObj.getMonth() + 1; // Mes 1-12
    const anoLectura = fechaLecturaObj.getFullYear(); // Año completo

    // Buscar en lecturas históricas por usuario, mes y año
    const lecturaEncontrada = lecturasHistoricas.find(lectura => {
      const clienteLectura = String(lectura.cliente || lectura.CLIENTE || "").trim();
      const mesHistorico = parseInt(lectura.mes || lectura.MES || 0);
      const anoHistorico = parseInt(lectura.ano || lectura.ANO || 0);
      
      return clienteLectura === usuario && 
             mesHistorico === mesLectura && 
             anoHistorico === anoLectura;
    });

    // Retornar los intentos si se encuentra la lectura
    if (lecturaEncontrada) {
      const intentos = lecturaEncontrada.intentos || 
                      lecturaEncontrada.INTENTOS || 
                      null;
      
      // Intentar convertir a número si es string
      if (intentos !== null && intentos !== undefined) {
        const intentosNum = parseInt(intentos);
        return isNaN(intentosNum) ? null : intentosNum;
      }
    }
    
    return null;
  }

  // ——— Método para buscar operario por cédula en array de empleados ———
  static _buscarOperarioPorCedula(cedula, empleadosArray = []) {
    if (!cedula || !empleadosArray.length) {
      return null;
    }

    // Buscar empleado por cédula
    const empleadoEncontrado = empleadosArray.find(empleado => {
      const cedulaEmpleado = String(empleado.cedula || "").trim();
      const cedulaBuscada = String(cedula).trim();
      return cedulaEmpleado === cedulaBuscada;
    });

    return empleadoEncontrado || null;
  }

  // ——— utilidades ———
  static indexEmpleados(empleados = []) {
    const idx = {};
    for (const e of empleados) {
      const key = CrearRegistro._normalizeName(e?.nombre || "");
      if (!key) continue;
      idx[key] = {
        nombre: e.nombre ?? null,
        cedula: e.cedula ?? null,
        sede: e.sede ?? null,
        cargo: e.cargo ?? null,
      };
    }
    return idx;
  }

  static _normalizeName(n) {
    return n
      .toString()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // quita tildes
      .toUpperCase()
      .replace(/\s+/g, " ")
      .trim();
  }
}
