// ==UserScript==
// @name         Google Sheets Full-width to Half-width Number Converter
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Automatically converts full-width (zenkaku) numbers to half-width (hankaku) when confirming a cell with Enter in Google Sheets.
// @author       takunnma
// @match        *://docs.google.com/spreadsheets/*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=google.com
// ==/UserScript==

(function() {
    'use strict';

    console.log('Google Sheets Hankaku Converter script loaded (v2 - on Enter).');

    function toHankaku(str) {
        if (!str) return str;
        return str.replace(/[０-９]/g, (char) => {
            return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
        });
    }

    function handleKeyDown(event) {

        if (event.key !== 'Enter' || event.shiftKey) {
            return;
        }

        if (event.isComposing) {
            return;
        }

        const target = event.target;
        const isEditable = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

        if (!isEditable) {
            return;
        }

        const originalValue = target.value !== undefined ? target.value : target.textContent;
        const convertedValue = toHankaku(originalValue);

        if (originalValue !== convertedValue) {
            console.log(`Converting on Enter: "${originalValue}" to "${convertedValue}"`);


            if (target.value !== undefined) {
                target.value = convertedValue;
            } else {
                target.textContent = convertedValue;
            }
        }
    }


    document.addEventListener('keydown', handleKeyDown, true);

})();
