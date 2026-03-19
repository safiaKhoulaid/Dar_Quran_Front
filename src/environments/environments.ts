/**
 * URL de l'API backend (DarQuran).
 * - Laravel : souvent http://localhost:8000/api
 * - Spring Boot : souvent http://localhost:8080/api
 */
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api',
  /** WebSocket du bridge No-OBS (streaming caméra → RTMP). */
  streamingBridgeWsUrl: 'http://localhost:9090'
};
