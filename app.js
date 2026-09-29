// ===== DADOS =====
const SK = 'pedidos-calmidrol-v4';
let pedidos = [];
let delId = null;
let selProdVal = 'calmidrol';
let selDurVal = '3m';
let selTipoVal = 'normal';
let selPagVal = 'ambos';

const KITS = {
  '3m_normal':   { produto: 'calmidrol', nome: 'Protocolo Inicial – 3 meses',   frascos: 3,  avista: 'R$ 329,00', parc: '12x de R$ 34,03' },
  '5m_normal':   { produto: 'calmidrol', nome: 'Protocolo Médio – 5 meses',     frascos: 5,  avista: 'R$ 379,00', parc: '12x de R$ 39,20' },
  '7m_normal':   { produto: 'calmidrol', nome: 'Protocolo Completo – 7 meses',  frascos: 7,  avista: 'R$ 449,00', parc: '12x de R$ 46,44' },
  'ultra_normal':{ produto: 'calmidrol', nome: 'Protocolo Ultra – 10 meses',    frascos: 10, avista: 'R$ 539,00', parc: '12x de R$ 55,75' },
  '3m_desc':     { produto: 'calmidrol', nome: 'Protocolo Inicial – 3 meses',   frascos: 3,  avista: 'R$ 309,02', parc: '12x de R$ 31,96' },
  '5m_desc':     { produto: 'calmidrol', nome: 'Protocolo Médio – 5 meses',     frascos: 5,  avista: 'R$ 359,00', parc: '12x de R$ 37,13' },
  '7m_desc':     { produto: 'calmidrol', nome: 'Protocolo Completo – 7 meses',  frascos: 7,  avista: 'R$ 429,00', parc: '12x de R$ 44,37' },
  'ultra_desc':  { produto: 'calmidrol', nome: 'Protocolo Ultra – 10 meses',    frascos: 10, avista: 'R$ 519,00', parc: '12x de R$ 53,68' },
  'f2m_normal':  { produto: 'famevity',  nome: 'Tratamento Famevity 2 meses',          avista: 'R$ 247,00', parc: '12x de R$ 25,55' },
  'f4m_normal':  { produto: 'famevity',  nome: 'Tratamento Famevity 4 meses',          avista: 'R$ 447,00', parc: '12x de R$ 46,23' },
  'f8m_normal':  { produto: 'famevity',  nome: 'Tratamento Completo Famevity 8 meses', avista: 'R$ 647,00', parc: '12x de R$ 66,91' },
};

// Durações disponíveis em cada produto. Famevity não tem preço com desconto.
const PRODUTOS = {
  calmidrol: { label: 'Kit Calmidrol', temDesconto: true,
    durs: [['3m', '3 meses'], ['5m', '5 meses'], ['7m', '7 meses'], ['ultra', 'ULTRA']] },
  famevity:  { label: 'Kit Famevity', temDesconto: false,
    durs: [['f2m', '2 meses'], ['f4m', '4 meses'], ['f8m', '8 meses']] },
};

// Tabelas oficiais de parcelas (valor à vista em centavos -> parcelas de 1x a 12x).
// Quando o valor à vista bate com uma dessas, usa a tabela em vez do cálculo.
const TABELAS_PARCELAS = {
  24700: [247.00, 130.00, 88.15, 67.23, 54.69, 46.34, 40.38, 35.92, 32.45, 29.68, 27.42, 25.55],
  44700: [447.00, 235.27, 159.52, 121.67, 98.97, 83.86, 73.08, 65.00, 58.73, 53.72, 49.63, 46.23],
  64700: [647.00, 340.53, 230.89, 176.10, 143.26, 121.38, 105.77, 94.08, 85.01, 77.76, 71.84, 66.91],
};

function produtoDoKit(kit) {
  return (KITS[kit] && KITS[kit].produto) || 'calmidrol';
}

function descricaoKit(k) {
  return k.frascos ? k.nome + ' (' + k.frascos + ' frascos)' : k.nome;
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  aplicarTema(localStorage.getItem('calmidrol-tema') === 'dark');

  document.getElementById('f-data').value = todayStr();
  preencherValoresKit();

  document.getElementById('f-nome').addEventListener('input', function () {
    const pos = this.selectionStart;
    this.value = capitalizeNome(this.value);
    this.setSelectionRange(pos, pos);
  });
  document.getElementById('f-cpf').addEventListener('input', function () {
    this.value = fmtCPF(this.value);
  });
  document.getElementById('f-cpf').addEventListener('change', function () {
    validarCPFCampo(this);
  });
  document.getElementById('f-tel').addEventListener('input', function () {
    this.value = fmtTel(this.value);
  });
  document.getElementById('f-valor-avista').addEventListener('input', function () {
    const selEl = document.getElementById('f-parcelamento');
    const atual = parseInt(selEl.value || '12', 10);
    popularParcelamento(selEl, parseValorBR(this.value), atual);
  });
  document.getElementById('f-uf').addEventListener('input', function () {
    this.value = this.value.toUpperCase();
  });
  document.getElementById('f-email').addEventListener('input', function () {
    const pos = this.selectionStart;
    this.value = this.value.toLowerCase();
    this.setSelectionRange(pos, pos);
  });
  document.getElementById('f-num').addEventListener('input', atualizarConfirmacaoEndereco);
  document.getElementById('f-rua').addEventListener('input', function () { formatarPalavras(this); });
  document.getElementById('f-comp').addEventListener('input', function () { formatarPalavras(this); });
  document.getElementById('f-bairro').addEventListener('input', function () { formatarPalavras(this); });
  document.getElementById('f-cidade').addEventListener('input', function () { formatarPalavras(this); });
  document.getElementById('f-comp').addEventListener('input', atualizarConfirmacaoEndereco);
  document.getElementById('f-rua').addEventListener('input', atualizarConfirmacaoEndereco);
  document.getElementById('f-bairro').addEventListener('input', atualizarConfirmacaoEndereco);
  document.getElementById('f-cidade').addEventListener('input', atualizarConfirmacaoEndereco);
  document.getElementById('f-uf').addEventListener('input', atualizarConfirmacaoEndereco);
  document.getElementById('f-cep').addEventListener('input', atualizarConfirmacaoEndereco);
});

function atualizarConfirmacaoEndereco() {
  const box = document.getElementById('addr-confirm');
  if (!box || box.style.display === 'none') return;

  const rua    = document.getElementById('f-rua').value;
  const num    = document.getElementById('f-num').value;
  const comp   = document.getElementById('f-comp').value;
  const bairro = document.getElementById('f-bairro').value;
  const cidade = document.getElementById('f-cidade').value;
  const uf     = document.getElementById('f-uf').value;
  const cep    = document.getElementById('f-cep').value;

  let linha1 = rua + (num ? ', ' + num : '');
  if (comp) linha1 += ' - ' + comp;

  const linha2 = [bairro, cidade && uf ? cidade + ' - ' + uf : cidade].filter(Boolean).join(' • ');
  const linha3 = cep ? 'CEP ' + cep : '';

  document.getElementById('addr-confirm-line1').textContent = linha1;
  document.getElementById('addr-confirm-line2').textContent = linha2;
  document.getElementById('addr-confirm-line3').textContent = linha3;
}

// ===== STORAGE =====
function loadData() {
  try { pedidos = JSON.parse(localStorage.getItem(SK)) || []; } catch (e) { pedidos = []; }
  pedidos = pedidos.map(p => ({ ...p, termo: p.termo || 'pendente' }));
  badge();
  stats();
}
function saveData() {
  localStorage.setItem(SK, JSON.stringify(pedidos));
}

// ===== TEMA (claro/escuro) =====
function aplicarTema(escuro) {
  document.body.classList.toggle('dark', escuro);
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.textContent = escuro ? '☀️' : '🌙';
  localStorage.setItem('calmidrol-tema', escuro ? 'dark' : 'light');
}

function toggleTema() {
  aplicarTema(!document.body.classList.contains('dark'));
}

// ===== TABS =====
function switchTab(t) {
  const idxMap = { novo: 0, lista: 1, agendados: 2, arquivados: 3 };
  document.querySelectorAll('.tab').forEach((el, i) =>
    el.classList.toggle('active', i === idxMap[t])
  );
  document.querySelectorAll('.section').forEach(el => el.classList.remove('active'));
  document.getElementById('sec-' + t).classList.add('active');
  document.getElementById('main-container').classList.toggle('full-width', t === 'lista' || t === 'agendados' || t === 'arquivados');
  if (t === 'lista') render();
  if (t === 'agendados') renderAgendados();
  if (t === 'arquivados') renderArquivados();
}

// ===== KIT & PAGAMENTO =====
function kitAtualKey() {
  return selDurVal + '_' + selTipoVal;
}

// Seleciona o primeiro kit do produto (usado ao limpar o formulário)
function selProduto(prod) {
  selDur(document.querySelector('#card-' + prod + ' .kit-dur-btn'), PRODUTOS[prod].durs[0][0]);
}

// Cada produto tem seu card. Ao clicar num botão de duração, aquele card vira o
// ativo e recebe o bloco de valor/parcelamento/pagamento (#kit-detalhes).
function selDur(el, val) {
  const prod = produtoDoKit(val + '_normal');
  if (prod !== selProdVal) {
    selProdVal = prod;
    selTipoVal = 'normal';
    document.querySelectorAll('.kit-tipo-btn').forEach((b, i) => b.classList.toggle('sel', i === 0));
  }
  document.querySelectorAll('.kit-card .kit-dur-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  document.querySelectorAll('.kit-card').forEach(c => c.classList.toggle('kit-card-ativo', c.id === 'card-' + prod));
  document.getElementById('card-' + prod).appendChild(document.getElementById('kit-detalhes'));
  selDurVal = val;
  preencherValoresKit();
}

function selTipo(el, val) {
  document.querySelectorAll('.kit-tipo-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  selTipoVal = val;
  preencherValoresKit();
}

// Preenche automaticamente os campos de valor com o preço padrão do kit
// selecionado. O usuário pode digitar por cima para alterar manualmente.
function preencherValoresKit() {
  const k = KITS[kitAtualKey()];
  if (!k) return;
  const avistaNum = parseValorBR(valorNumerico(k.avista));
  document.getElementById('f-valor-avista').value = fmtMoeda(avistaNum);
  popularParcelamento(document.getElementById('f-parcelamento'), avistaNum, 12);
  document.getElementById('kit-info-line').textContent = '📦 ' + (k.frascos ? k.frascos + ' frascos — ' : '') + k.nome;
}

// Extrai só o número (ex: "R$ 329,00" -> "329,00"; "12x de R$ 34,03" -> "34,03")
function valorNumerico(v) {
  const m = (v || '').match(/[\d.,]+/);
  return m ? m[0] : '';
}

// Taxa mensal usada no parcelamento (equivalente à tabela de parcelas do site)
const TAXA_PARCELA = 0.0349;

function calcParcelas(pv) {
  const tabela = TABELAS_PARCELAS[Math.round(pv * 100)];
  if (tabela) return tabela.map((valor, i) => ({ n: i + 1, valor }));
  const arr = [];
  for (let n = 1; n <= 12; n++) {
    let valor;
    if (n === 1) valor = pv;
    else {
      const fator = TAXA_PARCELA / (1 - Math.pow(1 + TAXA_PARCELA, -n));
      valor = pv * fator;
    }
    arr.push({ n, valor: Math.round(valor * 100) / 100 });
  }
  return arr;
}

// Recria as opções de um select de parcelamento a partir do valor à vista.
// alvoN é a parcela que deve ficar selecionada (usa 12 se não for possível).
function popularParcelamento(selEl, pv, alvoN) {
  const parcelas = calcParcelas(pv);
  selEl.innerHTML = parcelas.map(p =>
    `<option value="${p.n}">${p.n}x de R$ ${fmtMoeda(p.valor)}${p.n === 1 ? ' (à vista)' : ''}</option>`
  ).join('');
  selEl.value = parcelas.some(p => p.n === alvoN) ? alvoN : 12;
}

function fmtMoeda(v) {
  return v.toFixed(2).replace('.', ',');
}

function parseValorBR(v) {
  const m = String(v || '').match(/[\d.,]+/);
  if (!m) return 0;
  return parseFloat(m[0].replace(/\./g, '').replace(',', '.')) || 0;
}

function selPag(el, val) {
  document.querySelectorAll('.pag-btn').forEach(b => b.classList.remove('sel'));
  el.classList.add('sel');
  selPagVal = val;
}

// ===== CEP =====
let cepTimer = null;

function onCEPInput(el) {
  el.value = fmtCEP(el.value);
  const digits = el.value.replace(/\D/g, '');
  if (digits.length === 8) {
    clearTimeout(cepTimer);
    cepTimer = setTimeout(buscarCEP, 600);
  }
}

async function buscarCEP() {
  const cepVal = document.getElementById('f-cep').value.replace(/\D/g, '');
  if (cepVal.length !== 8) {
    showToast('Digite um CEP válido com 8 dígitos', 'error');
    return;
  }
  const btn = document.getElementById('btn-cep');
  btn.disabled = true;
  btn.textContent = 'Buscando...';

  let dados = null;

  try {
    const r = await fetch('https://viacep.com.br/ws/' + cepVal + '/json/');
    const d = await r.json();
    if (!d.erro) {
      dados = { logradouro: d.logradouro, bairro: d.bairro, localidade: d.localidade, uf: d.uf };
    }
  } catch (e) { /* tenta o backup abaixo */ }

  if (!dados) {
    try {
      const r2 = await fetch('https://brasilapi.com.br/api/cep/v1/' + cepVal);
      if (r2.ok) {
        const d2 = await r2.json();
        dados = { logradouro: d2.street, bairro: d2.neighborhood, localidade: d2.city, uf: d2.state };
      }
    } catch (e2) { /* segue sem dados */ }
  }

  if (dados && (dados.logradouro || dados.localidade)) {
    document.getElementById('f-rua').value = dados.logradouro || '';
    document.getElementById('f-bairro').value = dados.bairro || '';
    document.getElementById('f-cidade').value = dados.localidade || '';
    document.getElementById('f-uf').value = (dados.uf || '').toUpperCase();
    document.getElementById('f-num').focus();
    mostrarConfirmacaoEndereco(dados);
    showToast('✅ Endereço preenchido automaticamente!');
  } else {
    esconderConfirmacaoEndereco();
    showToast('CEP não encontrado ou serviço indisponível no momento.', 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Buscar';
}

function mostrarConfirmacaoEndereco(d) {
  const box = document.getElementById('addr-confirm');
  box.style.display = 'block';
  atualizarConfirmacaoEndereco();
}

function esconderConfirmacaoEndereco() {
  const box = document.getElementById('addr-confirm');
  if (box) box.style.display = 'none';
}

// ===== SALVAR =====
function salvar() {
  const nome = document.getElementById('f-nome').value.trim();
  if (!nome) { showToast('Informe o nome do paciente', 'error'); return; }

  const kit = kitAtualKey();
  const valorAvista = parseValorBR(document.getElementById('f-valor-avista').value);
  const parcN = parseInt(document.getElementById('f-parcelamento').value || '12', 10);
  const parcelaEscolhida = calcParcelas(valorAvista).find(p => p.n === parcN) || { n: 12, valor: valorAvista };
  const dataEscolhida = document.getElementById('f-data').value;

  const p = {
    id: Date.now(),
    data:    dataEscolhida,
    dataEraFutura: dataEscolhida > todayStr(),
    nome,
    cpf:     document.getElementById('f-cpf').value,
    tel:     document.getElementById('f-tel').value,
    email:   document.getElementById('f-email').value,
    cep:     document.getElementById('f-cep').value,
    rua:     document.getElementById('f-rua').value,
    num:     document.getElementById('f-num').value,
    comp:    document.getElementById('f-comp').value,
    bairro:  document.getElementById('f-bairro').value,
    cidade:  document.getElementById('f-cidade').value,
    uf:      document.getElementById('f-uf').value.toUpperCase(),
    kit,
    precoAvista: 'R$ ' + fmtMoeda(valorAvista),
    precoParc:   parcelaEscolhida.n + 'x de R$ ' + fmtMoeda(parcelaEscolhida.valor),
    pagamento: selPagVal,
    info:    document.getElementById('f-info').value,
    status:  document.getElementById('f-status').value,
    termo:   'pendente',
  };

  pedidos.unshift(p);
  saveData();
  badge();
  stats();
  render();
  renderAgendados();
  renderArquivados();
  clearForm();
  showToast('✅ Pedido salvo com sucesso!');
}

function clearForm() {
  ['f-nome','f-cpf','f-tel','f-email','f-cep','f-rua','f-num','f-comp','f-bairro','f-cidade','f-uf','f-info']
    .forEach(id => document.getElementById(id).value = '');
  document.getElementById('f-data').value = todayStr();
  document.getElementById('f-status').value = 'agendar';
  selProduto('calmidrol');
  document.querySelectorAll('.pag-btn').forEach((b, i) => b.classList.toggle('sel', i === 0));
  selPagVal = 'ambos';
  esconderConfirmacaoEndereco();
}

// ===== RENDER LISTA =====
function render() {
  const fn = (document.getElementById('fil-nome').value || '').toLowerCase();
  const fk = document.getElementById('fil-kit').value;
  const ft = document.getElementById('fil-termo').value;

  const list = pedidos.filter(p => {
    if (p.status === 'agendado') return false; // esses vivem na aba Agendados
    if (p.arquivado) return false; // esses vivem na aba Arquivados
    const mn = !fn || p.nome.toLowerCase().includes(fn) || (p.cpf || '').includes(fn);
    const mk = !fk || p.kit === fk;
    const mt = !ft || (p.termo || 'pendente') === ft;
    return mn && mk && mt;
  });

  const tbody = document.getElementById('tbody');
  const empty = document.getElementById('empty-msg');

  if (!list.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = list.map(p => pedidoRowHtml(p, true)).join('');
}

function renderAgendados() {
  const fn = (document.getElementById('fil-nome-ag').value || '').toLowerCase();
  const fk = document.getElementById('fil-kit-ag').value;
  const ft = document.getElementById('fil-termo-ag').value;

  const list = pedidos.filter(p => {
    if (p.status !== 'agendado') return false; // só os já agendados
    if (p.arquivado) return false; // esses vivem na aba Arquivados
    const mn = !fn || p.nome.toLowerCase().includes(fn) || (p.cpf || '').includes(fn);
    const mk = !fk || p.kit === fk;
    const mt = !ft || (p.termo || 'pendente') === ft;
    return mn && mk && mt;
  });

  const tbody = document.getElementById('tbody-ag');
  const empty = document.getElementById('empty-msg-ag');

  if (!list.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = list.map(p => pedidoRowHtml(p, true)).join('');
}

function renderArquivados() {
  const fn = (document.getElementById('fil-nome-arq').value || '').toLowerCase();
  const fk = document.getElementById('fil-kit-arq').value;
  const ft = document.getElementById('fil-termo-arq').value;

  const list = pedidos.filter(p => {
    if (!p.arquivado) return false;
    const mn = !fn || p.nome.toLowerCase().includes(fn) || (p.cpf || '').includes(fn);
    const mk = !fk || p.kit === fk;
    const mt = !ft || (p.termo || 'pendente') === ft;
    return mn && mk && mt;
  });

  const tbody = document.getElementById('tbody-arq');
  const empty = document.getElementById('empty-msg-arq');

  if (!list.length) {
    tbody.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';
  tbody.innerHTML = list.map(p => pedidoRowHtml(p, false)).join('');
}

function pedidoRowHtml(p, comCheckbox) {
  const termo = p.termo || 'pendente';
  const pillClass = termo === 'confirmado' ? 'pill-conf' : 'pill-pend';
  const pillLabel = termo === 'confirmado' ? '✅ Confirmado' : '⏳ Pendente';

  const dataClass = dataCssClass(p.data, p.dataEraFutura);
  const statusClass = statusCssClass(p);

  return `<tr>
${comCheckbox ? `<td><input type="checkbox" class="row-check" value="${p.id}"></td>` : ''}
<td><input class="td-edit ${dataClass}" type="date" value="${esc(p.data)}" onchange="updData(${p.id},this)"></td>
<td><input class="td-edit" value="${esc(p.nome)}" onchange="updNome(${p.id},this)"></td>
<td><input class="td-edit" value="${esc(p.tel)}" onchange="updTel(${p.id},this)"></td>
<td>
  <select class="kit-sel-td" onchange="updKitRow(${p.id},this)">
    <optgroup label="Normal">
      <option value="3m_normal"    ${p.kit==='3m_normal'?'selected':''}>3 meses</option>
      <option value="5m_normal"    ${p.kit==='5m_normal'?'selected':''}>5 meses</option>
      <option value="7m_normal"    ${p.kit==='7m_normal'?'selected':''}>7 meses</option>
      <option value="ultra_normal" ${p.kit==='ultra_normal'?'selected':''}>Ultra (10 meses)</option>
    </optgroup>
    <optgroup label="Desconto 🏷">
      <option value="3m_desc"    ${p.kit==='3m_desc'?'selected':''}>3 meses – Desconto</option>
      <option value="5m_desc"    ${p.kit==='5m_desc'?'selected':''}>5 meses – Desconto</option>
      <option value="7m_desc"    ${p.kit==='7m_desc'?'selected':''}>7 meses – Desconto</option>
      <option value="ultra_desc" ${p.kit==='ultra_desc'?'selected':''}>Ultra (10 meses) – Desconto</option>
    </optgroup>
    <optgroup label="Famevity">
      <option value="f2m_normal" ${p.kit==='f2m_normal'?'selected':''}>Famevity 2 meses</option>
      <option value="f4m_normal" ${p.kit==='f4m_normal'?'selected':''}>Famevity 4 meses</option>
      <option value="f8m_normal" ${p.kit==='f8m_normal'?'selected':''}>Famevity 8 meses</option>
    </optgroup>
  </select>
</td>
<td>
  <select class="td-sel ${statusClass}" onchange="updStatus(${p.id},this)">
    <option value="agendar"  ${p.status==='agendar'?'selected':''}>Agendar</option>
    <option value="agendado" ${p.status==='agendado'?'selected':''}>Agendado</option>
  </select>
</td>
<td>
  <button class="pill ${pillClass}" onclick="toggleTermo(${p.id})">${pillLabel}</button>
  <button class="term-btn" onclick="copyTermo(${p.id})">📋 Termo</button>
</td>
<td>
  <textarea class="info-ta" onchange="upd(${p.id},'info',this.value)">${esc(p.info || '')}</textarea>
</td>
<td class="td-actions">
  <div class="tbl-actions">
    <button class="btn-view" onclick="verPedido(${p.id})" title="Ver dados completos">👁</button>
    <button class="btn-del" onclick="askDel(${p.id})" title="Excluir pedido">🗑</button>
  </div>
</td>
</tr>`;
}

// ===== SELEÇÃO E ARQUIVAMENTO =====
function toggleSelecionarTodos(el, origem) {
  const tbodyId = origem === 'lista' ? 'tbody' : 'tbody-ag';
  document.querySelectorAll('#' + tbodyId + ' .row-check').forEach(c => { c.checked = el.checked; });
}

function arquivarSelecionados(origem) {
  const tbodyId = origem === 'lista' ? 'tbody' : 'tbody-ag';
  const marcados = document.querySelectorAll('#' + tbodyId + ' .row-check:checked');
  if (!marcados.length) {
    showToast('Selecione ao menos um pedido pra arquivar.', 'error');
    return;
  }
  const ids = Array.from(marcados).map(c => Number(c.value));
  ids.forEach(id => {
    const p = pedidos.find(x => x.id === id);
    if (p) p.arquivado = true;
  });
  saveData();
  badge();
  stats();
  render();
  renderAgendados();
  renderArquivados();
  showToast(`📦 ${ids.length} pedido(s) arquivado(s).`);
}

// Volta os pedidos marcados na aba Agendados para a aba Pedidos (status "Agendar")
function desagendarSelecionados() {
  const marcados = document.querySelectorAll('#tbody-ag .row-check:checked');
  if (!marcados.length) {
    showToast('Selecione ao menos um pedido pra tirar dos agendados.', 'error');
    return;
  }
  const ids = Array.from(marcados).map(c => Number(c.value));
  ids.forEach(id => {
    const p = pedidos.find(x => x.id === id);
    if (p) p.status = 'agendar';
  });
  saveData();
  badge();
  stats();
  render();
  renderAgendados();
  showToast(`↩️ ${ids.length} pedido(s) voltaram para Pedidos.`);
}

// ===== DATA / STATUS HELPERS =====
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dataCssClass(dataVal, eraFutura) {
  if (!dataVal) return '';
  const hoje = todayStr();
  if (dataVal > hoje) return 'data-futura';
  if (dataVal < hoje) return 'data-passada';
  // dataVal === hoje: verde se foi agendado direto pra hoje, amarelo se estava no futuro e o dia chegou
  return eraFutura ? 'data-chegou' : 'data-passada';
}

function statusCssClass(p) {
  return p.status === 'agendado' ? 'status-verde' : 'status-cinza';
}

function updData(id, input) {
  const hoje = todayStr();
  const p = pedidos.find(x => x.id === id);
  if (p) p.dataEraFutura = input.value > hoje;
  input.className = 'td-edit ' + dataCssClass(input.value, p ? p.dataEraFutura : false);
  upd(id, 'data', input.value);
  const sel = input.closest('tr').querySelector('.td-sel');
  if (sel) {
    sel.className = 'td-sel ' + statusCssClass(p);
  }
}

function updEmail(id, input) {
  const pos = input.selectionStart;
  input.value = input.value.toLowerCase();
  input.setSelectionRange(pos, pos);
  upd(id, 'email', input.value);
}

function updNome(id, input) {
  input.value = capitalizeNome(input.value);
  upd(id, 'nome', input.value);
}

function updCPF(id, input) {
  input.value = fmtCPF(input.value);
  upd(id, 'cpf', input.value);
}

function updTel(id, input) {
  input.value = fmtTel(input.value);
  upd(id, 'tel', input.value);
}

async function updCEPRow(id, input) {
  const cepVal = input.value.replace(/\D/g, '');
  input.value = fmtCEP(input.value);
  upd(id, 'cep', input.value);
  if (cepVal.length !== 8) return;

  let dados = null;

  try {
    const r = await fetch('https://viacep.com.br/ws/' + cepVal + '/json/');
    const d = await r.json();
    if (!d.erro) {
      dados = { logradouro: d.logradouro, bairro: d.bairro, localidade: d.localidade, uf: d.uf };
    }
  } catch (e) { /* tenta backup */ }

  if (!dados) {
    try {
      const r2 = await fetch('https://brasilapi.com.br/api/cep/v1/' + cepVal);
      if (r2.ok) {
        const d2 = await r2.json();
        dados = { logradouro: d2.street, bairro: d2.neighborhood, localidade: d2.city, uf: d2.state };
      }
    } catch (e2) { /* sem dados */ }
  }

  if (dados && (dados.logradouro || dados.localidade)) {
    const row = input.closest('.addr-edit-grid');
    const ruaInput = row.querySelector('[data-field="rua"]');
    const bairroInput = row.querySelector('[data-field="bairro"]');
    const cidadeInput = row.querySelector('[data-field="cidade"]');
    const ufInput = row.querySelector('[data-field="uf"]');
    if (ruaInput) ruaInput.value = dados.logradouro || '';
    if (bairroInput) bairroInput.value = dados.bairro || '';
    if (cidadeInput) cidadeInput.value = dados.localidade || '';
    if (ufInput) ufInput.value = (dados.uf || '').toUpperCase();
    upd(id, 'rua', dados.logradouro || '');
    upd(id, 'bairro', dados.bairro || '');
    upd(id, 'cidade', dados.localidade || '');
    upd(id, 'uf', (dados.uf || '').toUpperCase());
    const display = document.getElementById('addr-display-' + id);
    if (display) {
      const p = pedidos.find(x => x.id === id);
      display.querySelector('.addr-line1').textContent = (p.rua || '—') + (p.num ? ', ' + p.num : '') + (p.comp ? ' - ' + p.comp : '');
      display.querySelector('.addr-line2').textContent = [p.bairro, p.cidade && p.uf ? p.cidade + ' - ' + p.uf : p.cidade].filter(Boolean).join(' • ');
      display.querySelector('.addr-line3').textContent = p.cep ? 'CEP ' + p.cep : '';
    }
    showToast('✅ Endereço atualizado automaticamente!');
  } else {
    showToast('CEP não encontrado ou serviço indisponível.', 'error');
  }
}

// ===== ATUALIZAR CAMPO =====
function upd(id, field, val) {
  const p = pedidos.find(x => x.id === id);
  if (p) { p[field] = val; saveData(); stats(); }
}

function toggleAddrEdit(id) {
  const display = document.getElementById('addr-display-' + id);
  const edit = document.getElementById('addr-edit-' + id);
  if (!display || !edit) return;
  const isEditing = edit.style.display !== 'none';
  edit.style.display = isEditing ? 'none' : 'grid';
  display.style.display = isEditing ? 'block' : 'none';
}

function updKitRow(id, sel) {
  const val = sel.value;
  const k = KITS[val] || {};
  const p = pedidos.find(x => x.id === id);
  if (p) {
    p.kit = val;
    p.precoAvista = k.avista;
    p.precoParc = k.parc;
    saveData();
    stats();
  }
}

function updStatus(id, sel) {
  const val = sel.value;
  upd(id, 'status', val);
  badge();
  render();
  renderAgendados();
  renderArquivados();
}

// ===== TOGGLE TERMO =====
function toggleTermo(id) {
  const p = pedidos.find(x => x.id === id);
  if (!p) return;
  p.termo = p.termo === 'confirmado' ? 'pendente' : 'confirmado';
  saveData();
  stats();
  render();
  renderAgendados();
  renderArquivados();
  showToast(p.termo === 'confirmado' ? '✅ Termo confirmado!' : 'Termo marcado como pendente.');
}

// ===== GERAR TERMO =====
function gerarTermo(p) {
  const k = KITS[p.kit] || { nome: '—', frascos: '—', avista: '—', parc: '—' };
  const avista = p.precoAvista || k.avista;
  const parc   = p.precoParc   || k.parc;

  let precoLinha = '';
  if (p.pagamento === 'avista')         precoLinha = avista + ' à vista';
  else if (p.pagamento === 'parcelado') precoLinha = 'ou ' + parc;
  else                                  precoLinha = avista + ' à vista ou ' + parc;

  const rua  = [p.rua, p.num].filter(Boolean).join(', ');
  const comp = p.comp ? '\n▸ COMPLEMENTO – ' + p.comp : '';
  const cidade = [p.cidade, p.uf].filter(Boolean).join(' - ');

  const famevity = produtoDoKit(p.kit) === 'famevity';
  const blocoPedido = famevity
    ? blocoPedidoFamevity(k, avista, parc, p.pagamento)
    : `📦 SEU PEDIDO
▪ Produto: ${k.nome} - ${k.frascos} frascos
▪ Modalidade: PAGAMENTO NA ENTREGA
▪ Preço: ${precoLinha}`;

  return `📦 CONFIRMAÇÃO DE PEDIDO — ${famevity ? 'FAMEVITY' : 'CALMIDROL'}

Olá, ${p.nome || '—'}! 😊
Seu pedido foi registrado com sucesso e já está sendo separado pela nossa equipe.
👤 DADOS DO CLIENTE
▪ Nome: ${p.nome || '—'}
▪ CPF: ${p.cpf || '—'}
━━━━━━━━━━━━━━
ENDEREÇO DE ENTREGA
▸ RUA – ${rua || '—'}${comp}
▸ BAIRRO – ${p.bairro || '—'}
▸ CIDADE: ${cidade || '—'}
▸ CEP: ${p.cep || '—'}
━━━━━━━━━━━━━━
${blocoPedido}
━━━━━━━━━━━━━━
💳 FORMAS DE PAGAMENTO
✔ PIX
✔ Cartão de Crédito em até 12x
✔ Boleto Bancário à Vista
❌❌❌ NÃO TRABALHAMOS COM BOLETO PARCELADO! ❌❌❌
⚠️ IMPORTANTE
🚨🚨🚨 O PAGAMENTO DEVERÁ SER REALIZADO NO MESMO DIA DA ENTREGA DO PEDIDO, ASSIM QUE O PRODUTO FOR RECEBIDO EM SEU ENDEREÇO. 🚨🚨🚨
O não pagamento poderá resultar na adoção das medidas de cobrança cabíveis, incluindo comunicação aos órgãos de proteção ao crédito, conforme permitido pela legislação vigente.
━━━━━━━━━━━━━━
✅ Ao responder "SIM", você declara que os dados acima estão corretos e que concorda com todas as condições deste pedido.
⚠️ CPF vinculado ao pedido: ${p.cpf || '—'}
━━━━━━━━━━━━━━
📲 Digite "SIM" para confirmar seu pedido.`;
}

// Bloco do pedido no termo do Famevity (ex: "12x de R$ 46,23").
function blocoPedidoFamevity(k, avista, parc, pagamento) {
  const m = (parc || '').match(/^(\d+)x/);
  const parcN = m ? m[1] : '12';
  const parcValor = fmtMoeda(parseValorBR((parc || '').split('R$')[1]));
  const avistaTxt = 'R$' + fmtMoeda(parseValorBR(avista));

  const linhaParc = `💳 Em ${parcN}x de R$ ${parcValor} no cartão de crédito`;
  let linhas;
  if (pagamento === 'avista')         linhas = `💰 ${avistaTxt} AVISTA no boleto ou pix`;
  else if (pagamento === 'parcelado') linhas = linhaParc;
  else                                linhas = `${linhaParc}\n💰 Ou ${avistaTxt} AVISTA no boleto ou pix`;

  return `📦 ${k.nome.toUpperCase()}\n${linhas}`;
}

function copyTermo(id) {
  const p = pedidos.find(x => x.id === id);
  if (!p) return;
  const txt = gerarTermo(p);
  navigator.clipboard.writeText(txt)
    .then(() => showToast('📋 Termo copiado!'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = txt;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 Termo copiado!');
    });
}

// ===== VER / EDITAR DADOS COMPLETOS =====
let viewId = null;
let vmEditMode = false;
let vmCepTimer = null;

function fmtPagamento(v) {
  if (v === 'avista') return 'À vista';
  if (v === 'parcelado') return 'Parcelado';
  return 'Ambas as opções';
}

function verPedido(id) {
  viewId = id;
  vmEditMode = false;
  renderModalBody();
  document.getElementById('view-overlay').classList.add('show');
}

function closeView() {
  viewId = null;
  document.getElementById('view-overlay').classList.remove('show');
}

function pedidoAtualView() {
  return pedidos.find(x => x.id === viewId);
}

function vmToggleEdit() {
  vmEditMode = !vmEditMode;
  renderModalBody();
}

function enderecoCompletoTexto(p) {
  let linha1 = (p.rua || '') + (p.num ? ', ' + p.num : '');
  if (p.comp) linha1 += ' - ' + p.comp;
  const linha2 = [p.bairro, p.cidade && p.uf ? p.cidade + ' - ' + p.uf : p.cidade].filter(Boolean).join(' • ');
  const linha3 = p.cep ? 'CEP ' + p.cep : '';
  return [linha1, linha2, linha3].filter(Boolean).join('\n');
}

function copiarEnderecoCompleto(id) {
  const p = pedidos.find(x => x.id === id);
  if (!p) return;
  const texto = enderecoCompletoTexto(p);
  if (!texto.trim()) { showToast('Endereço vazio.', 'error'); return; }
  navigator.clipboard.writeText(texto)
    .then(() => showToast('📋 Endereço copiado!'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = texto;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 Endereço copiado!');
    });
}

function vmCopiarClique(el) {
  const val = el.getAttribute('data-copy');
  const label = el.getAttribute('data-label');
  if (!val) return;
  navigator.clipboard.writeText(val)
    .then(() => showToast('📋 ' + label + ' copiado!'))
    .catch(() => {
      const ta = document.createElement('textarea');
      ta.value = val;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      showToast('📋 ' + label + ' copiado!');
    });
}

function vmRow(label, value) {
  const val = value || '';
  return `<div class="vm-copy-row" data-copy="${esc(val)}" data-label="${esc(label)}" onclick="vmCopiarClique(this)">
    <div class="vm-copy-label">${esc(label)}</div>
    <div class="vm-copy-value">${val ? esc(val) : '—'}</div>
  </div>`;
}

function renderModalBody() {
  const p = pedidoAtualView();
  if (!p) { closeView(); return; }

  const [dur, tipo] = (p.kit || '3m_normal').split('_');
  const prod = produtoDoKit(p.kit);
  const k = KITS[p.kit] || { nome: '—', frascos: '—' };
  const avistaNum = parseValorBR(p.precoAvista || k.avista);
  const parcAtual = parseInt((p.precoParc || '').match(/^\d+/)?.[0] || '12', 10);
  const termo = p.termo || 'pendente';

  const editBtnHtml = `<div class="vm-edit-toggle-wrap">
    <button class="edit-toggle-btn ${vmEditMode ? 'sel' : ''}" onclick="vmToggleEdit()">${vmEditMode ? '✅ Editando' : '✏️ Editar'}</button>
  </div>`;

  const statusBtnHtml = `<div class="view-section">
      <div class="view-section-title">📅 Status do agendamento</div>
      <button class="status-toggle-btn ${p.status==='agendado'?'status-agendado':'status-agendar'}" onclick="vmToggleStatus()">${p.status==='agendado' ? '✅ Agendado' : '🕓 Agendar'}</button>
    </div>`;

  const termoBtnHtml = `<div class="view-section">
      <div class="view-section-title">✅ Termo</div>
      <button class="pill ${termo==='confirmado'?'pill-conf':'pill-pend'}" onclick="vmToggleTermo()">${termo==='confirmado' ? '✅ Confirmado' : '⏳ Pendente'}</button>
      <button class="term-btn" onclick="copyTermo(${p.id})">📋 Copiar termo</button>
    </div>`;

  if (!vmEditMode) {
    // ===== MODO VISUALIZAÇÃO: clicar em qualquer campo copia o valor =====
    document.getElementById('view-body').innerHTML = `
      ${editBtnHtml}
      <div class="view-section">
        <div class="view-section-title">👤 Paciente</div>
        ${vmRow('Data', fmtData(p.data))}
        ${vmRow('Nome completo', p.nome)}
        ${vmRow('CPF', p.cpf)}
        ${vmRow('Telefone', p.tel)}
        ${vmRow('E-mail', p.email)}
      </div>
      <div class="view-section">
        <div class="view-section-title">📍 Endereço</div>
        ${vmRow('CEP', p.cep)}
        ${vmRow('Rua / Avenida', p.rua)}
        ${vmRow('Número', p.num)}
        ${vmRow('Complemento', p.comp)}
        ${vmRow('Bairro', p.bairro)}
        ${vmRow('Cidade', p.cidade)}
        ${vmRow('UF', p.uf)}
        <button class="term-btn" onclick="copiarEnderecoCompleto(${p.id})">📋 Copiar endereço completo</button>
      </div>
      <div class="view-section">
        <div class="view-section-title">💊 Kit e pagamento</div>
        ${vmRow('Produto', PRODUTOS[produtoDoKit(p.kit)].label)}
        ${vmRow('Kit', descricaoKit(k))}
        ${vmRow('Valor à vista', p.precoAvista || k.avista)}
        ${vmRow('Parcelado', p.precoParc || k.parc)}
        ${vmRow('Forma de pagamento', fmtPagamento(p.pagamento))}
      </div>
      <div class="view-section">
        <div class="view-section-title">📝 Observações</div>
        ${vmRow('Observações', p.info)}
      </div>
      ${statusBtnHtml}
      ${termoBtnHtml}
    `;
    return;
  }

  // ===== MODO EDIÇÃO: campos editáveis de verdade =====
  document.getElementById('view-body').innerHTML = `
    ${editBtnHtml}
    <div class="view-section">
      <div class="view-section-title">👤 Paciente</div>
      <div class="form-group"><label>Data</label><input type="date" id="vm-data" value="${esc(p.data)}" onchange="vmSalvar('data',this.value)"></div>
      <div class="form-group"><label>Nome completo</label><input type="text" id="vm-nome" value="${esc(p.nome)}" onchange="vmSalvarNome(this)"></div>
      <div class="vm-2col">
        <div class="form-group"><label>CPF</label><input type="text" id="vm-cpf" value="${esc(p.cpf)}" maxlength="14" onchange="vmSalvarCPF(this)"></div>
        <div class="form-group"><label>Telefone</label><input type="text" id="vm-tel" value="${esc(p.tel)}" maxlength="11" onchange="vmSalvarTel(this)"></div>
      </div>
      <div class="form-group"><label>E-mail</label><input type="email" id="vm-email" value="${esc(p.email||'')}" onchange="vmSalvarEmail(this)"></div>
    </div>

    <div class="view-section">
      <div class="view-section-title">📍 Endereço</div>
      <div class="form-group">
        <label>CEP</label>
        <div class="cep-row">
          <input type="text" id="vm-cep" value="${esc(p.cep)}" maxlength="9" oninput="vmOnCEPInput(this)">
          <button class="btn-cep" id="vm-btn-cep" onclick="vmBuscarCEP()">Buscar</button>
        </div>
      </div>
      <div class="form-group"><label>Rua / Avenida</label><input type="text" id="vm-rua" value="${esc(p.rua)}" oninput="formatarPalavras(this)" onchange="vmSalvar('rua',this.value)"></div>
      <div class="vm-2col">
        <div class="form-group"><label>Número</label><input type="text" id="vm-num" value="${esc(p.num)}" onchange="vmSalvar('num',this.value)"></div>
        <div class="form-group"><label>Complemento</label><input type="text" id="vm-comp" value="${esc(p.comp)}" oninput="formatarPalavras(this)" onchange="vmSalvar('comp',this.value)"></div>
      </div>
      <div class="vm-2col">
        <div class="form-group"><label>Bairro</label><input type="text" id="vm-bairro" value="${esc(p.bairro)}" oninput="formatarPalavras(this)" onchange="vmSalvar('bairro',this.value)"></div>
        <div class="form-group"><label>Cidade</label><input type="text" id="vm-cidade" value="${esc(p.cidade)}" oninput="formatarPalavras(this)" onchange="vmSalvar('cidade',this.value)"></div>
      </div>
      <div class="form-group status-group"><label>UF</label><input type="text" id="vm-uf" value="${esc(p.uf)}" maxlength="2" onchange="vmSalvar('uf',this.value.toUpperCase())"></div>
      <button class="term-btn" onclick="copiarEnderecoCompleto(${p.id})">📋 Copiar endereço completo</button>
    </div>

    <div class="view-section">
      <div class="view-section-title">💊 Kit e pagamento</div>
      <label class="pag-label">Produto</label>
      <div class="vm-pill-row">
        ${Object.keys(PRODUTOS).map(pr => `<div class="kit-prod-btn ${pr===prod?'sel':''}" onclick="vmSelProduto('${pr}')">${PRODUTOS[pr].label}</div>`).join('')}
      </div>
      <label class="pag-label kit-tipo-label">Duração</label>
      <div class="vm-pill-row">
        ${PRODUTOS[prod].durs.map(([val, label]) => `<div class="kit-dur-btn ${dur===val?'sel':''}" onclick="vmSelDur('${val}')">${label}</div>`).join('')}
      </div>
      ${PRODUTOS[prod].temDesconto ? `<label class="pag-label kit-tipo-label">Tipo de preço</label>
      <div class="vm-pill-row">
        <div class="kit-tipo-btn ${tipo==='normal'?'sel':''}" id="vm-tipo-normal" data-tipo="normal" onclick="vmSelTipo('normal')">Preço normal</div>
        <div class="kit-tipo-btn ${tipo==='desc'?'sel':''}" id="vm-tipo-desc" data-tipo="desc" onclick="vmSelTipo('desc')">Com desconto</div>
      </div>` : ''}
      <div class="vm-2col kit-valor-grid">
        <div class="form-group"><label>Valor à vista (R$)</label><input type="text" id="vm-valor-avista" value="${fmtMoeda(avistaNum)}"></div>
        <div class="form-group"><label>Parcelamento</label><select id="vm-parcelamento"></select></div>
      </div>
      <label class="pag-label">Forma de pagamento</label>
      <div class="pag-opts">
        <div class="pag-btn ${p.pagamento==='ambos'?'sel':''}" onclick="vmSelPag('ambos')">Ambas</div>
        <div class="pag-btn ${p.pagamento==='avista'?'sel':''}" onclick="vmSelPag('avista')">À vista</div>
        <div class="pag-btn ${p.pagamento==='parcelado'?'sel':''}" onclick="vmSelPag('parcelado')">Parcelado</div>
      </div>
    </div>

    <div class="view-section">
      <div class="view-section-title">📝 Observações</div>
      <textarea id="vm-info" onchange="vmSalvar('info',this.value)">${esc(p.info||'')}</textarea>
    </div>

    ${statusBtnHtml}
    ${termoBtnHtml}
  `;

  const parcSel = document.getElementById('vm-parcelamento');
  popularParcelamento(parcSel, avistaNum, parcAtual);

  document.getElementById('vm-valor-avista').addEventListener('input', function () {
    const atual = parseInt(parcSel.value || '12', 10);
    popularParcelamento(parcSel, parseValorBR(this.value), atual);
  });
  document.getElementById('vm-valor-avista').addEventListener('change', vmSalvarPreco);
  parcSel.addEventListener('change', vmSalvarPreco);
}

function vmSalvar(field, val) {
  const p = pedidoAtualView();
  if (!p) return;
  p[field] = val;
  if (field === 'data') p.dataEraFutura = val > todayStr();
  saveData();
  stats();
  render();
  renderAgendados();
  renderArquivados();
}

function vmSalvarNome(input) { input.value = capitalizeNome(input.value); vmSalvar('nome', input.value); }
function vmSalvarCPF(input)  { input.value = fmtCPF(input.value); vmSalvar('cpf', input.value); validarCPFCampo(input); }
function vmSalvarTel(input)  { input.value = fmtTel(input.value); vmSalvar('tel', input.value); }
function vmSalvarEmail(input){ input.value = input.value.toLowerCase(); vmSalvar('email', input.value); }

function vmSalvarPreco() {
  const p = pedidoAtualView();
  if (!p) return;
  const avistaNum = parseValorBR(document.getElementById('vm-valor-avista').value);
  const parcN = parseInt(document.getElementById('vm-parcelamento').value || '12', 10);
  const parcela = calcParcelas(avistaNum).find(x => x.n === parcN) || { n: 12, valor: avistaNum };
  p.precoAvista = 'R$ ' + fmtMoeda(avistaNum);
  p.precoParc = parcela.n + 'x de R$ ' + fmtMoeda(parcela.valor);
  saveData();
  stats();
  render();
  renderAgendados();
  renderArquivados();
}

function vmSelProduto(prod) {
  aplicarKitModal(PRODUTOS[prod].durs[0][0], 'normal');
}

function vmSelDur(val) {
  const p = pedidoAtualView();
  if (!p) return;
  const tipo = (p.kit || '3m_normal').split('_')[1] || 'normal';
  aplicarKitModal(val, tipo);
}

function vmSelTipo(val) {
  const p = pedidoAtualView();
  if (!p) return;
  const dur = (p.kit || '3m_normal').split('_')[0] || '3m';
  aplicarKitModal(dur, val);
}

function aplicarKitModal(dur, tipo) {
  const p = pedidoAtualView();
  if (!p) return;
  const kit = dur + '_' + tipo;
  const k = KITS[kit];
  if (!k) return;
  p.kit = kit;
  p.precoAvista = k.avista;
  p.precoParc = k.parc;
  saveData();
  stats();
  render();
  renderAgendados();
  renderArquivados();
  renderModalBody();
}

function vmSelPag(val) {
  const p = pedidoAtualView();
  if (!p) return;
  p.pagamento = val;
  saveData();
  stats();
  render();
  renderAgendados();
  renderArquivados();
  renderModalBody();
}

function vmToggleStatus() {
  const p = pedidoAtualView();
  if (!p) return;
  p.status = p.status === 'agendado' ? 'agendar' : 'agendado';
  saveData();
  stats();
  badge();
  render();
  renderAgendados();
  renderArquivados();
  renderModalBody();
}

function vmToggleTermo() {
  if (viewId == null) return;
  toggleTermo(viewId);
  renderModalBody();
}

function vmOnCEPInput(el) {
  el.value = fmtCEP(el.value);
  const digits = el.value.replace(/\D/g, '');
  if (digits.length === 8) {
    clearTimeout(vmCepTimer);
    vmCepTimer = setTimeout(vmBuscarCEP, 600);
  }
}

async function vmBuscarCEP() {
  const p = pedidoAtualView();
  if (!p) return;
  const cepInput = document.getElementById('vm-cep');
  cepInput.value = fmtCEP(cepInput.value);
  vmSalvar('cep', cepInput.value);
  const cepVal = cepInput.value.replace(/\D/g, '');
  if (cepVal.length !== 8) { showToast('Digite um CEP válido com 8 dígitos', 'error'); return; }

  const btn = document.getElementById('vm-btn-cep');
  btn.disabled = true;
  btn.textContent = 'Buscando...';

  let dados = null;
  try {
    const r = await fetch('https://viacep.com.br/ws/' + cepVal + '/json/');
    const d = await r.json();
    if (!d.erro) dados = { logradouro: d.logradouro, bairro: d.bairro, localidade: d.localidade, uf: d.uf };
  } catch (e) { /* tenta backup */ }

  if (!dados) {
    try {
      const r2 = await fetch('https://brasilapi.com.br/api/cep/v1/' + cepVal);
      if (r2.ok) {
        const d2 = await r2.json();
        dados = { logradouro: d2.street, bairro: d2.neighborhood, localidade: d2.city, uf: d2.state };
      }
    } catch (e2) { /* sem dados */ }
  }

  if (dados && (dados.logradouro || dados.localidade)) {
    document.getElementById('vm-rua').value = dados.logradouro || '';
    document.getElementById('vm-bairro').value = dados.bairro || '';
    document.getElementById('vm-cidade').value = dados.localidade || '';
    document.getElementById('vm-uf').value = (dados.uf || '').toUpperCase();
    vmSalvar('rua', dados.logradouro || '');
    vmSalvar('bairro', dados.bairro || '');
    vmSalvar('cidade', dados.localidade || '');
    vmSalvar('uf', (dados.uf || '').toUpperCase());
    showToast('✅ Endereço preenchido automaticamente!');
  } else {
    showToast('CEP não encontrado ou serviço indisponível no momento.', 'error');
  }

  btn.disabled = false;
  btn.textContent = 'Buscar';
}

// ===== EXCLUIR =====
function askDel(id) { delId = id; document.getElementById('conf-overlay').classList.add('show'); }
function closeConf() { delId = null; document.getElementById('conf-overlay').classList.remove('show'); }
function confirmDel() {
  if (delId) {
    pedidos = pedidos.filter(p => p.id !== delId);
    saveData(); badge(); stats(); render(); renderAgendados(); renderArquivados();
    showToast('Pedido excluído.');
  }
  closeConf();
}

// ===== CONTADORES =====
function badge() {
  document.getElementById('count-badge').textContent = pedidos.filter(p => p.status !== 'agendado' && !p.arquivado).length;
  document.getElementById('count-badge-ag').textContent = pedidos.filter(p => p.status === 'agendado' && !p.arquivado).length;
  document.getElementById('count-badge-arq').textContent = pedidos.filter(p => p.arquivado).length;
}
function stats() {
  document.getElementById('st-total').textContent = pedidos.length;
  document.getElementById('st-ag').textContent    = pedidos.filter(p => p.status === 'agendar').length;
  document.getElementById('st-ok').textContent    = pedidos.filter(p => p.status === 'agendado').length;
  document.getElementById('st-conf').textContent  = pedidos.filter(p => p.termo === 'confirmado').length;
}

// ===== TOAST =====
function showToast(msg, type) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.style.background = type === 'error' ? '#c0392b' : '#185FA5';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2800);
}

// ===== FORMATAÇÕES =====
const NOME_PREPOSICOES = ['de', 'da', 'do', 'das', 'dos', 'e'];

function capitalizeNome(v) {
  return v
    .toLowerCase()
    .split(' ')
    .map((palavra, i) => {
      if (!palavra) return palavra;
      if (i !== 0 && NOME_PREPOSICOES.includes(palavra)) return palavra;
      return palavra.charAt(0).toUpperCase() + palavra.slice(1);
    })
    .join(' ');
}

// Aplica a mesma capitalização (1ª letra maiúscula por palavra, resto minúsculo)
// a um campo enquanto o usuário digita, preservando a posição do cursor.
function formatarPalavras(input) {
  const pos = input.selectionStart;
  input.value = capitalizeNome(input.value);
  input.setSelectionRange(pos, pos);
}

function fmtCPF(v) {
  v = v.replace(/\D/g, '');
  if (v.length > 3)  v = v.slice(0,3)  + '.' + v.slice(3);
  if (v.length > 7)  v = v.slice(0,7)  + '.' + v.slice(7);
  if (v.length > 11) v = v.slice(0,11) + '-' + v.slice(11);
  return v.slice(0, 14);
}

// Valida o CPF pelo algoritmo oficial dos dois dígitos verificadores.
function cpfValido(cpf) {
  const digits = (cpf || '').replace(/\D/g, '');
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false; // 000.000.000-00, 111.111.111-11 etc.

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(digits[i], 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(digits[i], 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) resto = 0;
  if (resto !== parseInt(digits[10], 10)) return false;

  return true;
}

// Marca visualmente o campo e avisa se o CPF digitado não for válido.
// Campo vazio não é considerado erro (CPF opcional).
function validarCPFCampo(input) {
  const digits = input.value.replace(/\D/g, '');
  if (!digits) { input.classList.remove('campo-invalido'); return; }
  if (cpfValido(input.value)) {
    input.classList.remove('campo-invalido');
  } else {
    input.classList.add('campo-invalido');
    showToast('⚠️ CPF inválido — confira os números.', 'error');
  }
}
function fmtTel(v) {
  return v.replace(/\D/g, '').slice(0, 11);
}
function fmtCEP(v) {
  v = v.replace(/\D/g, '');
  if (v.length > 5) v = v.slice(0,5) + '-' + v.slice(5);
  return v.slice(0, 9);
}
function fmtData(d) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}
function esc(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
