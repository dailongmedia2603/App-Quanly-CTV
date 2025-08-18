import { defineConfig } from "vite";
import dyadComponentTagger from "@dyad-sh/react-vite-component-tagger";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    dyadComponentTagger(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logoapp.png'],
      manifest: {
        name: 'CTV Dailong',
        short_name: 'CTV Dailong',
        description: 'Hệ thống quản lý cộng tác viên sale của Dailong Media',
        theme_color: '#F97316',
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'logoapp.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logoapp.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logoapp.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));