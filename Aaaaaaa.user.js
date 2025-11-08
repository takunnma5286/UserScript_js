// ==UserScript==
// @name         あぁぁぁぁぁぁ
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  ああああああああああああああああああああああああ
// @match        https://twitter.com/*
// @match        https://x.com/*
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  function toAString(src) {
    return src.replace(/[^\s]/g, 'あ');
  }

  function replaceTextNode(node) {
    if (node.nodeType !== Node.TEXT_NODE) return;
    if (!node.nodeValue.trim()) return;
    node.nodeValue = toAString(node.nodeValue);
  }

  function walk(root) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    let node;
    while ((node = walker.nextNode())) replaceTextNode(node);
  }

  function observe() {
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        for (const n of m.addedNodes) {
          if (n.nodeType === Node.TEXT_NODE) replaceTextNode(n);
          else if (n.nodeType === Node.ELEMENT_NODE) walk(n);
        }
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function init() {
    walk(document.body);
    observe();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
