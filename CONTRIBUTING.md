# Guía de Contribución - CriticaCi-v1 🤝

¡Gracias por tu interés en contribuir a CriticaCi-v1! Esta guía te ayudará a entender cómo puedes participar en el desarrollo del proyecto.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [¿Cómo puedo contribuir?](#cómo-puedo-contribuir)
- [Configuración del Entorno de Desarrollo](#configuración-del-entorno-de-desarrollo)
- [Proceso de Desarrollo](#proceso-de-desarrollo)
- [Estándares de Código](#estándares-de-código)
- [Guía de Commits](#guía-de-commits)
- [Pull Requests](#pull-requests)
- [Reportar Bugs](#reportar-bugs)
- [Solicitar Features](#solicitar-features)
- [Documentación](#documentación)

---

## 📜 Código de Conducta

Este proyecto se adhiere a un código de conducta. Al participar, se espera que mantengas este código. Por favor reporta comportamientos inaceptables a [carlos27marquez10@gmail.com](mailto:carlos27marquez10@gmail.com).

### Nuestros Compromisos

- Usar un lenguaje acogedor e inclusivo
- Respetar diferentes puntos de vista y experiencias
- Aceptar críticas constructivas de manera elegante
- Enfocarse en lo que es mejor para la comunidad
- Mostrar empatía hacia otros miembros de la comunidad

---

## 🚀 ¿Cómo puedo contribuir?

### Tipos de Contribuciones

1. **🐛 Reportar Bugs**: Ayuda a identificar y documentar problemas
2. **✨ Sugerir Features**: Propón nuevas funcionalidades
3. **💻 Código**: Implementa fixes, features o mejoras
4. **📚 Documentación**: Mejora la documentación existente
5. **🧪 Testing**: Agrega o mejora tests
6. **🎨 UI/UX**: Mejora la interfaz y experiencia de usuario
7. **🔧 DevOps**: Mejora procesos de CI/CD y deployment

### Áreas que Necesitan Ayuda

- [ ] Implementación de tests unitarios
- [ ] Mejora de la documentación de API
- [ ] Optimización de consultas de base de datos
- [ ] Implementación de autenticación JWT
- [ ] Dashboard web con gráficos
- [ ] Integración con medidores IoT
- [ ] Exportación a múltiples formatos (PDF, CSV)

---

## 🛠️ Configuración del Entorno de Desarrollo

### Prerrequisitos

- **Node.js** >= 16.0.0
- **MySQL** >= 8.0
- **Git** >= 2.20
- **npm** >= 8.0.0

### Configuración Inicial

1. **Fork del repositorio**
   ```bash
   # Haz fork desde GitHub UI, luego clona tu fork
   git clone https://github.com/TU_USUARIO/CriticaCi-v1.git
   cd CriticaCi-v1
   ```

2. **Configurar upstream**
   ```bash
   git remote add upstream https://github.com/CarlosMarquez10/CriticaCi-v1.git
   git fetch upstream
   ```

3. **Instalar dependencias**
   ```bash
   npm install
   ```

4. **Configurar variables de entorno**
   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales de desarrollo
   ```

5. **Configurar base de datos**
   ```bash
   # Crear base de datos de desarrollo
   mysql -u root -p -e "CREATE DATABASE criticaci_dev;"
   
   # Ejecutar scripts de esquema
   mysql -u root -p criticaci_dev < src/schemas/01_clientesCI_tiempos.sql
   mysql -u root -p criticaci_dev < src/schemas/tablaEmpleados.sql
   mysql -u root -p criticaci_dev < src/schemas/tabla_medidores.sql
   ```

6. **Verificar instalación**
   ```bash
   npm run dev
   # El servidor debe iniciarse en http://localhost:3000
   ```

---

## 🔄 Proceso de Desarrollo

### Workflow de Git

1. **Crear rama para tu feature**
   ```bash
   git checkout -b feature/nombre-descriptivo
   # o
   git checkout -b fix/descripcion-del-bug
   ```

2. **Mantener tu rama actualizada**
   ```bash
   git fetch upstream
   git rebase upstream/main
   ```

3. **Hacer commits frecuentes**
   ```bash
   git add .
   git commit -m "feat: descripción clara del cambio"
   ```

4. **Push a tu fork**
   ```bash
   git push origin feature/nombre-descriptivo
   ```

5. **Crear Pull Request**
   - Ve a GitHub y crea un PR desde tu rama hacia `main`
   - Usa el template de PR proporcionado

### Tipos de Ramas

- `main` - Rama principal estable
- `develop` - Rama de desarrollo (si existe)
- `feature/nombre` - Nuevas funcionalidades
- `fix/descripcion` - Corrección de bugs
- `docs/tema` - Mejoras de documentación
- `refactor/area` - Refactoring de código
- `test/componente` - Adición de tests

---

## 📝 Estándares de Código

### Estructura de Archivos

```
src/
├── controllers/     # Controladores de API
├── services/       # Lógica de negocio
├── routes/         # Definición de rutas
├── middleware/     # Middleware personalizado
├── connection/     # Configuración de BD
├── utils/          # Utilidades y helpers
├── schemas/        # Scripts SQL
└── data/           # Datos de prueba
```

### Convenciones de Nomenclatura

- **Archivos**: `camelCase.js` (ej: `medidor.controller.js`)
- **Clases**: `PascalCase` (ej: `CrearRegistro`)
- **Funciones**: `camelCase` (ej: `getMedidor`)
- **Variables**: `camelCase` (ej: `clienteMedidor`)
- **Constantes**: `UPPER_SNAKE_CASE` (ej: `MAX_CLIENTS`)
- **Rutas**: `kebab-case` (ej: `/api/medidores-search`)

### Estilo de Código

```javascript
// ✅ Bueno
export const getMedidor = async (req, res) => {
  try {
    const { cliente_medidor } = req.params;
    
    if (!cliente_medidor) {
      return res.status(400).json({
        ok: false,
        message: 'Falta parámetro cliente_medidor'
      });
    }
    
    const result = await fetchMedidorByCliente(cliente_medidor);
    return res.json({ ok: true, ...result });
  } catch (error) {
    console.error('Error en getMedidor:', error);
    return res.status(500).json({
      ok: false,
      message: 'Error interno del servidor'
    });
  }
};

// ❌ Malo
export const getMedidor = async (req,res) => {
const cliente_medidor = req.params.cliente_medidor
if(!cliente_medidor) return res.status(400).json({ok:false,message:'Falta parámetro'})
const result = await fetchMedidorByCliente(cliente_medidor)
res.json({ok:true,...result})
}
```

### Documentación JSDoc

Todas las funciones públicas deben tener documentación JSDoc:

```javascript
/**
 * Obtiene información de medidores para un cliente específico
 * @async
 * @function getMedidor
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object>} Respuesta JSON con información del medidor
 * @description
 * Endpoint: GET /api/medidores/:cliente_medidor
 * Busca medidores asociados a un cliente específico en la base de datos.
 * 
 * @example
 * // Respuesta exitosa
 * {
 *   "ok": true,
 *   "cliente_medidor": "202957",
 *   "total": 1,
 *   "rows": [...]
 * }
 */
```

---

## 📝 Guía de Commits

### Formato de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>[ámbito opcional]: <descripción>

[cuerpo opcional]

[footer opcional]
```

### Tipos de Commits

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Cambios en documentación
- `style`: Cambios de formato (espacios, comas, etc.)
- `refactor`: Refactoring de código
- `test`: Agregar o modificar tests
- `chore`: Tareas de mantenimiento

### Ejemplos

```bash
# Nuevas funcionalidades
git commit -m "feat(api): agregar endpoint para búsqueda de medidores"
git commit -m "feat(excel): implementar filtros personalizados en reportes"

# Corrección de bugs
git commit -m "fix(db): corregir consulta SQL para lecturas históricas"
git commit -m "fix(auth): resolver problema de validación de tokens"

# Documentación
git commit -m "docs(api): actualizar documentación de endpoints"
git commit -m "docs(readme): agregar instrucciones de instalación"

# Refactoring
git commit -m "refactor(services): extraer lógica común a utilidades"
git commit -m "refactor(controllers): simplificar manejo de errores"
```

---

## 🔀 Pull Requests

### Antes de Crear un PR

- [ ] Tu código sigue los estándares del proyecto
- [ ] Has agregado tests para nuevas funcionalidades
- [ ] Todos los tests existentes pasan
- [ ] Has actualizado la documentación si es necesario
- [ ] Tu rama está actualizada con `main`
- [ ] Has probado tu código localmente

### Template de PR

```markdown
## Descripción
Breve descripción de los cambios realizados.

## Tipo de Cambio
- [ ] Bug fix (cambio que corrige un problema)
- [ ] Nueva funcionalidad (cambio que agrega funcionalidad)
- [ ] Breaking change (cambio que podría romper funcionalidad existente)
- [ ] Documentación

## ¿Cómo se ha probado?
Describe las pruebas que realizaste para verificar tus cambios.

## Checklist
- [ ] Mi código sigue los estándares del proyecto
- [ ] He realizado una auto-revisión de mi código
- [ ] He comentado mi código, especialmente en áreas difíciles de entender
- [ ] He realizado los cambios correspondientes en la documentación
- [ ] Mis cambios no generan nuevas advertencias
- [ ] He agregado tests que prueban que mi fix es efectivo o que mi feature funciona
- [ ] Los tests unitarios nuevos y existentes pasan localmente con mis cambios

## Screenshots (si aplica)
Agrega screenshots para ayudar a explicar tu cambio.
```

### Proceso de Revisión

1. **Revisión Automática**: Los checks automáticos deben pasar
2. **Revisión de Código**: Al menos un maintainer debe aprobar
3. **Testing**: Se ejecutan tests en diferentes entornos
4. **Merge**: El PR se fusiona a la rama principal

---

## 🐛 Reportar Bugs

### Antes de Reportar

1. **Busca issues existentes** para evitar duplicados
2. **Verifica que sea realmente un bug** y no un error de configuración
3. **Prueba con la última versión** del proyecto

### Template de Bug Report

```markdown
**Descripción del Bug**
Una descripción clara y concisa del bug.

**Pasos para Reproducir**
1. Ve a '...'
2. Haz clic en '....'
3. Desplázate hacia abajo hasta '....'
4. Ve el error

**Comportamiento Esperado**
Una descripción clara de lo que esperabas que pasara.

**Screenshots**
Si aplica, agrega screenshots para ayudar a explicar tu problema.

**Información del Entorno:**
- OS: [ej. Windows 10, macOS 12.0, Ubuntu 20.04]
- Node.js: [ej. 16.14.0]
- MySQL: [ej. 8.0.28]
- Navegador: [ej. Chrome 98, Firefox 97]

**Contexto Adicional**
Agrega cualquier otro contexto sobre el problema aquí.
```

---

## ✨ Solicitar Features

### Template de Feature Request

```markdown
**¿Tu feature request está relacionado con un problema?**
Una descripción clara de cuál es el problema. Ej. Siempre me frustra cuando [...]

**Describe la solución que te gustaría**
Una descripción clara de lo que quieres que pase.

**Describe alternativas que has considerado**
Una descripción clara de cualquier solución o feature alternativa que hayas considerado.

**Contexto adicional**
Agrega cualquier otro contexto o screenshots sobre el feature request aquí.
```

---

## 📚 Documentación

### Tipos de Documentación

1. **README.md** - Información general del proyecto
2. **API.md** - Documentación de endpoints
3. **DATABASE.md** - Esquemas y estructura de BD
4. **CONTRIBUTING.md** - Esta guía de contribución
5. **JSDoc** - Documentación inline del código

### Estándares de Documentación

- Usa **Markdown** para toda la documentación
- Incluye **ejemplos prácticos** siempre que sea posible
- Mantén la documentación **actualizada** con los cambios de código
- Usa **emojis** para hacer la documentación más visual
- Incluye **diagramas** cuando sea necesario

### Estructura de Documentación

```markdown
# Título Principal

Descripción breve del contenido.

## Sección Principal

### Subsección

Contenido con ejemplos:

```javascript
// Ejemplo de código
const ejemplo = "código bien documentado";
```

**Nota importante**: Información relevante.

> **Tip**: Consejos útiles para el usuario.
```

---

## 🧪 Testing

### Ejecutar Tests

```bash
# Ejecutar todos los tests (cuando estén implementados)
npm test

# Ejecutar tests en modo watch
npm run test:watch

# Ejecutar tests con coverage
npm run test:coverage
```

### Escribir Tests

```javascript
// tests/controllers/medidor.test.js
import { describe, it, expect } from 'vitest';
import { getMedidor } from '../../src/controllers/medidor.controller.js';

describe('Medidor Controller', () => {
  it('should return medidor data for valid cliente_medidor', async () => {
    const req = {
      params: { cliente_medidor: '202957' }
    };
    const res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis()
    };

    await getMedidor(req, res);

    expect(res.json).toHaveBeenCalledWith({
      ok: true,
      cliente_medidor: '202957',
      // ... más assertions
    });
  });
});
```

---

## 🚀 Deployment

### Entornos

- **Development**: Tu máquina local
- **Staging**: Entorno de pruebas (si existe)
- **Production**: Entorno de producción

### Proceso de Release

1. **Crear release branch**: `git checkout -b release/v1.1.0`
2. **Actualizar versión**: Modificar `package.json`
3. **Actualizar CHANGELOG**: Documentar cambios
4. **Testing final**: Ejecutar todos los tests
5. **Merge a main**: Crear PR hacia main
6. **Tag release**: `git tag v1.1.0`
7. **Deploy**: Seguir proceso de deployment

---

## 📞 Contacto y Soporte

### Canales de Comunicación

- **GitHub Issues**: Para bugs y feature requests
- **Email**: [carlos27marquez10@gmail.com](mailto:carlos27marquez10@gmail.com)
- **Discussions**: Para preguntas generales (si está habilitado)

### Maintainers

- **Carlos Márquez** ([@CarlosMarquez10](https://github.com/CarlosMarquez10)) - Maintainer principal

---

## 📄 Licencia

Al contribuir a CriticaCi-v1, aceptas que tus contribuciones serán licenciadas bajo la misma licencia ISC del proyecto.

---

## 🙏 Reconocimientos

¡Gracias a todos los contribuidores que hacen posible este proyecto!

### Cómo ser Reconocido

- Contribuye con código, documentación o reportes de bugs
- Ayuda a otros usuarios en issues y discussions
- Mejora la experiencia de desarrollo del proyecto

---

**¡Gracias por contribuir a CriticaCi-v1! 🎉**

Tu participación hace que este proyecto sea mejor para toda la comunidad.