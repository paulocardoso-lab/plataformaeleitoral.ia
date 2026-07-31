(function iniciarSegurancaPEIA(global) {
  'use strict';

  function escaparHtml(valor) {
    return String(valor ?? '').replace(/[&<>"']/g, caractere => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    })[caractere]);
  }

  function texto(valor) {
    return String(valor ?? '');
  }

  global.PEIA_SECURITY = Object.freeze({ escaparHtml, texto });
})(window);
