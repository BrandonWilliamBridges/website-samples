/* ============================================================
   Fruit City Worldwide — Social media links
   ============================================================
   The one list of Fruit City's social accounts. Every page's footer
   and the Links page (links.html) draw their links from SOCIAL below,
   so adding a new account is a one-line change here.

   Add an account only once it is open and public. A page loads this with
   <script src="js/social.js"></script> after main.js and before i18n.js.
   Any element with data-social-links is filled with one <li> per account;
   the nearest data-social-wrap around it is shown once there is at least one.
   ============================================================ */
(function () {
  'use strict';

  var SOCIAL = [
    { name: 'Instagram', handle: '@fruitcityglobal', url: 'https://www.instagram.com/fruitcityglobal/' },
    { name: 'Pinterest', handle: '@fruitcityglobal', url: 'https://www.pinterest.com/fruitcityglobal/' }
  ];

  function render() {
    var lists = document.querySelectorAll('[data-social-links]');
    for (var i = 0; i < lists.length; i++) {
      var list = lists[i];
      var big = list.hasAttribute('data-social-big');
      list.innerHTML = '';
      for (var j = 0; j < SOCIAL.length; j++) {
        var s = SOCIAL[j];
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = s.url;
        a.rel = 'noopener me';
        a.target = '_blank';
        a.setAttribute('aria-label', 'Fruit City on ' + s.name + ' (' + s.handle + '), opens in a new tab');
        if (big) {
          a.className = 'links-list__item';
          var n = document.createElement('span');
          n.className = 'links-list__name';
          n.textContent = s.name;
          var h = document.createElement('span');
          h.className = 'links-list__sub';
          h.textContent = s.handle;
          a.appendChild(n);
          a.appendChild(h);
        } else {
          a.textContent = s.name;
        }
        li.appendChild(a);
        list.appendChild(li);
      }
      var wrap = list.closest('[data-social-wrap]');
      if (wrap) wrap.hidden = SOCIAL.length === 0;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', render);
  } else {
    render();
  }
})();
