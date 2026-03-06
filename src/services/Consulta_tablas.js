import { pool } from "../connection/db.js";

export async function cantidadLecturas(){
   const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM tiempos`);
   return rows[0].total;
}

export async function cantidadConsulta(){
   const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM log_consultas`);
   return rows[0].total;
}

export async function cantidadEmpleados(){
   const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM empleados`);
   return rows[0].total;
}

export async function cantidadEmpleadosActivos(){
   const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM empleados WHERE passwordChanged = 1`);
   return rows[0].total;
}

export async function cantidadClientesSac(){
   const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM clientessac`);
   return rows[0].total;
}

export async function cantidadTipoFacturacion(){
   const [rows] = await pool.execute(`SELECT COUNT(*) as total FROM TipoFacturacion`);
   return rows[0].total;
}

export async function informacionPanel(){
    const infoTablero = {
        cantidad_lectura: await cantidadLecturas(),
        cantidad_consulta: await cantidadConsulta(),
        cantidad_empleado: await cantidadEmpleados(),
        cantidad_empleado_activo: await cantidadEmpleadosActivos(),
        cantidad_cliente_sac: await cantidadClientesSac(),
        cantidad_tipo_factura: await cantidadTipoFacturacion()
    };
    return infoTablero;
}