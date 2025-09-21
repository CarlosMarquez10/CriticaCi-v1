

// src/service/CrearRegistro.js
export class CrearRegistro {
  constructor(
    {
      usuario, zona, ciclo, solucionConsumo, fechaLectura, fechaFactura,
      lecturaTomada, observacionDeLectura, texto, lecturaFacturada,
      aclaraciones, tipoLectura, tipoDeError, kwAjustados, nue,
      verifConsolidado, verifSemanaAnterior
    },
    {
      // extras
      Lectura_1 = null, Lectura_2 = null, Lectura_3 = null, Lectura_4 = null, Obs_Lectura_1 = null,
      Obs_Lectura_2 = null, Obs_Lectura_3 = null, Obs_Lectura_4 = null,
      Operario = null, medidor = null, marcamedidor = null, tipomedidor = null,
      cedula = null, tipo = null, sede = null, Validacion = null, obsValidacion = null,
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
    this.Lectura_1 = Lectura_1;
    this.Lectura_2 = Lectura_2;
    this.Lectura_3 = Lectura_3;
    this.Lectura_4 = Lectura_4;
    this.Obs_Lectura_1 = Obs_Lectura_1;
    this.Obs_Lectura_2 = Obs_Lectura_2;
    this.Obs_Lectura_3 = Obs_Lectura_3;
    this.Obs_Lectura_4 = Obs_Lectura_4;
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
    
    // Buscar operario por cédula en array de empleados
    const operarioPorCedula = CrearRegistro._buscarOperarioPorCedula(cedulaLector, empleadosArray);

    // El operario lo tomamos del campo ACLARACIONES si viene nombre ahí (fallback)
    const nombreOperario = (raw.ACLARACIONES || "").toString().trim();
    const emp = empleadosIndexByNombre[CrearRegistro._normalizeName(nombreOperario)] || null;

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
      Lectura_1: lecturasUsuario.Lectura_1,
      Lectura_2: lecturasUsuario.Lectura_2,
      Lectura_3: lecturasUsuario.Lectura_3,
      Lectura_4: lecturasUsuario.Lectura_4,
      Obs_Lectura_1: lecturasUsuario.Obs_Lectura_1,
      Obs_Lectura_2: lecturasUsuario.Obs_Lectura_2,
      Obs_Lectura_3: lecturasUsuario.Obs_Lectura_3,
      Obs_Lectura_4: lecturasUsuario.Obs_Lectura_4,
      Operario: operarioPorCedula?.nombre || nombreOperario || (emp?.nombre ?? null),
      medidor: medidorNum,
      marcamedidor: medidorDbRow?.marca_medidor ?? null,
      tipomedidor: medidorDbRow?.tipo_medidor ?? null,
      cedula: cedulaLector || (emp?.cedula ?? null),
      tipo: operarioPorCedula?.cargo ?? (emp?.cargo ?? null),
      sede: operarioPorCedula?.sede ?? (emp?.sede ?? null),
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
      Lectura_1: null, // Mes 8 (mes anterior al actual si estamos en mes 9)
      Lectura_2: null, // Mes 7
      Lectura_3: null, // Mes 6
      Lectura_4: null, // Mes 5
      Obs_Lectura_1: null, // Observación del mes anterior
      Obs_Lectura_2: null, // Observación de 2 meses atrás
      Obs_Lectura_3: null, // Observación de 3 meses atrás
      Obs_Lectura_4: null  // Observación de 4 meses atrás
    };

    // Mapear las lecturas según el mes objetivo
    const mesesObjetivo = [
      mesActual - 1, // Lectura_1: mes anterior
      mesActual - 2, // Lectura_2: 2 meses atrás
      mesActual - 3, // Lectura_3: 3 meses atrás
      mesActual - 4  // Lectura_4: 4 meses atrás
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
    const anoLectura = fechaLecturaObj.getFullYear();

    // Buscar en lecturas históricas por usuario, mes y año
    const lecturaEncontrada = lecturasHistoricas.find(lectura => {
      const clienteLectura = String(lectura.cliente || lectura.CLIENTE || "").trim();
      const mesHistorico = parseInt(lectura.mes || lectura.MES || 0);
      const anoHistorico = parseInt(lectura.ano || lectura.ANO || 0);
      
      return clienteLectura === usuario && 
             mesHistorico === mesLectura && 
             anoHistorico === anoLectura;
    });

    // Retornar la cédula del lector si se encuentra
    return lecturaEncontrada?.lector || lecturaEncontrada?.LECTOR || null;
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
