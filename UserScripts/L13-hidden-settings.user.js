// ==UserScript==
// @name         Speed Wi-Fi HOME 5G L13 隠し設定タブ
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  L13の管理画面「詳細設定」に「隠し設定」タブを追加し、メニューに出ない画面（ネットワーク情報・温度・定期再起動・VPNなど）を一覧表示します。未翻訳の項目には日本語訳を補います。※管理画面のIPアドレスを変えた場合は @match も合わせて変更してください。
// @author       takunnma
// @match        http://192.168.0.1/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
    'use strict';


    const HASH = '#hidden_settings';
    const PATH = 'userscript/hidden_settings';
    const TAB_MARK = 'data-us-hidden-tab';
    const initialHash = location.hash;

    // ---- 隠し設定タブに並べる画面（hash / 表示名キー / 既定の表示名） ----
    const GROUPS = [
        { key: 'us_hs_group_info', text: '情報', items: [
            ['#network_info', 'network_info', 'ネットワーク情報'],
            ['#temp_status', 'temp_status_title', '温度ステータス'],
            ['#device_info', 'us_hs_device_info', '端末情報（詳細）'],
            ['#traffic_statistics', 'traffic_statistics', '通信量統計'],
            ['#sys_log', 'us_hs_sys_log', 'システムログ'],
        ]},
        { key: 'us_hs_group_device', text: '本体・回線', items: [
            ['#net_select', 'us_hs_net_select', 'ネットワーク選択'],
            ['#connect_limit', 'us_hs_connect_limit', '接続制限'],
            ['#restart_schedule', 'restart_schedule', '定期再起動'],
            ['#watch_dog_setting', 'watch_dog_setting', 'ウォッチドッグ'],
            ['#sleep_protection_mode', 'us_hs_sleep_protection_mode', 'LEDライト（タイマー）'],
            ['#thermal_switch', 'Thermal Switch Page', '温度保護設定'],
            ['#traffic_alert', 'traffic_alert', '通信量アラート'],
        ]},
        { key: 'us_hs_group_security', text: 'セキュリティ', items: [
            ['#vpn_client', 'vpn_client', 'VPNクライアント'],
            ['#pc_children_group', 'parental_control', 'ペアレンタルコントロール'],
            ['#pc_time_limited', 'pc_time_limited', '利用時間制限'],
            ['#wifi_mac_filter', 'wifi_mac_filter', 'MACアドレスフィルター'],
        ]},
        { key: 'us_hs_group_dev', text: '開発者向け（変更注意）', warn: true, items: [
            ['#ant_switch', 'ant_switch', 'アンテナ切替'],
            ['#rf_mmw', 'antenna_module', 'アンテナモジュール'],
            ['#slice_setting', 'slice_setting', 'スライス設定'],
            ['#bsp_tc_settings', 'tc_settings', '温度制御しきい値'],
            ['#tr069config', 'tr069config', 'TR-069設定'],
            ['#user_improv_switch', 'user_improv_switch', 'ユーザー体験向上プログラム'],
        ]},
    ];
    const HIDDEN_HASHES = GROUPS.flatMap(g => g.items.map(i => i[0]));

    // ---- 純正に翻訳が無いキーの日本語訳（既に訳があるキーは上書きしない） ----
    const JA = {
        // このスクリプト自身
        us_hidden_settings: '隠し設定',
        us_hs_group_info: '情報',
        us_hs_group_device: '本体・回線',
        us_hs_group_security: 'セキュリティ',
        us_hs_group_dev: '開発者向け（変更注意）',
        us_hs_device_info: '端末情報（詳細）',
        us_hs_sys_log: 'システムログ',
        us_hs_net_select: 'ネットワーク選択',
        us_hs_connect_limit: '接続制限',
        us_hs_sleep_protection_mode: 'LEDライト（タイマー）',
        us_hs_note_1: 'このタブはUserScriptで追加したもので、メーカーの公式メニューには表示されない画面を一覧にしています。',
        us_hs_note_2: '「開発者向け」の項目はメーカー・通信事業者向けの設定です。変更すると通信できなくなったり、本体が高温になったりする場合があります。',
        us_hs_note_3: '設定を変える前に、「その他」→「バックアップとリストア」で設定を書き出しておくことをおすすめします。',

        // ネットワーク情報
        '34g_frequency': '4G 周波数（EARFCN）',
        '34g_usedBand': '4G 使用バンド',
        '34g_signal_strength_label': '4G 受信電力（RSRP）',
        '34g_sinr': '4G SINR',
        '34g_4g_pci': '4G PCI',
        '34g_cell_id': '4G セルID',
        '5g_frequency': '5G 周波数（NR-ARFCN）',
        usedBand5g: '5G 使用バンド',
        signal_strength_label_5g: '5G 受信電力（RSRP）',
        '5g_sinr': '5G SINR',
        '5g_pci': '5G PCI',
        '5g_cell_id': '5G セルID',
        network_info_note: '現在接続している基地局（セル）の情報です。「— —」は、その方式で接続していないことを表します。',

        // 温度ステータス
        temp_status_title: '温度ステータス',
        temp_status_wifi_chip: 'Wi-Fiチップ',
        temp_pm_sensor_pa1: 'パワーアンプ（PA1）',
        temp_pm_sensor_mdm: 'モデム',
        temp_pm_modem_5g: '5Gモデム',
        temp_therm_pa_level: 'PA 温度制御レベル',
        temp_therm_pa_frl_level: 'PA（FRL）温度制御レベル',
        temp_therm_tj_level: 'チップ内部温度（Tj）制御レベル',

        // 端末情報（詳細）・ネットワーク選択・接続モード
        IMSI: 'IMSI',
        manual_search_alert: 'ネットワークを検索しています。検索中は通信が切断されます。しばらくお待ちください。',
        dial_roaming_remind: 'ローミング中の接続を許可する',

        // 定期再起動
        restart_schedule: '定期再起動',
        enable_reboot_switch: '定期再起動を有効にする',
        enable_reboot_byweek: '曜日を指定して再起動',
        interval_hours: '間隔（時間）',
        enable_reboot_bymonth: '日付を指定して再起動',
        interval_date: '間隔（日）',
        mon: '月', tues: '火', wed: '水', thur: '木', fri: '金', sat: '土', sun: '日',
        restart_schedule_note_rules: '指定した条件になると、本体が自動で再起動します。再起動中は通信できません。',
        restart_schedule_note_time: '時刻：再起動する時刻を24時間表記で指定します。',
        restart_schedule_note_week: '曜日：再起動する曜日を選びます（複数選択できます）。',
        restart_schedule_note_interval_hour: '間隔（時間）：指定した時間ごとに再起動します。',
        restart_schedule_note_interval: '間隔（日）：指定した日数ごとに再起動します。',
        system_time_not_syn: '本体の時刻がまだ同期されていないため、設定できません。インターネットに接続してから、もう一度お試しください。',
        operating: '処理中です…',

        // ウォッチドッグ
        watch_dog_setting: 'ウォッチドッグ',
        watch_dog: 'ウォッチドッグ',
        detectTimeout: '応答待ち時間',
        pingURL: '確認先（Ping宛先）',
        reboot_threshold: '再起動までの失敗回数',
        watch_dog_times: '回',
        time_interval: '確認間隔',
        rebootEnable: '失敗時に本体を再起動する',
        watch_dog_note_switch: 'ウォッチドッグ：インターネットにつながっているかを定期的に確認し、つながらない状態が続くと自動で復旧を試みます。',
        watch_dog_note_alert: '設定によっては再起動を繰り返す場合があります。',
        watch_dog_reboot_too_much_warning: '再起動の回数が多すぎます。設定を見直してください。',
        watch_dog_note_url: '確認先：接続確認に使う宛先（ドメイン名またはIPアドレス）です。',
        watch_dog_note_reboot: '再起動までの失敗回数：確認に続けて失敗した回数がこの値に達すると、復旧処理を行います。',
        watch_dog_note_times: '回数は1以上で指定してください。',
        watch_dog_note_detect_timeout: '応答待ち時間：1回の確認で応答を待つ秒数です（1〜30秒）。',
        watch_dog_note_reboot_enable: '失敗時に本体を再起動する：オンにすると、復旧処理として本体を再起動します。',

        // LEDライト（タイマー）・温度保護
        tsw_note: 'オフ時間設定：指定した時間帯にLEDライトを消灯します。',
        tsw_note_on: 'オン時刻：LEDライトを点灯する時刻です。',
        tsw_note_off: 'オフ時刻：LEDライトを消灯する時刻です。',
        tsw_timer_on: 'オン時刻',
        tsw_timer_off: 'オフ時刻',
        'Thermal Switch Page': '温度保護設定',
        'Thermal Switch': '温度保護',
        'LED Switch': 'LEDスイッチ',

        // 通信量統計・通信量アラート
        traffic_statistics: '通信量統計',
        traffic_alert: '通信量アラート',
        traffic_sub_title: '月間の通信量・接続時間の上限と、通知のタイミングを設定します。',
        traffic_clear: '毎月の自動リセット',
        traffic_limit_data: '月間データ上限',
        traffic_when: '上限の',
        traffic_alert_reach_text: '{0} に達したら通知',
        traffic_time_used: '使用済み時間',
        traffic_time_plan: '月間時間上限',
        traffic_used_text: '使用済み：{0}',
        traffic_limit_data_text: '上限：{0}',
        traffic_data_left_text: '残り：{0}',
        traffic_limit_time_text: '上限：{0}',
        used_time_unit_60: '時間',
        used_time_unit_1: '分',

        // VPNクライアント
        vpn_client: 'VPNクライアント',
        vpn_server_ip: 'サーバーアドレス',
        vpn_l2tp_password: 'L2TPパスワード',
        vpn_username: 'ユーザー名',
        vpn_password: 'パスワード',
        vpn_auto_connect: '自動接続',
        vpn_connect_status: '接続状態',
        vpn_remote_ip: 'リモートIPアドレス',
        vpn_local_ip: 'ローカルIPアドレス',
        vpn_connected_note: 'VPN接続中は設定を変更できません。変更するときは先に切断してください。',
        vpn_note: '接続先VPNサーバーの情報を入力して接続します。',
        vpn_type_PPTP: 'PPTP',
        vpn_type_L2TP: 'L2TP',

        // ペアレンタルコントロール・利用時間制限
        parental_control: 'ペアレンタルコントロール',
        restricted_time: '利用制限時間',
        pc_children_group: '子どものデバイス',
        pc_manage: '管理',
        pc_no_children_device: '子どものデバイスはまだ登録されていません。',
        pc_current_attached_devices: '接続中のデバイス',
        pc_in_child_group: '登録済み',
        pc_add: '追加',
        parent_control_note_kids: '子どものデバイスとして登録した機器は、設定した時間帯だけインターネットを利用できます。',
        restricted_time_list: '利用制限時間の一覧',
        restricted_access_time: '利用できる時間',
        restricted_access_time_repeat: '繰り返し',
        restricted_time_status: '状態',
        parent_control_note_time: '利用制限時間：子どものデバイスがインターネットを使える時間帯を設定します。',
        parental_add_self: '今使っているデバイスを子どものデバイスに追加すると、この画面に入れなくなる場合があります。追加しますか？',
        modify_hostname_invalid: 'デバイス名が正しくありません。',
        exist_unsave_rules: '保存していない設定があります。',
        pc_time_limited: '利用時間制限',
        pc_forbid_time: '利用禁止',
        pc_allow_time: '利用可能',
        pc_setting_desc: '表をクリックして、インターネットを使える時間帯を設定します。',
        pc_not_save: '変更がまだ保存されていません。',

        // MACアドレスフィルター
        ap_station: 'Wi-Fiスポット',
        wifi_mac_filter: 'MACアドレスフィルター',
        mac_filter_help_1: 'MACアドレスフィルター：登録した機器のWi-Fi接続を許可、または拒否します。',
        mac_filter_help_2: 'ブラックリスト：リストに登録した機器の接続を拒否します。',
        mac_filter_help_3: 'ホワイトリスト：リストに登録した機器だけ接続を許可します。',
        mac_filter_help_4: '今使っている機器を拒否しないよう注意してください。',
        anti_vio_ack_open_note: '設定を変更すると、接続中の機器が切断される場合があります。続行しますか？',
        white_list_max: 'ホワイトリストの登録数が上限に達しています。',
        can_not_close_last_ssid: 'すべてのWi-Fi（SSID）を無効にすることはできません。',

        // アンテナ
        ant_switch: 'アンテナ切替',
        antenna_module: 'アンテナモジュール',
        antenna_module_debug: 'アンテナモジュールのデバッグ',
        antenna_module_infor: 'アンテナモジュール情報',
        antenna_module_debug_note: '使用するアンテナモジュールを選択してください。',
        antenna_module_1: 'アンテナモジュール1',
        antenna_module_2: 'アンテナモジュール2',
        antenna_module_3: 'アンテナモジュール3',
        antenna_module_4: 'アンテナモジュール4',
        antenna_module_debug_note2: '開発者向けのデバッグ機能です。通常は変更しないでください。',

        // スライス設定
        slice_setting: 'スライス設定',
        slice_title_2: 'スライス用APN',
        slice_title_3: '振り分けルール',
        vlan_id: 'VLAN ID',
        pdn_switch: 'PDN接続',

        // 温度制御しきい値
        tc_settings: '温度制御しきい値',
        tc_zte_sensor_ambient: '周囲温度',
        tc_zte_sensor_pa: 'PA',
        tc_zte_sensor_pa1: 'PA1',
        tc_zte_sensor_modem_skin: 'モデム表面',
        tc_zte_sensor_sdx_case: 'SDX筐体',
        tc_thermal_type: '制御タイプ',
        tc_threshold_1: 'しきい値1',
        tc_threshold_2: 'しきい値2',
        tc_threshold_3: 'しきい値3',
        // 制御タイプの値（0/1/2）の意味は画面のプログラムから読み取れないので、番号のまま表示する
        tc_thermal_type_0: '方式 0',
        tc_thermal_type_1: '方式 1',
        tc_thermal_type_2: '方式 2',

        // TR-069
        tr069config: 'TR-069設定',
        tr069_module: 'TR-069',
        tr181: 'TR-181',
        tr098: 'TR-098',
        server_url: 'ACSサーバーURL',
        server_user_name: 'ACSユーザー名',
        server_password: 'ACSパスワード',
        connection_request_url: '接続要求URL',
        connection_request_uname: '接続要求ユーザー名',
        connection_request_password: '接続要求パスワード',
        periodic_inform: '定期通知',
        periodic_inform_interval: '定期通知の間隔',
        tr069_note: 'TR-069は、通信事業者が本体を遠隔管理するための機能です。変更すると正常に動作しなくなる場合があります。',
        certificate_file_nomatch: '証明書ファイルの形式が正しくありません。',

        // ユーザー体験向上プログラム
        user_improv_switch: 'ユーザー体験向上プログラム',
        user_improv_note_1: '有効にすると、品質向上のため本体の利用状況がメーカーに送信されます。',
    };

    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const tabRow = active => `
        <ul class="nav nav-tabs nav-justified" role="tablist">
            <li><a href="#sleep_mode" data-trans="sleep_mode">LEDライト</a></li>
            <li><a href="#router_setting" data-trans="router_setting">本体設定</a></li>
            <li><a href="#firewall" data-trans="firewall">ファイアウォール</a></li>
            <li><a href="#ota_update" data-trans="update_settings">アップデート</a></li>
            <li><a href="#others" data-trans="others">その他</a></li>
            <li class="${active ? 'active' : ''}" ${TAB_MARK}="1"><a href="${HASH}" data-trans="us_hidden_settings">隠し設定</a></li>
        </ul>`;
    const pageHtml = () => `
        <div id="innerContainer">
            <div class="row header-row">
                <div class="col-xs-1"><a href="#home"><img alt="" src="img/ic_back.png"></a></div>
                <div class="col-xs-11"><div class="form-title"><h1 data-trans="advanced_settings">詳細設定</h1></div></div>
            </div>
            <div class="row">
                <div class="col-xs-1 margin-top-15"></div>
                <div class="col-xs-11">
                    <div class="form-body margin-top-20">
                        <div class="row meun-nav-new"><a href="#home"><img alt="" src="img/ic_settings_settings_blue.png"></a></div>
                        ${tabRow(true)}
                        <div class="form-body">
                            <div class="content margin-top-20 line-height-30">
                                ${GROUPS.map(g => `
                                    <div class="row margin-top-20"><div class="col-xs-12"><strong data-trans="${g.key}" ${g.warn ? 'class="colorRed"' : ''}>${esc(g.text)}</strong></div></div>
                                    ${g.items.map(([hash, key, text]) => `
                                        <div class="row margin-top-10">
                                            <a href="${hash}"><div class="col-xs-4 arrow-right" data-trans="${esc(key)}">${esc(text)}</div></a>
                                        </div>`).join('')}
                                `).join('')}
                            </div>
                            <div class="form-note">
                                <div class="notes-title">&nbsp;</div>
                                <ul class="notes-content">
                                    <li data-trans="us_hs_note_1"></li>
                                    <li data-trans="us_hs_note_2"></li>
                                    <li data-trans="us_hs_note_3"></li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

    // ---- 日本語訳の補完（日本語表示のときだけ、足りないキーだけ追加） ----
    function isJapanese() {
        const $ = window.jQuery;
        return !!($ && $.i18n && $.i18n.map && $.i18n.prop('others') === 'その他');
    }
    function patchI18n() {
        if (!isJapanese()) return false;
        const map = window.jQuery.i18n.map;
        for (const [k, v] of Object.entries(JA)) {
            if (!(k in map)) map[k] = v;
        }
        return true;
    }

    const SPARE_HASHES = ['#group_colleague', '#group_friend', '#group_family', '#group_common'];
    let menuRef = null;
    function registerPage() {
        return new Promise((resolve, reject) => {
            window.define('text!tmpl/' + PATH + '.html', [], () => pageHtml());
            window.define(PATH, [], () => ({ init() {} }));
            window.require(['config/config'], cfg => {
                const name = ({ LTE_BRIDGE: 'menu_bridge', MULTIWAN: 'menu_multiwan', AUTO_PPPOE: 'menu_pppoe', AUTO_DHCP: 'menu_pppoe',
                    PPPOE: 'menu_pppoe', DHCP: 'menu_pppoe', STATIC: 'menu_pppoe' })[cfg.opms_wan_mode] || 'menu_4ggateway';
                window.require(['config/' + cfg.DEVICE + '/' + name], menu => {
                    menuRef = menu;
                    ensureMenuEntry();
                    resolve();
                }, reject);
            }, reject);
        });
    }
    function ensureMenuEntry() {
        if (!menuRef || menuRef.some(m => m.hash === HASH)) return;
        const base = menuRef.find(m => m.hash === '#others') || { level: '3', parent: '#device_setting' };
        const spare = SPARE_HASHES.map(h => menuRef.find(m => m.hash === h)).find(Boolean);
        if (!spare) {
            console.warn('[L13 隠し設定] 書き換えに使える空き項目が見つかりませんでした');
            return;
        }
        Object.assign(spare, { hash: HASH, path: PATH, level: base.level, parent: base.parent, requireLogin: true, checkSIMStatus: false });
    }

    function decorate() {
        const container = document.getElementById('container');
        if (!container) return;
        container.querySelectorAll('ul.nav-tabs').forEach(ul => {
            if (!ul.querySelector('a[href="#others"]') || ul.querySelector(`[${TAB_MARK}]`)) return;
            const li = document.createElement('li');
            li.setAttribute(TAB_MARK, '1');
            li.innerHTML = `<a href="${HASH}" data-trans="us_hidden_settings">${esc(JA.us_hidden_settings)}</a>`;
            ul.appendChild(li);
        });
        if (HIDDEN_HASHES.includes(location.hash)) {
            if (!container.querySelector('.header-row') && container.children.length && !container.querySelector('[data-us-frame]')) {
                const item = GROUPS.flatMap(g => g.items).find(i => i[0] === location.hash);
                const title = item ? (isJapanese() ? window.jQuery.i18n.prop(item[1]) : item[2]) : '';
                const frame = document.createElement('div');
                frame.setAttribute('data-us-frame', '1');
                frame.innerHTML = `
                    <div class="row header-row">
                        <div class="col-xs-1"><a href="${HASH}"><img alt="" src="img/ic_back.png"></a></div>
                        <div class="col-xs-11"><div class="form-title"><h1>${esc(title)}</h1></div></div>
                    </div>
                    <div class="row">
                        <div class="col-xs-1 margin-top-15"></div>
                        <div class="col-xs-11"><div class="form-body margin-top-20" data-us-frame-body></div></div>
                    </div>`;
                const body = frame.querySelector('[data-us-frame-body]');
                while (container.firstChild) body.appendChild(container.firstChild);
                container.appendChild(frame);
            }
            const back = container.querySelector('.header-row a[href]');
            if (back && back.getAttribute('href') !== HASH) back.setAttribute('href', HASH);
        }
        if (patchI18n()) {
            container.querySelectorAll('[data-trans]').forEach(el => {
                const k = el.getAttribute('data-trans');
                if (!(k in JA)) return;
                const text = window.jQuery.i18n.prop(k);
                if (!text || text === k) return;
                if (el.tagName === 'INPUT') {
                    if ((!el.value || el.value === k) && el.value !== text) el.value = text;
                } else if (el.children.length === 0) {
                    const cur = el.textContent.trim();
                    if ((cur === '' || cur === k) && cur !== text) el.textContent = text;
                }
            });
        }
    }

    let observer = null;
    let pending = false;
    function watch() {
        const container = document.getElementById('container');
        observer = new MutationObserver(() => {
            if (pending) return;
            pending = true;
            setTimeout(() => {
                pending = false;
                observer.disconnect();
                try { decorate(); } finally { observer.observe(container, { childList: true, subtree: true }); }
            }, 50);
        });
        observer.observe(container, { childList: true, subtree: true });
    }

    // ---- 起動 ----
    function ready() {
        const $ = window.jQuery;
        return typeof window.require === 'function' && typeof window.define === 'function' && $ && $.i18n && $.i18n.map && document.getElementById('container');
    }
    const boot = setInterval(() => {
        if (!ready()) return;
        clearInterval(boot);
        patchI18n();
        registerPage().then(() => {
            if (initialHash === HASH && location.hash !== HASH) location.hash = HASH;
        }).catch(e => console.warn('[L13 隠し設定] 登録に失敗しました', e));

        watch();
        setInterval(() => { patchI18n(); ensureMenuEntry(); }, 1000);
        decorate();
    }, 200);
})();
