/**
 * ============================================================
 * VITÃOTUB - VÍDEOS & LIVES (PÁGINA EXCLUSIVA)
 * Descrição: JavaScript completo e independente para a página
 * videos-lives.html. Não depende do javascript.js.
 * Versão: 1.2 - Independente, com todas as funções necessárias
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
    if (!grid) {
        console.error('❌ Container não encontrado!');
        return;
    }

    console.log('📊 Status atual (Vídeos & Lives):');
    console.log('  - Vídeos carregados:', vlVideosCarregados);
    console.log('  - Total de vídeos:', vlTodosOsVideos.length);

    // Verifica se já carregou todos
    if (vlVideosCarregados >= vlTodosOsVideos.length) {
        console.log('🎉 Todos os vídeos já foram carregados!');
        const sentinela = document.getElementById('vl-sentinel');
        if (sentinela) {
            sentinela.textContent = '🎉 Todos os vídeos carregados!';
            sentinela.className = 'done';
        }
        return;
    }

    // Previne carregamento duplicado
    if (vlEstaCarregando) {
        console.log('⏳ Já está carregando...');
        return;
    }
    vlEstaCarregando = true;
    console.log('🔄 Iniciando carregamento do lote...');

    // Pega o próximo lote (21 vídeos)
    const proximos = vlTodosOsVideos.slice(vlVideosCarregados, vlVideosCarregados + VL_CONFIG.videosPorLote);
    console.log('📦 Lote atual:', proximos.length, 'vídeos (', vlVideosCarregados, 'a', vlVideosCarregados + proximos.length - 1, ')');

    // Cria os cards
    proximos.forEach((video, index) => {
        console.log(`  ➕ Adicionando vídeo ${vlVideosCarregados + index + 1}: ${video.title}`);
        const card = criarCardVl(video);
        grid.appendChild(card);
    });

    vlVideosCarregados += proximos.length;
    console.log('✅ Lote carregado! Total:', vlVideosCarregados, 'de', vlTodosOsVideos.length);

    vlEstaCarregando = false;

    // Move o sentinela para o final após adicionar novos vídeos
    const sentinela = document.getElementById('vl-sentinel');
    if (sentinela) {
        grid.appendChild(sentinela);
        if (vlVideosCarregados < vlTodosOsVideos.length) {
            sentinela.textContent = '🔄 Carregando mais vídeos...';
            sentinela.className = 'loading';
        } else {
            sentinela.textContent = '🎉 Todos os vídeos carregados!';
            sentinela.className = 'done';
        }
        console.log('📌 Sentinela movido para o final.');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
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

    card.innerHTML = `
        <div class="vl-thumbnail" onclick="abrirModalVl('${videoId}')" role="button" tabindex="0" aria-label="Assistir: ${escapeHtmlVl(titulo)}">
            <img src="${thumbnailUrl}" alt="${escapeHtmlVl(titulo)}" loading="lazy" onerror="this.src='https://img.youtube.com/vi/${videoId}/hqdefault.jpg'">
            <div class="vl-play-icon"><i class="fa-solid fa-circle-play"></i></div>
        </div>
        <div class="vl-content">
            <h3 class="vl-title">${escapeHtmlVl(titulo)}</h3>
            <div class="vl-meta-actions">
                <div class="vl-meta-left">
                    <span class="vl-date">📅 ${escapeHtmlVl(dataPub)}</span>
                    <span class="vl-author">✍️ VitãoTub</span>
                </div>
                <div class="vl-actions-right">
                    <button class="vl-btn-share" onclick="event.stopPropagation(); compartilharVideoVl('${videoId}')" title="Compartilhar vídeo" aria-label="Compartilhar vídeo">
                        <i class="fa-solid fa-share-nodes"></i>
                    </button>
                    <a href="https://www.youtube.com/watch?v=${videoId}" target="_blank" rel="noopener" class="vl-btn-youtube" onclick="event.stopPropagation();" title="Assistir no YouTube" aria-label="Assistir no YouTube">
                        <i class="fa-brands fa-youtube"></i>
                    </a>
                </div>
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
    if (!grid) {
        console.error('❌ Container não encontrado!');
        return;
    }

    // Remove sentinela anterior se existir
    const sentinelaAntigo = document.getElementById('vl-sentinel');
    if (sentinelaAntigo) {
        sentinelaAntigo.remove();
        console.log('🧹 Sentinela antigo removido.');
    }

    // Desconecta observer anterior se existir
    if (vlObserver) {
        vlObserver.disconnect();
        vlObserver = null;
        console.log('🧹 Observer antigo desconectado.');
    }

    // Cria o sentinela
    const sentinela = document.createElement('div');
    sentinela.id = 'vl-sentinel';
    sentinela.style.height = '50px';
    sentinela.style.width = '100%';
    sentinela.style.display = 'flex';
    sentinela.style.justifyContent = 'center';
    sentinela.style.alignItems = 'center';
    sentinela.style.color = 'var(--text-dim)';
    sentinela.style.fontSize = '0.9rem';
    sentinela.style.padding = '30px 0';
    sentinela.style.backgroundColor = 'rgba(139, 92, 246, 0.05)';
    sentinela.style.borderRadius = '8px';
    sentinela.style.marginTop = '10px';
    sentinela.textContent = '🔄 Carregando mais vídeos...';
    sentinela.className = 'loading';
    
    grid.appendChild(sentinela);
    console.log('✅ Sentinela criado e adicionado ao final do container.');

    // Verifica a posição do sentinela
    setTimeout(() => {
        const rect = sentinela.getBoundingClientRect();
        console.log('📍 Posição do sentinela:', rect.top, rect.bottom);
        console.log('📐 Altura da janela:', window.innerHeight);
        console.log('👀 Visível?', rect.top < window.innerHeight && rect.bottom > 0);
    }, 100);

    // Configura o observer
    vlObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            console.log('🔍 Sentinela detectado:', entry.isIntersecting ? 'VISÍVEL ✅' : 'OCULTO ❌');
            
            if (entry.isIntersecting && !vlEstaCarregando && vlVideosCarregados < vlTodosOsVideos.length) {
                console.log('🔄 Carregando mais vídeos... (sentinela visível)');
                setTimeout(() => {
                    carregarProximosVideosVl();
                }, 100);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px 300px 0px',
        threshold: 0.01
    });

    vlObserver.observe(sentinela);
    console.log('✅ Observer configurado e observando o sentinela.');
}

// ==================== 9. ABRIR MODAL DE VÍDEO ====================
function abrirModalVl(videoId) {
    vlVideoIdAtual = videoId;

    vlModal = document.getElementById('vl-modal');
    vlIframe = document.getElementById('vl-modal-iframe');
    const youtubeLink = document.getElementById('vl-modal-youtube-link');

    if (!vlModal || !vlIframe) return;

    vlIframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1`;

    if (youtubeLink) {
        youtubeLink.href = `https://www.youtube.com/watch?v=${videoId}`;
    }

    vlModal.classList.add('active');
    document.body.style.overflow = 'hidden';
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

// ==================== 15. FUNÇÕES DO SITE (INDEPENDENTES) ====================

/**
 * Alterna o tema claro/escuro
 */
function toggleTheme() {
    document.body.classList.toggle('light-mode');
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (document.body.classList.contains('light-mode')) {
        localStorage.setItem('vitaotub_theme', 'light');
        if (themeBtn) {
            themeBtn.innerHTML = '🌙';
            themeBtn.title = 'Mudar para modo escuro';
        }
    } else {
        localStorage.setItem('vitaotub_theme', 'dark');
        if (themeBtn) {
            themeBtn.innerHTML = '☀️';
            themeBtn.title = 'Mudar para modo claro';
        }
    }
}

/**
 * Inicializa o tema com base no localStorage
 */
function initThemeToggle() {
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (!themeBtn) return;
    const savedTheme = localStorage.getItem('vitaotub_theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        themeBtn.innerHTML = '🌙';
        themeBtn.title = 'Mudar para modo escuro';
    } else {
        themeBtn.innerHTML = '☀️';
        themeBtn.title = 'Mudar para modo claro';
    }
}

/**
 * Alterna o dropdown de tradução
 */
function toggleTranslateDropdown(e) {
    if (e) {
        e.stopPropagation();
        e.preventDefault();
    }
    const dropdown = document.getElementById('translate-dropdown');
    if (dropdown) dropdown.classList.toggle('active');
}

/**
 * Traduz a página para o idioma selecionado
 */
function translatePage(lang) {
    if (lang === 'pt') {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = 'pt';
            select.dispatchEvent(new Event('change'));
            setTimeout(() => {
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
                document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;';
                window.location.reload();
            }, 300);
        } else {
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; domain=.vitaotub.com; path=/;';
            window.location.reload();
        }
        const dropdown = document.getElementById('translate-dropdown');
        if (dropdown) dropdown.classList.remove('active');
        return;
    }
    
    setGoogleTranslateCookieVl(lang);
    const checkExist = setInterval(() => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            clearInterval(checkExist);
            select.value = lang;
            select.dispatchEvent(new Event('change'));
            const dropdown = document.getElementById('translate-dropdown');
            if (dropdown) dropdown.classList.remove('active');
            updateActiveLanguageVl(lang);
        }
    }, 100);
    setTimeout(() => {
        if (!document.querySelector('.goog-te-combo')) window.location.reload();
    }, 3000);
}

/**
 * Define o cookie de tradução do Google
 */
function setGoogleTranslateCookieVl(lang) {
    const date = new Date();
    date.setTime(date.getTime() + (365 * 24 * 60 * 60 * 1000));
    const expires = date.toUTCString();
    document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = lang === 'pt' ? `googtrans=/pt/pt; expires=${expires}; path=/` : `googtrans=/pt/${lang}; expires=${expires}; path=/`;
}

/**
 * Atualiza o idioma ativo no dropdown
 */
function updateActiveLanguageVl(lang) {
    document.querySelectorAll('.translate-option').forEach(btn => {
        btn.classList.remove('active-lang');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active-lang');
        }
    });
}

/**
 * Fecha o toast de confirmação
 */
function closeToast() {
    const toast = document.getElementById('toast-container');
    if (toast) {
        toast.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/**
 * Fecha o menu mobile
 */
function closeMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!menuToggle || !mobileMenu) return;
    menuToggle.classList.remove('active');
    mobileMenu.classList.remove('active');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    document.body.style.overflow = '';
}

/**
 * Alterna o menu mobile
 */
function toggleMobileMenu() {
    const menuToggle = document.getElementById('menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    if (!menuToggle || !mobileMenu) return;
    const isActive = mobileMenu.classList.contains('active');
    if (isActive) {
        menuToggle.classList.remove('active');
        mobileMenu.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.setAttribute('aria-label', 'Abrir menu');
        document.body.style.overflow = '';
    } else {
        menuToggle.classList.add('active');
        mobileMenu.classList.add('active');
        menuToggle.setAttribute('aria-expanded', 'true');
        menuToggle.setAttribute('aria-label', 'Fechar menu');
    }
}

/**
 * Abre o modal de privacidade
 */
async function openPrivacyModal() {
    await loadModalContentVl('./politica-de-privacidade.html');
}

/**
 * Abre o modal de termos de uso
 */
async function openTermsModal() {
    await loadModalContentVl('./termos-de-uso.html');
}

/**
 * Carrega o conteúdo de um arquivo HTML no modal
 */
async function loadModalContentVl(filePath) {
    const modal = document.getElementById('privacy-modal');
    const target = document.getElementById('privacy-content-target');
    if (modal && target) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        target.innerHTML = '<p>Carregando conteúdo...</p>';
        try {
            const response = await fetch(filePath);
            if (!response.ok) throw new Error('Arquivo não encontrado');
            target.innerHTML = await response.text();
            initSwipeToCloseVl();
        } catch (error) {
            target.innerHTML = `
                <h2>Erro</h2>
                <p>Não foi possível carregar o conteúdo.</p>
                <p><a href="${filePath}" target="_blank" style="color: var(--primary-purple);">Clique aqui para abrir em uma nova aba.</a></p>
            `;
        }
    }
}

/**
 * Fecha o modal de privacidade
 */
function closePrivacyModal() {
    const modal = document.getElementById('privacy-modal');
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (!modal.classList.contains('active')) modal.style.display = 'none';
        }, 300);
        document.body.style.overflow = '';
    }
    const content = document.getElementById('privacy-modal-content');
    if (content) {
        content.style.transform = '';
        content.style.opacity = '';
    }
}

/**
 * Inicializa o swipe to close no modal de privacidade
 */
function initSwipeToCloseVl() {
    const modal = document.getElementById('privacy-modal');
    const content = document.getElementById('privacy-modal-content');
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
            setTimeout(() => { closePrivacyModal(); }, 300);
        } else {
            content.style.transform = '';
            content.style.opacity = '';
        }
        currentX = 0;
    });
}

/**
 * Botão de voltar ao topo
 */
function initBackToTopVl() {
    const backToTopButton = document.getElementById('back-to-top');
    if (backToTopButton) {
        backToTopButton.style.display = 'none';
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopButton.style.display = 'flex';
            } else {
                backToTopButton.style.display = 'none';
            }
        });
        backToTopButton.addEventListener('click', function(e) {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

/**
 * Fecha dropdowns ao clicar fora
 */
function initClickOutsideVl() {
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
}

/**
 * Tecla ESC fecha modais
 */
function initEscapeKeyVl() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePrivacyModal();
            closeMobileMenu();
            fecharModalVl();
            const translateDropdown = document.getElementById('translate-dropdown');
            if (translateDropdown) translateDropdown.classList.remove('active');
        }
    });
}

/**
 * Inicializa o widget de tradução
 */
function initTranslateWidgetVl() {
    const toggleBtn = document.getElementById('translate-toggle');
    const dropdown = document.getElementById('translate-dropdown');
    if (!toggleBtn || !dropdown) return;
    toggleBtn.removeEventListener('click', toggleTranslateDropdown);
    toggleBtn.addEventListener('click', toggleTranslateDropdown);
    setTimeout(() => {
        const match = document.cookie.match(/googtrans=\/pt\/([^;]+)/);
        if (match && match[1]) updateActiveLanguageVl(match[1]);
    }, 1500);
}

// ==================== 16. INICIALIZAÇÃO DO SITE ====================
document.addEventListener("DOMContentLoaded", function() {
    // Tema
    initThemeToggle();
    
    // Menu mobile
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            toggleMobileMenu();
        });
        document.addEventListener('click', function(e) {
            const mobileMenu = document.getElementById('mobile-menu');
            if (!mobileMenu || !mobileMenu.classList.contains('active')) return;
            if (!mobileMenu.contains(e.target) && e.target !== menuToggle) {
                closeMobileMenu();
            }
        });
        window.addEventListener('resize', function() {
            if (window.innerWidth > 850) closeMobileMenu();
        });
    }
    
    // Tradução
    initTranslateWidgetVl();
    
    // Voltar ao topo
    initBackToTopVl();
    
    // Clique fora
    initClickOutsideVl();
    
    // Tecla ESC
    initEscapeKeyVl();
});

// ==================== 17. GOOGLE TRANSLATE INICIALIZAÇÃO ====================
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'pt',
        includedLanguages: 'en,es,pt,it,fr,zh-CN,ja,hi',
        layout: google.translate.TranslateElement.InlineLayout.HORIZONTAL,
        autoDisplay: false,
        multilanguagePage: true,
        gaTrack: false
    }, 'google_translate_element');
}