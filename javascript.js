/**
 * Website do canal VitãoTub - v0.2
 * Desenvolvido por: Victor (Vitão)
 */
	
// --- INTEGRAÇÃO ONESIGNAL PUSH ---
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(function(OneSignal) {
  OneSignal.init({
    appId: "24dbec09-7c58-4193-9d90-8417abc8564e", // <--- ID DO CANAL
    safari_web_id: "SEU_ID_SAFARI_AQUI_SE_HOUVER",
    notifyButton: {
      enable: true,
    },
  });
});

// --- INICIA O SERVICE WORKER ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js')
      .then(registration => {
        console.log('Service Worker registrado com sucesso!');
      })
      .catch(error => {
        console.log('Erro ao registrar o Service Worker:', error);
      });
  });
}

// --- AUTO-ATUALIZAÇÃO DO PWA ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.ready.then(registration => {
    // Verifica por atualizações no servidor periodicamente ou ao abrir
    registration.update();

    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Nova versão detectada! Recarrega a página automaticamente para exibir as mudanças
          console.log('Nova versão do app disponível. Atualizando...');
          window.location.reload();
        }
      });
    });
  });
}

// --- LÓGICA DO POPUP DE INSTALAÇÃO FORÇADA (FASE 1) ---
document.addEventListener("DOMContentLoaded", () => {
  const pwaPopup = document.getElementById('pwa-install-popup');
  const installBtn = document.getElementById('pwa-install-btn');
  const closeBtn = document.getElementById('pwa-close-btn');

  if (!pwaPopup) {
    return; 
  }

  let deferredPrompt = null;

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); 
    deferredPrompt = e; 
    pwaPopup.style.display = 'flex'; 
  });

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  if (!isStandalone) {
    setTimeout(() => {
      if (pwaPopup.style.display !== 'flex') {
        pwaPopup.style.display = 'flex';
      }
    }, 2000);
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
        alert('O seu navegador bloqueou a instalação automática.\n\nPara instalar: Clique no ícone de "Aplicativo" ou "Instalar" na barra de endereços (no PC) ou escolha "Adicionar à Tela Inicial" no menu do navegador (no celular).');
      }
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      pwaPopup.style.display = 'none';
    });
  }
});


// 1. CONFIGURAÇÕES GERAIS
const CONFIG = {
    modalId: 'video-modal',
    iframeTargetId: 'modal-iframe-target',
    toastContainerId: 'toast-overlay',
    privacyModalId: 'privacy-modal',
    privacyTargetId: 'privacy-content-target',
    articleModalId: 'article-modal',
    scriptURL: 'https://script.google.com/macros/s/AKfycbwOnJ8aLNMfbOss06eRh_glZRNULpJ3j9HqeL7PCGPDfr80_vcCB5-hLEHkDddO-LFrqA/exec'
};

// FUNÇÃO AUXILIAR: SANITIZADOR DE HTML
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// 2. ANIMAÇÃO DE ESTATÍSTICAS
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const fills = entry.target.querySelectorAll('.demo-bar-fill, .bar-fill');
            fills.forEach(fill => {
                const targetWidth = fill.getAttribute('data-width') || 
                                    fill.parentElement.getAttribute('data-width') || 
                                    "100%";
                fill.style.width = targetWidth;
            });
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.stat-card, .demo-box, .demo-bar-item').forEach(el => observer.observe(el));

// 3. SISTEMA DE MODAL DE VÍDEO
function openVideo(videoId) {
    const modal = document.getElementById(CONFIG.modalId);
    const target = document.getElementById(CONFIG.iframeTargetId);
    if (modal && target) {
        target.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}?autoplay=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
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

// 4. MODAL DE PRIVACIDADE
async function openPrivacyModal() {
    const modal = document.getElementById(CONFIG.privacyModalId);
    const target = document.getElementById(CONFIG.privacyTargetId);
    
    if (modal && target) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch('./politica-de-privacidade.html');
            if (!response.ok) throw new Error('Arquivo não encontrado');
            const htmlContent = await response.text();
            target.innerHTML = htmlContent; 
        } catch (error) {
            target.innerHTML = `<h2>Erro</h2><p>Não foi possível carregar o conteúdo. <a href="politica-de-privacidade.html" target="_blank">Clique aqui para abrir.</a></p>`;
        }
    }
}

async function openTermsModal() {
    const modal = document.getElementById(CONFIG.privacyModalId);
    const target = document.getElementById(CONFIG.privacyTargetId);
    
    if (modal && target) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            const response = await fetch('./termos-de-uso.html');
            if (!response.ok) throw new Error('Arquivo não encontrado');
            const htmlContent = await response.text();
            target.innerHTML = htmlContent;
        } catch (error) {
            target.innerHTML = `<h2>Erro</h2><p>Não foi possível carregar os termos. <a href="termos-de-uso.html" target="_blank" style="color: var(--primary-purple);">Clique aqui para abrir em uma nova aba.</a></p>`;
        }
    }
}

function closePrivacyModal() {
    const modal = document.getElementById(CONFIG.privacyModalId);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            if (!modal.classList.contains('active')) {
                modal.style.display = 'none';
            }
        }, 300); 
        document.body.style.overflow = '';
    }
}

// 5. PROCESSAMENTO DO FORMULÁRIO
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const humanCheck = document.getElementById('human-check');
        if (!humanCheck || !humanCheck.checked) {
            alert("Por favor, confirme que você não é um robô.");
            return;
        }

        const nome = contactForm.querySelector('input[name="nome"]').value;
        const email = contactForm.querySelector('input[name="email"]').value;
        const mensagem = contactForm.querySelector('textarea[name="mensagem"]').value;

        const assunto = encodeURIComponent(`Contato via Site - ${nome}`);
        const corpo = encodeURIComponent(`Nome: ${nome}\nE-mail: ${email}\n\nMensagem:\n${mensagem}`);
        const mailtoLink = `mailto:vitaotub@gmail.com?subject=${assunto}&body=${corpo}`;

        window.location.href = mailtoLink;

        const toast = document.getElementById(CONFIG.toastContainerId);
        if (toast) {
            toast.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        contactForm.reset();
    });
}

function closeToast() {
    const toast = document.getElementById(CONFIG.toastContainerId);
    if (toast) {
        toast.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// FECHAR MODAL DE ARTIGO
function fecharArtigoCompleto() {
    const modal = document.getElementById(CONFIG.articleModalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}

// EVENTOS DE TECLADO (ESC)
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideo();
        closeToast();
        closePrivacyModal();
        fecharArtigoCompleto();
    }
});

// EVENTOS DE CLIQUE FORA DA MODAL
document.addEventListener('click', function(e) {
    if (e.target.id === CONFIG.modalId || e.target.classList.contains('modal-overlay')) {
        closeVideo();
    }
    if (e.target.id === CONFIG.toastContainerId || e.target.classList.contains('toast-close-btn')) {
        closeToast();
    }
    if (e.target.id === CONFIG.privacyModalId || 
        e.target.classList.contains('modal-overlay') || 
        e.target.classList.contains('modal-close') ||
        e.target.innerText === '×') {
        closePrivacyModal();
    }
    if (e.target.id === CONFIG.articleModalId) {
        fecharArtigoCompleto();
    }
});

const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) {
    backToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

function initCookieBanner() {
    const banner = document.getElementById("lgpd-banner");
    const btnAccept = document.getElementById("lgpd-accept");
    const btnReject = document.getElementById("lgpd-reject");

    if (!banner) return;

    if (!localStorage.getItem("vitaotub_cookies_accepted")) {
        setTimeout(() => {
            banner.classList.add("show");
        }, 1000);
    }

    if (btnAccept) {
        btnAccept.onclick = function() {
            localStorage.setItem("vitaotub_cookies_accepted", "true");
            banner.classList.remove("show");
        };
    }

    if (btnReject) {
        btnReject.onclick = function() {
            banner.classList.remove("show");
        };
    }
}

document.addEventListener("DOMContentLoaded", initCookieBanner);


// --- LÓGICA DE ABAS E FEED AUTOMÁTICO ---

function mudarAba(aba) {
    const btnVideos = document.querySelector('.feed-tabs button:nth-child(1)');
    const btnArtigos = document.querySelector('.feed-tabs button:nth-child(2)');
    const secaoVideos = document.getElementById('secao-videos');
    const secaoArtigos = document.getElementById('secao-artigos');

    if (!btnVideos || !secaoVideos) return;

    if (aba === 'videos') {
        btnVideos.classList.add('active');
        if (btnArtigos) btnArtigos.classList.remove('active');
        secaoVideos.style.display = 'block';
        if (secaoArtigos) secaoArtigos.style.display = 'none';
    } else {
        if (btnArtigos) btnArtigos.classList.add('active');
        btnVideos.classList.remove('active');
        if (secaoArtigos) secaoArtigos.style.display = 'block';
        secaoVideos.style.display = 'none';
    }
}

// 1. CARREGAMENTO AUTOMÁTICO DOS VÍDEOS DO YOUTUBE
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

                        postElement.innerHTML = `
                            <div class="video-container">
                                <iframe src="https://www.youtube.com/embed/${videoId}" title="${escapeHtml(video.title)}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                            </div>
                            <div class="feed-content">
                                <h2>${escapeHtml(video.title)}</h2>
                                <span class="feed-date">${dataPub}</span>
                            </div>
                        `;
                        ytContainer.appendChild(postElement);
                    }
                });

                const rodapeFeed = document.createElement('div');
                rodapeFeed.style.cssText = 'text-align: center; padding: 30px 15px; margin-top: 20px; border-top: 1px solid #222;';
                rodapeFeed.innerHTML = `
                    <p style="color: #aaa; font-size: 0.95rem; line-height: 1.5; margin-bottom: 15px;">
                        Esta página exibe apenas os últimos vídeos e lives do Canal VitãoTub. Para conferir todos os demais conteúdos, acesse o canal clicando 
                        <a href="https://www.youtube.com/@VitaoTub" target="_blank" class="btn-action btn-subscribe" style="display: inline-block; text-decoration: none; padding: 6px 14px; margin-left: 5px; margin-right: 5px; vertical-align: middle;">AQUI</a>.
                    </p>
                `;
                ytContainer.appendChild(rodapeFeed);

            } else {
                ytContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Não foi possível carregar os vídeos automáticos no momento.</p>';
            }
        } catch (error) {
            console.error("Erro ao buscar feed do YouTube:", error);
            ytContainer.innerHTML = '<p style="text-align: center; color: #ff5555;">Erro de conexão ao carregar vídeos.</p>';
        }
    }

    carregarYouTubeAutomatico();
}

// 2. FUNÇÕES DA MODAL DE LEITURA E COMPARTILHAMENTO DOS ARTIGOS

function abrirArtigoHtml(botaoElemento) {
    const card = botaoElemento.closest('.article-card, .feed-card, .card-artigo, article');
    if (!card) {
        console.error('Não foi possível localizar o container do artigo.');
        return;
    }

    const titulo = card.getAttribute('data-titulo') || card.querySelector('h2, h3')?.innerText || 'Artigo';
    const dataPub = card.getAttribute('data-data') || '';
    const autor = card.getAttribute('data-autor') || 'VitãoTub';
    const conteudoCompleto = card.getAttribute('data-conteudo') || card.querySelector('.artigo-conteudo, p')?.innerHTML || 'Conteúdo em breve...';

    const facebook = card.getAttribute('data-facebook');
    const instagram = card.getAttribute('data-instagram');
    const tiktok = card.getAttribute('data-tiktok');
    const twitter = card.getAttribute('data-twitter');
    const youtube = card.getAttribute('data-youtube');
    const website = card.getAttribute('data-website');

    let redesSociaisHtml = '';
    if (facebook) redesSociaisHtml += `<a href="${facebook}" target="_blank" class="author-social-btn" title="Facebook"><i class="fa-brands fa-facebook-f"></i></a>`;
    if (instagram) redesSociaisHtml += `<a href="${instagram}" target="_blank" class="author-social-btn" title="Instagram"><i class="fa-brands fa-instagram"></i></a>`;
    if (tiktok) redesSociaisHtml += `<a href="${tiktok}" target="_blank" class="author-social-btn" title="TikTok"><i class="fa-brands fa-tiktok"></i></a>`;
    if (twitter) redesSociaisHtml += `<a href="${twitter}" target="_blank" class="author-social-btn" title="X / Twitter"><i class="fa-brands fa-x-twitter"></i></a>`;
    if (youtube) redesSociaisHtml += `<a href="${youtube}" target="_blank" class="author-social-btn" title="YouTube"><i class="fa-brands fa-youtube"></i></a>`;
    if (website) redesSociaisHtml += `<a href="${website}" target="_blank" class="author-social-btn" title="Site / GitHub"><i class="fa-solid fa-globe"></i></a>`;

    const modal = document.getElementById(CONFIG.articleModalId);
    const modalBody = document.getElementById('modal-body-content') || document.getElementById('modal-body');

    if (modal && modalBody) {
        modalBody.innerHTML = `
            <h1 style="color: #fff; margin-bottom: 10px; font-size: 1.6rem; line-height: 1.3;">${escapeHtml(titulo)}</h1>
            
            <div style="display: flex; justify-content: space-between; align-items: center; color: #aaa; font-size: 0.9rem; margin-bottom: 20px; border-bottom: 1px solid #222; padding-bottom: 10px;">
                <span>📅 ${dataPub}</span>
                <span style="color: #3b82f6; font-weight: 600;">✍️ Autor: ${escapeHtml(autor)}</span>
            </div>

            <div style="color: #ccc; line-height: 1.6; font-size: 1rem; margin-bottom: 20px;">
                ${conteudoCompleto}
            </div>
            
            <div class="modal-footer-actions">
                <!-- Lado Esquerdo: Redes Sociais do Autor -->
                <div class="author-social-links">
                    ${redesSociaisHtml}
                </div>

                <!-- Lado Direito: Ações -->
                <div class="modal-action-buttons">
                    <button class="icon-action-btn btn-share" id="modal-btn-share" title="Compartilhar Artigo" aria-label="Compartilhar">
                        <i class="fa-solid fa-share-nodes"></i>
                    </button>
                    <a href="https://www.youtube.com/@VitaoTub?sub_confirmation=1" target="_blank" class="icon-action-btn btn-subscribe" title="Inscrever-se no Canal" aria-label="Inscrever-se">
                        <i class="fa-brands fa-youtube"></i>
                    </a>
                </div>
            </div>
        `;

        const btnShare = document.getElementById('modal-btn-share');
        if (btnShare) {
            btnShare.addEventListener('click', () => compartilharArtigoPorTitulo(titulo));
        }

        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function compartilharArtigo(botaoElemento) {
    const card = botaoElemento.closest('.article-card, .feed-card, .card-artigo, article');
    const titulo = card ? (card.getAttribute('data-titulo') || card.querySelector('h2, h3')?.innerText || 'VitãoTub') : 'VitãoTub';
    compartilharArtigoPorTitulo(titulo);
}

function compartilharArtigoPorTitulo(titulo) {
    const urlAtual = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: titulo,
            url: urlAtual
        }).catch(err => console.log('Compartilhamento cancelado:', err));
    } else {
        navigator.clipboard.writeText(urlAtual);
        alert('Link copiado para a área de transferência!');
    }
}