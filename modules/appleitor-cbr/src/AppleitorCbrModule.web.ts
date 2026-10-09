import { registerWebModule, NativeModule } from 'expo';

class AppleitorCbrModule extends NativeModule<{}> {
  async listPagesAsync(): Promise<string[]> {
    throw new Error('CBR requer o build Android nativo do Appleitor.');
  }

  async extractPageAsync(): Promise<string> {
    throw new Error('CBR requer o build Android nativo do Appleitor.');
  }
}

export default registerWebModule(AppleitorCbrModule, 'AppleitorCbrModule');
