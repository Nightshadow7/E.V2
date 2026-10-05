import assert from 'node:assert/strict';
import { createServer } from 'vite';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync, readdirSync } from 'node:fs';
import { parse } from '@babel/parser';
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' });
try {
  const { BuscadorClientePQRS } = await server.ssrLoadModule('/src/components/pqrs/BuscadorClientePQRS.jsx');
  const { AnexosDocumentos } = await server.ssrLoadModule('/src/components/pqrs/AnexosDocumentos.jsx');
  const { FormularioDetallePQRS } = await server.ssrLoadModule('/src/components/pqrs/FormularioDetallePQRS.jsx');
  const noop = () => {};
  for (const cliente of [null, { id_vinculo: 'test', estado_servicio: 'Inactivo', personas: { nombres_razon_social: 'Usuario de prueba' }, predios: {} }, { id_vinculo: 'incompleto' }]) {
    const html = renderToStaticMarkup(createElement(BuscadorClientePQRS, { clienteEncontrado: cliente, onClienteSeleccionado: noop, onLimpiarCliente: noop }));
    assert.ok(html.includes(cliente ? 'Cliente Seleccionado' : 'Consultar'));
    if (cliente?.estado_servicio) assert.ok(html.includes('Inactivo'));
  }
  for (const isUploading of [false, true]) {
    const html = renderToStaticMarkup(createElement(AnexosDocumentos, { archivoFisico: { name: 'prueba.pdf', size: 1024 }, setArchivoFisico: noop, isUploading, disabled: false }));
    assert.ok(html.includes(isUploading ? 'Subiendo archivo' : 'Listo para subir'));
  }
  for (const [tipo, campo] of [['Petición', 'Asunto Resumido'], ['Queja', 'Área Implicada'], ['Reclamo', 'Número de Factura'], ['Felicitación', 'Área o Empleado Reconocido'], ['Desvinculación', 'Motivo de Desvinculación']]) {
    const html = renderToStaticMarkup(createElement(FormularioDetallePQRS, { formData: { tipo_solicitud: tipo, asunto: '', descripcion: '', urgencia: 'media', datos_extra: {} }, setFormData: noop, isClienteSeleccionado: true }));
    assert.ok(html.includes(campo), tipo);
  }
  const inert = [];
  const visit = (node, file) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'JSXOpeningElement' && node.name.name === 'button') {
      const attrs = node.attributes;
      const has = name => attrs.some(a => a.name?.name === name);
      const submit = attrs.some(a => a.name?.name === 'type' && a.value?.value === 'submit');
      if (!has('onClick') && !has('disabled') && !submit) inert.push(`${file}:${node.loc.start.line}`);
    }
    for (const value of Object.values(node)) if (Array.isArray(value)) value.forEach(v => visit(v, file)); else if (value && typeof value === 'object') visit(value, file);
  };
  for (const file of readdirSync('src', { recursive: true }).filter(f => f.endsWith('.jsx'))) visit(parse(readFileSync(`src/${file}`, 'utf8'), { sourceType: 'module', plugins: ['jsx'] }), file);
  assert.deepEqual(inert, [], 'Botones sin acción');
  console.log('OK: cliente seleccionado y datos incompletos, anexos, cinco tipos PQRS y auditoría estática de botones.');
} finally { await server.close(); }
