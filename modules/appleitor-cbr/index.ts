// Re-export the native module. On web, it will be resolved to AppleitorCbrModule.web.ts
// and on native platforms to AppleitorCbrModule.ts
export { default } from './src/AppleitorCbrModule';
export * from './src/AppleitorCbr.types';
