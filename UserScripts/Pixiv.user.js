// ==UserScript==
// @name         Pixiv ブックマーク一括非公開化
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Pixivのブックマーク管理UIを自動クリックして全ページを非公開にします
// @author       takunnma
// @match        https://www.pixiv.net/users/*/bookmarks/artworks*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const STORAGE_KEY = 'pixiv_auto_private_running';
    const wait = ms => new Promise(r => setTimeout(r, ms));

    function findDeepestElementByText(text) {
        const elements = Array.from(document.querySelectorAll('*')).filter(el => {
            return el.textContent && el.textContent.trim() === text;
        });
        if (elements.length === 0) return null;

        const innermost = elements.filter(el => {
            return !Array.from(el.children).some(child => child.textContent && child.textContent.trim() === text);
        });
        return innermost[0] || elements[0];
    }

    async function waitForText(text, timeout = 8000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const el = findDeepestElementByText(text);
            if (el) return el;
            await wait(500); // 0.5秒ごとに再探索
        }
        return null;
    }

    function toggleAuto() {
        if (sessionStorage.getItem(STORAGE_KEY)) {
            sessionStorage.removeItem(STORAGE_KEY);
            alert('自動実行を停止しました。');
            location.reload();
        } else {
            if (!confirm('ページ上の「ブックマーク管理」→「全てを選択」→「非公開にする」を自動で繰り返し実行します。よろしいですか？\n（途中で止めたい場合は、右下の赤い停止ボタンを押してください）')) return;
            sessionStorage.setItem(STORAGE_KEY, 'true');
            location.reload();
        }
    }

    // 画面右下のコントローラー作成
    function createToggleButton() {
        const isRunning = sessionStorage.getItem(STORAGE_KEY);
        const btn = document.createElement('button');
        btn.textContent = isRunning ? '自動処理を停止する' : '▶一括非公開にする';
        btn.style.position = 'fixed';
        btn.style.bottom = '20px';
        btn.style.right = '20px';
        btn.style.zIndex = '999999';
        btn.style.padding = '12px 24px';
        btn.style.backgroundColor = isRunning ? '#f44336' : '#0096fa';
        btn.style.color = '#fff';
        btn.style.border = 'none';
        btn.style.borderRadius = '24px';
        btn.style.fontWeight = 'bold';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
        document.body.appendChild(btn);

        btn.addEventListener('click', toggleAuto);
    }

    // 自動クリック処理の本体
    async function runAutoPrivate() {
        console.log("自動化を開始します。画面のロードを待機中...");

        await wait(100);

        const manageBtn = await waitForText("ブックマーク管理", 8000);
        if (!manageBtn) {
            sessionStorage.removeItem(STORAGE_KEY);
            alert('処理が完了したか、「ブックマーク管理」ボタンが見つかりません。\n自動実行を終了します。');
            return;
        }
        manageBtn.click();
        console.log("「ブックマーク管理」をクリックしました");

        await wait(1000); // UIの切り替わりアニメーションを待つ
        let selectAllBtn = await waitForText("全てを選択", 3000) || await waitForText("全選択", 2000);
        if (!selectAllBtn) {
            sessionStorage.removeItem(STORAGE_KEY);
            alert('エラー: 「全てを選択」ボタンが見つかりませんでした。\n自動実行を停止します。');
            return;
        }
        selectAllBtn.click();
        console.log("「全てを選択」をクリックしました");

        await wait(100);
        const privateBtn = await waitForText("非公開にする", 3000);
        if (!privateBtn) {
            sessionStorage.removeItem(STORAGE_KEY);
            alert('エラー: 「非公開にする」ボタンが見つかりませんでした。\n自動実行を停止します。');
            return;
        }
        privateBtn.click();
        console.log("「非公開にする」をクリックしました");

        console.log("サーバーの処理完了を待機中...");
        await wait(500);

        console.log("ページをリロードします");
        location.reload();
    }

    createToggleButton();

    if (sessionStorage.getItem(STORAGE_KEY)) {
        runAutoPrivate();
    }

})();