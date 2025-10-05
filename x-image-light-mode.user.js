// ==UserScript==
// @name         X Image Light Mode Adjuster
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Forces images in tweets on X.com that contain the phrase "ダークモード非対応" (dark mode not supported) to be displayed in light mode only.
// @author       takunnma
// @match        *://twitter.com/*
// @match        *://x.com/*
// @grant        none
// @icon         https://www.google.com/s2/favicons?sz=64&domain=x.com
// ==/UserScript==

(function() {
    'use strict';

    const KEYWORD = "ダークモード非対応";
    const PROCESSED_MARKER = 'data-image-adjuster-processed';

    const processTweet = (tweet) => {
        if (tweet.hasAttribute(PROCESSED_MARKER)) {
            return false;
        }

        const tweetTextElement = tweet.querySelector('[data-testid="tweetText"]');
        const photoElements = tweet.querySelectorAll('[data-testid="tweetPhoto"] img');

        if (tweetTextElement && tweetTextElement.innerText.includes(KEYWORD) && photoElements.length > 0) {
            //console.log('Found target tweet with image. Applying white background.');
            photoElements.forEach(container => {
                container.parentElement.parentElement.style.backgroundColor = 'white';
            });
            tweet.setAttribute(PROCESSED_MARKER, 'true');
            return true;
        }
        return false;
    };

    const observerCallback = (mutationsList) => {
        for (const mutation of mutationsList) {
            for (const node of mutation.addedNodes) {
                if (node.nodeType === 1) {
                    const closestTweet = node.closest('[data-testid="tweet"]');
                    if (closestTweet) {
                        processTweet(closestTweet);
                    }
                }
            }
        }
    };

    const observer = new MutationObserver(observerCallback);
    observer.observe(document.body, { childList: true, subtree: true });

    document.querySelectorAll('[data-testid="tweet"]').forEach(processTweet);

    //console.log('X Image Light Mode Adjuster is active.');
})();
