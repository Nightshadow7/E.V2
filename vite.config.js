import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // --- MAGIA PWA: Esto convierte tu web en una App de celular ---
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'EcoSanGil CRM V2',
        short_name: 'EcoSanGil',
        description: 'Sistema Integral de Gestión y PQRS',
        theme_color: '#10b981', // Color Esmeralda de tu marca
        background_color: '#f8fafc',
        display: 'standalone', // Quita la barra del navegador
        icons: [
          {
            // Usaremos un ícono genérico por ahora. Luego lo cambias por el logo de tu empresa.
            src: 'https://cdn-icons-png.flaticon.com/512/7590/7590812.png', 
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})