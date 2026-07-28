/**
 * ============================================================
 * VITÃOTUB - JAVASCRIPT DO FEED
 * Descrição: Lógica de abas, carregamento de vídeos via RSS,
 * modal de artigo, compartilhamento e PWA
 * Organizado por seções para facilitar manutenção
 * ============================================================
 */

// ==================== 1. CONFIGURAÇÕES ====================
const CONFIG = {
    articleModalId: 'article-modal',
    channelID: 'UCUNyU0HewM1JQVVKMAEAfyQ'
};

// ==================== 2. UTILITÁRIOS ====================
/**
 * Sanitiza texto para evitar injeção de HTML
 * @param {string} text - Texto a ser sanitizado
 * @returns {string} Texto seguro
 */
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
/**
 * Alterna entre as abas do feed (Vídeos, Artigos, Sobre)
 * @param {string} aba - Identificador da aba ('videos', 'artigos', 'sobre')
 */
function mudarAba(aba) {
    const btnVideos = document.getElementById('btn-tab-videos');
    const btnArtigos = document.getElementById('btn-tab-artigos');
    const btnSobre = document.getElementById('btn-tab-sobre');
    
    const secaoVideos = document.getElementById('secao-videos');
    const secaoArtigos = document.getElementById('secao-artigos');
    const secaoSobre = document.getElementById('secao-sobre');

    // Oculta todas as seções
    if (secaoVideos) secaoVideos.style.display = 'none';
    if (secaoArtigos) secaoArtigos.style.display = 'none';
    if (secaoSobre) secaoSobre.style.display = 'none';
    
    // Remove estado ativo de todos os botões
    if (btnVideos) {
        btnVideos.classList.remove('active');
        btnVideos.setAttribute('aria-pressed', 'false');
    }
    if (btnArtigos) {
        btnArtigos.classList.remove('active');
        btnArtigos.setAttribute('aria-pressed', 'false');
    }
    if (btnSobre) {
        btnSobre.classList.remove('active');
        btnSobre.setAttribute('aria-pressed', 'false');
    }

    // Ativa a aba selecionada
    if (aba === 'videos') {
        if (btnVideos) {
            btnVideos.classList.add('active');
            btnVideos.setAttribute('aria-pressed', 'true');
        }
        if (secaoVideos) secaoVideos.style.display = 'block';
    } else if (aba === 'artigos') {
        if (btnArtigos) {
            btnArtigos.classList.add('active');
            btnArtigos.setAttribute('aria-pressed', 'true');
        }
        if (secaoArtigos) secaoArtigos.style.display = 'block';
    } else if (aba === 'sobre') {
        if (btnSobre) {
            btnSobre.classList.add('active');
            btnSobre.setAttribute('aria-pressed', 'true');
        }
        if (secaoSobre) secaoSobre.style.display = 'block';
    }
}

// ==================== 5. CARREGAMENTO DO FEED DO YOUTUBE (RSS) ====================
const ytContainer = document.getElementById('youtube-feed-container');

if (ytContainer) {
    carregarYouTubeAutomatico();
}

/**
 * Busca os vídeos mais recentes do canal via RSS e exibe no feed
 */
async function carregarYouTubeAutomatico() {
    try {
        const RSS_URL = `https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2Ffeeds%2Fvideos.xml%3Fchannel_id%3D${CONFIG.channelID}`;
        
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
                        <a href="https://www.youtube.com/watch?v=${videoId}" 
                           target="_blank" 
                           rel="noopener noreferrer" 
                           class="video-thumbnail-container" 
                           aria-label="Assistir: ${escapeHtml(video.title)}">
                            <img src="${thumbnailUrl}" 
                                 alt="${escapeHtml(video.title)}" 
                                 loading="lazy" 
                                 class="video-thumbnail">
                            <div class="play-icon-overlay">
                                <i class="fa-solid fa-circle-play"></i>
                            </div>
                        </a>
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

// ==================== 6. MODAL DE ARTIGO ====================
/**
 * Abre o modal com o conteúdo completo do artigo
 * @param {HTMLElement} botaoElemento - Botão que acionou a abertura
 */
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

/**
 * Fecha o modal de artigo
 */
function fecharArtigoCompleto() {
    const modal = document.getElementById(CONFIG.articleModalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// ==================== 7. COMPARTILHAMENTO ====================
/**
 * Compartilha o artigo usando Web Share API (mobile) ou copia o link (desktop)
 * @param {string} tituloArtigo - Título do artigo a ser compartilhado
 * @param {HTMLElement} elementoBotao - Botão que acionou o compartilhamento
 */
function compartilharArtigoModal(tituloArtigo, elementoBotao) {
    let linkParaCompartilhar = window.location.href.split('#')[0];
    
    if (elementoBotao) {
        let card = elementoBotao.closest('.article-card, .feed-card');
        
        // Se o botão está dentro do modal, busca o card pelo título
        if (!card) {
            const tituloModal = document.querySelector('.article-modal-title');
            if (tituloModal) {
                const cards = document.querySelectorAll('.article-card, .feed-card');
                for (let c of cards) {
                    const t = c.getAttribute('data-titulo') || c.querySelector('h2')?.innerText;
                    if (t === tituloModal.innerText) {
                        card = c;
                        break;
                    }
                }
            }
        }

        if (card && card.id) {
            linkParaCompartilhar += '#' + card.id;
        }
    }

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
        navigator.share({ 
            title: tituloArtigo || document.title, 
            url: linkParaCompartilhar 
        }).catch(() => {});
    } else {
        // Usa Clipboard API (método moderno)
        navigator.clipboard.writeText(linkParaCompartilhar)
            .then(() => {
                alert('Link direto para o artigo copiado para a área de transferência!');
            })
            .catch(() => {
                // Fallback para navegadores antigos
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

// ==================== 8. POPUP DE INSTALAÇÃO PWA ====================
document.addEventListener("DOMContentLoaded", () => {
    const pwaPopup = document.getElementById('pwa-install-popup');
    const installBtn = document.getElementById('pwa-install-btn');
    const closeBtn = document.getElementById('pwa-close-btn');

    if (!pwaPopup) return;

    let deferredPrompt = null;

    // Captura o evento de instalação do PWA
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        pwaPopup.classList.add('show');
    });

    // Verifica se já está instalado
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

    if (!isStandalone) {
        setTimeout(() => {
            if (!pwaPopup.classList.contains('show')) {
                pwaPopup.classList.add('show');
            }
        }, 2000);
    }

    // Botão de instalar
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (deferredPrompt) {
                pwaPopup.classList.remove('show');
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                if (outcome === 'accepted') console.log('App instalado!');
                deferredPrompt = null;
            } else {
                alert('Para instalar, acesse as opções do seu navegador.');
            }
        });
    }

    // Botão de fechar
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            pwaPopup.classList.remove('show');
        });
    }
});

// ==================== 9. EVENTOS GLOBAIS ====================

// Fechar modal com tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        fecharArtigoCompleto();
    }
});

// Fechar modal com clique fora
document.addEventListener('click', function(e) {
    if (e.target.id === CONFIG.articleModalId || 
        e.target.classList.contains('article-modal-overlay')) {
        fecharArtigoCompleto();
    }
});