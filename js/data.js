window.ecopontosData = [
  {
    id: 'ecoponto-sacramenta',
    name: 'Ecoponto de Belém — Sacramenta',
    bairro: 'Sacramenta',
    category: 'Ecoponto municipal',
    address: 'Avenida Pedro Álvares Cabral, em frente ao Casota, Sacramenta, Belém - PA',
    lat: -1.408806,
    lng: -48.466503,
    materials: [
      'Entulho de pequenas obras',
      'Madeira e móveis',
      'Eletrodomésticos e volumosos',
      'Pneus',
      'Eletrônicos',
      'Papel e papelão',
      'Plástico',
      'Vidro',
      'Metais e alumínio',
      'Caroço de açaí'
    ],
    hours: 'Segunda a sexta, 08h às 20h; sábado, 08h às 12h',
    phone: 'Não publicado pela Prefeitura',
    dailyLimit: 'Até 1 m³ por pessoa, por dia',
    verified: true,
    source: 'Agência Belém — Prefeitura de Belém',
    sourceUrl: 'https://agencia.belem.pa.gov.br/saiba-como-funciona-o-primeiro-ecoponto-de-belem/',
    coordinateSource: 'Localização do estabelecimento no Google Maps',
    coordinateSourceUrl: 'https://www.google.com/maps/place/ECOPONTO+DE+BEL%C3%89M/@-1.408806,-48.466503,17z/',
    lastUpdated: '2026-10-10',
    notes: 'A Prefeitura informa que lixo doméstico comum, restos de alimentos e resíduos hospitalares não são aceitos. Grandes volumes devem ser encaminhados a empresas especializadas. A unidade é descrita como projeto-piloto para futura expansão.'
  },
  ...[
    'Portal da Amazônia',
    'Praça Batista Campos',
    'Praça da República',
    'Praça Brasil',
    'Complexo Ver-o-Rio',
    'Boulevard da Gastronomia',
    'Praça do Conjunto Marex',
    'Avenida Doca de Souza Franco',
    'Praça do Operário',
    'Avenida João Paulo II',
    'Avenida Júlio César',
    'Complexo Arquitetônico de Nazaré (CAN)',
    'Orla de Icoaraci'
  ].map((place) => ({
    id: `lev-anunciado-${slugify(place)}`,
    name: `LEV anunciado — ${place}`,
    bairro: 'Não informado',
    category: 'LEV anunciado — situação atual pendente',
    address: `${place}, Belém - PA (local exato não confirmado)`,
    lat: null,
    lng: null,
    materials: [],
    hours: 'Não publicados para este local',
    phone: 'Não publicado',
    verified: false,
    status: 'Local listado pela Prefeitura para receber LEV em anúncio de 25/02/2025; presença e funcionamento atuais não confirmados.',
    source: 'Agência Belém — Prefeitura de Belém',
    sourceUrl: 'https://agencia.belem.pa.gov.br/belem-tera-22-novos-pontos-de-coleta-seletiva-veja-os-locais/',
    lastUpdated: '2026-10-10',
    notes: 'Registro de um local anunciado para receber um Local de Entrega Voluntária (LEV). Não é confirmação de instalação ou funcionamento atual. O endereço preciso, os materiais aceitos e os horários precisam ser verificados antes de uma visita.'
  }))
];

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

window.materialGuides = [
  {
    material: 'Papel e papelão',
    summary: 'Papel limpo, sem gordura, cola ou alimentos, deve ser separado e acondicionado de forma seca.',
    preparation: 'Amasse ou separe folhas sujas; papelão deve ser desmontado e guardado seco.'
  },
  {
    material: 'Plásticos',
    summary: 'Garrafas, potes e embalagens podem ser reciclados, mas devem estar limpos e secos.',
    preparation: 'Lave, seque e remova tampas quando a regra do ponto exigir.'
  },
  {
    material: 'Vidros',
    summary: 'Garrafas e frascos de vidro podem ser reciclados, mas alguns locais não aceitam louça quebrada.',
    preparation: 'Retire tampas, evite misturar com cerâmica e observe as regras do ponto.'
  },
  {
    material: 'Metais',
    summary: 'Latas, tampinhas e arames podem ser recuperados em pontos de metal.',
    preparation: 'Lave, seque e, se possível, comprima as latas para economizar espaço.'
  },
  {
    material: 'Resíduos eletrônicos',
    summary: 'Aparelhos, cabos e baterias exigem cuidado especial e não devem ir em lixo comum.',
    preparation: 'Guarde em sacos ou caixas separadas e leve em ponto específico de recebimento.'
  },
  {
    material: 'Pilhas e baterias',
    summary: 'Devem ser entregues em pontos específicos para evitar vazamentos e incêndios.',
    preparation: 'Não misture com outros materiais; mantenha-as secas e protegidas.'
  },
  {
    material: 'Óleo de cozinha usado',
    summary: 'O óleo não deve ser jogado na pia ou no lixo; ele pode ser reaproveitado e reciclado.',
    preparation: 'Deixe o óleo em recipiente fechado, sem mistura com água ou detergente.'
  },
  {
    material: 'Orgânicos',
    summary: 'Restos de alimentos e folhas podem virar composto, reduzindo desperdício.',
    preparation: 'Evite misturar demais com plásticos e metais; dê preferência à compostagem doméstica quando houver espaço.'
  },
  {
    material: 'Rejeitos',
    summary: 'Papel higiênico, resíduos hospitalares e restos de alimentos não devem ser misturados aos recicláveis.',
    preparation: 'Descarte conforme a coleta domiciliar; resíduos de saúde exigem fluxo próprio. Não leve esses materiais ao Ecoponto da Sacramenta.'
  }
];

window.quizQuestions = [
  {
    question: 'Qual material deve ser lavado e seco antes de entrar em um ponto de coleta?',
    options: ['Garrafas PET', 'Papel higiênico usado', 'Cabo elétrico usado', 'Fósforo usado'],
    correctIndex: 0,
    explanation: 'Garrafas e embalagens plásticas devem ser lavadas e secas para evitar contaminação do material reciclável.'
  },
  {
    question: 'O que é mais importante ao separar pilhas e baterias?',
    options: ['Jogar no lixo comum', 'Guardar em recipiente específico e seco', 'Misturar com vidro', 'Queimar em casa'],
    correctIndex: 1,
    explanation: 'Pilhas e baterias têm risco de vazamentos e incêndios, então devem ser entregues em pontos específicos.'
  },
  {
    question: 'Qual atitude é recomendada para o óleo de cozinha usado?',
    options: ['Jogar em ralo', 'Guardar em recipiente fechado e levar ao ponto de coleta', 'Misturar com detergente', 'Descarregar em terreno vazio'],
    correctIndex: 1,
    explanation: 'O óleo usado deve ser armazenado em recipiente fechado e encaminhado a um ponto de coleta ou programa municipal.'
  },
  {
    question: 'Papéis com gordura ou comida devem ser reciclados junto com papéis limpos?',
    options: ['Sim, sem problemas', 'Não, porque contaminam a reciclagem', 'Só em dias de chuva', 'Só se estiver seco'],
    correctIndex: 1,
    explanation: 'Papéis contaminados por gordura, comida ou umidade tendem a ser rejeitados no processo de reciclagem.'
  },
  {
    question: 'Qual é a melhor forma de lidar com resíduos eletrônicos?',
    options: ['Deixar no quintal', 'Entregar em ponto específico', 'Misturar com vidro', 'Queimar em fogão'],
    correctIndex: 1,
    explanation: 'Resíduos eletrônicos têm materiais valiosos e tóxicos que exigem tratamento adequado e coleta específica.'
  }
];

window.appMeta = {
  lastUpdated: '2026-10-10',
  sources: [
    {
      label: 'Agência Belém — Saiba como funciona o primeiro Ecoponto de Belém',
      url: 'https://agencia.belem.pa.gov.br/saiba-como-funciona-o-primeiro-ecoponto-de-belem/'
    },
    {
      label: 'Agência Belém — Ecoponto evita mais de 20 toneladas de lixo nas ruas de Belém',
      url: 'https://agencia.belem.pa.gov.br/ecoponto-evita-mais-de-20-toneladas-de-lixo-nas-ruas-de-belem/'
    },
    {
      label: 'Agência Belém — locais anunciados para instalação de 22 LEVs em 2025',
      url: 'https://agencia.belem.pa.gov.br/belem-tera-22-novos-pontos-de-coleta-seletiva-veja-os-locais/'
    },
    {
      label: 'Google Maps — localização cartográfica do Ecoponto',
      url: 'https://www.google.com/maps/place/ECOPONTO+DE+BEL%C3%89M/@-1.408806,-48.466503,17z/'
    }
  ]
};
