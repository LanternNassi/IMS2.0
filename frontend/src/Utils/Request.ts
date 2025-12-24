import axios , {AxiosInstance, InternalAxiosRequestConfig} from 'axios'

// Determine API base URL
const getDefaultBaseURL = () => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5184'
}

// Create axios instance with default base URL
const api : AxiosInstance = axios.create({
    baseURL : `${getDefaultBaseURL()}/api`
})

// In Electron, intercept requests to use dynamic server config
if (typeof window !== 'undefined' && (window as any).electron) {
  let serverConfig: { serverIP: string; backendPort: number } | null = null
  let configInitialized = false
  
  // Initialize server config
  const initServerConfig = async () => {
    if (configInitialized) return
    try {
      const config = await (window as any).electron.getServerConfig()
      if (config) {
        serverConfig = {
          serverIP: config.serverIP,
          backendPort: config.backendPort
        }
        // Update axios default base URL
        api.defaults.baseURL = `http://${config.serverIP}:${config.backendPort}/api`
        configInitialized = true
        console.log(`[API] Using server: ${config.serverIP}:${config.backendPort}`)
      }
    } catch (error) {
      // Fallback to default if config fetch fails
      console.warn('[API] Failed to get server config, using default:', error)
      configInitialized = true
    }
  }
  
  // Initialize immediately
  initServerConfig()
  
  // Request interceptor to ensure correct base URL
  api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
    // Ensure config is initialized before making requests
    if (!configInitialized) {
      await initServerConfig()
    }
    
    if (serverConfig && config.url) {
      // Ensure we're using the correct base URL
      const baseURL = `http://${serverConfig.serverIP}:${serverConfig.backendPort}/api`
      if (api.defaults.baseURL !== baseURL) {
        api.defaults.baseURL = baseURL
      }
    }
    return config
  })
}

export default api