import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'br.com.hubworkz.saude.paciente',
  appName: 'HubWorkz Saúde',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    buildOptions: {
      keystorePath: 'hubworkz-paciente.keystore',
      keystoreAlias: 'hubworkz-paciente',
    },
  },
}

export default config
