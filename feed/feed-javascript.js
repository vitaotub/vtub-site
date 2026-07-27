/**
 * Website do canal VitãoTub - v0.2
 * Desenvolvido por: Victor (Vitão)
 */

// --- CONFIGURAÇÕES GERAIS ---
const CONFIG = {
    modalId: 'video-modal',
    iframeTargetId: 'modal-iframe-target',
    toastContainerId: 'toast-overlay',
    articleModalId: 'article-modal'
};

// --- SANITIZADOR DE HTML ---
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// --- REGISTRO SEGURO DE SERVICE WORKER (Evita erros em file://) ---
if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then(() => console.log('Service Worker registrado com sucesso!'))
            .catch(error => console.log('Erro ao registrar o Service Worker:', error));
    });
}

// --- LÓGICA DO POPUP DE INSTALAÇÃO PWA ---
document.addEventListener("DOMContentLoaded", () => {
    const pwaPopup = document.getElementById('pwa-install-popup');
    const installBtn = document.getElementById('pwa-install-btn');
    const closeBtn = document.getElementById('pwa-close-btn');

    if (!pwaPopup) return;

    let deferredPrompt = null;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        pwaPopup.style.display = 'flex';
    });

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (!isStandalone) {
        setTimeout(() => {
            if (pwaPopup.style.display !== 'flex' && !localStorage.getItem('pwa_closed')) {
                pwaPopup.style.display = 'flex';
                pwaPopup.classList.add('show');
            }
        }, 3000);
    }

    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                pwaPopup.style.display = 'none';
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') console.log('App instalado!');
                deferredPrompt = null;
            } else {
                alert('Para instalar: Clique no menu do seu navegador e escolha "Adicionar à Tela Inicial" ou "Instalar aplicativo".');
            }
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            pwaPopup.style.display = 'none';
            pwaPopup.classList.remove('show');
            localStorage.setItem('pwa_closed', 'true');
        });
    }
});

// --- SISTEMA DE MODAL DE VÍDEO ---
function openVideo(videoId) {
    const modal = document.getElementById(CONFIG.modalId);
    const target = document.getElementById(CONFIG.iframeTargetId);
    if (modal && target) {
        target.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" loading="lazy" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeVideo() {
    const modal = document.getElementById(CONFIG.modalId);
    const target = document.getElementById(CONFIG.iframeTargetId);
    if (modal) {
        if (target) target.innerHTML = '';
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

function closeToast() {
    const toast = document.getElementById(CONFIG.toastContainerId);
    if (toast) {
        toast.classList.remove('show');
        document.body.style.overflow = '';
    }
}

function fecharArtigoCompleto() {
    const modal = document.getElementById(CONFIG.articleModalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// --- NAVEGAÇÃO POR ABAS ---
function mudarAba(aba) {
    const btnVideos = document.getElementById('btn-tab-videos');
    const btnArtigos = document.getElementById('btn-tab-artigos');
    const btnSobre = document.getElementById('btn-tab-sobre');
    
    const secaoVideos = document.getElementById('secao-videos');
    const secaoArtigos = document.getElementById('secao-artigos');
    const secaoSobre = document.getElementById('secao-sobre');

    if(secaoVideos) secaoVideos.style.display = 'none';
    if(secaoArtigos) secaoArtigos.style.display = 'none';
    if(secaoSobre) secaoSobre.style.display = 'none';
    
    if(btnVideos) btnVideos.classList.remove('active');
    if(btnArtigos) btnArtigos.classList.remove('active');
    if(btnSobre) btnSobre.classList.remove('active');

    if (aba === 'videos') {
        if(btnVideos) btnVideos.classList.add('active');
        if(secaoVideos) secaoVideos.style.display = 'block';
    } else if (aba === 'artigos') {
        if(btnArtigos) btnArtigos.classList.add('active');
        if(secaoArtigos) secaoArtigos.style.display = 'block';
    } else if (aba === 'sobre') {
        if(btnSobre) btnSobre.classList.add('active');
        if(secaoSobre) secaoSobre.style.display = 'block';
    }
}

// --- CARREGAMENTO AUTOMÁTICO DO FEED DO YOUTUBE ---
const ytContainer = document.getElementById('youtube-feed-container');

if (ytContainer) {
    async function carregarYouTubeAutomatico() {
        try {
            const channelID = 'UCUNyU0HewM1JQVVKMAEAfyQ'; 
            const RSS_URL = `https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2ffeeds%2Fvideos.xml%3Fchannel_id%3D${channelID}`;
            
            const response = await fetch(RSS_URL);
            const data = await response.json();
            
            if (data.status === 'ok' && data.items.length > 0) {
                ytContainer.innerHTML = '';
                const ultimosVideos = data.items.slice(0, 15);
                
                ultimosVideos.forEach(video => {
                    const videoIdMatch = video.link.match(/(?:v=|\/embed\/|\/v\/|youtu\.be\/)([^&\n?#]+)/);
                    const videoId = videoIdMatch ? videoIdMatch[1] : '';
                    
                    if (videoId) {
                        const postElement = document.createElement('article');
                        postElement.className = 'feed-card';
                        const dataPub = new Date(video.pubDate).toLocaleDateString('pt-BR');
                        const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

                        postElement.innerHTML = `
                            <div class="video-thumbnail-container" onclick="openVideo('${videoId}')">
                                <img src="${thumbnailUrl}" alt="${escapeHtml(video.title)}" loading="lazy" class="video-thumbnail">
                                <div class="play-icon-overlay">
                                    <i class="fa-solid fa-circle-play"></i>
                                </div>
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
                ytContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Não foi possível carregar os vídeos automáticos no momento.</p>';
            }
        } catch (error) {
            console.error("Erro ao buscar feed do YouTube:", error);
            ytContainer.innerHTML = '<p style="text-align: center; color: #ff5555;">Conexão offline ou bloqueio de requisição local detectado.</p>';
        }
    }

    carregarYouTubeAutomatico();
}

// --- FUNÇÕES DE ARTIGOS E COMPARTILHAMENTO ---
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
                    <a href="https://facebook.com" target="_blank" class="social-btn facebook" title="Facebook"><i class="fa-brands fa-facebook"></i></a>
                    <a href="https://instagram.com/vitaotub" target="_blank" class="social-btn instagram" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
                    <a href="https://tiktok.com" target="_blank" class="social-btn tiktok" title="TikTok"><i class="fa-brands fa-tiktok"></i></a>
                    <a href="https://twitter.com" target="_blank" class="social-btn x-twitter" title="X"><i class="fa-brands fa-x-twitter"></i></a>
                    <a href="https://youtube.com/@VitaoTub" target="_blank" class="social-btn youtube" title="YouTube"><i class="fa-brands fa-youtube"></i></a>
                    <a href="https://vitaotub.com" target="_blank" class="social-btn website" title="Site Oficial"><i class="fa-solid fa-globe"></i></a>
                </div>
                
                <div class="article-modal-actions">
                    <button class="btn-action-icon btn-share-icon" onclick="compartilharArtigoModal('${escapeHtml(titulo).replace(/'/g, "\\'")}')" title="Compartilhar"><i class="fa-solid fa-share-nodes"></i></button>
                    <a href="https://www.youtube.com/@VitaoTub?sub_confirmation=1" target="_blank" class="btn-action-icon btn-subscribe-icon" title="Inscrever-se"><i class="fa-brands fa-youtube"></i></a>
                </div>
            </div>
        `;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// --- FUNÇÃO DE COMPARTILHAMENTO INTELIGENTE (PC E CELULAR) ---
function compartilharArtigoModal(tituloArtigo) {
    // Detecta se o usuário está em um dispositivo móvel
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    // No celular usa o menu nativo; no computador copia direto para a área de transferência (evita o bug do popup)
    if (isMobile && navigator.share) {
        navigator.share({ 
            title: tituloArtigo || document.title, 
            url: window.location.href 
        }).catch(() => {});
    } else {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                alert('Link copiado para a área de transferência!');
            })
            .catch(err => {
                // Fallback de segurança caso o navegador bloqueie o clipboard direto
                const tempInput = document.createElement('input');
                tempInput.value = window.location.href;
                document.body.appendChild(tempInput);
                tempInput.select();
                document.execCommand('copy');
                document.body.removeChild(tempInput);
                alert('Link copiado para a área de transferência!');
            });
    }
}