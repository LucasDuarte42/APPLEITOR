# Appleitor

Leitor de quadrinhos **Android-only**, feito com Expo + React Native + TypeScript.

## O que está implementado

- Importação de múltiplos arquivos `.cbr` pelo seletor de documentos Android.
- CBR lido no módulo nativo Android com Junrar.
- Ordenação natural das páginas (`2.jpg` antes de `10.jpg`).
- Leitor em tela cheia com navegação anterior/próxima.
- - Biblioteca e progresso persistidos localmente com AsyncStorage.
- Extração somente da página atual para o cache, sem descompactar o quadrinho inteiro no armazenamento.
- Sem versão iOS.

## Testar localmente

### Pré-requisitos

1. Instale o **Node.js 20+**.
2. Instale o **Android Studio**.
3. No Android Studio, abra **SDK Manager** e instale:
   - Android SDK Platform 36;
   - Android SDK Build-Tools 36;
   - Android SDK Platform-Tools;
   - Android SDK Command-line Tools.
4. Crie um emulador em **Device Manager** ou conecte um celular Android com **Depuração USB** ativada.

### Linux/macOS

Configure o SDK no terminal, ajustando o caminho se necessário:

```bash
export ANDROID_HOME="$HOME/Android/Sdk"
export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"
```

No Linux, se o Android Studio estiver instalado em outro local, confirme o caminho do SDK em **Settings > Languages & Frameworks > Android SDK**.

### Windows PowerShell

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator"
```

### Instalar e executar

Na raiz do projeto:

```bash
git clone https://github.com/LucasDuarte42/APPLEITOR.git
cd APPLEITOR
npm install
npx expo run:android
```

O primeiro build pode demorar alguns minutos. Depois de instalado no aparelho/emulador, o Metro será iniciado. Use **Importar arquivos**, escolha um `.cbr` e toque no título para abrir.

Para iniciar somente o Metro depois que o app já estiver instalado:

```bash
npx expo start --dev-client
```

### Validações rápidas

```bash
npx tsc --noEmit
npx expo-modules-autolinking resolve --platform android
```

A segunda validação deve listar `appleitor-cbr` e `expo.modules.appleitorcbr.AppleitorCbrModule`.

## Observação sobre o Sandbox

O código foi validado com TypeScript e autolinking. O APK não foi compilado neste ambiente porque o Sandbox não possui Android SDK configurado (`ANDROID_HOME` ausente). No computador local com Android Studio e SDK instalados, `npx expo run:android` fará a compilação nativa do módulo Junrar.
