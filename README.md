# Repar.io 🔧📱

Aplicativo pessoal para técnicos de assistência técnica acompanharem seus **reparos agendados no dia a dia**, organizarem a bancada e controlarem o fluxo das suas **Ordens de Serviço (O.S.)** sem conflito de horários.

---

## ✨ Funcionalidades

- 🛡️ **Detecção e Prevenção Inteligente de Overlap (Conflitos de Bancada)**:
  - **Alerta em Tempo Real**: Ao cadastrar ou editar um reparo, o sistema verifica automaticamente se já existe outro serviço agendado no mesmo dia e com horários sobrepostos (considerando o horário de início e o tempo estimado).
  - **Ajuste Automático com 1 Clique**: Se houver sobreposição, o modal sugere o próximo horário livre (ex: *`⚡ Evitar sobreposição: Ajustar para às 14:45`*) e ajusta o relógio automaticamente.
  - **Identificação Visual**: Tanto na Agenda quanto no Calendário, serviços com sobreposição de bancada recebem destaque em tom âmbar com identificação da O.S. concorrente.
- 📅 **Visão de Calendário Interativa**:
  - Grade mensal completa com marcação de agendamentos por dia.
  - Células que se ajustam sem sobrepor cards visualmente.
  - Exibição visual do **tempo estimado de reparo** em cada dia (ex: `~45 min`, `~1h 30m`).
  - Painel lateral do dia selecionado com cálculo da **carga horária total prevista** (ex: *3 reparos • Tempo estimado total: 2h 45m*).
  - Botão rápido `+` para agendar diretamente em qualquer dia do mês.
- ⏱️ **Controle de Tempo Estimado de Reparo**:
  - Definição do tempo previsto de bancada para cada serviço (com atalhos rápidos: *15 min, 30 min, 45 min, 1h, 1h 30m, 2h, 3h* ou valor personalizado).
  - Exibição da duração e faixa de horário (ex: `14:00 às 14:45`) nos cartões e no calendário.
- 📋 **Agenda Diária com Foco em Horários**:
  - Visualização cronológica dos reparos ordenados por horário de início.
  - Navegação entre datas: *Hoje*, *Ontem*, *Amanhã*, seletor de calendário e opção de *Ver Todos*.
- 🔢 **Identificação e Controle de O.S.**:
  - Numeração sequencial automática (ex: `OS #0001`, `OS #0002`).
  - Aparelho/modelo e descrição detalhada do defeito relatado.
  - Observações e laudos técnicos internos.
- 🔄 **Controle de Status da Bancada**:
  - Alternância rápida com 1 clique:
    - 🔵 `Agendado`
    - 🟡 `Na Bancada` (em teste / manutenção)
    - 🟢 `Concluído` (pronto para retirada)
    - ⚪ `Entregue`
    - 🔴 `Cancelado`
- 💬 **Contato Rápido via WhatsApp**:
  - Link direto com o cliente com mensagem pronta sobre a O.S.
- 🔍 **Busca em Tempo Real**:
  - Pesquisa instantânea por número da O.S., nome do cliente, modelo do aparelho ou defeito.
- 📊 **Contadores no Topo**:
  - Total de reparos do período filtrado e contadores rápidos por status.

---

## 🛠️ Tecnologias

- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript
- **Estilo**: Tailwind CSS v4 (Tema Claro limpo e profissional em tons Índigo/Slate)
- **Banco de Dados**: SQLite local com Prisma ORM
- **Ícones**: Lucide React
- **Datas**: date-fns (pt-BR)

---

## 🚀 Como Executar

1. **Instalar dependências**:
   ```bash
   npm install
   ```

2. **Sincronizar banco de dados**:
   ```bash
   npx prisma db push
   ```

3. **Iniciar o app**:
   ```bash
   npm run dev
   ```

4. **Acessar**:
   Abra [http://localhost:3000](http://localhost:3000).
