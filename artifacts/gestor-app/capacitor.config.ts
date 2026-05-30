import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'br.com.hubworkz.saude.gestor',
  appName: 'HubWorkz Saúde Gestor',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      keystorePath: 'hubworkz-gestor.keystore',
      keystoreAlias: 'hubworkz-gestor',
    },
  },
}

export default config
