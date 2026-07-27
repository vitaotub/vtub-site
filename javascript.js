/**
 * Website do canal VitãoTub - v1.3 (Com PWA, Feed do YouTube e Novo Sistema de Artigos)
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

  closeBtn.addEventListener('click', () => {
    pwaPopup.style.display = 'none';
  });
});


// 1. CONFIGURAÇÕES GERAIS
const CONFIG = {
    modalId: 'video-modal',
    iframeTargetId: 'modal-iframe-target',
    toastContainerId: 'toast-overlay',
    privacyModalId: 'privacy-modal',
    privacyTargetId: 'privacy-content-target',
    scriptURL: 'https://script.google.com/macros/s/AKfycbwOnJ8aLNMfbOss06eRh_glZRNULpJ3j9HqeL7PCGPDfr80_vcCB5-hLEHkDddO-LFrqA/exec'
};

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

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideo();
        closeToast();
        closePrivacyModal();
        fecharArtigoCompleto();
    }
});

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


// --- LÓGICA DE ABAS E FEED AUTOMÁTICO (FASE 3) ---

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
                
                data.items.forEach(video => {
                    const videoIdMatch = video.link.match(/(?:v=|\/embed\/|\/v\/|youtu\.be\/)([^&\n?#]+)/);
                    const videoId = videoIdMatch ? videoIdMatch[1] : '';
                    
                    if (videoId) {
                        const postElement = document.createElement('article');
                        postElement.className = 'feed-card';
                        
                        const dataPub = new Date(video.pubDate).toLocaleDateString('pt-BR');

                        postElement.innerHTML = `
                            <div class="video-container">
                                <iframe src="https://www.youtube.com/embed/${videoId}" title="${video.title}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                            </div>
                            <div class="feed-content">
                                <h2>${video.title}</h2>
                                <span class="feed-date">${dataPub}</span>
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
            ytContainer.innerHTML = '<p style="text-align: center; color: #ff5555;">Erro de conexão ao carregar vídeos.</p>';
        }
    }

    carregarYouTubeAutomatico();
}

// 2. CARREGAMENTO MANUAL DOS ARTIGOS E SISTEMA DE MODAL DE LEITURA
const artigosContainer = document.getElementById('artigos-feed-container');

// Banco de dados em memória para armazenar o conteúdo completo dos artigos injetados via JSON
let cacheArtigosCompletos = {};

if (artigosContainer) {
    async function carregarArtigosManuais() {
        try {
            const response = await fetch(`feed.json?v=${new Date().getTime()}`);
            if (!response.ok) throw new Error('Erro ao carregar artigos.');
            
            const publicacoes = await response.json();
            artigosContainer.innerHTML = ''; 
            
            const apenasArtigos = publicacoes.filter(item => item.tipo === 'artigo');

            if (apenasArtigos.length === 0) {
                artigosContainer.innerHTML = '<p style="text-align: center; color: #aaa;">Nenhum artigo publicado ainda.</p>';
                return;
            }
            
            apenasArtigos.forEach((post, index) => {
                // Atribui um ID único para cada artigo
                const artigoId = `artigo-${index}`;
                cacheArtigosCompletos[artigoId] = {
                    titulo: post.titulo,
                    conteudo: post.conteudoCompleto || post.descricao // Fallback caso não tenha conteúdo completo dedicado
                };

                const postElement = document.createElement('article');
                postElement.className = 'feed-card article-card';
                
                // Suporte a miniatura de vídeo ou banner de imagem
                let midiaHtml = '';
                if (post.videoId) {
                    midiaHtml = `
                        <div class="video-container">
                            <iframe src="https://www.youtube.com/embed/${post.videoId}" title="${post.titulo}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        </div>
                    `;
                } else if (post.imagem) {
                    midiaHtml = `<img src="${post.imagem}" alt="${post.titulo}" class="feed-image" loading="lazy">`;
                }

                postElement.innerHTML = `
                    ${midiaHtml}
                    <div class="feed-content">
                        <span class="feed-date">${post.data}</span>
                        <h2>${post.titulo}</h2>
                        <p>${post.descricao}</p>
                        
                        <!-- Botões centralizados na horizontal -->
                        <div class="article-actions">
                            <button class="btn-action btn-read" onclick="abrirArtigoCompleto('${artigoId}')">Ler Artigo</button>
                            <button class="btn-action btn-share" onclick="compartilharArtigo('${post.titulo.replace(/'/g, "\\'")}')">Compartilhar</button>
                            <a href="https://www.youtube.com/@VitaoTub?sub_confirmation=1" target="_blank" class="btn-action btn-subscribe">Inscrever-se</a>
                        </div>
                    </div>
                `;
                artigosContainer.appendChild(postElement);
            });
            
        } catch (error) {
            console.error("Erro ao carregar artigos:", error);
            artigosContainer.innerHTML = '<p style="text-align: center; color: #ff5555;">Erro ao carregar os artigos.</p>';
        }
    }

    carregarArtigosManuais();
}

// 3. FUNÇÕES DA MODAL DE LEITURA DOS ARTIGOS
function abrirArtigoCompleto(artigoId) {
    const modal = document.getElementById('article-modal');
    const modalBody = document.getElementById('modal-body-content');
    const artigo = cacheArtigosCompletos[artigoId];

    if (modal && modalBody && artigo) {
        modalBody.innerHTML = `
            <h1 style="color: #fff; margin-bottom: 15px; font-size: 1.6rem; line-height: 1.3;">${artigo.titulo}</h1>
            <div style="color: #ccc; line-height: 1.6; font-size: 1rem; margin-bottom: 20px;">
                ${artigo.conteudo}
            </div>
            
            <!-- Botões úteis no rodapé da modal (alinhados à direita) -->
            <div class="modal-footer-actions">
                <button class="btn-action btn-share" onclick="compartilharArtigo('${artigo.titulo.replace(/'/g, "\\'")}')">Compartilhar</button>
                <a href="https://www.youtube.com/@VitaoTub" target="_blank" class="btn-action btn-read">Ver Canal</a>
                <a href="https://www.youtube.com/@VitaoTub?sub_confirmation=1" target="_blank" class="btn-action btn-subscribe">Inscrever-se</a>
            </div>
        `;
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Trava o fundo
    }
}

function fecharArtigoCompleto() {
    const modal = document.getElementById('article-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = ''; // Restaura o scroll do feed
    }
}

function compartilharArtigo(titulo) {
    const urlAtual = window.location.href;
    if (navigator.share) {
        navigator.share({
            title: titulo,
            url: urlAtual
        }).catch(console.error);
    } else {
        navigator.clipboard.writeText(urlAtual);
        alert('Link copiado para a área de transferência!');
    }
}