# Appleitor

Leitor de quadrinhos **Android-only**, feito com Expo + React Native + TypeScript.

## MVP implementado

- Importação de múltiplos arquivos `.cbz` pelo seletor de documentos Android.
- Identificação de páginas por assinatura do conteúdo ZIP e ordenação natural (`2.jpg` antes de `10.jpg`).
- Leitura em tela cheia com navegação anterior/próxima.
- Leitura de `ComicInfo.xml` quando presente para título, série e número.
- Biblioteca local persistida com `AsyncStorage`.
- Progresso de leitura salvo por arquivo.
- Tema escuro com destaque verde-lima e foco em leitura sem distrações.
- Arquivos mantidos no armazenamento local/cache do dispositivo.

## CBR

Arquivos `.cbr` são identificados e exibidos na biblioteca, mas ainda não são abertos. O próximo passo é adicionar um módulo nativo Android com `libarchive` (ou `junrar`) para listar entradas e extrair apenas a página atual e vizinhas, mantendo o cache pequeno.

## Rodar

```bash
npm install
npm run android
```

O projeto não inclui versão iOS. A validação atual é feita com `npx tsc --noEmit`; para testar o fluxo de importação é necessário um dispositivo Android ou um development build.
