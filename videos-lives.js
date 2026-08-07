/**
 * ============================================================
 * VITÃOTUB - VÍDEOS & LIVES (PÁGINA EXCLUSIVA)
 * Descrição: JavaScript exclusivo para a página videos-lives.html
 * Prefixo: Vl (para evitar conflitos com outras páginas)
 * Versão: 1.0
 * ============================================================
 */

// ==================== 1. CONFIGURAÇÕES ====================
const VL_CONFIG = {
    videosPorLote: 21,
    videosJsonPath: '/videos.json'
};

// ==================== 2. VARIÁVEIS GLOBAIS ====================
let vlTodosOsVideos = [];
let vlVideosCarregados = 0;
let vlEstaCarregando = false;
let vlObserver = null;
let vlVideoIdAtual = null;
let vlModal = null;
let vlIframe = null;

// ==================== 3. INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', function() {
    const grid = document.getElementById('vl-grid');
    if (grid) {
        carregarVideosVl();
    }
});

// ==================== 4. CARREGAR VÍDEOS ====================
async function carregarVideosVl() {
    const grid = document.getElementById('vl-grid');
    if (!grid) return;

    try {
        let data = null;

        // Tenta buscar do cache primeiro (para PWA offline)
        try {
            const cache = await caches.open('vitaotub-cache-v3.1-20260804');
            const cachedResponse = await cache.match(VL_CONFIG.videosJsonPath);
            if (cachedResponse) {
                data = await cachedResponse.json();
            }
        } catch (e) {
            // Fallback para fetch normal
        }

        // Se não achou no cache, faz fetch normal
        if (!data) {
            const response = await fetch(VL_CONFIG.videosJsonPath);
            if (!response.ok) throw new Error('Erro ao carregar vídeos');
            data = await response.json();
        }

        vlTodosOsVideos = data.videos;

        if (!vlTodosOsVideos || vlTodosOsVideos.length === 0) {
            grid.innerHTML = '<p class="vl-placeholder">Nenhum vídeo encontrado.</p>';
            return;
        }

        // Reinicia o estado
        vlVideosCarregados = 0;
        grid.innerHTML = '';
        vlEstaCarregando = false;

        // Remove observer anterior se existir
        if (vlObserver) {
            vlObserver.disconnect();
            vlObserver = null;
        }

        // Carrega os primeiros 21 vídeos
        carregarProximosVideosVl();

        // Configura o scroll infinito
        configurarScrollInfinitoVl();

    } catch (error) {
        console.error('Erro ao carregar vídeos:', error);
        grid.innerHTML = '<p class="vl-placeholder" style="color: #ff5555;">Erro ao carregar vídeos. Tente novamente mais tarde.</p>';
    }
}

// ==================== 5. CARREGAR PRÓXIMOS VÍDEOS ====================
function carregarProximosVideosVl() {
    const grid = document.getElementById('vl-grid');
    if (!grid) return;

    // Verifica se já carregou todos
    if (vlVideosCarregados >= vlTodosOsVideos.length) {
        const sentinela = document.getElementById('vl-sentinel');
        if (sentinela) {
            sentinela.textContent = '🎉 Todos os vídeos carregados!';
            sentinela.className = 'done';
        }
        return;
    }

    // Previne carregamento duplicado
    if (vlEstaCarregando) return;
    vlEstaCarregando = true;

    // Pega o próximo lote (21 vídeos)
    const proximos = vlTodosOsVideos.slice(vlVideosCarregados, vlVideosCarregados + VL_CONFIG.videosPorLote);

    // Cria os cards
    proximos.forEach(video => {
        const card = criarCardVl(video);
        grid.appendChild(card);
    });

    vlVideosCarregados += proximos.length;
    vlEstaCarregando = false;

    // Atualiza o sentinela
    const sentinela = document.getElementById('vl-sentinel');
    if (sentinela) {
        if (vlVideosCarregados < vlTodosOsVideos.length) {
            sentinela.textContent = '🔄 Carregando mais vídeos...';
            sentinela.className = 'loading';
        } else {
            sentinela.textContent = '🎉 Todos os vídeos carregados!';
            sentinela.className = 'done';
        }
    }
}

// ==================== 6. CRIAR CARD DE VÍDEO ====================
function criarCardVl(video) {
    const videoId = video.id;
    const titulo = video.title || 'Vídeo sem título';
    const dataPub = video.date || new Date().toLocaleDateString('pt-BR');
    const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    const card = document.createElement('article');
    card.className = 'vl-card';
    card.setAttribute('data-video-id', videoId);

    // Conteúdo do card
    card.innerHTML = `
        <div class="vl-thumbnail" onclick="abrirModalVl('${videoId}')" role="button" tabindex="0" aria-label="Assistir: ${escapeHtmlVl(titulo)}">
            <img src="${thumbnailUrl}" alt="${escapeHtmlVl(titulo)}" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'">
            <div class="vl-play-icon"><i class="fa-solid fa-circle-play"></i></div>
        </div>
        <div class="vl-content">
            <h3 class="vl-title">${escapeHtmlVl(titulo)}</h3>
            <div class="vl-meta">
                <span class="vl-date">📅 ${escapeHtmlVl(dataPub)}</span>
                <span class="vl-author">✍️ VitãoTub</span>
            </div>
            <div class="vl-actions">
                <button class="vl-btn-share" onclick="event.stopPropagation(); compartilharVideoVl('${videoId}')" title="Compartilhar vídeo" aria-label="Compartilhar vídeo">
                    <i class="fa-solid fa-share-nodes"></i>
                </button>
                <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener" class="vl-btn-youtube" onclick="event.stopPropagation();" title="Assistir no YouTube" aria-label="Assistir no YouTube">
                    <i class="fa-brands fa-youtube"></i>
                </a>
            </div>
        </div>
    `;

    return card;
}

// ==================== 7. ESCAPE HTML ====================
function escapeHtmlVl(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ==================== 8. CONFIGURAR SCROLL INFINITO ====================
function configurarScrollInfinitoVl() {
    const grid = document.getElementById('vl-grid');
    if (!grid) return;

    // Remove sentinela anterior se existir
    const sentinelaAntigo = document.getElementById('vl-sentinel');
    if (sentinelaAntigo) sentinelaAntigo.remove();

    // Cria um elemento sentinela no final do grid
    const sentinela = document.createElement('div');
    sentinela.id = 'vl-sentinel';
    sentinela.textContent = '🔄 Carregando mais vídeos...';
    sentinela.className = 'loading';
    grid.appendChild(sentinela);

    // Configura o observer
    vlObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !vlEstaCarregando && vlVideosCarregados < vlTodosOsVideos.length) {
                console.log('🔄 Carregando mais vídeos... (sentinela visível)');
                carregarProximosVideosVl();
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px 300px 0px',
        threshold: 0.01
    });

    vlObserver.observe(sentinela);
    console.log('✅ Sentinela criado e observer configurado.');
}

// ==================== 9. ABRIR MODAL DE VÍDEO ====================
function abrirModalVl(videoId) {
    vlVideoIdAtual = videoId;

    // Busca o modal
    vlModal = document.getElementById('vl-modal');
    vlIframe = document.getElementById('vl-modal-iframe');
    const youtubeLink = document.getElementById('vl-modal-youtube-link');

    if (!vlModal || !vlIframe) return;

    // Define o iframe com autoplay
    vlIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;

    // Atualiza o link do YouTube
    if (youtubeLink) {
        youtubeLink.href = `https://www.youtube.com/watch?v=${videoId}`;
    }

    // Abre o modal
    vlModal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Adiciona evento para fechar com ESC
    document.addEventListener('keydown', fecharModalVlEsc);
}

// ==================== 10. FECHAR MODAL DE VÍDEO ====================
function fecharModalVl() {
    const modal = document.getElementById('vl-modal');
    const iframe = document.getElementById('vl-modal-iframe');

    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (iframe) {
        iframe.src = '';
    }

    vlVideoIdAtual = null;
    document.removeEventListener('keydown', fecharModalVlEsc);
}

// ==================== 11. FECHAR MODAL COM ESC ====================
function fecharModalVlEsc(e) {
    if (e.key === 'Escape') {
        fecharModalVl();
    }
}

// ==================== 12. COMPARTILHAR VÍDEO ====================
function compartilharVideoVl(videoId) {
    // Se não recebeu videoId, tenta usar o atual
    const id = videoId || vlVideoIdAtual;
    if (!id) return;

    const videoUrl = `https://www.youtube.com/watch?v=${id}`;
    const mensagem = `🎬 Vídeo do VitãoTub: ${videoUrl}`;
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
        navigator.share({
            title: 'Vídeo do VitãoTub',
            text: 'Confira este vídeo!',
            url: videoUrl
        }).catch((err) => {
            if (err.name !== 'AbortError') console.error('Erro ao compartilhar:', err);
        });
        return;
    }

    // Fallback: copia o link
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(mensagem)
            .then(() => {
                alert('✅ Link do vídeo copiado! Compartilhe com seus amigos.');
            })
            .catch(() => {
                fallbackCopyVl(mensagem);
            });
    } else {
        fallbackCopyVl(mensagem);
    }
}

// ==================== 13. FALLBACK COPIAR ====================
function fallbackCopyVl(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
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

// ==================== 14. RECARREGAR VÍDEOS (UTILITÁRIO) ====================
function recarregarVideosVl() {
    const grid = document.getElementById('vl-grid');
    if (!grid) return;

    vlTodosOsVideos = [];
    vlVideosCarregados = 0;
    vlEstaCarregando = false;

    if (vlObserver) {
        vlObserver.disconnect();
        vlObserver = null;
    }

    grid.innerHTML = '<p class="vl-placeholder">Carregando vídeos...</p>';
    carregarVideosVl();
}