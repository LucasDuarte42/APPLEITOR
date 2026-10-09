import { NativeModule, requireNativeModule } from 'expo';

declare class AppleitorCbrModule extends NativeModule<{}> {
  listPagesAsync(uri: string): Promise<string[]>;
  extractPageAsync(uri: string, entryName: string): Promise<string>;
}

export default requireNativeModule<AppleitorCbrModule>('AppleitorCbr');
