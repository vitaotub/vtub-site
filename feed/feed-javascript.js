/**
 * ============================================================
 * VITÃOTUB - JAVASCRIPT DO FEED
 * Descrição: Lógica de abas, carregamento de vídeos via RSS,
 * sistema de artigos com scroll infinito e destaque,
 * modal de artigo em tela cheia com gesto de arraste e
 * formatação forçada (justificado, hifenizado, margens),
 * modal de vídeo com gesto de arraste (lados e baixo),
 * compartilhamento com link absoluto,
 * PWA (apenas mobile) com memória de instalação,
 * Botão de tradução arrastável e fechável,
 * Botão de tema arrastável e fechável,
 * Botão voltar ao topo
 * Organizado por seções para facilitar manutenção
 * ============================================================
 */

// ==================== 1. CONFIGURAÇÕES ====================
const CONFIG = {
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
    initVideoSwipeToClose();
}
function fecharVideoModal() { const modal = document.getElementById('video-fullscreen-modal'); const iframe = document.getElementById('video-fullscreen-iframe'); if (modal) { modal.classList.remove('active'); if (iframe) iframe.src = ''; document.body.style.overflow = ''; } window.removeEventListener('orientationchange', verificarOrientacao); }
function verificarOrientacao() { const container = document.getElementById('video-container'); if (!container) return; if (window.innerWidth > window.innerHeight) { container.classList.add('landscape'); container.classList.remove('portrait'); } else { container.classList.add('portrait'); container.classList.remove('landscape'); } }
function compartilharVideo(videoId) { const videoUrl = `https://www.youtube.com/watch?v=${videoId}`; const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent); if (isMobile && navigator.share) { navigator.share({ title: 'Confira este vídeo do VitãoTub!', text: 'Assista este vídeo no YouTube', url: videoUrl }).catch(() => {}); } else { navigator.clipboard.writeText(videoUrl).then(() => { alert('Link do vídeo copiado!'); }).catch(() => { const tempInput = document.createElement('input'); tempInput.value = videoUrl; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput); alert('Link do vídeo copiado!'); }); } }

function initVideoSwipeToClose() {
    const modal = document.getElementById('video-fullscreen-modal'); if (!modal) return;
    let startX = 0, startY = 0, currentX = 0, currentY = 0, isDragging = false;
    modal.addEventListener('touchstart', (e) => { if (e.target === modal) { startX = e.touches[0].clientX; startY = e.touches[0].clientY; isDragging = true; modal.style.transition = 'none'; } }, { passive: true });
    modal.addEventListener('touchmove', (e) => { if (!isDragging) return; currentX = e.touches[0].clientX; currentY = e.touches[0].clientY; const diffX = currentX - startX; const diffY = currentY - startY; if (Math.abs(diffX) > Math.abs(diffY)) { if (Math.abs(diffX) > 20) { modal.style.transform = `translateX(${diffX}px)`; modal.style.opacity = 1 - Math.abs(diffX) / 400; } } else if (diffY > 20) { modal.style.transform = `translateY(${diffY}px)`; modal.style.opacity = 1 - Math.abs(diffY) / 500; } }, { passive: true });
    modal.addEventListener('touchend', () => { if (!isDragging) return; isDragging = false; const diffX = currentX - startX; const diffY = currentY - startY; modal.style.transition = 'transform 0.3s ease, opacity 0.3s ease'; if (Math.abs(diffX) > 100 || diffY > 150) { if (Math.abs(diffX) > Math.abs(diffY)) { modal.style.transform = diffX > 0 ? 'translateX(150%)' : 'translateX(-150%)'; } else { modal.style.transform = 'translateY(100%)'; } modal.style.opacity = '0'; setTimeout(() => { fecharVideoModal(); modal.style.transform = ''; modal.style.opacity = ''; }, 300); } else { modal.style.transform = ''; modal.style.opacity = ''; } currentX = 0; currentY = 0; });
}

// ==================== 6. SISTEMA DE ARTIGOS ====================
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
        const meta = card.querySelector('.artigo-meta'); if (meta) { meta.after(btnLerMais); } else { card.appendChild(btnLerMais); }
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

// ==================== 6.1 FUNÇÃO CORRIGIDA - ABRIR ARTIGO EM TELA CHEIA ====================
// ==================== 6.1 FUNÇÃO CORRIGIDA - ABRIR ARTIGO EM TELA CHEIA ====================
function abrirArtigoFullscreen(artigoId) {
    const artigo = document.getElementById(artigoId);
    if (!artigo) {
        console.error("Artigo não encontrado:", artigoId);
        return;
    }
    const modal = document.getElementById('artigo-fullscreen-modal');
    const body = document.getElementById('artigo-fullscreen-body');
    if (!modal || !body) {
        console.error("Modal não encontrado");
        return;
    }
    
    // ===== CLONA O ARTIGO =====
    const conteudo = artigo.cloneNode(true);
    conteudo.style.cursor = 'default';
    conteudo.classList.add('artigo-fullscreen-active');
    
    // ===== REMOVE RODAPÉ E BOTÃO "LER MAIS" =====
    const rodape = conteudo.querySelector('.artigo-rodape');
    if (rodape) rodape.remove();
    const btnLerMais = conteudo.querySelector('.btn-ler-mais');
    if (btnLerMais) btnLerMais.remove();
    
    // ===== FORÇA A EXIBIÇÃO DO CORPO DO ARTIGO =====
    const corpo = conteudo.querySelector('.artigo-corpo');
    if (corpo) {
        // Remove qualquer classe que possa estar ocultando
        corpo.classList.remove('hidden', 'oculto');
        // Força o display block com !important via estilo inline
        corpo.setAttribute('style', 
            'display: block !important; ' +
            'max-height: none !important; ' +
            'overflow: visible !important; ' +
            'padding: 15px 20px !important; ' +
            'text-align: justify !important; ' +
            'text-justify: inter-word !important; ' +
            'word-break: break-word !important; ' +
            'overflow-wrap: break-word !important; ' +
            'word-wrap: break-word !important; ' +
            '-webkit-hyphens: auto !important; ' +
            '-moz-hyphens: auto !important; ' +
            '-ms-hyphens: auto !important; ' +
            'hyphens: auto !important;'
        );
        
        // Aplica formatação aos parágrafos
        const paragrafos = corpo.querySelectorAll('p');
        paragrafos.forEach(p => {
            p.setAttribute('style',
                'text-align: justify !important; ' +
                'text-justify: inter-word !important; ' +
                'word-break: break-word !important; ' +
                'overflow-wrap: break-word !important; ' +
                'word-wrap: break-word !important; ' +
                '-webkit-hyphens: auto !important; ' +
                '-moz-hyphens: auto !important; ' +
                '-ms-hyphens: auto !important; ' +
                'hyphens: auto !important; ' +
                'margin-bottom: 14px !important;'
            );
        });
        
        // Aplica formatação às listas
        const listas = corpo.querySelectorAll('ul, ol');
        listas.forEach(lista => {
            lista.setAttribute('style',
                'padding-left: 25px !important; ' +
                'margin-bottom: 14px !important;'
            );
        });
        
        const itens = corpo.querySelectorAll('li');
        itens.forEach(item => {
            item.setAttribute('style',
                'text-align: justify !important; ' +
                '-webkit-hyphens: auto !important; ' +
                '-moz-hyphens: auto !important; ' +
                '-ms-hyphens: auto !important; ' +
                'hyphens: auto !important; ' +
                'overflow-wrap: break-word !important; ' +
                'word-wrap: break-word !important; ' +
                'text-justify: inter-word !important; ' +
                'word-break: break-word !important; ' +
                'margin-bottom: 6px !important;'
            );
        });
        
        const subtitulos = corpo.querySelectorAll('h3');
        subtitulos.forEach(h3 => {
            h3.setAttribute('style',
                'font-size: 1.1rem !important; ' +
                'margin-top: 20px !important; ' +
                'margin-bottom: 10px !important;'
            );
        });
    } else {
        console.warn("Corpo do artigo não encontrado para:", artigoId);
    }
    
    // ===== AJUSTA O RESUMO NO MODAL =====
    const resumo = conteudo.querySelector('.artigo-resumo');
    if (resumo) {
        resumo.setAttribute('style',
            'display: block !important; ' +
            'overflow: visible !important; ' +
            'max-height: none !important; ' +
            'padding: 0 20px 10px 20px !important; ' +
            'font-size: 1rem !important; ' +
            'text-align: justify !important; ' +
            'text-justify: inter-word !important; ' +
            'word-break: break-word !important; ' +
            'overflow-wrap: break-word !important; ' +
            'word-wrap: break-word !important; ' +
            '-webkit-hyphens: auto !important; ' +
            '-moz-hyphens: auto !important; ' +
            '-ms-hyphens: auto !important; ' +
            'hyphens: auto !important;'
        );
    }
    
    // ===== AJUSTA O TÍTULO NO MODAL =====
    const titulo = conteudo.querySelector('.artigo-titulo');
    if (titulo) {
        titulo.setAttribute('style',
            'font-size: 1.6rem !important; ' +
            'padding: 0 20px 10px 20px !important; ' +
            'text-align: justify !important; ' +
            'overflow: visible !important; ' +
            'max-height: none !important; ' +
            '-webkit-hyphens: auto !important; ' +
            '-moz-hyphens: auto !important; ' +
            '-ms-hyphens: auto !important; ' +
            'hyphens: auto !important;'
        );
    }
    
    // ===== AJUSTA A META NO MODAL =====
    const meta = conteudo.querySelector('.artigo-meta');
    if (meta) {
        meta.setAttribute('style',
            'padding: 10px 20px !important; ' +
            'margin-bottom: 15px !important; ' +
            'font-size: 0.85rem !important; ' +
            'display: flex !important; ' +
            'justify-content: space-between !important;'
        );
    }
    
    // ===== AJUSTA O BANNER NO MODAL =====
    const banner = conteudo.querySelector('.artigo-banner');
    if (banner) {
        banner.setAttribute('style',
            'margin: -20px -20px 20px -20px !important; ' +
            'width: calc(100% + 40px) !important; ' +
            'border-radius: 0 !important;'
        );
    }
    
    // ===== INSERE O CONTEÚDO NO MODAL =====
    body.innerHTML = '';
    body.appendChild(conteudo);
    
    // ===== ABRE O MODAL =====
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
    window.scrollTo(0, 0);
    
    // ===== INICIALIZA O SWIPE TO CLOSE =====
    initArtigoSwipeToClose();
}

function fecharArtigoFullscreen() { 
    const modal = document.getElementById('artigo-fullscreen-modal'); 
    if (modal) { 
        modal.classList.remove('active'); 
        document.body.style.overflow = ''; 
    } 
}

function initArtigoSwipeToClose() {
    const modal = document.getElementById('artigo-fullscreen-modal'); 
    const content = document.querySelector('.artigo-fullscreen-content'); 
    if (!modal || !content) return;
    let startX = 0, currentX = 0, isDragging = false;
    content.addEventListener('touchstart', (e) => { 
        startX = e.touches[0].clientX; 
        isDragging = true; 
        content.style.transition = 'none'; 
    }, { passive: true });
    content.addEventListener('touchmove', (e) => { 
        if (!isDragging) return; 
        currentX = e.touches[0].clientX; 
        const diffX = currentX - startX; 
        if (Math.abs(diffX) > 20) { 
            content.style.transform = `translateX(${diffX}px)`; 
            content.style.opacity = 1 - Math.abs(diffX) / 400; 
        } 
    }, { passive: true });
    content.addEventListener('touchend', () => { 
        if (!isDragging) return; 
        isDragging = false; 
        const diffX = currentX - startX; 
        content.style.transition = 'transform 0.3s ease, opacity 0.3s ease'; 
        if (Math.abs(diffX) > 100) { 
            content.style.transform = diffX > 0 ? 'translateX(150%)' : 'translateX(-150%)'; 
            content.style.opacity = '0'; 
            setTimeout(() => { 
                fecharArtigoFullscreen(); 
                content.style.transform = ''; 
                content.style.opacity = ''; 
            }, 300); 
        } else { 
            content.style.transform = ''; 
            content.style.opacity = ''; 
        } 
        currentX = 0; 
    });
}

function compartilharArtigo(artigoId, titulo) {
    const link = `https://www.vitaotub.com/feed/feed.html#${artigoId}`;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile && navigator.share) { navigator.share({ title: titulo || 'Artigo do VitãoTub', text: 'Confira este artigo!', url: link }).catch(() => {}); }
    else { navigator.clipboard.writeText(link).then(() => { alert('Link do artigo copiado! Compartilhe com seus amigos.'); }).catch(() => { const tempInput = document.createElement('input'); tempInput.value = link; document.body.appendChild(tempInput); tempInput.select(); document.execCommand('copy'); document.body.removeChild(tempInput); alert('Link do artigo copiado!'); }); }
}

function verificarArtigoNaUrl() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#artigo-')) {
        const artigoId = hash.substring(1);
        if (!artigosCarregados) { carregarTodosArtigos().then(() => { mudarAba('artigos'); setTimeout(() => { const artigo = document.getElementById(artigoId); if (artigo) abrirArtigoFullscreen(artigoId); }, 800); }); }
        else { mudarAba('artigos'); setTimeout(() => { const artigo = document.getElementById(artigoId); if (artigo) abrirArtigoFullscreen(artigoId); }, 800); }
    }
}

// ==================== 7. EVENTOS GLOBAIS ====================
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharVideoModal(); fecharArtigoFullscreen(); const translateDropdown = document.getElementById('translate-dropdown'); if (translateDropdown) translateDropdown.classList.remove('active'); } });
document.addEventListener('click', function(e) { const translateDropdown = document.getElementById('translate-dropdown'); const translateToggle = document.getElementById('translate-toggle'); if (translateDropdown && translateToggle) { if (!translateDropdown.contains(e.target) && e.target !== translateToggle) { translateDropdown.classList.remove('active'); } } });

// ==================== 8. BOTÃO DE TRADUÇÃO FLUTUANTE ====================
function toggleTranslateDropdown() { const dropdown = document.getElementById('translate-dropdown'); if (dropdown) dropdown.classList.toggle('active'); }
function translatePage(lang) { if (lang === 'pt') { const select = document.querySelector('.goog-te-combo'); if (select) { select.value = 'pt'; select.dispatchEvent(new Event('change')); setTimeout(() => { document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;'; window.location.reload(); }, 300); } else { document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;'; document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;'; window.location.reload(); } const dropdown = document.getElementById('translate-dropdown'); if (dropdown) dropdown.classList.remove('active'); return; } setGoogleTranslateCookie(lang); const checkExist = setInterval(() => { const select = document.querySelector('.goog-te-combo'); if (select) { clearInterval(checkExist); select.value = lang; select.dispatchEvent(new Event('change')); const dropdown = document.getElementById('translate-dropdown'); if (dropdown) dropdown.classList.remove('active'); updateActiveLanguage(lang); } }, 100); setTimeout(() => { if (!document.querySelector('.goog-te-combo')) window.location.reload(); }, 3000); }
function setGoogleTranslateCookie(lang) { const date = new Date(); date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000)); const expires = date.toUTCString(); document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'; document.cookie = lang === 'pt' ? `googtrans=/pt/pt; expires=${expires}; path=/` : `googtrans=/pt/${lang}; expires=${expires}; path=/`; }
function updateActiveLanguage(lang) { document.querySelectorAll('.translate-option').forEach(btn => { btn.classList.remove('active-lang'); if (btn.getAttribute('data-lang') === lang) btn.classList.add('active-lang'); }); }
function initTranslateWidget() { const toggleBtn = document.getElementById('translate-toggle'); const dropdown = document.getElementById('translate-dropdown'); if (!toggleBtn || !dropdown) return; toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleTranslateDropdown(); }); setTimeout(() => { const match = document.cookie.match(/googtrans=\/pt\/([^;]+)/); if (match && match[1]) updateActiveLanguage(match[1]); }, 1500); }

// ==================== 9. BOTÃO DE TRADUÇÃO ARRASTÁVEL E FECHÁVEL ====================
function initDraggableTranslate() {
    const widget = document.getElementById('translate-widget');
    const toggleBtn = document.getElementById('translate-toggle');
    if (!widget || !toggleBtn) return;
    if (localStorage.getItem('vitaotub_translate_hidden')) { widget.style.display = 'none'; return; }
    let isDragging = false; let startX, startY, startLeft, startBottom;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'translate-close-btn'; closeBtn.innerHTML = '✕'; closeBtn.title = 'Esconder tradutor';
    closeBtn.style.cssText = 'display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#ff0000;color:#fff;border:none;border-radius:50%;font-size:12px;cursor:pointer;z-index:1000;line-height:1;';
    widget.appendChild(closeBtn);
    toggleBtn.addEventListener('mouseenter', () => { closeBtn.style.display = 'block'; });
    widget.addEventListener('mouseleave', () => { if (!closeBtn.dataset.forced) closeBtn.style.display = 'none'; });
    let clickTimeout;
    toggleBtn.addEventListener('click', (e) => { if (isDragging) return; if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; closeBtn.style.display = 'block'; closeBtn.dataset.forced = 'true'; setTimeout(() => { closeBtn.style.display = 'none'; closeBtn.dataset.forced = ''; }, 3000); } else { clickTimeout = setTimeout(() => { clickTimeout = null; toggleTranslateDropdown(); }, 300); } });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); widget.style.display = 'none'; localStorage.setItem('vitaotub_translate_hidden', 'true'); });
    toggleBtn.addEventListener('mousedown', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.clientX; startY = e.clientY; const rect = widget.getBoundingClientRect(); startLeft = rect.left; startBottom = window.innerHeight - rect.bottom; widget.style.transition = 'none'; e.preventDefault(); });
    toggleBtn.addEventListener('touchstart', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY; const rect = widget.getBoundingClientRect(); startLeft = rect.left; startBottom = window.innerHeight - rect.bottom; widget.style.transition = 'none'; }, { passive: true });
    document.addEventListener('mousemove', (e) => { if (!isDragging) return; widget.style.left = `${startLeft + e.clientX - startX}px`; widget.style.bottom = `${startBottom - (e.clientY - startY)}px`; widget.style.right = 'auto'; widget.style.top = 'auto'; });
    document.addEventListener('touchmove', (e) => { if (!isDragging) return; widget.style.left = `${startLeft + e.touches[0].clientX - startX}px`; widget.style.bottom = `${startBottom - (e.touches[0].clientY - startY)}px`; widget.style.right = 'auto'; widget.style.top = 'auto'; }, { passive: true });
    document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; widget.style.transition = ''; } });
    document.addEventListener('touchend', () => { if (isDragging) { isDragging = false; widget.style.transition = ''; } });
}

// ==================== 10. BOTÃO DE INSTALAÇÃO PWA (APENAS MOBILE) ====================
document.addEventListener("DOMContentLoaded", () => {
    const pwaPopup = document.getElementById('pwa-install-popup');
    const pwaFloatingBtn = document.getElementById('pwa-floating-btn');
    if (!pwaPopup && !pwaFloatingBtn) return;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    if (!isMobile) { if (pwaPopup) pwaPopup.style.display = 'none'; if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; return; }
    if (localStorage.getItem('vitaotub_pwa_installed')) { if (pwaPopup) pwaPopup.style.display = 'none'; if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; return; }
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (isStandalone) { localStorage.setItem('vitaotub_pwa_installed', 'true'); return; }
    let deferredPrompt = null;
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredPrompt = e; const jaRejeitou = localStorage.getItem('vitaotub_pwa_rejected'); if (!jaRejeitou && pwaPopup) { pwaPopup.style.display = 'flex'; } else if (jaRejeitou && pwaFloatingBtn) { pwaFloatingBtn.style.display = 'flex'; } });
    const jaRejeitou = localStorage.getItem('vitaotub_pwa_rejected');
    if (jaRejeitou && pwaFloatingBtn) { pwaFloatingBtn.style.display = 'flex'; }
    if (!jaRejeitou && pwaPopup) { setTimeout(() => { if (pwaPopup.style.display !== 'flex' && !localStorage.getItem('vitaotub_pwa_rejected')) pwaPopup.style.display = 'flex'; }, 2000); }
    const installBtn = document.getElementById('pwa-install-btn');
    if (installBtn) { installBtn.addEventListener('click', async () => { if (deferredPrompt) { pwaPopup.style.display = 'none'; deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { localStorage.setItem('vitaotub_pwa_installed', 'true'); localStorage.removeItem('vitaotub_pwa_rejected'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none'; } else { localStorage.setItem('vitaotub_pwa_rejected', 'true'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex'; } deferredPrompt = null; } }); }
    const closeBtn = document.getElementById('pwa-close-btn');
    if (closeBtn) { closeBtn.addEventListener('click', () => { pwaPopup.style.display = 'none'; localStorage.setItem('vitaotub_pwa_rejected', 'true'); if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex'; }); }
    if (pwaFloatingBtn) { pwaFloatingBtn.addEventListener('click', async () => { if (deferredPrompt) { deferredPrompt.prompt(); const { outcome } = await deferredPrompt.userChoice; if (outcome === 'accepted') { localStorage.setItem('vitaotub_pwa_installed', 'true'); localStorage.removeItem('vitaotub_pwa_rejected'); pwaFloatingBtn.style.display = 'none'; } deferredPrompt = null; } else { alert('Para instalar, acesse as opções do seu navegador.'); } }); }
});

// ==================== 11. BOTÃO DE TEMA (CLARO/ESCURO) ====================
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('vitaotub_theme', 'light');
        if (themeBtn) { themeBtn.innerHTML = '🌙'; themeBtn.title = 'Mudar para modo escuro'; }
    } else {
        localStorage.setItem('vitaotub_theme', 'dark');
        if (themeBtn) { themeBtn.innerHTML = '☀️'; themeBtn.title = 'Mudar para modo claro'; }
    }
}

function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;
    const savedTheme = localStorage.getItem('vitaotub_theme');
    if (savedTheme === 'light') { document.body.classList.add('light-mode'); themeBtn.innerHTML = '🌙'; themeBtn.title = 'Mudar para modo escuro'; }
    else { themeBtn.innerHTML = '☀️'; themeBtn.title = 'Mudar para modo claro'; }
}

// ==================== 11.5 BOTÃO DE TEMA ARRASTÁVEL E FECHÁVEL ====================
function initDraggableTheme() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;
    if (localStorage.getItem('vitaotub_theme_hidden')) { themeBtn.style.display = 'none'; return; }
    let isDragging = false; let startX, startY, startTop, startRight;
    const closeBtn = document.createElement('button');
    closeBtn.className = 'theme-close-btn'; closeBtn.innerHTML = '✕'; closeBtn.title = 'Esconder botão de tema';
    closeBtn.style.cssText = 'display:none;position:absolute;top:-8px;right:-8px;width:22px;height:22px;background:#ff0000;color:#fff;border:none;border-radius:50%;font-size:12px;cursor:pointer;z-index:1000;line-height:1;';
    themeBtn.appendChild(closeBtn);
    themeBtn.addEventListener('mouseenter', () => { closeBtn.style.display = 'block'; });
    themeBtn.addEventListener('mouseleave', () => { if (!closeBtn.dataset.forced) closeBtn.style.display = 'none'; });
    let clickTimeout;
    themeBtn.addEventListener('click', (e) => { if (isDragging) return; if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; closeBtn.style.display = 'block'; closeBtn.dataset.forced = 'true'; setTimeout(() => { closeBtn.style.display = 'none'; closeBtn.dataset.forced = ''; }, 3000); } else { clickTimeout = setTimeout(() => { clickTimeout = null; toggleTheme(); }, 300); } });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); themeBtn.style.display = 'none'; localStorage.setItem('vitaotub_theme_hidden', 'true'); });
    themeBtn.addEventListener('mousedown', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.clientX; startY = e.clientY; const rect = themeBtn.getBoundingClientRect(); startTop = rect.top; startRight = window.innerWidth - rect.right; themeBtn.style.transition = 'none'; e.preventDefault(); });
    themeBtn.addEventListener('touchstart', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY; const rect = themeBtn.getBoundingClientRect(); startTop = rect.top; startRight = window.innerWidth - rect.right; themeBtn.style.transition = 'none'; }, { passive: true });
    document.addEventListener('mousemove', (e) => { if (!isDragging) return; themeBtn.style.top = `${startTop + e.clientY - startY}px`; themeBtn.style.right = `${startRight - (e.clientX - startX)}px`; themeBtn.style.left = 'auto'; themeBtn.style.bottom = 'auto'; });
    document.addEventListener('touchmove', (e) => { if (!isDragging) return; themeBtn.style.top = `${startTop + e.touches[0].clientY - startY}px`; themeBtn.style.right = `${startRight - (e.touches[0].clientX - startX)}px`; themeBtn.style.left = 'auto'; themeBtn.style.bottom = 'auto'; }, { passive: true });
    document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; themeBtn.style.transition = ''; } });
    document.addEventListener('touchend', () => { if (isDragging) { isDragging = false; themeBtn.style.transition = ''; } });
}

// ==================== 12. BOTÃO VOLTAR AO TOPO ====================
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) { backToTopButton.addEventListener('click', function(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

// ==================== 13. INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => { initTranslateWidget(); initDraggableTranslate(); initThemeToggle(); initDraggableTheme(); verificarArtigoNaUrl(); });