export const ROLES = ['Comercial', 'Lider', 'Administrador'];
export const esAdministrador = user => user?.estado === 'Activo' && user.rol === 'Administrador';
export const puedeVerTrazabilidad = user => user?.estado === 'Activo' && ['Lider', 'Administrador'].includes(user.rol);
