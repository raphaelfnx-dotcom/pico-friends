export interface WorldReference {
  id: number;
  worldNumber: number;
  title: string;
  tagline: string;
  gimmickCentral: string;
  difficulty: 'Muito Fácil' | 'Fácil' | 'Fácil a Média' | 'Média' | 'Média-Alta' | 'Difícil' | 'Muito Difícil' | 'Extrema' | 'Variável';
  difficultyStars: number; // 1 to 5
  scale2Players: string;
  scale8Players: string;
  designNotes: string[];
  mechanicsKey: string;
  scalingRules: {
    basePushers: number;
    pushersPerPlayerMultiplier?: number;
    maxDistanceAllowed?: number; // for Distance world
    timeLimitSeconds?: number;   // for Time Limit world
    stopAndGoTolerance?: number; // for Stop & Go world
    formationHeightReq?: number; // for Formation world
  };
}

export const PICO_PARK_2_WORLDS: WorldReference[] = [
  {
    id: 1,
    worldNumber: 1,
    title: 'HELLO, PICO PARK 2',
    tagline: 'O Básico Cooperativo',
    gimmickCentral: 'Introdução ao básico de física de botões, portões coloridos e empurrar blocos pesados.',
    difficulty: 'Muito Fácil',
    difficultyStars: 1,
    scale2Players: 'Os blocos pesados exigem apenas 1 ou 2 gatinhos empurrando simultaneamente. Portões exigem que um jogador segure o botão enquanto o outro passa.',
    scale8Players: 'O peso dos blocos é multiplicado por 4. É necessária a força física de pelo menos 5 a 6 gatinhos empurrando juntos. Filas longas geram gargalos em plataformas pequenas.',
    designNotes: [
      'Janela de aprendizado suave para ensinar empurrão e peso.',
      'Portas de cores coordenadas associadas a botões no solo.',
      'Fossos com largura pequena permitindo travessia simples quando a caixa é posicionada.'
    ],
    mechanicsKey: 'heavy_box_push',
    scalingRules: {
      basePushers: 2,
      pushersPerPlayerMultiplier: 0.65,
    }
  },
  {
    id: 2,
    worldNumber: 2,
    title: 'DISTANCE',
    tagline: 'Cabo Elástico & Proximidade',
    gimmickCentral: 'Sensores de proximidade ou lasers ativados pela distância exata (ou cabos elásticos visíveis/invisíveis) entre os jogadores.',
    difficulty: 'Fácil a Média',
    difficultyStars: 2,
    scale2Players: 'Coordenação simples em linha reta ou saltos paralelos. Se um errar a distância, o outro corrige rápido.',
    scale8Players: 'Caos geométrico. Formar uma linha perfeita de 8 pessoas sem que o primeiro se distancie demais do último. Telas de rolagem lateral exigem que o grupo ande como uma "centopeia" rígida; um único erro de posicionamento ativa o perigo para todos.',
    designNotes: [
      'Conexão elástica visual brilhante ligando os gatinhos com cor pulsante.',
      'Se o elástico esticar além do limite seguro, a linha fica vermelha e apita.',
      'Exige saltos simultâneos em plataformas separadas mantendo a cadência de grupo.'
    ],
    mechanicsKey: 'elastic_distance',
    scalingRules: {
      basePushers: 2,
      maxDistanceAllowed: 280, // pixels
    }
  },
  {
    id: 3,
    worldNumber: 3,
    title: 'FORMATION',
    tagline: 'A Arte da Escada Humana',
    gimmickCentral: 'Criação de formas corporais e estruturas com os próprios gatinhos para superar barreiras de altura ou fossos.',
    difficulty: 'Média',
    difficultyStars: 3,
    scale2Players: 'Puzzles focados em alternar quem sobe na cabeça de quem. Empilhamento máximo de 2 de altura.',
    scale8Players: 'O jogo exige "totens" humanos gigantescos. Para alcançar chaves no teto, é necessário empilhar até 4 ou 5 gatinhos verticalmente, gerando instabilidade física extrema (efeito torre oscilante), enquanto os outros 3 estabilizam a base ou ativam botões laterais.',
    designNotes: [
      'Empilhamento (stacking) rígido onde quem está em cima herda o movimento de quem está embaixo.',
      'Chaves posicionadas em alturas modulares correspondentes ao número de jogadores.',
      'Botões no alto em paredes verticais inacessíveis por pulo individual.'
    ],
    mechanicsKey: 'human_totem',
    scalingRules: {
      basePushers: 2,
      formationHeightReq: 3,
    }
  },
  {
    id: 4,
    worldNumber: 4,
    title: 'DANGER PARK',
    tagline: 'Precisão Mortal & Rage Game',
    gimmickCentral: 'Desafio clássico de plataforma de precisão (Rage Game). Serras circulares móveis, lasers intermitentes e blocos que despencam ao toque.',
    difficulty: 'Difícil',
    difficultyStars: 4,
    scale2Players: 'Janelas de tempo generosas. É puramente um teste de habilidade individual de plataforma de cada um.',
    scale8Players: 'Efeito dominó. Com 8 pessoas na tela, o "espaço seguro" (hitbox de colisão) entre os corpos diminui drasticamente. Um jogador empurra o outro acidentalmente contra as serras, ou o primeiro da fila consome o tempo de queda de uma plataforma retrátil, matando quem vem atrás.',
    designNotes: [
      'Serras giratórias com trajeto contínuo em trilhos fixos.',
      'Plataformas quebradiças que desmoronam 0.7s após o primeiro pisão.',
      'Apertos milimétricos onde empurrões corporais acidentais são fatais.'
    ],
    mechanicsKey: 'precision_rage',
    scalingRules: {
      basePushers: 2,
    }
  },
  {
    id: 5,
    worldNumber: 5,
    title: 'TIME LIMIT',
    tagline: 'Corrida Contra o Relógio',
    gimmickCentral: 'O layout da fase é simples, mas há um cronômetro regressivo agressivo (ex: 15 a 30 segundos) na tela.',
    difficulty: 'Média-Alta',
    difficultyStars: 4,
    scale2Players: 'Resolução rápida em paralelo. Ambos correm e dividem tarefas mínimas. O tempo é justo, mas perdoa pequenos engasgos.',
    scale8Players: 'Gargalo logístico absoluto. 8 pessoas tentando passar por uma única porta estreita ou subir uma escada de corda simultaneamente perdem segundos vitais se espremendo. Exige divisão milimétrica de quem faz o que desde o segundo zero.',
    designNotes: [
      'Cronômetro regressivo gigante no topo com som de relógio acelerando nos últimos 5 segundos.',
      'Portas múltiplas e tarefas em paralelo para incentivar divisão de equipe.',
      'Se o tempo zerar, a fase reinicia instantaneamente com efeito dramático.'
    ],
    mechanicsKey: 'countdown_rush',
    scalingRules: {
      basePushers: 2,
      timeLimitSeconds: 25,
    }
  },
  {
    id: 6,
    worldNumber: 6,
    title: "SHOOT 'EM UP",
    tagline: 'Canhões Balísticos & Destruição',
    gimmickCentral: 'Combate e quebra-cabeças balísticos. Jogadores ganham armas que disparam projéteis coloridos ou caixas com física para destruir blocos ou rebater ameaças.',
    difficulty: 'Média',
    difficultyStars: 3,
    scale2Players: 'Menos inimigos/barreiras na tela. Foco em mirar bem e alternar os tiros entre as duas cores disponíveis.',
    scale8Players: 'Fogo cruzado caótico. O jogo joga hordas massivas ou barreiras que exigem uma parede de tiros contínuos. O perigo aumenta porque tiros errados ricocheteiam ou ativam gatilhos errados criados pelos próprios companheiros de equipe.',
    designNotes: [
      'Disparos balísticos com trajetória reta ou parabólica.',
      'Alvos que exigem acertos simultâneos de projéteis de cores diferentes.',
      'Blocos destrutíveis que limpam o caminho até o cofre.'
    ],
    mechanicsKey: 'ballistic_cannons',
    scalingRules: {
      basePushers: 2,
    }
  },
  {
    id: 7,
    worldNumber: 7,
    title: 'STOP AND GO',
    tagline: 'Batatinha Frita 1, 2, 3',
    gimmickCentral: 'Mecânica baseada no movimento do jogador. Inimigos/plataformas agem no estilo "Batatinha Frita 1, 2, 3" (red light, green light) ou se movem estritamente espelhados ao passo do jogador.',
    difficulty: 'Média-Alta',
    difficultyStars: 4,
    scale2Players: 'Muito controlável. É fácil coordenar verbalmente "1, 2, 3, parem".',
    scale8Players: 'O teste supremo de paciência. Basta que um dos 8 jogadores dê um leve toque analógico por reflexo ou atraso de input (lag) para mover o cenário e matar o grupo inteiro instantaneamente.',
    designNotes: [
      'Semáforo visual (Verde / Vermelho) no centro da tela com aviso sonoro rítmico.',
      'Quando vermelho: qualquer movimento horizontal ou pulo aciona a laser barreira.',
      'Sincronia auditiva para coordenar avanços em grupo.'
    ],
    mechanicsKey: 'red_light_green_light',
    scalingRules: {
      basePushers: 2,
      stopAndGoTolerance: 0.1,
    }
  },
  {
    id: 8,
    worldNumber: 8,
    title: 'MINI GAMES',
    tagline: 'Clássicos do Arcade Fatiados',
    gimmickCentral: 'Adaptação de jogos retrô/arcade (como Tetris, Pong ou Flappy Bird) onde o controle do jogo é fatiado entre os gatinhos.',
    difficulty: 'Variável',
    difficultyStars: 3,
    scale2Players: 'Controles divididos de forma simples (ex: Jogador 1 move esquerda/direita, Jogador 2 pula).',
    scale8Players: 'Divisão bizarra de funções. Em um jogo estilo Flappy Bird, cada gatinho pode controlar o pulo de um pássaro diferente em um mini-torneio interno, ou todos dividem o controle de uma única barra gigante de Pong que exige empurrões coordenados.',
    designNotes: [
      'Barra de pong gigante controlada pela massa combinada de jogadores.',
      'Desafio retrô com paleta nostálgica.',
      'Controles interdependentes fatiados.'
    ],
    mechanicsKey: 'shared_arcade',
    scalingRules: {
      basePushers: 2,
    }
  },
  {
    id: 9,
    worldNumber: 9,
    title: 'TOP DOWN VIEW',
    tagline: 'Labirinto Sokoban 2D',
    gimmickCentral: 'Mudança radical de perspectiva para 2D visto de cima (estilo Sokoban/Zelda). Remove o pulo e adiciona movimentação em 4 direções cardinais.',
    difficulty: 'Média',
    difficultyStars: 3,
    scale2Players: 'Labirintos abertos com espaço de manobra confortável para empurrar caixas sem trancar o parceiro.',
    scale8Players: 'Claustrofobia. Caminhos estreitos de 1 bloco de largura onde os jogadores bloqueiam fisicamente a passagem uns dos outros (body blocking). Se a ordem da fila na hora de entrar em um corredor estiver errada, o puzzle fica insolúvel, exigindo reinício voluntário.',
    designNotes: [
      'Vista aérea em grid ortogonal.',
      'Corredores de 1 bloco de largura exigindo ordem correta de entrada.',
      'Empurrar caixas para interruptores sem encurralar companheiros nos cantos.'
    ],
    mechanicsKey: 'top_down_sokoban',
    scalingRules: {
      basePushers: 2,
    }
  },
  {
    id: 10,
    worldNumber: 10,
    title: 'SKILLS OR DEVICES',
    tagline: 'Acessórios Assimétricos',
    gimmickCentral: 'Distribuição de acessórios especiais e assimétricos (Jetpacks, Armas de Ímã, Cordas de Rapel) para resolver desafios específicos.',
    difficulty: 'Difícil',
    difficultyStars: 4,
    scale2Players: 'Um jogador ganha a habilidade A e o outro a habilidade B. Dependência mútua direta e limpa.',
    scale8Players: 'Especialização de funções (Assimetria Complexa). Apenas 2 jogadores ganham jetpacks para voar e resgatar itens no alto; 2 ganham ímãs para segurar pontes para os outros passarem; e os 4 restantes são "cargas úteis" sem poderes que precisam ser carregados ou protegidos pelo mapa.',
    designNotes: [
      'Ícones visuais flutuando acima da cabeça de quem possui cada gadget.',
      'Ímãs para puxar plataformas pesadas.',
      'Jetpack com combustível limitado por segundo de empuxo.'
    ],
    mechanicsKey: 'asymmetric_gadgets',
    scalingRules: {
      basePushers: 2,
    }
  },
  {
    id: 11,
    worldNumber: 11,
    title: 'PARKFUL DODGER',
    tagline: 'Sobrevivência Bullet Hell',
    gimmickCentral: 'Bullet Hell / Sobrevivência. A tela fica estática e os jogadores precisam apenas desviar de ondas geométricas e crescentes de bolas de energia/espinhos por um tempo determinado até a chave aparecer.',
    difficulty: 'Muito Difícil',
    difficultyStars: 5,
    scale2Players: 'Amplo espaço físico na tela para se esquivar e dar rasteiras/pulos de última hora.',
    scale8Players: 'Uma colmeia humana lotada. Como a hitbox de 8 gatinhos ocupa quase 30% do chão utilizável da fase, desviar de projéteis velozes exige que o grupo se mova em uníssono perfeito (como um cardume de peixes). Se um entrar em pânico e correr para o lado errado, bate em outro jogador e causa uma morte em cadeia.',
    designNotes: [
      'Ondas geométricas de esferas com padrões telegrafados em feixes de luz.',
      'Duração de sobrevivência: 20 a 30 segundos.',
      'Chave Dourada desce no centro após o último feixe de projéteis.'
    ],
    mechanicsKey: 'bullet_hell_survival',
    scalingRules: {
      basePushers: 2,
      timeLimitSeconds: 20,
    }
  },
  {
    id: 12,
    worldNumber: 12,
    title: 'GO GO GO',
    tagline: 'Autoscroll & Fuga Alucinada',
    gimmickCentral: 'Rolagem de tela automática (Autoscroll) vertical ou horizontal. O cenário "engole" quem ficar para trás.',
    difficulty: 'Difícil',
    difficultyStars: 4,
    scale2Players: 'Corrida fluida. Erros de pulo rápidos podem ser recuperados se o jogador for ágil.',
    scale8Players: 'Ritmo de manada. Jogadores mais lentos atrasam fisicamente os mais rápidos ao baterem cabeças. Subir escadas ou pular plataformas pequenas sob pressão de esmagamento de tela gera colisões caóticas e empurrões para fora do mapa.',
    designNotes: [
      'Câmera em velocidade de avanço constante forçando a movimentação contínua.',
      'Obstáculos de salto que devem ser superados sem hesitação.',
      'A borda esquerda da tela esmaga quem ficar para trás.'
    ],
    mechanicsKey: 'autoscroll_chase',
    scalingRules: {
      basePushers: 2,
    }
  },
  {
    id: 13,
    worldNumber: 13,
    title: 'SPECIAL PARK',
    tagline: 'Gravidade Invertida & Portais',
    gimmickCentral: 'Subversão de regras físicas básicas. Portais estilo Portal, inversão da gravidade ao pular, ou ilusões visuais onde paredes sólidas são falsas.',
    difficulty: 'Média-Alta',
    difficultyStars: 4,
    scale2Players: 'Fácil de rastrear visualmente onde cada um está e qual o seu estado gravitacional/espacial atual.',
    scale8Players: 'Desorientação cognitiva. Metade do grupo pode estar andando no teto de cabeça para baixo enquanto a outra metade está no chão normal. Ativar botões inverte a gravidade do grupo oposto, exigindo comunicação perfeita para não arremessar 4 amigos em um teto cheio de espinhos.',
    designNotes: [
      'Alavancas de inversão gravitacional que afetam o teto e o chão.',
      'Portais pares (Azul e Laranja) de teletransporte instantâneo conservando momento.',
      'Sinais telegrafando teto seguro vs teto com perigo.'
    ],
    mechanicsKey: 'gravity_portal_inversion',
    scalingRules: {
      basePushers: 2,
    }
  },
  {
    id: 14,
    worldNumber: 14,
    title: 'HANDY GADGETS',
    tagline: 'Linha de Montagem Mecânica',
    gimmickCentral: 'Interação com engenhocas mecânicas complexas do próprio mapa, como manivelas gigantes que exigem corrida em esteira, luvas de boxe retráteis ativadas por botões e interruptores de tempo curto.',
    difficulty: 'Média-Alta',
    difficultyStars: 4,
    scale2Players: 'Uso sequencial dos gadgets. O jogador 1 gira a manivela para levantar o elevador do jogador 2, que então aciona a alavanca para o jogador 1 subir.',
    scale8Players: 'Trabalho de linha de montagem industrial. Uma manivela gigante exige que 4 jogadores corram nela ao mesmo tempo para gerar torque/velocidade suficiente, enquanto outros 2 controlam o tempo de disparo de luvas mecânicas para arremessar os últimos 2 jogadores através de um abismo com a chave.',
    designNotes: [
      'Esteiras de corrida mecânica gerando energia enquanto jogadores correm nelas.',
      'Pistões e molas que impulsionam companheiros através de abismos.',
      'Alavancas com temporizador de recarga exigindo rodízio de operadores.'
    ],
    mechanicsKey: 'mechanical_treadmill',
    scalingRules: {
      basePushers: 3,
    }
  },
  {
    id: 15,
    worldNumber: 15,
    title: 'LAST PARK',
    tagline: 'O Exame Final Sem Checkpoints',
    gimmickCentral: 'O "Exame Final". Uma única fase longa dividida em sub-salas, onde cada sala replica o gimmick mais complexo de um dos mundos anteriores sem checkpoints.',
    difficulty: 'Extrema',
    difficultyStars: 5,
    scale2Players: 'Exige que ambos dominem todas as mecânicas do jogo perfeitamente. Menos margem para carregar um jogador "carregado" nas costas.',
    scale8Players: 'Teste supremo de resiliência e foco do grupo. Uma maratona de 5 a 10 minutos onde qualquer erro individual de um dos 8 jogadores na última sala reseta o progresso inteiro do grupo de volta para a primeira sala.',
    designNotes: [
      'Câmara 1: Caixa pesada em fosso estreito.',
      'Câmara 2: Totem de empilhamento humano quádruplo para chave aérea.',
      'Câmara 3: Botões simultâneos sob pressão de tempo.',
      'Câmara 4: Portal final do Cofre Mestre de Ouro com troféu lendário.'
    ],
    mechanicsKey: 'gauntlet_final_boss',
    scalingRules: {
      basePushers: 2,
      pushersPerPlayerMultiplier: 0.75,
    }
  }
];

export function getWorldReference(worldId: number): WorldReference | undefined {
  return PICO_PARK_2_WORLDS.find((w) => w.id === worldId || w.worldNumber === worldId);
}
