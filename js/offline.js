(function () {
    'use strict';
    var btn = document.getElementById('retry');
    if (btn) {
        btn.addEventListener('click', function () { window.location.reload(); });
    }
})();
