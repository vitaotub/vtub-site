/**
 * Website do canal VitãoTub - v1.2 (Com PWA Forçado e Feed Automático do YouTube)
 * Desenvolvido por: Victor (Vitão)
 */
	
// --- INTEGRAÇÃO ONESIGNAL PUSH ---
window.OneSignalDeferred = window.OneSignalDeferred || [];
OneSignalDeferred.push(function(OneSignal) {
  OneSignal.init({
    appId: "24dbec09-7c58-4193-9d90-8417abc8564e", // <--- SUBSTITUA PELO SEU ID REAL
    safari_web_id: "SEU_ID_SAFARI_AQUI_SE_HOUVER", // Opcional, para iPhone antigo
    notifyButton: {
      enable: true, // Mostra o sininho flutuante padrão
    },
  });
});

// --- INICIA O SERVICE WORKER (Obrigatório para o PWA e para o Popup) ---
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

  // Verifica se o HTML da popup realmente existe na página atual
  if (!pwaPopup) {
    console.log("Aviso: O HTML do popup não está nesta página.");
    return; // Para o código aqui se não achar a popup
  }

  console.log("Sucesso: HTML do popup encontrado! Preparando o gatilho de 2 segundos...");
  let deferredPrompt = null;

  // 1. Tenta capturar o evento nativo
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); 
    deferredPrompt = e; 
    pwaPopup.style.display = 'flex'; 
  });

  // 2. Verifica se já é App
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

  // 3. Gatilho forçado de 2 segundos
  if (!isStandalone) {
    setTimeout(() => {
      if (pwaPopup.style.display !== 'flex') {
        console.log("Forçando a exibição do popup agora!");
        pwaPopup.style.display = 'flex';
      }
    }, 2000);
  }

  // 4. Botão de Instalar
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

  // 5. Botão de Fechar
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
    privacyTargetId: 'privacy-content-target', // ID do container de texto
    scriptURL: 'https://script.google.com/macros/s/AKfycbwOnJ8aLNMfbOss06eRh_glZRNULpJ3j9HqeL7PCGPDfr80_vcCB5-hLEHkDddO-LFrqA/exec'
};

// 2. ANIMAÇÃO DE ESTATÍSTICAS
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            // Procura todas as barras dentro do elemento que entrou na tela
            const fills = entry.target.querySelectorAll('.demo-bar-fill, .bar-fill');
            
            fills.forEach(fill => {
                // Lê o valor diretamente da barra ou do pai (como backup)
                const targetWidth = fill.getAttribute('data-width') || 
                                    fill.parentElement.getAttribute('data-width') || 
                                    "100%";
                
                fill.style.width = targetWidth;
            });
        }
    });
}, { threshold: 0.1 });

// Observa os containers principais
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

// 4. MODAL DE PRIVACIDADE (CARREGAMENTO DINÂMICO)
async function openPrivacyModal() {
    const modal = document.getElementById(CONFIG.privacyModalId);
    const target = document.getElementById(CONFIG.privacyTargetId);
    
    if (modal && target) {
        modal.style.display = 'flex';
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        try {
            // Busca o arquivo limpo (sem estilos inline)
            const response = await fetch('./politica-de-privacidade.html');
            if (!response.ok) throw new Error('Arquivo não encontrado');
            
            const htmlContent = await response.text();
            target.innerHTML = htmlContent; 
        } catch (error) {
            console.error("Erro ao carregar política:", error);
            target.innerHTML = `<h2>Erro</h2><p>Não foi possível carregar o conteúdo. <a href="politica-de-privacidade.html" target="_blank">Clique aqui para abrir.</a></p>`;
        }
    }
}

// Função para abrir Termos de Uso
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
            console.error("Erro ao carregar termos:", error);
            target.innerHTML = `<h2>Erro</h2><p>Não foi possível carregar os termos. <a href="termos-de-uso.html" target="_blank" style="color: var(--primary-purple);">Clique aqui para abrir em uma nova aba.</a></p>`;
        }
    }
}

// FUNÇÃO DE FECHAMENTO DA PRIVACIDADE
function closePrivacyModal() {
    const modal = document.getElementById(CONFIG.privacyModalId);
    if (modal) {
        modal.classList.remove('active');
        // Usamos um timeout curto para esconder o display só após a transição do CSS
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

// 6. FUNÇÕES DE FECHAMENTO (TOAST E GERAL)
function closeToast() {
    const toast = document.getElementById(CONFIG.toastContainerId);
    if (toast) {
        toast.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Atalho Tecla ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        closeVideo();
        closeToast();
        closePrivacyModal();
    }
});

// Cliques no Fundo Escuro ou Botões de Fechar
document.addEventListener('click', function(e) {
    // Fecha Modal de Vídeo
    if (e.target.id === CONFIG.modalId || e.target.classList.contains('modal-overlay')) {
        closeVideo();
    }
    
    // Fecha Toast/Sucesso
    if (e.target.id === CONFIG.toastContainerId || e.target.classList.contains('toast-close-btn')) {
        closeToast();
    }
    
    // Fecha Modal de Privacidade
    if (e.target.id === CONFIG.privacyModalId || 
        e.target.classList.contains('modal-overlay') || 
        e.target.classList.contains('modal-close') ||
        e.target.innerText === '×') {
        closePrivacyModal();
    }
});

// 7. VOLTAR AO TOPO
const backToTopButton = document.getElementById('back-to-top');
if (backToTopButton) {
    backToTopButton.addEventListener('click', function(e) {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// 8. BANNER LGPD
function initCookieBanner() {
    const banner = document.getElementById("lgpd-banner");
    const btnAccept = document.getElementById("lgpd-accept");
    const btnReject = document.getElementById("lgpd-reject");

    // Verifica se o banner existe na página atual
    if (!banner) return;

    // Se não houver a marcação no navegador, mostra o banner após 1 segundo
    if (!localStorage.getItem("vitaotub_cookies_accepted")) {
        setTimeout(() => {
            banner.classList.add("show");
        }, 1000);
    }

    // Ação de Aceitar (Salva a preferência e fecha)
    if (btnAccept) {
        btnAccept.onclick = function() {
            localStorage.setItem("vitaotub_cookies_accepted", "true");
            banner.classList.remove("show");
        };
    }

    // Ação de Recusar (Apenas fecha o banner)
    if (btnReject) {
        btnReject.onclick = function() {
            banner.classList.remove("show");
        };
    }
}

// Inicializa quando o HTML terminar de carregar
document.addEventListener("DOMContentLoaded", initCookieBanner);


// --- LÓGICA DE ABAS E FEED AUTOMÁTICO (FASE 3) ---

// Função que controla a troca de abas no app
function mudarAba(aba) {
    const btnVideos = document.querySelector('.feed-tabs button:nth-child(1)');
    const btnArtigos = document.querySelector('.feed-tabs button:nth-child(2)');
    const secaoVideos = document.getElementById('secao-videos');
    const secaoArtigos = document.getElementById('secao-artigos');

    // Se os botões ou seções não existirem na página, para a execução
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

// 1. CARREGAMENTO MÁXIMO AUTOMÁTICO DOS VÍDEOS DO YOUTUBE (VIA RSS)
const ytContainer = document.getElementById('youtube-feed-container');

if (ytContainer) {
    async function carregarYouTubeAutomatico() {
        try {
            // Substitua 'SEU_CHANNEL_ID_AQUI' pelo ID real do seu canal (ex: UCxxxxxxxxxxxxxx)
            const channelID = 'SEU_CHANNEL_ID_AQUI'; 
            const RSS_URL = `https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.youtube.com%2ffeeds%2Fvideos.xml%3Fchannel_id%3D${channelID}`;
            
            const response = await fetch(RSS_URL);
            const data = await response.json();
            
            if (data.status === 'ok' && data.items.length > 0) {
                ytContainer.innerHTML = '';
                
                // Exibe todos os vídeos entregues pelo feed em ordem do mais recente para o mais antigo
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

// 2. CARREGAMENTO MANUAL DOS ARTIGOS (VIA JSON)
const artigosContainer = document.getElementById('artigos-feed-container');

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
            
            apenasArtigos.forEach(post => {
                const postElement = document.createElement('article');
                postElement.className = 'feed-card';
                
                postElement.innerHTML = `
                    <img src="${post.imagem}" alt="${post.titulo}" class="feed-image" loading="lazy">
                    <div class="feed-content">
                        <h2>${post.titulo}</h2>
                        <span class="feed-date">${post.data}</span>
                        <p>${post.descricao}</p>
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