/**
 * ============================================================
 * VITÃOTUB - JAVASCRIPT DO FEED
 * Descrição: Lógica de abas, carregamento de vídeos via RSS,
 * modal de artigo, modal de vídeo em tela cheia,
 * compartilhamento e botões flutuantes
 * Organizado por seções para facilitar manutenção
 * ============================================================
 */

// ==================== 1. CONFIGURAÇÕES ====================
const CONFIG = {
    articleModalId: 'article-modal',
    channelID: 'UCUNyU0HewM1JQVVKMAEAfyQ'
};

// ==================== 2. UTILITÁRIOS ====================
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==================== 3. SERVICE WORKER ====================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(() => console.log('Service Worker registrado com sucesso!'))
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

    if (aba === 'videos') {
        if (btnVideos) { btnVideos.classList.add('active'); btnVideos.setAttribute('aria-pressed', 'true'); }
        if (secaoVideos) secaoVideos.style.display = 'block';
    } else if (aba === 'artigos') {
        if (btnArtigos) { btnArtigos.classList.add('active'); btnArtigos.setAttribute('aria-pressed', 'true'); }
        if (secaoArtigos) secaoArtigos.style.display = 'block';
    } else if (aba === 'sobre') {
        if (btnSobre) { btnSobre.classList.add('active'); btnSobre.setAttribute('aria-pressed', 'true'); }
        if (secaoSobre) secaoSobre.style.display = 'block';
    }
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
                            <h2>${escapeHtml(video.title)}</h2>
                            <div class="feed-meta-header">
                                <span class="feed-date">📅 ${dataPub}</span>
                                <span class="feed-author">✍️ VitãoTub</span>
                            </div>
                        </div>
                    `;
                    ytContainer.appendChild(postElement);
                }
            });
        } else {
            ytContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Não foi possível carregar os vídeos no momento.</p>';
        }
    } catch (error) {
        console.error("Erro ao buscar feed do YouTube:", error);
        ytContainer.innerHTML = '<p style="text-align: center; color: #ff5555;">Erro ao carregar vídeos. Verifique sua conexão.</p>';
    }
}

// ==================== 5.1 MODAL DE VÍDEO EM TELA CHEIA ====================
function abrirVideoModal(videoId) {
    let modal = document.getElementById('video-fullscreen-modal');
    
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'video-fullscreen-modal';
        modal.className = 'video-fullscreen-modal';
        modal.innerHTML = `
            <button class="video-fullscreen-close" id="video-close-btn" aria-label="Fechar vídeo">
                <i class="fa-solid fa-xmark"></i>
            </button>
            <div class="video-fullscreen-container" id="video-container">
                <iframe id="video-fullscreen-iframe" src="" frameborder="0" allow="autoplay; encrypted-media; fullscreen" allowfullscreen></iframe>
            </div>
            <div class="video-tap-hint" id="video-tap-hint">Toque na tela para ver o botão fechar</div>
        `;
        document.body.appendChild(modal);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) fecharVideoModal();
        });
        
        let hideTimeout;
        
        modal.addEventListener('click', function() {
            const closeBtn = document.getElementById('video-close-btn');
            const tapHint = document.getElementById('video-tap-hint');
            if (closeBtn) closeBtn.classList.add('visible');
            if (tapHint) tapHint.classList.remove('visible');
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => { if (closeBtn) closeBtn.classList.remove('visible'); }, 3000);
        });
        
        modal.addEventListener('mousemove', function() {
            const closeBtn = document.getElementById('video-close-btn');
            if (closeBtn) closeBtn.classList.add('visible');
            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => { if (closeBtn) closeBtn.classList.remove('visible'); }, 3000);
        });
    }
    
    const iframe = document.getElementById('video-fullscreen-iframe');
    iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
    
    const closeBtn = document.getElementById('video-close-btn');
    const tapHint = document.getElementById('video-tap-hint');
    if (closeBtn) closeBtn.classList.add('visible');
    if (tapHint) tapHint.classList.add('visible');
    
    setTimeout(() => {
        if (closeBtn) closeBtn.classList.remove('visible');
        if (tapHint) tapHint.classList.remove('visible');
    }, 4000);
    
    verificarOrientacao();
    window.addEventListener('orientationchange', verificarOrientacao);
}

function fecharVideoModal() {
    const modal = document.getElementById('video-fullscreen-modal');
    const iframe = document.getElementById('video-fullscreen-iframe');
    if (modal) {
        modal.classList.remove('active');
        if (iframe) iframe.src = '';
        document.body.style.overflow = '';
    }
    window.removeEventListener('orientationchange', verificarOrientacao);
}

function verificarOrientacao() {
    const container = document.getElementById('video-container');
    if (!container) return;
    
    if (window.innerWidth > window.innerHeight) {
        container.classList.add('landscape');
        container.classList.remove('portrait');
    } else {
        container.classList.add('portrait');
        container.classList.remove('landscape');
    }
}

// ==================== 6. MODAL DE ARTIGO ====================
function abrirArtigoHtml(botaoElemento) {
    const card = botaoElemento.closest('.article-card, .feed-card');
    if (!card) return;

    const titulo = card.getAttribute('data-titulo') || card.querySelector('h2, h3')?.innerText || 'Artigo';
    const dataPub = card.getAttribute('data-data') || '';
    const autor = card.getAttribute('data-autor') || 'Vitão';
    const conteudoCompleto = card.getAttribute('data-conteudo') || card.querySelector('p')?.innerHTML || 'Conteúdo em breve...';

    const modal = document.getElementById(CONFIG.articleModalId);
    const modalBody = document.getElementById('modal-body-content');

    if (modal && modalBody) {
        modalBody.innerHTML = `
            <h1 class="article-modal-title">${escapeHtml(titulo)}</h1>
            <div class="article-modal-meta">
                <span class="article-modal-date">📅 ${escapeHtml(dataPub)}</span>
                <span class="article-modal-author">Por: ${escapeHtml(autor)}</span>
            </div>
            <div class="article-modal-text">${conteudoCompleto}</div>
            <div class="article-modal-footer">
                <div class="article-modal-socials">
                    <a href="https://instagram.com/vitaotub" target="_blank" class="social-btn instagram" title="Instagram" rel="noopener noreferrer" aria-label="Instagram do VitãoTub"><i class="fa-brands fa-instagram"></i></a>
                    <a href="https://youtube.com/@VitaoTub" target="_blank" class="social-btn youtube" title="YouTube" rel="noopener noreferrer" aria-label="Canal do YouTube"><i class="fa-brands fa-youtube"></i></a>
                </div>
                <div class="article-modal-actions">
                    <button class="btn-action-icon btn-share-icon" onclick="compartilharArtigoModal('${escapeHtml(titulo).replace(/'/g, "\\'")}', this)" title="Compartilhar" aria-label="Compartilhar artigo"><i class="fa-solid fa-share-nodes"></i></button>
                    <a href="https://www.youtube.com/@VitaoTub?sub_confirmation=1" target="_blank" class="btn-action-icon btn-subscribe-icon" title="Inscrever-se" rel="noopener noreferrer" aria-label="Inscrever-se no canal"><i class="fa-brands fa-youtube"></i></a>
                </div>
            </div>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function fecharArtigoCompleto() {
    const modal = document.getElementById(CONFIG.articleModalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ==================== 7. COMPARTILHAMENTO ====================
function compartilharArtigoModal(tituloArtigo, elementoBotao) {
    let linkParaCompartilhar = window.location.href.split('#')[0];
    
    if (elementoBotao) {
        let card = elementoBotao.closest('.article-card, .feed-card');
        if (!card) {
            const tituloModal = document.querySelector('.article-modal-title');
            if (tituloModal) {
                const cards = document.querySelectorAll('.article-card, .feed-card');
                for (let c of cards) {
                    const t = c.getAttribute('data-titulo') || c.querySelector('h2')?.innerText;
                    if (t === tituloModal.innerText) { card = c; break; }
                }
            }
        }
        if (card && card.id) { linkParaCompartilhar += '#' + card.id; }
    }

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
        navigator.share({ title: tituloArtigo || document.title, url: linkParaCompartilhar }).catch(() => {});
    } else {
        navigator.clipboard.writeText(linkParaCompartilhar)
            .then(() => { alert('Link direto para o artigo copiado para a área de transferência!'); })
            .catch(() => {
                const tempInput = document.createElement('input');
                tempInput.value = linkParaCompartilhar;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                alert('Link direto copiado!');
            });
    }
}

// ==================== 8. EVENTOS GLOBAIS ====================
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharArtigoCompleto();
        fecharVideoModal();
        const translateDropdown = document.getElementById('translate-dropdown');
        if (translateDropdown) translateDropdown.classList.remove('active');
    }
});

document.addEventListener('click', function(e) {
    if (e.target.id === CONFIG.articleModalId || e.target.classList.contains('article-modal-overlay')) {
        fecharArtigoCompleto();
    }
    const translateDropdown = document.getElementById('translate-dropdown');
    const translateToggle = document.getElementById('translate-toggle');
    if (translateDropdown && translateToggle) {
        if (!translateDropdown.contains(e.target) && e.target !== translateToggle) {
            translateDropdown.classList.remove('active');
        }
    }
});

// ==================== 9. BOTÃO DE TRADUÇÃO FLUTUANTE ====================
function toggleTranslateDropdown() {
    const dropdown = document.getElementById('translate-dropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

function translatePage(lang) {
    if (lang === 'pt') { setGoogleTranslateCookie('pt'); window.location.reload(); return; }
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
    
    setTimeout(() => { if (!document.querySelector('.goog-te-combo')) window.location.reload(); }, 3000);
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
    
    toggleBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleTranslateDropdown(); });
    
    setTimeout(() => {
        const match = document.cookie.match(/googtrans=\/pt\/([^;]+)/);
        if (match && match[1]) updateActiveLanguage(match[1]);
    }, 1500);
}

// ==================== 10. BOTÃO VOLTAR AO TOPO ====================
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) {
    backToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ==================== 11. INICIALIZAÇÃO ====================
document.addEventListener("DOMContentLoaded", () => {
    initTranslateWidget();
});