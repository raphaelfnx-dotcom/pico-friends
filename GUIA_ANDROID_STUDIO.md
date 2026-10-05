# 📱 Guia Passo a Passo: Gerar o `.APK` no Android Studio (Modo Paisagem + 2 a 8 Jogadores)

Este projeto já está configurado com o **Capacitor (`capacitor.config.json`)** para transformar o jogo (com os 15 Mundos e o controle de 2 a 8 jogadores) em um instalável nativo **`.APK`** no **Android Studio** em poucos cliques, sem precisar reescrever código.

---

## 🛠️ Pré-requisitos no seu Computador
1. **Node.js (LTS)** instalado: [https://nodejs.org](https://nodejs.org)
2. **Android Studio** instalado: [https://developer.android.com/studio](https://developer.android.com/studio)

---

## 🚀 Passo a Passo Completo (Do Zero até o `.APK`)

### Passo 1: Preparar a pasta do projeto no Terminal
Extraia o arquivo `pico-friends-github.zip` em uma pasta no seu computador, abra o terminal dentro dela e rode estes **2 comandos**:

```bash
# 1. Instala todas as dependências do jogo
npm install

# 2. Compila o jogo e cria automaticamente a pasta nativa 'android/' do Android Studio
npm run android:init
```

---

### Passo 2: Travar a Tela em Modo Paisagem (Horizontal) no Android Studio
Antes de gerar o `.APK`, vamos garantir que o Android abra o jogo sempre deitado (**Landscape**) e em **Tela Cheia**:

1. Abra o projeto no Android Studio rodando:
   ```bash
   npm run android:open
   ```
   *(Ou abra o Android Studio $\rightarrow$ clique em **Open** $\rightarrow$ selecione a subpasta **`android`** que foi criada dentro do seu projeto).*
2. Aguarde a barra inferior do Android Studio terminar o *Gradle Sync* (leva cerca de 1 a 2 minutos na primeira vez).
3. No menu lateral esquerdo do Android Studio, navegue até:
   `app` $\rightarrow$ `manifests` $\rightarrow$ **`AndroidManifest.xml`**
4. Procure a linha `<activity` (onde está escrito `.MainActivity`) e adicione a propriedade `android:screenOrientation="sensorLandscape"`:

```xml
<activity
    android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
    android:name=".MainActivity"
    android:label="@string/title_activity_main"
    android:theme="@style/AppTheme.NoActionBarLaunch"
    android:launchMode="singleTask"
    android:screenOrientation="sensorLandscape"
    android:exported="true">
```
*(Isso faz o celular girar automaticamente para a horizontal assim que o ícone do jogo é tocado!)*

---

### Passo 3: Exportar o Instalável `.APK` de Teste
Com o Android Studio aberto:

1. No menu superior do Android Studio, clique em:
   **`Build`** $\rightarrow$ **`Generate App Bundles or APKs`** $\rightarrow$ **`Generate APKs`**
2. O Android Studio vai compilar o instalador em alguns segundos e mostrará uma notificação no canto inferior direito: **"Generate APK(s): APK(s) generated successfully"**.
3. Clique em **`locate`** nessa notificação (ou vá direto na pasta do seu projeto em:
   `android/app/build/outputs/apk/debug/app-debug.apk`).
4. **Pronto!** O arquivo **`app-debug.apk`** é o seu instalável Android!
   * Basta enviar esse arquivo `app-debug.apk` pelo WhatsApp, Google Drive ou cabo USB para o seu celular e instalar!

---

## 🎮 Como Usar os 2 Jogadores (ou até 8) Dentro do `.APK` de Teste

O `.APK` já inicia direto na aba **"Viagem Offline"** com todas as ferramentas de teste para você jogar sozinho no celular controlando 2 (ou até 8) gatinhos na tela Paisagem:

1. **Escolher 2 Jogadores (ou mais):** Na tela inicial (ou na barra superior durante o jogo), deixe marcado **`2P`** (Verde + Laranja) — ou mude para `3P`..`8P` quando quiser testar fases com mais peso.
2. **Controle dos 2 Gatinhos na Direita da Tela:**
   * **Botão `P1/2` (Trocar Gato):** Alterna na hora entre controlar o **Jogador 1 (Verde)** e o **Jogador 2 (Laranja)**.
   * **Botão `Seguir` / `Todos` / `Solo`:**
     * **`Seguir`:** O Jogador 2 segue o Jogador 1 automaticamente, pula degraus e **empurra caixas pesadas junto com você** quando você encosta na caixa.
     * **`Solo`:** Você controla um gatinho por vez e o outro fica **parado onde você deixou** (perfeito para deixar o Jogador 1 pisando num botão enquanto você leva o Jogador 2 pela porta aberta!).
     * **`Todos`:** Os dois gatinhos se movem e pulam exatamente ao mesmo tempo.
   * **Botão `Empilhar`:** Coloca o Jogador 2 em cima da cabeça do Jogador 1 com 1 toque para alcançar chaves altas e testar escadas humanas!
   * **Botão `Chamar`:** Traz o Jogador 2 instantaneamente para o lado do Jogador 1.
