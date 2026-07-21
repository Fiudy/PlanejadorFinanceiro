import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/icon.svg"],
      devOptions: {
        // Ativa o service worker também em `vite dev`, para dar pra testar
        // instalação/offline sem precisar rodar um build de produção.
        enabled: true,
        type: "module",
      },
      manifest: {
        name: "Planejador Financeiro",
        short_name: "Planejador",
        description: "Controle financeiro pessoal completo — contas, cartões, metas e mais.",
        lang: "pt-BR",
        theme_color: "#050505",
        background_color: "#050505",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/painel",
        id: "/painel",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
        shortcuts: [
          {
            name: "Novo lançamento",
            short_name: "Lançamento",
            description: "Registrar uma nova receita ou despesa",
            url: "/transacoes?novo=transacao",
            icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
          {
            name: "Nova compra no cartão",
            short_name: "Compra no cartão",
            description: "Lançar uma compra parcelada no cartão",
            url: "/cartoes?novo=compra",
            icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) {
              return "vendor-forms";
            }
            if (id.includes("react-router") || id.includes("/react/") || id.includes("/react-dom/")) {
              return "vendor-react";
            }
          }
          return undefined;
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
