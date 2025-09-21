import { findEmpleadoByCedula } from "../src/services/empleados.service.js";


const consulta = findEmpleadoByCedula("1065893182");
consulta.then(res => console.log(res.empleado.nombre));
