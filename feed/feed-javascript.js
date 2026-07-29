/**
 * ============================================================
 * VITÃOTUB - JAVASCRIPT DO FEED
 * Descrição: Lógica de abas, carregamento de vídeos via RSS,
 * sistema completo de artigos com scroll infinito e efeito
 * de destaque, modal de artigo em tela cheia real, modal de
 * vídeo, compartilhamento, PWA com auto-update e botões
 * flutuantes
 * Organizado por seções para facilitar manutenção
 * ============================================================
 */

// ==================== 1. CONFIGURAÇÕES ====================
const CONFIG = {
    articleModalId: 'article-modal',
    channelID: 'UCUNyU0HewM1JQVVKMAEAfyQ',
    artigosFiles: ['artigos.html'],
    artigosPorVez: 20,
    artigosIncremento: 10
};

// ==================== 2. UTILITÁRIOS ====================
function escapeHtml(text) {
    if (!text) return '';
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// ==================== 3. SERVICE WORKER COM AUTO-UPDATE ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado com sucesso!');
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            console.log('🔄 Nova versão do app disponível!');
                            if (confirm('🚀 Uma nova versão do app está disponível! Deseja atualizar agora?')) {
                                newWorker.postMessage({ action: 'skipWaiting' });
                                window.location.reload();
                            }
                        }
                    });
                });
                setInterval(() => { registration.update(); }, 30 * 60 * 1000);
                document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') registration.update(); });
            })
            .catch(error => console.log('Erro ao registrar o Service Worker:', error));
    });
}

// ==================== 4. NAVEGAÇÃO POR ABAS ====================
function mudarAba(aba) {
    const btnVideos = document.getElementById('btn-tab-videos');
    const btnArtigos = document.getElementById('btn-tab-artigos');
    const btnSobre = document.getElementById('btn-tab-sobre');
    const secaoVideos = document.getElementById('secao-videos');
    const secaoArtigos = document.getElementById('secao-artigos');
    const secaoSobre = document.getElementById('secao-sobre');
    if (secaoVideos) secaoVideos.style.display = 'none';
    if (secaoArtigos) secaoArtigos.style.display = 'none';
    if (secaoSobre) secaoSobre.style.display = 'none';
    if (btnVideos) { btnVideos.classList.remove('active'); btnVideos.setAttribute('aria-pressed', 'false'); }
    if (btnArtigos) { btnArtigos.classList.remove('active'); btnArtigos.setAttribute('aria-pressed', 'false'); }
    if (btnSobre) { btnSobre.classList.remove('active'); btnSobre.setAttribute('aria-pressed', 'false'); }
    if (aba === 'videos') { if (btnVideos) { btnVideos.classList.add('active'); btnVideos.setAttribute('aria-pressed', 'true'); } if (secaoVideos) secaoVideos.style.display = 'block'; }
    else if (aba === 'artigos') { if (btnArtigos) { btnArtigos.classList.add('active'); btnArtigos.setAttribute('aria-pressed', 'true'); } if (secaoArtigos) secaoArtigos.style.display = 'block'; if (!artigosCarregados) carregarTodosArtigos(); }
    else if (aba === 'sobre') { if (btnSobre) { btnSobre.classList.add('active'); btnSobre.setAttribute('aria-pressed', 'true'); } if (secaoSobre) secaoSobre.style.display = 'block'; }
}

// ==================== 5. CARREGAMENTO DO FEED DO YOUTUBE (RSS) ====================
const ytContainer = document.getElementById('youtube-feed-container');
if (ytContainer) { carregarYouTubeAutomatico(); }

async function carregarYouTubeAutomatico() {
    try {
        const API_KEY = 'a2ffjzqucytgmqa6xn9wbm16slffblnydpk3hcn7';
        const RSS_URL = `https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2Ffeeds%2Fvideos.xml%3Fchannel_id%3D${CONFIG.channelID}&api_key=${API_KEY}&count=15`;
        const response = await fetch(RSS_URL);
        const data = await response.json();
        if (data.status === 'ok' && data.items && data.items.length > 0) {
            ytContainer.innerHTML = '';
            data.items.forEach(video => {
                const videoIdMatch = video.link.match(/(?:v=|\/embed\/|\/v\/|youtu\.be\/)([^&\n?#]+)/);
                const videoId = videoIdMatch ? videoIdMatch[1] : '';
                if (videoId) {
                    const postElement = document.createElement('article');
                    postElement.className = 'feed-card';
                    const dataPub = new Date(video.pubDate).toLocaleDateString('pt-BR');
                    const thumbnailUrl = video.thumbnail || `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                    postElement.innerHTML = `<div class="video-thumbnail-container" onclick="abrirVideoModal('${videoId}')" role="button" tabindex="0" aria-label="Assistir: ${escapeHtml(video.title)}"><img src="${thumbnailUrl}" alt="${escapeHtml(video.title)}" loading="lazy" class="video-thumbnail" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'"><div class="play-icon-overlay"><i class="fa-solid fa-circle-play"></i></div></div><div class="feed-content"><h2>${escapeHtml(video.title)}</h2><div class="feed-meta-header"><span class="feed-date">📅 ${dataPub}</span><span class="feed-author">✍️ VitãoTub</span></div></div>`;
                    ytContainer.appendChild(postElement);
                }
            });
        } else { ytContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Não foi possível carregar os vídeos no momento.</p>'; }
    } catch (error) { console.error("Erro ao buscar feed do YouTube:", error); ytContainer.innerHTML = '<p style="text-align: center; color: #ff5555;">Erro ao carregar vídeos. Verifique sua conexão.</p>'; }
}

// ==================== 5.1 MODAL DE VÍDEO EM TELA CHEIA ====================
function abrirVideoModal(videoId) {
    let modal = document.getElementById('video-fullscreen-modal');
    if (!modal) {
        modal = document.createElement('div'); modal.id = 'video-fullscreen-modal'; modal.className = 'video-fullscreen-modal';
        modal.innerHTML = `<button class="video-fullscreen-close" id="video-close-btn" aria-label="Fechar vídeo"><i class="fa-solid fa-xmark"></i></button><div class="video-fullscreen-container" id="video-container"><iframe id="video-fullscreen-iframe" src="" frameborder="0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe></div><div class="video-tap-hint" id="video-tap-hint">Toque na tela para ver mais opções</div><div class="video-actions-bar" id="video-actions-bar"><button class="btn-action-icon btn-share-icon" id="video-share-btn" title="Compartilhar" aria-label="Compartilhar vídeo"><i class="fa-solid fa-share-nodes"></i></button><a href="https://www.youtube.com/@VitaoTub?sub_confirmation=1" target="_blank" class="btn-action-icon btn-subscribe-icon" id="video-subscribe-btn" title="Inscrever-se" rel="noopener noreferrer" aria-label="Inscrever-se no canal"><i class="fa-brands fa-youtube"></i></a></div>`;
        document.body.appendChild(modal);
        modal.addEventListener('click', function(e) { if (e.target === modal) fecharVideoModal(); });
        modal.addEventListener('click', function() { const tapHint = document.getElementById('video-tap-hint'); if (tapHint) tapHint.classList.remove('visible'); });
        document.getElementById('video-share-btn').addEventListener('click', function(e) { e.stopPropagation(); const iframe = document.getElementById('video-fullscreen-iframe'); const currentSrc = iframe.src; const videoIdMatch = currentSrc.match(/embed\/([^?]+)/); if (videoIdMatch) compartilharVideo(videoIdMatch[1]); });
        document.getElementById('video-close-btn').addEventListener('click', function(e) { e.stopPropagation(); fecharVideoModal(); });
    }
    const iframe = document.getElementById('video-fullscreen-iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
    modal.classList.add('active'); document.body.style.overflow = 'hidden';
    const tapHint = document.getElementById('video-tap-hint');
    if (tapHint) { tapHint.classList.add('visible'); setTimeout(() => { if (tapHint) tapHint.classList.remove('visible'); }, 4000); }
    verificarOrientacao(); window.addEventListener('orientationchange', verificarOrientacao);
}
function fecharVideoModal() { const modal = document.getElementById('video-fullscreen-modal'); const iframe = document.getElementById('video-fullscreen-iframe'); if (modal) { modal.classList.remove('active'); if (iframe) iframe.src = ''; document.body.style.overflow = ''; } window.removeEventListener('orientationchange', verificarOrientacao); }
function verificarOrientacao() { const container = document.getElementById('video-container'); if (!container) return; if (window.innerWidth > window.innerHeight) { container.classList.add('landscape'); container.classList.remove('portrait'); } else { container.classList.add('portrait'); container.classList.remove('landscape'); } }
function compartilharVideo(videoId) { const videoUrl = `https://www.youtube.com/watch?v=${videoId}`; const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent); if (isMobile && navigator.share) { navigator.share({ title: 'Confira este vídeo do VitãoTub!', text: 'Assista este vídeo no YouTube', url: videoUrl }).catch(() => {}); } else { navigator.clipboard.writeText(videoUrl).then(() => { alert('Link do vídeo copiado!'); }).catch(() => { const tempInput = document.createElement('input'); tempInput.value = videoUrl; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput); alert('Link do vídeo copiado!'); }); } }

// ==================== 6. SISTEMA DE ARTIGOS COM SCROLL INFINITO E DESTAQUE ====================
let todosArtigos = [];
let artigosCarregados = false;
let artigosExibidos = 0;

async function carregarTodosArtigos() {
    const container = document.getElementById('artigos-feed-container');
    if (!container) return;
    container.innerHTML = '<p style="text-align: center; color: #aaa;">Carregando artigos...</p>';
    todosArtigos = [];
    for (const file of CONFIG.artigosFiles) {
        try {
            const response = await fetch(file);
            if (!response.ok) continue;
            const htmlText = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const artigos = doc.querySelectorAll('.artigo-card');
            artigos.forEach(artigo => { todosArtigos.push({ element: artigo.cloneNode(true), data: new Date(artigo.getAttribute('data-data').split('/').reverse().join('-')), id: artigo.id }); });
        } catch (error) { console.warn(`Erro ao carregar ${file}:`, error); }
    }
    todosArtigos.sort((a, b) => b.data - a.data);
    if (todosArtigos.length > 0) { artigosCarregados = true; artigosExibidos = 0; container.innerHTML = ''; carregarMaisArtigos(); configurarScrollInfinito(); initArtigoDestaque(); }
    else { container.innerHTML = '<p style="text-align: center; color: #aaa;">Nenhum artigo encontrado.</p>'; }
}

function carregarMaisArtigos() {
    const container = document.getElementById('artigos-feed-container');
    const loading = document.getElementById('artigos-loading');
    if (!container) return;
    const proximos = todosArtigos.slice(artigosExibidos, artigosExibidos + CONFIG.artigosIncremento);
    if (proximos.length === 0) { if (loading) loading.style.display = 'none'; return; }
    proximos.forEach(artigo => {
        const card = artigo.element;
        card.style.cursor = 'pointer';
        card.addEventListener('click', function(e) { if (e.target.closest('button') || e.target.closest('a') || e.target.closest('iframe')) return; abrirArtigoFullscreen(artigo.id); });
        const btnLerMais = document.createElement('button'); btnLerMais.className = 'btn-ler-mais'; btnLerMais.innerHTML = '📖 Ler Artigo Completo';
        btnLerMais.addEventListener('click', function(e) { e.stopPropagation(); abrirArtigoFullscreen(artigo.id); });
        const rodape = card.querySelector('.artigo-rodape'); if (rodape) { card.insertBefore(btnLerMais, rodape); } else { card.appendChild(btnLerMais); }
        container.appendChild(card);
    });
    artigosExibidos += proximos.length;
    if (artigosExibidos >= todosArtigos.length && loading) { loading.style.display = 'none'; }
    initArtigoDestaque();
}

function configurarScrollInfinito() {
    const loading = document.getElementById('artigos-loading');
    window.addEventListener('scroll', () => {
        const secaoArtigos = document.getElementById('secao-artigos'); if (!secaoArtigos || secaoArtigos.style.display === 'none') return;
        const scrollBottom = window.innerHeight + window.scrollY; const pageBottom = document.body.offsetHeight - 300;
        if (scrollBottom >= pageBottom && artigosExibidos < todosArtigos.length) { if (loading) loading.style.display = 'block'; carregarMaisArtigos(); if (artigosExibidos >= todosArtigos.length && loading) { loading.innerHTML = '<p>Todos os artigos foram carregados! 🎉</p>'; setTimeout(() => { loading.style.display = 'none'; }, 3000); } }
    });
}

function initArtigoDestaque() {
    const artigos = document.querySelectorAll('.artigo-card');
    if (artigos.length === 0) return;
    const observer = new IntersectionObserver((entries) => { entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('artigo-destaque'); } else { entry.target.classList.remove('artigo-destaque'); } }); }, { threshold: 0.4, rootMargin: '-15% 0px -15% 0px' });
    artigos.forEach(artigo => observer.observe(artigo));
}

function abrirArtigoFullscreen(artigoId) {
    const artigo = document.getElementById(artigoId);
    if (!artigo) return;
    const modal = document.getElementById('artigo-fullscreen-modal');
    const body = document.getElementById('artigo-fullscreen-body');
    const shareBtn = document.getElementById('artigo-share-btn');
    if (!modal || !body) return;
    const conteudo = artigo.cloneNode(true); conteudo.style.cursor = 'default'; conteudo.classList.add('artigo-fullscreen-active');
    const btnLerMais = conteudo.querySelector('.btn-ler-mais'); if (btnLerMais) btnLerMais.remove();
    const corpo = conteudo.querySelector('.artigo-corpo'); if (corpo) { corpo.style.maxHeight = 'none'; corpo.style.overflow = 'visible'; }
    body.innerHTML = ''; body.appendChild(conteudo);
    if (shareBtn) { shareBtn.onclick = function() { const titulo = artigo.getAttribute('data-titulo') || ''; compartilharArtigo(artigoId, titulo); }; }
    modal.classList.add('active'); document.body.style.overflow = 'hidden';
    modal.scrollTop = 0; window.scrollTo(0, 0);
}
function fecharArtigoFullscreen() { const modal = document.getElementById('artigo-fullscreen-modal'); if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } }
function compartilharArtigo(artigoId, titulo) { const baseUrl = window.location.href.split('#')[0]; const link = `${baseUrl}#${artigoId}`; const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent); if (isMobile && navigator.share) { navigator.share({ title: titulo || 'Artigo do VitãoTub', text: 'Confira este artigo!', url: link }).catch(() => {}); } else { navigator.clipboard.writeText(link).then(() => { alert('Link do artigo copiado!'); }).catch(() => { const tempInput = document.createElement('input'); tempInput.value = link; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput); alert('Link do artigo copiado!'); }); } }
function verificarArtigoNaUrl() { const hash = window.location.hash; if (hash && hash.startsWith('#artigo-')) { const artigoId = hash.substring(1); const checkExist = setInterval(() => { const artigo = document.getElementById(artigoId); if (artigo) { clearInterval(checkExist); mudarAba('artigos'); setTimeout(() => { abrirArtigoFullscreen(artigoId); }, 500); } }, 200); setTimeout(() => { clearInterval(checkExist); }, 5000); } }

// ==================== 7. EVENTOS GLOBAIS ====================
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharVideoModal(); fecharArtigoFullscreen(); const translateDropdown = document.getElementById('translate-dropdown'); if (translateDropdown) translateDropdown.classList.remove('active'); } });
document.addEventListener('click', function(e) { const translateDropdown = document.getElementById('translate-dropdown'); const translateToggle = document.getElementById('translate-toggle'); if (translateDropdown && translateToggle) { if (!translateDropdown.contains(e.target) && e.target !== translateToggle) { translateDropdown.classList.remove('active'); } } });

// ==================== 8. BOTÃO DE TRADUÇÃO FLUTUANTE ====================
function toggleTranslateDropdown() { const dropdown = document.getElementById('translate-dropdown'); if (dropdown) dropdown.classList.toggle('active'); }
function translatePage(lang) { if (lang === 'pt') { const select = document.querySelector('.goog-te-combo'); if (select) { select.value = 'pt'; select.dispatchEvent(new Event('change')); setTimeout(() => { document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;'; window.location.reload(); }, 300); } else { document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;'; window.location.reload(); } const dropdown = document.getElementById('translate-dropdown'); if (dropdown) dropdown.classList.remove('active'); return; } setGoogleTranslateCookie(lang); const checkExist = setInterval(() => { const select = document.querySelector('.goog-te-combo'); if (select) { clearInterval(checkExist); select.value = lang; select.dispatchEvent(new Event('change')); const dropdown = document.getElementById('translate-dropdown'); if (dropdown) dropdown.classList.remove('active'); updateActiveLanguage(lang); } }, 100); setTimeout(() => { if (!document.querySelector('.goog-te-combo')) window.location.reload(); }, 3000); }
function setGoogleTranslateCookie(lang) { const date = new Date(); date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000)); const expires = date.toUTCString(); document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = lang === 'pt' ? `googtrans=/pt/pt; expires=${expires}; path=/` : `googtrans=/pt/${lang}; expires=${expires}; path=/`; }
function updateActiveLanguage(lang) { document.querySelectorAll('.translate-option').forEach(btn => { btn.classList.remove('active-lang'); if (btn.getAttribute('data-lang') === lang) btn.classList.add('active-lang'); }); }
function initTranslateWidget() { const toggleBtn = document.getElementById('translate-toggle'); const dropdown = document.getElementById('translate-dropdown'); if (!toggleBtn || !dropdown) return; toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleTranslateDropdown(); }); setTimeout(() => { const match = document.cookie.match(/googtrans=\/pt\/([^;]+)/); if (match && match[1]) updateActiveLanguage(match[1]); }, 1500); }

// ==================== 9. BOTÃO VOLTAR AO TOPO ====================
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) { backToTopButton.addEventListener('click', function(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

// ==================== 10. INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => { initTranslateWidget(); verificarArtigoNaUrl(); });