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

// ==================== 4. NAVEGAÇÃO POR ABAS (CORRIGIDA) ====================
function mudarAba(aba) {
    const btnVideos = document.getElementById('btn-tab-videos');
    const btnArtigos = document.getElementById('btn-tab-artigos');
    const btnProjetos = document.getElementById('btn-tab-projetos');
    const btnSobre = document.getElementById('btn-tab-sobre');
    const secaoVideos = document.getElementById('secao-videos');
    const secaoArtigos = document.getElementById('secao-artigos');
    const secaoProjetos = document.getElementById('secao-projetos');
    const secaoSobre = document.getElementById('secao-sobre');
    
    // Esconde todas as seções
    if (secaoVideos) secaoVideos.style.display = 'none';
    if (secaoArtigos) secaoArtigos.style.display = 'none';
    if (secaoProjetos) secaoProjetos.style.display = 'none';
    if (secaoSobre) secaoSobre.style.display = 'none';
    
    // Remove active de todos os botões
    if (btnVideos) { btnVideos.classList.remove('active'); btnVideos.setAttribute('aria-pressed', 'false'); }
    if (btnArtigos) { btnArtigos.classList.remove('active'); btnArtigos.setAttribute('aria-pressed', 'false'); }
    if (btnProjetos) { btnProjetos.classList.remove('active'); btnProjetos.setAttribute('aria-pressed', 'false'); }
    if (btnSobre) { btnSobre.classList.remove('active'); btnSobre.setAttribute('aria-pressed', 'false'); }
    
    // Ativa a aba selecionada
    if (aba === 'videos') {
        if (btnVideos) { btnVideos.classList.add('active'); btnVideos.setAttribute('aria-pressed', 'true'); }
        if (secaoVideos) secaoVideos.style.display = 'block';
    } else if (aba === 'artigos') {
        if (btnArtigos) { btnArtigos.classList.add('active'); btnArtigos.setAttribute('aria-pressed', 'true'); }
        if (secaoArtigos) secaoArtigos.style.display = 'block';
        if (!artigosCarregados) carregarTodosArtigos();
    } else if (aba === 'projetos') {
        if (btnProjetos) { btnProjetos.classList.add('active'); btnProjetos.setAttribute('aria-pressed', 'true'); }
        if (secaoProjetos) secaoProjetos.style.display = 'block';
        if (!projetosCarregados) carregarProjetos();
    } else if (aba === 'sobre') {
        if (btnSobre) { btnSobre.classList.add('active'); btnSobre.setAttribute('aria-pressed', 'true'); }
        if (secaoSobre) secaoSobre.style.display = 'block';
    }
}

// ==================== CARREGAR PROJETOS NO FEED ====================
let projetosCarregados = false;

async function carregarProjetos() {
    const container = document.getElementById('projetos-feed-container');
    if (!container) return;
    
    // Os mesmos projetos do meus-projetos.html, mas em formato compacto
    const projetos = [
        {
            id: 1,
            nome: 'VitãoTub',
            plataforma: 'YouTube',
            descricao: 'Canal principal de tecnologia, segurança digital e games.',
            link: 'https://www.youtube.com/@vitaotub?sub_confirmation=1',
            imagem: '../projeto-001.jpg'
        },
        {
            id: 2,
            nome: 'Tutorials Insolentes',
            plataforma: 'YouTube',
            descricao: 'Canal secundário com tutoriais e dicas rápidas.',
            link: 'https://www.youtube.com/@tutoriaisinsolentes?sub_confirmation=1',
            imagem: '../projeto-002.jpg'
        },
        {
            id: 3,
            nome: 'Fedora Only Fans (FOF)',
            plataforma: 'GitHub',
            descricao: 'Aplicativo para tornar o Fedora Linux mais prático.',
            link: 'https://github.com/vitaotub/fedora-only-fans',
            imagem: '../projeto-003.jpg'
        },
        {
            id: 4,
            nome: 'Site VitãoTub',
            plataforma: 'GitHub',
            descricao: 'Site oficial com HTML, CSS e JavaScript puro.',
            link: 'https://github.com/vitaotub/vtub-site',
            imagem: '../projeto-004.jpg'
        },
        {
            id: 5,
            nome: 'WebApp VitãoTub',
            plataforma: 'GitHub',
            descricao: 'PWA com feed de vídeos e artigos.',
            link: 'https://github.com/vitaotub/vtub-app',
            imagem: '../projeto-005.jpg'
        }
    ];
    
    container.innerHTML = '';
    
    projetos.forEach(proj => {
        const card = document.createElement('div');
        card.className = 'projeto-card-feed';
        card.onclick = () => openProjectModal(proj.id);
        
        const isYoutube = proj.plataforma === 'YouTube';
        const platformClass = isYoutube ? 'platform-youtube' : 'platform-github';
        const platformIcon = isYoutube
            ? '<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>'
            : '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/></svg>';
        
        card.innerHTML = `
            <div class="projeto-card-feed-image">
                <img src="${proj.imagem}" alt="${proj.nome}" loading="lazy">
            </div>
            <div class="projeto-card-feed-info">
                <h4 class="projeto-card-feed-nome">${proj.nome}</h4>
                <span class="projeto-card-feed-platform ${platformClass}">${platformIcon} ${proj.plataforma}</span>
                <p class="projeto-card-feed-descricao">${proj.descricao}</p>
                <a href="${proj.link}" target="_blank" rel="noopener" class="projeto-card-feed-link" onclick="event.stopPropagation();">Ver Projeto</a>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    projetosCarregados = true;
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
                    postElement.innerHTML = `
    <div class="video-thumbnail-container" onclick="abrirVideoModal('${videoId}')" role="button" tabindex="0" aria-label="Assistir: ${escapeHtml(video.title)}">
        <img src="${thumbnailUrl}" alt="${escapeHtml(video.title)}" loading="lazy" class="video-thumbnail" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'">
        <div class="play-icon-overlay"><i class="fa-solid fa-circle-play"></i></div>
    </div>
    <div class="feed-content">
        <h2 class="video-title">${escapeHtml(video.title)}</h2>
        <div class="video-meta-wrapper">
            <div class="video-meta-left">
                <span class="video-date">📅 ${dataPub}</span>
                <span class="video-author">✍️ VitãoTub</span>
            </div>
            <div class="video-meta-right">
                <button class="btn-video-share" onclick="event.stopPropagation(); compartilharVideoFeed('${videoId}')" data-tooltip="Compartilhar vídeo" aria-label="Compartilhar vídeo">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                </button>
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener" class="btn-video-youtube" onclick="event.stopPropagation();" data-tooltip="Assistir no YouTube" aria-label="Assistir no YouTube">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                </a>
            </div>
        </div>
    </div>
`;
                    ytContainer.appendChild(postElement);
                }
            });
        } else { ytContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Não foi possível carregar os vídeos no momento.</p>'; }
    } catch (error) { console.error("Erro ao buscar feed do YouTube:", error); ytContainer.innerHTML = '<p style="text-align: center; color: #ff5555;">Erro ao carregar vídeos. Verifique sua conexão.</p>'; }
}

function compartilharVideoFeed(videoId) {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const mensagem = `🎬 Vídeo publicado no Canal VitãoTub: ${videoUrl}`;
    
    // Detecta se é dispositivo móvel E se suporta Web Share API
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isShareSupported = navigator.share !== undefined;
    
    // Se for mobile E suportar share, usa a API nativa
    if (isMobile && isShareSupported) {
        navigator.share({
            title: 'Vídeo do VitãoTub',
            text: 'Confira este vídeo no YouTube!',
            url: videoUrl
        }).catch((err) => {
            // Se o usuário cancelar, não faz nada
            if (err.name !== 'AbortError') {
                console.error('Erro ao compartilhar:', err);
            }
        });
        return;
    }
    
    // Desktop ou mobile sem suporte: copia para área de transferência
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mensagem)
            .then(() => {
                alert('✅ Link do vídeo copiado! Compartilhe com seus amigos.');
            })
            .catch(() => {
                // Fallback: input temporário
                const tempInput = document.createElement('input');
                tempInput.value = mensagem;
                tempInput.style.position = 'fixed';
                tempInput.style.opacity = '0';
                document.body.appendChild(tempInput);
                tempInput.select();
                try {
                    document.execCommand('copy');
                    alert('✅ Link do vídeo copiado! Compartilhe com seus amigos.');
                } catch (e) {
                    alert('❌ Não foi possível copiar o link. Tente manualmente.');
                }
                document.body.removeChild(tempInput);
            });
    } else {
        // Fallback mais antigo
        const tempInput = document.createElement('input');
        tempInput.value = mensagem;
        tempInput.style.position = 'fixed';
        tempInput.style.opacity = '0';
        document.body.appendChild(tempInput);
        tempInput.select();
        try {
            document.execCommand('copy');
            alert('✅ Link do vídeo copiado! Compartilhe com seus amigos.');
        } catch (e) {
            alert('❌ Não foi possível copiar o link. Tente manualmente.');
        }
        document.body.removeChild(tempInput);
    }
}

// ==================== 6. MODAL DE VÍDEO EM TELA CHEIA ====================
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

// ==================== 7. SISTEMA DE ARTIGOS ====================
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

function abrirArtigoFullscreen(artigoId) {
    const artigo = document.getElementById(artigoId);
    if (!artigo) return;
    const modal = document.getElementById('artigo-fullscreen-modal');
    const body = document.getElementById('artigo-fullscreen-body');
    if (!modal || !body) return;
    const conteudo = artigo.cloneNode(true);
    conteudo.style.cursor = 'default';
    conteudo.classList.add('artigo-fullscreen-active');
    const btnLerMais = conteudo.querySelector('.btn-ler-mais');
    if (btnLerMais) btnLerMais.remove();
    
    const corpo = conteudo.querySelector('.artigo-corpo');
    if (corpo) {
        corpo.style.setProperty('display', 'block', 'important');
        corpo.style.setProperty('max-height', 'none', 'important');
        corpo.style.setProperty('overflow', 'visible', 'important');
        corpo.style.setProperty('padding', '15px 20px', 'important');
        corpo.style.setProperty('text-align', 'justify', 'important');
        corpo.style.setProperty('text-justify', 'inter-word', 'important');
        corpo.style.setProperty('word-break', 'break-word', 'important');
        corpo.style.setProperty('overflow-wrap', 'break-word', 'important');
        corpo.style.setProperty('word-wrap', 'break-word', 'important');
        corpo.style.setProperty('-webkit-hyphens', 'auto', 'important');
        corpo.style.setProperty('-moz-hyphens', 'auto', 'important');
        corpo.style.setProperty('-ms-hyphens', 'auto', 'important');
        corpo.style.setProperty('hyphens', 'auto', 'important');
        
        const paragrafos = corpo.querySelectorAll('p');
        paragrafos.forEach(p => {
            p.style.setProperty('text-align', 'justify', 'important');
            p.style.setProperty('text-justify', 'inter-word', 'important');
            p.style.setProperty('word-break', 'break-word', 'important');
            p.style.setProperty('overflow-wrap', 'break-word', 'important');
            p.style.setProperty('word-wrap', 'break-word', 'important');
            p.style.setProperty('-webkit-hyphens', 'auto', 'important');
            p.style.setProperty('-moz-hyphens', 'auto', 'important');
            p.style.setProperty('-ms-hyphens', 'auto', 'important');
            p.style.setProperty('hyphens', 'auto', 'important');
            p.style.setProperty('margin-bottom', '14px', 'important');
            p.style.setProperty('text-indent', '1.5em', 'important');
        });
    }
    
    body.innerHTML = '';
    body.appendChild(conteudo);
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    modal.scrollTop = 0;
    window.scrollTo(0, 0);
    initArtigoSwipeToClose();
}
function fecharArtigoFullscreen() { const modal = document.getElementById('artigo-fullscreen-modal'); if (modal) { modal.classList.remove('active'); document.body.style.overflow = ''; } }
function initArtigoSwipeToClose() {
    const modal = document.getElementById('artigo-fullscreen-modal'); const content = document.querySelector('.artigo-fullscreen-content'); if (!modal || !content) return;
    let startX = 0, currentX = 0, isDragging = false;
    content.addEventListener('touchstart', (e) => { startX = e.touches[0].clientX; isDragging = true; content.style.transition = 'none'; }, { passive: true });
    content.addEventListener('touchmove', (e) => { if (!isDragging) return; currentX = e.touches[0].clientX; const diffX = currentX - startX; if (Math.abs(diffX) > 20) { content.style.transform = `translateX(${diffX}px)`; content.style.opacity = 1 - Math.abs(diffX) / 400; } }, { passive: true });
    content.addEventListener('touchend', () => { if (!isDragging) return; isDragging = false; const diffX = currentX - startX; content.style.transition = 'transform 0.3s ease, opacity 0.3s ease'; if (Math.abs(diffX) > 100) { content.style.transform = diffX > 0 ? 'translateX(150%)' : 'translateX(-150%)'; content.style.opacity = '0'; setTimeout(() => { fecharArtigoFullscreen(); content.style.transform = ''; content.style.opacity = ''; }, 300); } else { content.style.transform = ''; content.style.opacity = ''; } currentX = 0; });
}
function compartilharArtigo(artigoId, titulo) {
    const link = `https://www.vitaotub.com/feed/index.html#${artigoId}`;
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

// ==================== 8. EVENTOS GLOBAIS ====================
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fecharVideoModal(); fecharArtigoFullscreen(); const translateDropdown = document.getElementById('translate-dropdown'); if (translateDropdown) translateDropdown.classList.remove('active'); } });

// ===== CONTROLE DO DROPDOWN DE TRADUÇÃO =====
document.addEventListener('click', function(e) {
    const translateDropdown = document.getElementById('translate-dropdown');
    const translateToggle = document.getElementById('translate-toggle');
    
    if (!translateDropdown || !translateToggle) return;
    
    if (!translateDropdown.contains(e.target) && e.target !== translateToggle) {
        setTimeout(() => {
            translateDropdown.classList.remove('active');
        }, 150);
    }
});

function toggleTranslateDropdown(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    const dropdown = document.getElementById('translate-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// ==================== 9. BOTÃO DE TRADUÇÃO FLUTUANTE ====================
function translatePage(lang) {
    if (lang === 'pt') {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = 'pt';
            select.dispatchEvent(new Event('change'));
            setTimeout(() => {
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;';
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;';
                window.location.reload();
            }, 300);
        } else {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/feed/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;';
            window.location.reload();
        }
        const dropdown = document.getElementById('translate-dropdown');
        if (dropdown) dropdown.classList.remove('active');
        return;
    }
    setGoogleTranslateCookie(lang);
    const checkExist = setInterval(() => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            clearInterval(checkExist);
            select.value = lang;
            select.dispatchEvent(new Event('change'));
            const dropdown = document.getElementById('translate-dropdown');
            if (dropdown) dropdown.classList.remove('active');
            updateActiveLanguage(lang);
        }
    }, 100);
    setTimeout(() => {
        if (!document.querySelector('.goog-te-combo')) window.location.reload();
    }, 3000);
}

function setGoogleTranslateCookie(lang) {
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = date.toUTCString();
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = lang === 'pt' ? `googtrans=/pt/pt; expires=${expires}; path=/` : `googtrans=/pt/${lang}; expires=${expires}; path=/`;
}

function updateActiveLanguage(lang) {
    document.querySelectorAll('.translate-option').forEach(btn => {
        btn.classList.remove('active-lang');
        if (btn.getAttribute('data-lang') === lang) btn.classList.add('active-lang');
    });
}

function initTranslateWidget() {
    const toggleBtn = document.getElementById('translate-toggle');
    const dropdown = document.getElementById('translate-dropdown');
    if (!toggleBtn || !dropdown) return;
    
    toggleBtn.removeEventListener('click', toggleTranslateDropdown);
    toggleBtn.addEventListener('click', toggleTranslateDropdown);
    
    setTimeout(() => {
        const match = document.cookie.match(/googtrans=\/pt\/([^;]+)/);
        if (match && match[1]) updateActiveLanguage(match[1]);
    }, 1500);
}

// ==================== 10. BOTÃO DE TRADUÇÃO ARRASTÁVEL E FECHÁVEL ====================
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
    toggleBtn.addEventListener('click', (e) => { if (isDragging) return; if (clickTimeout) { clearTimeout(clickTimeout); clickTimeout = null; closeBtn.style.display = 'block'; closeBtn.dataset.forced = 'true'; setTimeout(() => { closeBtn.style.display = 'none'; closeBtn.dataset.forced = ''; }, 3000); } else { clickTimeout = setTimeout(() => { clickTimeout = null; toggleTranslateDropdown(e); }, 300); } });
    closeBtn.addEventListener('click', (e) => { e.stopPropagation(); widget.style.display = 'none'; localStorage.setItem('vitaotub_translate_hidden', 'true'); });
    toggleBtn.addEventListener('mousedown', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.clientX; startY = e.clientY; const rect = widget.getBoundingClientRect(); startLeft = rect.left; startBottom = window.innerHeight - rect.bottom; widget.style.transition = 'none'; e.preventDefault(); });
    toggleBtn.addEventListener('touchstart', (e) => { if (e.target === closeBtn) return; isDragging = true; startX = e.touches[0].clientX; startY = e.touches[0].clientY; const rect = widget.getBoundingClientRect(); startLeft = rect.left; startBottom = window.innerHeight - rect.bottom; widget.style.transition = 'none'; }, { passive: true });
    document.addEventListener('mousemove', (e) => { if (!isDragging) return; widget.style.left = `${startLeft + e.clientX - startX}px`; widget.style.bottom = `${startBottom - (e.clientY - startY)}px`; widget.style.right = 'auto'; widget.style.top = 'auto'; });
    document.addEventListener('touchmove', (e) => { if (!isDragging) return; widget.style.left = `${startLeft + e.touches[0].clientX - startX}px`; widget.style.bottom = `${startBottom - (e.touches[0].clientY - startY)}px`; widget.style.right = 'auto'; widget.style.top = 'auto'; }, { passive: true });
    document.addEventListener('mouseup', () => { if (isDragging) { isDragging = false; widget.style.transition = ''; } });
    document.addEventListener('touchend', () => { if (isDragging) { isDragging = false; widget.style.transition = ''; } });
}

// ==================== 11. BOTÃO DE INSTALAÇÃO PWA (APENAS MOBILE) ====================
document.addEventListener("DOMContentLoaded", () => {
    const pwaPopup = document.getElementById('pwa-install-popup');
    const popupContent = document.getElementById('pwa-popup-content');
    const pwaFloatingBtn = document.getElementById('pwa-floating-btn');
    
    if (!pwaPopup || !popupContent) {
        console.warn("Elementos PWA não encontrados");
        return;
    }
    
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    
    if (isStandalone) {
        localStorage.setItem('vitaotub_pwa_installed', 'true');
        pwaPopup.style.display = 'none';
        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none';
        return;
    }
    
    const jaEntendeu = localStorage.getItem('vitaotub_pwa_entendido');
    const jaInstalou = localStorage.getItem('vitaotub_pwa_installed');
    const jaRejeitou = localStorage.getItem('vitaotub_pwa_rejected');
    
    if (!isMobile) {
        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none';
        if (jaEntendeu) return;
        
        popupContent.innerHTML = `
            <h2>📱 App para Celular!</h2>
            <img src="../logo-app-popup.png" alt="Ícone do App" class="pwa-welcome-img" onerror="this.style.display='none'">
            <p>Este site possui um <strong>App para celular</strong> com notícias, matérias e novidades. Acesse pelo seu próprio celular e o App estará disponível para instalação!</p>
            <button id="pwa-desktop-ok-btn" class="pwa-btn-install">Entendi! 👍</button>
        `;
        
        setTimeout(() => {
            if (!localStorage.getItem('vitaotub_pwa_entendido')) {
                pwaPopup.style.display = 'flex';
            }
        }, 2000);
        
        document.getElementById('pwa-desktop-ok-btn').addEventListener('click', () => {
            pwaPopup.style.display = 'none';
            localStorage.setItem('vitaotub_pwa_entendido', 'true');
        });
        return;
    }
    
    if (jaInstalou) {
        pwaPopup.style.display = 'none';
        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none';
        return;
    }
    
    function preencherPopup(mensagem) {
        if (!popupContent) return;
        popupContent.innerHTML = mensagem;
    }
    
    function mostrarPopupPadrao() {
        if (jaRejeitou) {
            if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
            return;
        }
        
        preencherPopup(`
            <h2>Bem-Vindo!</h2>
            <img src="../logo-app-popup.png" alt="Ícone do App" class="pwa-welcome-img" onerror="this.style.display='none'">
            <p>Este site é a apresentação do canal. Se você quiser receber notificações direto no seu celular sobre novos vídeos, lives e artigos exclusivos, instale meu App oficial!</p>
            <button id="pwa-install-btn" class="pwa-btn-install">Instalar App</button>
            <button id="pwa-close-btn" class="pwa-btn-close">Agora não</button>
        `);
        
        pwaPopup.style.display = 'flex';
        
        document.getElementById('pwa-install-btn').addEventListener('click', async () => {
            if (deferredPrompt) {
                pwaPopup.style.display = 'none';
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    localStorage.setItem('vitaotub_pwa_installed', 'true');
                    localStorage.removeItem('vitaotub_pwa_rejected');
                    if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none';
                } else {
                    localStorage.setItem('vitaotub_pwa_rejected', 'true');
                    if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
                }
                deferredPrompt = null;
            } else {
                alert('Para instalar, acesse as opções do seu navegador e selecione "Adicionar à tela inicial".');
                localStorage.setItem('vitaotub_pwa_rejected', 'true');
                pwaPopup.style.display = 'none';
                if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
            }
        });
        
        document.getElementById('pwa-close-btn').addEventListener('click', () => {
            pwaPopup.style.display = 'none';
            localStorage.setItem('vitaotub_pwa_rejected', 'true');
            if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
        });
    }
    
    let deferredPrompt = null;
    
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log("beforeinstallprompt capturado!");
        
        if (!jaRejeitou) {
            preencherPopup(`
                <h2>Bem-Vindo!</h2>
                <img src="../logo-app-popup.png" alt="Ícone do App" class="pwa-welcome-img" onerror="this.style.display='none'">
                <p>Este site é a apresentação do canal. Se você quiser receber notificações direto no seu celular sobre novos vídeos, lives e artigos exclusivos, instale meu App oficial!</p>
                <button id="pwa-install-btn" class="pwa-btn-install">Instalar App</button>
                <button id="pwa-close-btn" class="pwa-btn-close">Agora não</button>
            `);
            pwaPopup.style.display = 'flex';
            
            document.getElementById('pwa-install-btn').addEventListener('click', async () => {
                if (deferredPrompt) {
                    pwaPopup.style.display = 'none';
                    deferredPrompt.prompt();
                    const { outcome } = await deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        localStorage.setItem('vitaotub_pwa_installed', 'true');
                        localStorage.removeItem('vitaotub_pwa_rejected');
                        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'none';
                    } else {
                        localStorage.setItem('vitaotub_pwa_rejected', 'true');
                        if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
                    }
                    deferredPrompt = null;
                }
            });
            
            document.getElementById('pwa-close-btn').addEventListener('click', () => {
                pwaPopup.style.display = 'none';
                localStorage.setItem('vitaotub_pwa_rejected', 'true');
                if (pwaFloatingBtn) pwaFloatingBtn.style.display = 'flex';
            });
        } else if (jaRejeitou && pwaFloatingBtn) {
            pwaFloatingBtn.style.display = 'flex';
        }
    });
    
    if (jaRejeitou && pwaFloatingBtn) {
        pwaFloatingBtn.style.display = 'flex';
    }
    
    if (!jaRejeitou && !jaInstalou) {
        setTimeout(() => {
            if (pwaPopup.style.display !== 'flex' && !localStorage.getItem('vitaotub_pwa_rejected')) {
                console.log("Mostrando popup padrão (beforeinstallprompt não disparou)");
                mostrarPopupPadrao();
            }
        }, 3000);
    }
    
    if (pwaFloatingBtn) {
        pwaFloatingBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') {
                    localStorage.setItem('vitaotub_pwa_installed', 'true');
                    localStorage.removeItem('vitaotub_pwa_rejected');
                    pwaFloatingBtn.style.display = 'none';
                }
                deferredPrompt = null;
            } else {
                alert('Para instalar, acesse as opções do seu navegador e selecione "Adicionar à tela inicial".');
            }
        });
    }
});

// ==================== 12. BOTÃO DE TEMA (CLARO/ESCURO) ====================
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

// ==================== 13. BOTÃO DE TEMA ARRASTÁVEL E FECHÁVEL ====================
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

// ==================== 14. BOTÃO VOLTAR AO TOPO ====================
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) { backToTopButton.addEventListener('click', function(e) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }); }

// ==================== 15. INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => { initTranslateWidget(); initDraggableTranslate(); initThemeToggle(); initDraggableTheme(); verificarArtigoNaUrl(); });