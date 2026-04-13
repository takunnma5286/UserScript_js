// ==UserScript==
// @name         X(Twitter) Niconico Linker
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds a Niconico Video link button next to hashtags like #sm12345 on X (Twitter).
// @author       takunnma
// @match        https://x.com/*
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=nicovideo.jp
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const NICONICO_ICON = `📺`;

    const PREFIXES = ['sm', 'nm', 'ax', 'ca', 'cd', 'cw', 'fx', 'ig', 'na', 'om', 'sd', 'sk', 'yk', 'yo', 'za', 'zb', 'zc', 'zd', 'ze', 'nl', 'so'];
    const ID_REGEX = new RegExp(`^#(${PREFIXES.join('|')})(\\d+)$`, 'i');

    const styles = `
        .nico-link-btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            vertical-align: middle;
            margin-left: 4px;
            padding: 2px;
            border-radius: 4px;
            background-color: transparent;
            transition: background-color 0.2s, transform 0.1s;
            cursor: pointer;
            line-height: 0;
            text-decoration: none;
        }
        .nico-link-btn:hover {
            background-color: rgba(0, 0, 0, 0.1);
            transform: scale(1.1);
        }
        [data-theme="dark"] .nico-link-btn:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
    `;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);

    function addNicoButtons() {
        // Target tweet text containers
        const tweetTexts = document.querySelectorAll('[data-testid="tweetText"]');

        tweetTexts.forEach(tweetText => {
            // Find hashtags within this tweet
            const hashtags = tweetText.querySelectorAll('a[href^="/hashtag/"]');

            hashtags.forEach(tag => {
                if (tag.hasAttribute('data-nico-processed')) return;

                const text = tag.innerText;
                const match = text.match(ID_REGEX);

                if (match) {
                    const videoId = match[1].toLowerCase() + match[2];
                    const url = `https://www.nicovideo.jp/watch/${videoId}`;

                    const btn = document.createElement('a');
                    btn.href = url;
                    btn.target = '_blank';
                    btn.rel = 'noopener noreferrer';
                    btn.className = 'nico-link-btn';
                    btn.title = `Open ${videoId} on Niconico`;
                    btn.innerHTML = NICONICO_ICON;

                    // Standard Twitter hashtag layout is sometimes complex, 
                    // but appending after the <a> tag is generally safe.
                    tag.parentNode.insertBefore(btn, tag.nextSibling);
                }

                tag.setAttribute('data-nico-processed', 'true');
            });
        });
    }

    // Run initially
    addNicoButtons();

    // Observe dynamic changes
    const observer = new MutationObserver((mutations) => {
        let shouldRun = false;
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                shouldRun = true;
                break;
            }
        }
        if (shouldRun) {
            addNicoButtons();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

})();
