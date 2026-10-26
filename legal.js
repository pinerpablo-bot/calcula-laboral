/**
 * CalculaLaboral 2026 - legal.js
 * Diccionario estático de textos legales y eventos click simples para modal y banner RGPD.
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  var LEGAL_TEXTS = {
    aviso: {
      title: 'Aviso Legal y Condiciones de Uso',
      html:
        '<h4>1. Identificación del Responsable</h4>' +
        '<p>En cumplimiento de la Ley 34/2002 (LSSI-CE), se informa que el portal web <strong>CalculaLaboral</strong> pone a disposición de los usuarios un canal de contacto directo a través del correo electrónico oficial: <a href="mailto:somoscalculacae@gmail.com"><strong>somoscalculacae@gmail.com</strong></a>.</p>' +
        '<h4>2. Objeto del Sitio Web</h4>' +
        '<p>CalculaLaboral ofrece simuladores gratuitos en línea para estimar el salario neto, finiquito, indemnización por extinción de contrato y coste laboral de empresa conforme a los parámetros generales vigentes en España en 2026.</p>' +
        '<h4>3. Exención de Responsabilidad</h4>' +
        '<p>Los resultados mostrados tienen carácter estrictamente orientativo e informativo y no constituyen asesoramiento laboral, fiscal, jurídico ni contable vinculante. Convenios colectivos, regímenes forales o situaciones personales específicas pueden modificar las cuantías reales.</p>' +
        '<h4>4. Propiedad Intelectual</h4>' +
        '<p>Todos los contenidos, textos editoriales, diseño y código fuente de CalculaLaboral están protegidos por la normativa de propiedad intelectual vigente.</p>'
    },
    privacidad: {
      title: 'Política de Privacidad (RGPD)',
      html:
        '<h4>1. Responsable y Contacto</h4>' +
        '<p>Para cualquier cuestión relativa a privacidad y protección de datos (Reglamento UE 2016/679 y LOPDGDD 3/2018), puedes escribir a <a href="mailto:somoscalculacae@gmail.com"><strong>somoscalculacae@gmail.com</strong></a>.</p>' +
        '<h4>2. Procesamiento 100% Local en tu Navegador</h4>' +
        '<p>Todos los importes salariales, fechas y datos familiares introducidos en las calculadoras se procesan exclusivamente en la memoria local de tu navegador. CalculaLaboral no envía, registra ni almacena ningún dato salarial en servidores externos.</p>' +
        '<h4>3. Google AdSense y Cookies de DART</h4>' +
        '<p>Este sitio web utiliza <strong>Google AdSense</strong> para mostrar publicidad. Google, como proveedor tercero, utiliza cookies (incluida la cookie de DART) para publicar anuncios basados en las visitas previas del usuario a este u otros sitios de Internet.</p>' +
        '<p>Los usuarios pueden inhabilitar el uso de la cookie de DART y la publicidad personalizada visitando la <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Configuración de anuncios de Google</a> o <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.</p>' +
        '<h4>4. Derechos del Usuario</h4>' +
        '<p>Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad enviando un correo electrónico a <a href="mailto:somoscalculacae@gmail.com"><strong>somoscalculacae@gmail.com</strong></a>.</p>'
    },
    cookies: {
      title: 'Política de Cookies',
      html:
        '<h4>1. ¿Qué son las cookies?</h4>' +
        '<p>Las cookies y tecnologías de almacenamiento local son pequeños archivos que el navegador guarda en tu dispositivo para recordar preferencias técnicas o gestionar servicios publicitarios.</p>' +
        '<h4>2. Cookies empleadas en CalculaLaboral</h4>' +
        '<ul>' +
        '<li><strong>Almacenamiento técnico necesario:</strong> Guarda tu elección sobre el aviso de cookies (clave <code>calculalaboral_consent</code>) para no mostrar el banner en cada visita.</li>' +
        '<li><strong>Cookies publicitarias de terceros (Google AdSense):</strong> Permiten mostrar anuncios relevantes y limitar la frecuencia publicitaria cuando navegas a través de HTTP/HTTPS.</li>' +
        '</ul>' +
        '<h4>3. Gestión de cookies en tu navegador</h4>' +
        '<p>Puedes bloquear o eliminar las cookies desde los ajustes de privacidad de Chrome, Firefox, Safari o Edge sin afectar al funcionamiento de nuestras calculadoras.</p>'
    },
    contacto: {
      title: 'Contacto Oficial',
      html:
        '<h4>Atención al Usuario de CalculaLaboral</h4>' +
        '<p>Si deseas enviarnos cualquier consulta, sugerencia de mejora o avisar de alguna incidencia, escríbenos directamente a nuestro correo oficial:</p>' +
        '<p><strong>Correo electrónico:</strong> <a href="mailto:somoscalculacae@gmail.com">somoscalculacae@gmail.com</a></p>' +
        '<p>Tiempo habitual de respuesta: de 24 a 48 horas hábiles.</p>'
    }
  };

  var modalOverlay = document.getElementById('legal-modal');
  var modalTitle = document.getElementById('modal-title');
  var modalBody = document.getElementById('modal-body');
  var modalCloseBtn = document.getElementById('modal-close-btn');

  function openLegalModal(key) {
    var entry = LEGAL_TEXTS[key];
    if (!entry || !modalOverlay || !modalTitle || !modalBody) {
      return;
    }
    modalTitle.textContent = entry.title;
    modalBody.innerHTML = entry.html;
    modalOverlay.style.display = 'flex';
    modalOverlay.setAttribute('aria-hidden', 'false');
  }

  function closeLegalModal() {
    if (!modalOverlay) {
      return;
    }
    modalOverlay.style.display = 'none';
    modalOverlay.setAttribute('aria-hidden', 'true');
  }

  var legalTriggers = document.querySelectorAll('[data-legal]');
  for (var i = 0; i < legalTriggers.length; i++) {
    legalTriggers[i].addEventListener('click', function (evt) {
      evt.preventDefault();
      var key = this.getAttribute('data-legal');
      if (key) {
        openLegalModal(key);
      }
    });
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeLegalModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', function (evt) {
      if (evt.target === modalOverlay) {
        closeLegalModal();
      }
    });
  }

  // Banner de cookies con bloque try/catch seguro para protocolo file://
  var cookieBanner = document.getElementById('cookie-banner');
  var btnAccept = document.getElementById('btn-cookie-accept');
  var btnReject = document.getElementById('btn-cookie-reject');
  var CONSENT_KEY = 'calculalaboral_consent';

  if (cookieBanner) {
    var savedConsent = null;
    try {
      savedConsent = window.localStorage.getItem(CONSENT_KEY);
    } catch (e) {
      savedConsent = null;
    }

    if (!savedConsent) {
      cookieBanner.style.display = 'block';
    } else {
      cookieBanner.style.display = 'none';
    }
  }

  function saveCookieChoice(choice) {
    try {
      window.localStorage.setItem(CONSENT_KEY, choice);
    } catch (e) {
      // Ignorar si file:// o modo incógnito bloquea localStorage
    }
    if (cookieBanner) {
      cookieBanner.style.display = 'none';
    }
  }

  if (btnAccept) {
    btnAccept.addEventListener('click', function () {
      saveCookieChoice('accepted');
    });
  }

  if (btnReject) {
    btnReject.addEventListener('click', function () {
      saveCookieChoice('rejected');
    });
  }
});
