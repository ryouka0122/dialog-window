// Plugins
import Vue from '@vitejs/plugin-vue'
import Vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

// Utilities
import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import {resolve} from "path";

const root = resolve(__dirname, 'src')
const dist = resolve(__dirname, 'docs')

// https://vitejs.dev/config/
export default defineConfig({
  base: "./",
  root: root,
  plugins: [
    Vue({
      template: { transformAssetUrls },
    }),
    // https://github.com/vuetifyjs/vuetify-loader/tree/master/packages/vite-plugin#readme
    Vuetify({
      autoImport: true,
      styles: {
        configFile: 'styles/settings.scss',
      },
    }),
  ],
  define: { 'process.env': {} },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
    extensions: [
      '.js',
      '.json',
      '.jsx',
      '.mjs',
      '.ts',
      '.tsx',
      '.vue',
    ],
  },
  server: {
    port: 3000,
  },
  build: {
    rollupOptions: {
      input: {
        parent: resolve(root, "index.html"),
        child1: resolve(root, "child1", "index.html"),
        child2: resolve(root, "child2", "index.html")
      },
      output: {
        dir: dist
      }
    }
  }
})
