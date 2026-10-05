// ==UserScript==
// @name         Download Page HTML
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a button to download the current page's HTML
// @match        https://app.overgrad.com/universities/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const button = document.createElement('button');

    button.textContent = 'Download HTML';

    button.style.position = 'fixed';
    button.style.top = '10px';
    button.style.right = '10px';
    button.style.zIndex = '999999';
    button.style.padding = '8px 12px';
    button.style.background = '#333';
    button.style.color = '#fff';
    button.style.border = 'none';
    button.style.borderRadius = '5px';
    button.style.cursor = 'pointer';

    button.addEventListener('click', function () {
        const html = document.documentElement.outerHTML;

        const blob = new Blob([html], {
            type: 'text/html'
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = document.title;

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(url);
    });

    document.body.appendChild(button);
})();