import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['app-icon-1024.png', 'ube-logo.png', 'favicon.ico'],
      manifest: {
        name: 'U.be Training - Personal Fitness Coaching',
        short_name: 'U.be',
        description: 'Professional personal training app with customized workout programs, daily check-ins, and direct coach communication.',
        theme_color: '#212121',
        background_color: '#212121',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        categories: ['fitness', 'health', 'lifestyle'],
        icons: [
          {
            src: '/ube-app-icon.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/ube-app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/ube-app-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/ube-app-icon.png',
            sizes: '1024x1024',
            type: 'image/png',
            purpose: 'any'
          }
        ],
        shortcuts: [
          {
            name: 'Start Workout',
            short_name: 'Workout',
            description: 'Start je volgende workout',
            url: '/programs',
            icons: [{ src: '/app-icon-1024.png', sizes: '192x192' }]
          },
          {
            name: 'Dashboard',
            short_name: 'Dashboard',
            description: 'Bekijk je voortgang',
            url: '/dashboard',
            icons: [{ src: '/app-icon-1024.png', sizes: '192x192' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,jpg,jpeg,webp}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          // Cache Supabase API calls
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(programs|workouts|exercises|weeks).*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'workout-data-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache Supabase storage (images, videos)
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'media-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache other API calls with network first
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Cache Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          // Cache font files
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
