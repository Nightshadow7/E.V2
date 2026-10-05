import { useState } from 'react';
import { supabase } from '../../supabaseClient';

export function MiCuenta({ user }) {
  const [nombre, setNombre] = useState(user.nombres || '');
  const [email, setEmail] = useState(user.email || '');
  const [actual, setActual] = useState('');
  const [clave, setClave] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const ejecutar = async accion => {
    if (ocupado) return;
    setOcupado(true); setMensaje(''); setError('');
    try { await accion(); } catch (err) { setError(err.message); } finally { setOcupado(false); }
  };
  const guardarNombre = event => {
    event.preventDefault();
    if (!nombre.trim()) { setError('El nombre no puede estar vacío.'); return; }
    ejecutar(async () => {
      const { error } = await supabase.from('empleados').update({ nombres: nombre.trim() }).eq('id_empleado', user.id_empleado).select('id_empleado').single();
      if (error) throw error;
      window.dispatchEvent(new Event('eco-user-updated'));
      setMensaje('Nombre actualizado.');
    });
  };
  const guardarCorreo = event => {
    event.preventDefault();
    ejecutar(async () => {
      const { data, error } = await supabase.auth.updateUser({ email: email.trim().toLowerCase() });
      if (error) throw error;
      window.dispatchEvent(new Event('eco-user-updated'));
      setMensaje(data.user.email?.toLowerCase() === email.trim().toLowerCase() ? 'Correo actualizado.' : 'Cambio solicitado. Revisa tu correo actual y el nuevo para confirmar. Hasta entonces sigue vigente el correo anterior.');
    });
  };
  const guardarClave = event => {
    event.preventDefault();
    if (clave !== confirmacion) { setError('Las contraseñas nuevas no coinciden.'); return; }
    ejecutar(async () => {
      const { error } = await supabase.auth.updateUser({ password: clave, current_password: actual });
      if (error) throw error;
      setActual(''); setClave(''); setConfirmacion('');
      setMensaje('Contraseña actualizada. Usa la nueva contraseña al iniciar sesión.');
    });
  };
  const input = 'block w-full border border-gray-300 rounded-lg p-2 mt-1';
  return <section className="p-6 space-y-6 max-w-2xl">
    <h3 className="text-xl font-bold">Mi cuenta</h3>
    <p>Rol: <strong>{user.rol}</strong>. Todos los roles pueden cambiar su propio correo y contraseña.</p>
    {mensaje && <p role="status" className="p-3 bg-emerald-50 text-emerald-800 rounded-lg">{mensaje}</p>}
    {error && <p role="alert" className="p-3 bg-red-50 text-red-800 rounded-lg">{error}</p>}
    <form onSubmit={guardarNombre}><fieldset disabled={ocupado} className="space-y-3"><label className="block">Nombre completo<input className={input} value={nombre} onChange={e => setNombre(e.target.value)} required maxLength={150} /></label><button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Guardar nombre</button></fieldset></form>
    <form onSubmit={guardarCorreo} className="border-t pt-5"><fieldset disabled={ocupado} className="space-y-3"><label className="block">Nuevo correo<input type="email" autoComplete="email" className={input} value={email} onChange={e => setEmail(e.target.value)} required /></label><button type="submit" disabled={email.trim().toLowerCase() === user.email?.toLowerCase()} className="bg-emerald-600 text-white px-4 py-2 rounded-lg disabled:opacity-50">Cambiar correo</button></fieldset></form>
    <form onSubmit={guardarClave} className="border-t pt-5"><fieldset disabled={ocupado} className="space-y-3">
      <h4 className="font-bold">Cambiar contraseña</h4>
      <label className="block">Contraseña actual<input type="password" autoComplete="current-password" className={input} value={actual} onChange={e => setActual(e.target.value)} required /></label>
      <label className="block">Nueva contraseña (mínimo 12 caracteres)<input type="password" autoComplete="new-password" className={input} value={clave} onChange={e => setClave(e.target.value)} minLength={12} required /></label>
      <label className="block">Confirmar nueva contraseña<input type="password" autoComplete="new-password" className={input} value={confirmacion} onChange={e => setConfirmacion(e.target.value)} minLength={12} required /></label>
      <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Actualizar contraseña</button>
    </fieldset></form>
  </section>;
}
