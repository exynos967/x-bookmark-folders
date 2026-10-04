// ==UserScript==
// @name         X 书签文件夹（第三方）
// @namespace    https://x.com/xbf
// @homepageURL  https://github.com/exynos967/x-bookmark-folders
// @supportURL   https://github.com/exynos967/x-bookmark-folders/issues
// @updateURL    https://raw.githubusercontent.com/exynos967/x-bookmark-folders/main/x-bookmark-folders.user.js
// @downloadURL  https://raw.githubusercontent.com/exynos967/x-bookmark-folders/main/x-bookmark-folders.user.js
// @version      1.7.2
// @description  无需 X Premium 的本地书签文件夹。电脑端入口在左侧栏 Money 下方，手机端入口在头像抽屉菜单 Money 下方；帖子「分享」按钮右侧新增文件夹按钮，可选择放入哪个文件夹；支持 WebDAV 跨浏览器同步。
// @match        https://x.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      *
// @noframes
// ==/UserScript==

(function () {
  "use strict";
  document.documentElement.dataset.xbf = "1.7.2"; // 运行标记，方便在控制台确认脚本已生效

  // ───────────────────────── i18n ─────────────────────────
  const ZH = /^zh/i.test(document.documentElement.lang || navigator.language);
  const T = ZH
    ? {
        entry: "书签文件夹",
        all: "全部收藏",
        addTo: "添加到文件夹",
        newFolder: "新建文件夹",
        folderName: "文件夹名称（最多 25 个字）",
        rename: "重命名",
        del: "删除文件夹",
        delConfirm: (n) =>
          "确定删除文件夹「" +
          n +
          "」吗？其中的帖子记录会一并移除（不影响 X 原生书签）。",
        manage: "管理文件夹",
        empty: "还没有文件夹，点右上角「+」新建一个吧",
        emptyFolder: "这个文件夹还是空的",
        saved: (n) => "已添加到「" + n + "」",
        removed: (n) => "已从「" + n + "」移除",
        count: (c) => c + " 条帖子",
        exp: "导出",
        imp: "导入",
        impDone: (c) => "已导入，新增 " + c + " 条记录",
        impFail: "导入失败：文件格式不正确",
        dup: "已存在同名文件夹",
        remove: "移出文件夹",
        close: "关闭",
        back: "返回",
        local: "仅保存在本浏览器",
        settings: "设置",
        sync: "WebDAV 云端同步",
        davUrl: "WebDAV 文件夹地址",
        davUser: "用户名",
        davPass: "密码 / 应用密码",
        davHint:
          "数据会保存为该文件夹下的 x-bookmark-folders.json。坚果云请填写「第三方应用密码」。首次请求时脚本管理器会询问是否允许访问该域名，请选择「总是允许」。",
        autoSync: "自动同步",
        autoSyncHint:
          "修改收藏后约 30 秒同步一次，期间的多次修改合并为一次；未同步完的修改会在下次打开页面时补上",
        save: "保存",
        test: "测试连接",
        syncNow: "立即同步",
        backup: "本地备份",
        cfgSaved: "设置已保存",
        testOk: "连接成功",
        syncOk: "同步完成",
        syncing: "同步中…",
        lastSync: (t) => "上次同步：" + t,
        never: "尚未同步",
        syncFail: (m) => "同步失败：" + m,
        noUrl: "请先填写 WebDAV 地址",
        authFail: "用户名或密码错误",
        badRemote: "云端文件不是有效的书签数据",
        noGM: "脚本管理器不支持跨域请求（GM_xmlhttpRequest）",
        synced: "已开启云端同步",
        passKept: "已加密保存，留空表示不修改",
        keyLost:
          "无法解密已保存的密码（可能清除过 x.com 的网站数据），请重新输入密码并保存",
        encHint:
          "密码使用 AES-GCM 加密后保存；密钥是浏览器内不可导出的本机密钥，脚本存储里只有密文。",
      }
    : {
        entry: "Folders",
        all: "All saved",
        addTo: "Add to folder",
        newFolder: "New folder",
        folderName: "Folder name (max 25 chars)",
        rename: "Rename",
        del: "Delete folder",
        delConfirm: (n) =>
          'Delete folder "' +
          n +
          '"? Saved posts in it will be removed (native bookmarks are untouched).',
        manage: "Manage folders",
        empty: 'No folders yet. Tap "+" to create one.',
        emptyFolder: "This folder is empty",
        saved: (n) => 'Added to "' + n + '"',
        removed: (n) => 'Removed from "' + n + '"',
        count: (c) => c + " posts",
        exp: "Export",
        imp: "Import",
        impDone: (c) => "Imported, " + c + " new entries",
        impFail: "Import failed: invalid file",
        dup: "A folder with this name already exists",
        remove: "Remove from folder",
        close: "Close",
        back: "Back",
        local: "Stored in this browser only",
        settings: "Settings",
        sync: "WebDAV sync",
        davUrl: "WebDAV folder URL",
        davUser: "Username",
        davPass: "Password / app password",
        davHint:
          'Data is stored as x-bookmark-folders.json in that folder. Your userscript manager will ask to allow the domain on first request — choose "Always allow".',
        autoSync: "Auto sync",
        autoSyncHint:
          "Syncs about 30s after you change bookmarks (changes in between are batched); unsynced changes are retried on next page load",
        save: "Save",
        test: "Test connection",
        syncNow: "Sync now",
        backup: "Local backup",
        cfgSaved: "Settings saved",
        testOk: "Connection OK",
        syncOk: "Sync complete",
        syncing: "Syncing…",
        lastSync: (t) => "Last sync: " + t,
        never: "Never synced",
        syncFail: (m) => "Sync failed: " + m,
        noUrl: "Please enter a WebDAV URL first",
        authFail: "Wrong username or password",
        badRemote: "Remote file is not valid bookmark data",
        noGM: "Your userscript manager lacks GM_xmlhttpRequest",
        synced: "Cloud sync enabled",
        passKept: "Saved encrypted — leave empty to keep",
        keyLost:
          "Cannot decrypt the saved password (site data may have been cleared). Please re-enter and save it.",
        encHint:
          "The password is stored AES-GCM encrypted with a non-extractable key kept in this browser; script storage only holds ciphertext.",
      };

  // ───────────────────────── 键值存储 ─────────────────────────
  const KV = (() => {
    const hasGM =
      typeof GM_getValue === "function" && typeof GM_setValue === "function";
    return {
      get(key) {
        try {
          const raw = hasGM
            ? GM_getValue(key, null)
            : localStorage.getItem(key);
          return typeof raw === "string" ? JSON.parse(raw) : raw;
        } catch {
          return null;
        }
      },
      set(key, value) {
        const str = JSON.stringify(value);
        hasGM ? GM_setValue(key, str) : localStorage.setItem(key, str);
      },
    };
  })();

  // ───────────────────────── 数据层 ─────────────────────────
  /**
   * v2 数据结构为可合并的 LWW（后写者胜）集合，便于多端同步：
   *   folders[id] = { name, created, t, del?, items: { [postId]: { on, t } } }
   *   posts[id]   = 帖子快照
   * 删除只打墓碑（del / on:false），过期后再清理，避免同步时被另一端“复活”。
   */
  const Store = (() => {
    const KEY = "xbf:data:v2",
      V1_KEY = "xbf:data:v1";
    const TOMBSTONE_TTL = 180 * 864e5;
    const listeners = new Set();
    const empty = () => ({ v: 2, folders: {}, posts: {} });
    const uid = () =>
      Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    const isObj = (x) => !!x && typeof x === "object" && !Array.isArray(x);

    /** 把 v1 / v2 / 导出文件统一成 v2；无法识别时 strict 模式抛错 */
    function normalize(d, strict) {
      if (isObj(d) && d.v === 2 && isObj(d.folders))
        return {
          v: 2,
          folders: d.folders,
          posts: isObj(d.posts) ? d.posts : {},
        };
      if (isObj(d) && Array.isArray(d.folders)) {
        const out = empty(),
          now = Date.now(),
          posts = isObj(d.posts) ? d.posts : {};
        for (const f of d.folders) {
          if (!f || typeof f.name !== "string" || !Array.isArray(f.items))
            continue;
          const items = {};
          f.items.forEach((pid, i) => {
            items[pid] = { on: true, t: posts[pid]?.savedAt || now - i };
          });
          out.folders[f.id || uid()] = {
            name: f.name.slice(0, 25),
            created: f.created || now,
            t: f.created || now,
            items,
          };
        }
        Object.assign(out.posts, posts);
        return out;
      }
      if (strict) throw new Error("invalid");
      return empty();
    }

    function read() {
      const d = KV.get(KEY);
      return d ? normalize(d) : normalize(KV.get(V1_KEY)); // 首次运行自动迁移 v1
    }

    /** 两份数据按时间戳合并：文件夹名称/删除以较新的为准，成员关系逐条比较 */
    function merge(a, b) {
      const out = empty();
      for (const id of new Set([
        ...Object.keys(a.folders),
        ...Object.keys(b.folders),
      ])) {
        const x = a.folders[id],
          y = b.folders[id];
        if (!x || !y) {
          out.folders[id] = structuredClone(x || y);
          continue;
        }
        const head = (y.t || 0) > (x.t || 0) ? y : x;
        const items = { ...x.items };
        for (const [pid, it] of Object.entries(y.items || {}))
          if (!items[pid] || it.t > items[pid].t) items[pid] = it;
        out.folders[id] = {
          name: head.name,
          created: Math.min(x.created || Infinity, y.created || Infinity),
          t: head.t,
          items,
        };
        if (head.del) out.folders[id].del = true;
      }
      for (const src of [a.posts, b.posts]) {
        for (const [pid, p] of Object.entries(src)) {
          if (
            !out.posts[pid] ||
            (p.savedAt || 0) > (out.posts[pid].savedAt || 0)
          )
            out.posts[pid] = p;
        }
      }
      return out;
    }

    /** 清理过期墓碑与不再被引用的帖子快照 */
    function gc(d) {
      const expired = Date.now() - TOMBSTONE_TTL,
        used = new Set();
      for (const [id, f] of Object.entries(d.folders)) {
        if (f.del) {
          if (f.t < expired) delete d.folders[id];
          continue;
        }
        for (const [pid, it] of Object.entries(f.items)) {
          if (it.on) used.add(pid);
          else if (it.t < expired) delete f.items[pid];
        }
      }
      for (const pid of Object.keys(d.posts))
        if (!used.has(pid)) delete d.posts[pid];
      return d;
    }

    function write(d, source = "local") {
      KV.set(KEY, gc(d));
      listeners.forEach((fn) => fn(source));
    }
    // 每次操作都重新读取，避免多标签页互相覆盖
    const mutate = (fn) => {
      const d = read();
      const r = fn(d);
      write(d);
      return r;
    };
    const live = (d) => Object.entries(d.folders).filter(([, f]) => !f.del);
    const activeIds = (f) =>
      Object.entries(f.items)
        .filter(([, it]) => it.on)
        .sort((x, y) => y[1].t - x[1].t)
        .map(([pid]) => pid);
    const countActive = (d) =>
      live(d).reduce((n, [, f]) => n + activeIds(f).length, 0);

    function validName(d, name, exceptId) {
      name = (name || "").trim().slice(0, 25);
      if (!name) return null;
      if (live(d).some(([id, f]) => id !== exceptId && f.name === name)) {
        toast(T.dup);
        return null;
      }
      return name;
    }

    return {
      /** 订阅变更，回调参数为来源：'local' | 'sync' | 'import'；返回取消订阅函数 */
      onChange: (fn) => {
        listeners.add(fn);
        return () => listeners.delete(fn);
      },
      folders: () =>
        live(read())
          .sort((x, y) => x[1].created - y[1].created)
          .map(([id, f]) => ({ id, name: f.name, items: activeIds(f) })),
      folderIdsOf: (postId) =>
        new Set(
          live(read())
            .filter(([, f]) => f.items[postId]?.on)
            .map(([id]) => id),
        ),
      posts(folderId) {
        const d = read();
        if (folderId) {
          const f = d.folders[folderId];
          return f && !f.del
            ? activeIds(f)
                .map((id) => d.posts[id])
                .filter(Boolean)
            : [];
        }
        const ids = new Set(live(d).flatMap(([, f]) => activeIds(f)));
        return [...ids]
          .map((id) => d.posts[id])
          .filter(Boolean)
          .sort((a, b) => b.savedAt - a.savedAt);
      },
      create: (name) =>
        mutate((d) => {
          const n = validName(d, name);
          if (!n) return null;
          const id = uid(),
            now = Date.now();
          d.folders[id] = { name: n, created: now, t: now, items: {} };
          return { id, name: n };
        }),
      rename: (id, name) =>
        mutate((d) => {
          const f = d.folders[id],
            n = f && validName(d, name, id);
          if (n) {
            f.name = n;
            f.t = Date.now();
          }
        }),
      remove: (id) =>
        mutate((d) => {
          const f = d.folders[id];
          if (f) Object.assign(f, { del: true, t: Date.now(), items: {} });
        }),
      /** 切换帖子在文件夹中的状态，返回切换后是否在文件夹内 */
      toggle: (folderId, post) =>
        mutate((d) => {
          const f = d.folders[folderId];
          if (!f || f.del) return false;
          const on = !f.items[post.id]?.on,
            now = Date.now();
          f.items[post.id] = { on, t: now };
          if (on)
            d.posts[post.id] = { ...d.posts[post.id], ...post, savedAt: now };
          return on;
        }),
      unsave: (folderId, postId) =>
        mutate((d) => {
          for (const [id, f] of live(d)) {
            if ((!folderId || id === folderId) && f.items[postId]?.on)
              f.items[postId] = { on: false, t: Date.now() };
          }
        }),
      exportJSON: () =>
        JSON.stringify({ app: "x-bookmark-folders", ...read() }),
      /** 合并外部数据（导入文件 / 云端），返回新增的收藏条数 */
      mergeIn(other, source) {
        const cur = read(),
          incoming = normalize(other, true);
        const next = merge(cur, incoming),
          added = Math.max(0, countActive(next) - countActive(cur));
        write(next, source);
        return added;
      },
      importJSON(text) {
        return this.mergeIn(JSON.parse(text), "import");
      },
    };
  })();

  // ───────────────────────── 凭据加密 ─────────────────────────
  /**
   * 密文存脚本存储（GM），密钥是不可导出的 AES-GCM CryptoKey，存在 x.com 源的 IndexedDB。
   * 两者分处不同存储：脚本存储被导出/云备份时只泄露密文，网页脚本拿到密钥也没有密文。
   * 注意：这不是主密码方案，能同时读取这两处存储的人（或本机恶意程序）仍可解密。
   */
  const Secret = (() => {
    const DB = "xbf-keystore",
      STORE = "keys",
      KEY_ID = "webdav";
    const enc = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
    const dec = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

    function idb(mode, op) {
      return new Promise((resolve, reject) => {
        const open = indexedDB.open(DB, 1);
        open.onupgradeneeded = () => open.result.createObjectStore(STORE);
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result,
            tx = db.transaction(STORE, mode),
            req = op(tx.objectStore(STORE));
          tx.oncomplete = () => {
            db.close();
            resolve(req.result);
          };
          tx.onerror = () => {
            db.close();
            reject(tx.error);
          };
        };
      });
    }

    async function key(create) {
      let k = await idb("readonly", (s) => s.get(KEY_ID));
      if (!k && create) {
        k = await crypto.subtle.generateKey(
          { name: "AES-GCM", length: 256 },
          false,
          ["encrypt", "decrypt"],
        );
        await idb("readwrite", (s) => s.put(k, KEY_ID));
      }
      return k;
    }

    return {
      async encrypt(plain) {
        if (!plain) return "";
        const iv = crypto.getRandomValues(new Uint8Array(12));
        const ct = await crypto.subtle.encrypt(
          { name: "AES-GCM", iv },
          await key(true),
          new TextEncoder().encode(plain),
        );
        return "v1:" + enc(iv) + ":" + enc(ct);
      },
      async decrypt(blob) {
        if (!blob) return "";
        const [, iv, ct] = blob.split(":");
        const k = await key(false);
        if (!k) throw new Error(T.keyLost);
        try {
          return new TextDecoder().decode(
            await crypto.subtle.decrypt(
              { name: "AES-GCM", iv: dec(iv) },
              k,
              dec(ct),
            ),
          );
        } catch {
          throw new Error(T.keyLost);
        }
      },
    };
  })();

  // ───────────────────────── WebDAV 同步 ─────────────────────────
  const Sync = (() => {
    const KEY = "xbf:sync:v1",
      FILE = "x-bookmark-folders.json";
    const statusListeners = new Set();
    const AUTO_DELAY = 30000; // 自动同步只在本地修改后触发，攒 30 秒合并为一次
    let status = { state: "idle", msg: "" },
      running = null,
      again = false,
      timer = 0;

    /** 读取配置（不含明文密码） */
    const get = () => {
      const { pass, ...cfg } = {
        url: "",
        user: "",
        passEnc: "",
        auto: false,
        last: 0,
        ...(KV.get(KEY) || {}),
      };
      return cfg;
    };
    /** 保存配置；patch.pass 为明文时先加密成 passEnc，明文从不落盘 */
    async function save(patch) {
      const { pass, ...rest } = patch;
      const next = { ...get(), ...rest };
      if (pass) next.passEnc = await Secret.encrypt(pass);
      KV.set(KEY, next);
    }
    /** 组装请求凭据：优先用表单里新输入的密码，否则解密已保存的密文 */
    const withPass = async (cfg, typed) => ({
      ...cfg,
      pass: typed || (await Secret.decrypt(cfg.passEnc)),
    });
    const baseOf = (url) => url.trim().replace(/\/*$/, "/");
    const b64 = (str) =>
      btoa(String.fromCharCode(...new TextEncoder().encode(str)));

    function setStatus(state, msg = "") {
      status = { state, msg };
      statusListeners.forEach((fn) => fn(status));
    }

    /** 跨域请求必须走 GM_xmlhttpRequest（页面 CSP 禁止直接连第三方域名） */
    function request(method, url, cfg, body, headers = {}) {
      return new Promise((resolve, reject) => {
        if (typeof GM_xmlhttpRequest !== "function")
          return reject(new Error(T.noGM));
        GM_xmlhttpRequest({
          method,
          url,
          data: body,
          timeout: 20000,
          anonymous: true,
          headers: {
            Authorization: "Basic " + b64(cfg.user + ":" + cfg.pass),
            ...headers,
          },
          onload: (r) =>
            r.status === 401 || r.status === 403
              ? reject(new Error(T.authFail))
              : resolve(r),
          onerror: () => reject(new Error("network error")),
          ontimeout: () => reject(new Error("timeout")),
        });
      });
    }
    const ok = (r) => r.status >= 200 && r.status < 300;

    /** 确认目录可用，不存在时尝试创建（只创建最后一级） */
    async function ensureDir(cfg) {
      const base = baseOf(cfg.url);
      const r = await request("PROPFIND", base, cfg, null, { Depth: "0" });
      if (ok(r)) return base;
      if (r.status === 404) {
        const m = await request("MKCOL", base, cfg);
        if (ok(m)) return base;
        throw new Error("MKCOL HTTP " + m.status);
      }
      throw new Error("HTTP " + r.status);
    }

    async function run(cfg) {
      const file = baseOf(cfg.url) + FILE;
      const r = await request("GET", file, cfg);
      if (ok(r)) {
        let remote;
        try {
          remote = JSON.parse(r.responseText);
        } catch {
          throw new Error(T.badRemote);
        }
        try {
          Store.mergeIn(remote, "sync");
        } catch {
          throw new Error(T.badRemote);
        }
      } else if (r.status === 404) {
        await ensureDir(cfg);
      } else {
        throw new Error("GET HTTP " + r.status);
      }
      const p = await request("PUT", file, cfg, Store.exportJSON(), {
        "Content-Type": "application/json; charset=utf-8",
      });
      if (!ok(p)) throw new Error("PUT HTTP " + p.status);
    }

    function syncNow() {
      const cfg = get();
      if (!cfg.url.trim()) return Promise.reject(new Error(T.noUrl));
      if (running) {
        again = true;
        return running;
      }
      setStatus("syncing");
      save({ dirty: false }); // 先清标记：同步期间的新修改会重新置脏并排队
      running = withPass(cfg)
        .then(run)
        .then(() => save({ last: Date.now() }))
        .then(() => setStatus("ok"))
        .catch((e) => {
          save({ dirty: true });
          setStatus("error", e.message);
          throw e;
        })
        .finally(() => {
          running = null;
          if (again) {
            again = false;
            syncNow().catch(() => {});
          }
        });
      return running;
    }

    /** 节流：已有待执行的同步时不再重复排队，窗口内的修改会一起被同步 */
    function schedule(delay = AUTO_DELAY) {
      const cfg = get();
      if (!cfg.auto || !cfg.url.trim() || timer) return;
      timer = setTimeout(() => {
        timer = 0;
        syncNow().catch(() => {});
      }, delay);
    }

    async function init() {
      // 迁移：1.5.0 曾明文保存密码，首次运行时加密并删除明文
      const raw = KV.get(KEY);
      if (raw?.pass) await save({ pass: raw.pass });
      // 只有本地修改（含导入）才触发；云端合并回来的变化不算
      Store.onChange((source) => {
        if (source === "sync") return;
        save({ dirty: true });
        schedule();
      });
      // 上次关页面前还没来得及同步的修改，打开页面时补上
      if (get().dirty) schedule(5000);
    }

    return {
      get,
      save,
      syncNow,
      init,
      /** 用表单当前值测试；密码留空则使用已保存的密码 */
      test: async (form) => {
        if (!form.url.trim()) throw new Error(T.noUrl);
        return ensureDir(await withPass({ ...get(), ...form }, form.pass));
      },
      status: () => status,
      onStatus: (fn) => {
        statusListeners.add(fn);
        return () => statusListeners.delete(fn);
      },
    };
  })();

  // ───────────────────────── 帖子解析 ─────────────────────────
  const STATUS_RE = /^\/([^/?#]+)\/status\/(\d+)/;

  /** 由操作栏内元素解析所属帖子，返回 { entry, id, handle } */
  function resolvePost(el) {
    const entry = el.closest("[data-timeline-entry]");
    const m =
      (entry?.dataset.href || "").match(STATUS_RE) ||
      (entry && !entry.dataset.href && location.pathname.match(STATUS_RE));
    if (m) return { entry, id: m[2], handle: m[1] };
    const reply = el
      .closest("article")
      ?.querySelector('a[href*="in_reply_to="]');
    const id =
      reply &&
      new URL(reply.href, location.origin).searchParams.get("in_reply_to");
    if (id) return { entry, id, handle: "i" };
    // 兜底：向上找到只包含这一条帖子的容器，取其中第一个帖子链接（即发帖时间链接，排在引用帖之前）
    for (
      let node = el.parentElement, i = 0;
      node && i < 15;
      node = node.parentElement, i++
    ) {
      if (node.querySelectorAll('[data-engagement-action="share"]').length > 1)
        break;
      for (const a of node.querySelectorAll('a[href*="/status/"]')) {
        const mm = new URL(a.href, location.origin).pathname.match(STATUS_RE);
        if (mm) return { entry, id: mm[2], handle: mm[1] };
      }
    }
    return null;
  }

  /** 保存时抓取帖子快照（只读取当前帖子自身，排除嵌套的引用帖） */
  function snapshot(el) {
    const ref = resolvePost(el);
    if (!ref) return null;
    const scope = ref.entry || el.closest("article") || document;
    const own = (sel) =>
      [...scope.querySelectorAll(sel)].filter(
        (n) => !ref.entry || n.closest("[data-timeline-entry]") === ref.entry,
      );
    const handle =
      ref.handle !== "i"
        ? ref.handle
        : own('img[alt^="@"]')[0]?.alt.slice(1) || "i";
    return {
      id: ref.id,
      path: "/" + handle + "/status/" + ref.id,
      handle,
      name:
        own('a[href="/' + handle + '"]')
          .map((a) => a.textContent.trim())
          .find((t) => t && !t.startsWith("@")) || handle,
      avatar: own('img[alt^="@"]')[0]?.src || "",
      text: (
        own('[dir="auto"].whitespace-pre-wrap')[0]?.textContent || ""
      ).slice(0, 500),
      media:
        own('img[src*="pbs.twimg.com/media"], img[src*="video_thumb"]')[0]
          ?.src || "",
    };
  }

  const postTime = (id) => {
    try {
      return Number((BigInt(id) >> 22n) + 1288834974657n);
    } catch {
      return 0;
    }
  };

  // ───────────────────────── 通用 UI 工具 ─────────────────────────
  const ICON = {
    folder:
      '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4.3l2 2.5h6.7A2.5 2.5 0 0 1 21 9v9.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5zM5.5 6a.5.5 0 0 0-.5.5v12c0 .28.22.5.5.5h13a.5.5 0 0 0 .5-.5V9a.5.5 0 0 0-.5-.5h-7.66l-2-2.5z"/>',
    folderFill:
      '<path d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4.3l2 2.5h6.7A2.5 2.5 0 0 1 21 9v9.5a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5z"/>',
    plus: '<path d="M11 11V4h2v7h7v2h-7v7h-2v-7H4v-2z"/>',
    close:
      '<path d="M10.59 12 4.54 5.96l1.42-1.42L12 10.59l6.04-6.05 1.42 1.42L13.41 12l6.05 6.04-1.42 1.42L12 13.41l-6.04 6.05-1.42-1.42z"/>',
    back: '<path d="M7.41 13 13 18.59 11.59 20l-8-8 8-8L13 5.41 7.41 11H21v2z"/>',
    check:
      '<path d="M9.64 18.95 3.7 13.01l1.41-1.41 4.53 4.52 9.25-9.25 1.41 1.42z"/>',
    edit: '<path d="m14.06 4.94 5 5L8 21H3v-5zm1.41-1.41L17 2l5 5-1.53 1.53z"/>',
    trash:
      '<path d="M16 6V4.5A2.5 2.5 0 0 0 13.5 2h-3A2.5 2.5 0 0 0 8 4.5V6H3v2h1.06l.81 11.21A3 3 0 0 0 7.86 22h8.28a3 3 0 0 0 2.99-2.79L19.94 8H21V6zm-6-1.5c0-.28.22-.5.5-.5h3c.28 0 .5.22.5.5V6h-4z"/>',
    gear: '<path d="M10.54 1.75h2.92l1.57 2.36c.11.17.32.25.53.21l2.53-.59 2.17 2.17-.58 2.54c-.05.2.04.41.21.53l2.36 1.57v2.92l-2.36 1.57c-.17.12-.26.33-.21.53l.58 2.54-2.17 2.17-2.53-.59c-.21-.04-.42.04-.53.21l-1.57 2.36h-2.92l-1.58-2.36c-.11-.17-.32-.25-.52-.21l-2.54.59-2.17-2.17.58-2.54c.05-.2-.03-.41-.21-.53l-2.35-1.57v-2.92L4.1 9.54c.18-.12.26-.33.21-.53l-.58-2.54L5.9 4.3l2.54.59c.2.04.41-.04.52-.21zm.72 2-1.09 1.62c-.57.85-1.62 1.27-2.62 1.04l-1.75-.4-.6.6.4 1.75c.23 1-.19 2.04-1.04 2.61l-1.61 1.08v.82l1.61 1.08c.85.57 1.27 1.62 1.04 2.61l-.4 1.75.6.6 1.75-.4c1-.23 2.05.19 2.62 1.04l1.09 1.62h.82l1.09-1.62c.57-.85 1.61-1.27 2.61-1.04l1.75.4.6-.6-.4-1.75c-.23-1 .19-2.04 1.04-2.61l1.62-1.08v-.82l-1.62-1.08c-.85-.57-1.27-1.62-1.04-2.61l.4-1.75-.6-.6-1.75.4c-1 .23-2.04-.19-2.61-1.04l-1.09-1.62zM12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7m0 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3"/>',
  };
  const svg = (name, cls = "") =>
    '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" data-xbf-icon="' +
    name +
    '" class="' +
    cls +
    '">' +
    ICON[name] +
    "</svg>";
  /** 用我们的图标替换一个原生 svg，保留其 class 以继承尺寸与颜色 */
  function swapIcon(old, name) {
    const tpl = document.createElement("template");
    tpl.innerHTML = svg(name, old.getAttribute("class") || "");
    const icon = tpl.content.firstElementChild;
    icon.setAttribute("width", "1em");
    icon.setAttribute("height", "1em");
    const r = old.getBoundingClientRect();
    if (old.getAttribute("style")) icon.setAttribute("style", old.getAttribute("style"));
    else if (r.width) Object.assign(icon.style, { width: r.width + "px", height: r.height + "px" }); // 保持原图标的实际尺寸
    old.replaceWith(icon);
    return icon;
  }

  /** 轻量 DOM 构造：文本一律走 textContent，杜绝 XSS */
  function h(tag, attrs = {}, ...kids) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === "html") el.innerHTML = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const kid of kids.flat())
      if (kid != null && kid !== false) el.append(kid);
    return el;
  }
  const isMobile = () => matchMedia("(max-width: 516px)").matches;
  const iconBtn = (name, label, onclick) =>
    h("button", {
      type: "button",
      class: "xbf-icon-btn",
      "aria-label": label,
      title: label,
      html: svg(name),
      onclick,
    });

  /** SPA 内跳转：复用 X 的 TanStack Router（监听 popstate），失败回落整页跳转 */
  function navigate(path) {
    try {
      const key = Math.random().toString(36).slice(2, 10);
      const idx = ((history.state && history.state.__TSR_index) || 0) + 1;
      history.pushState({ key, __TSR_key: key, __TSR_index: idx }, "", path);
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: history.state }),
      );
    } catch {
      location.assign(path);
    }
  }

  let toastTimer;
  function toast(msg) {
    let el = document.getElementById("xbf-toast");
    if (!el) {
      el = h("div", { id: "xbf-toast", role: "status" });
      document.body.append(el);
    }
    el.textContent = msg;
    el.classList.add("xbf-show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("xbf-show"), 2200);
  }

  /** 统一的浮层：遮罩点击 / Esc 关闭；阻断键盘事件冒泡，避免触发 X 的快捷键 */
  function layer(className, content, onClose) {
    const root = h("div", { class: "xbf-overlay " + className });
    const close = () => {
      root.remove();
      document.removeEventListener("keydown", onKey, true);
      onClose && onClose();
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      }
    };
    root.addEventListener("click", (e) => {
      if (e.target === root) close();
    });
    root.addEventListener("keydown", (e) => e.stopPropagation());
    document.addEventListener("keydown", onKey, true);
    root.append(content);
    document.body.append(root);
    return close;
  }

  function askName(initial = "") {
    const v = prompt(T.folderName, initial);
    return v == null ? null : v.trim() || null;
  }

  // ───────────────────────── 文件夹选择器（帖子按钮触发） ─────────────────────────
  function openPicker(anchorBtn, post) {
    const box = h("div", {
      class: "xbf-chooser",
      role: "dialog",
      "aria-label": T.addTo,
    });
    const close = layer(isMobile() ? "xbf-sheet" : "xbf-pop", box);
    const row = (attrs, ...kids) =>
      h("button", { type: "button", class: "xbf-row", ...attrs }, ...kids);

    function render() {
      const inSet = Store.folderIdsOf(post.id);
      box.replaceChildren(
        h(
          "div",
          { class: "xbf-chooser-head" },
          h("span", { class: "xbf-chooser-title" }, T.addTo),
          iconBtn("close", T.close, close),
        ),
        h(
          "div",
          { class: "xbf-chooser-list" },
          Store.folders().map((f) =>
            row(
              {
                onclick: () => {
                  toast(
                    Store.toggle(f.id, post)
                      ? T.saved(f.name)
                      : T.removed(f.name),
                  );
                  render();
                },
              },
              h("span", { class: "xbf-tile", html: svg("folderFill") }),
              h(
                "span",
                { class: "xbf-row-main" },
                h("span", { class: "xbf-row-name" }, f.name),
                h("span", { class: "xbf-sub" }, T.count(f.items.length)),
              ),
              h("span", {
                class: "xbf-check" + (inSet.has(f.id) ? " xbf-on" : ""),
                html: svg("check"),
              }),
            ),
          ),
        ),
        row(
          {
            class: "xbf-row xbf-accent",
            onclick: () => {
              const f = Store.create(askName());
              if (f) {
                Store.toggle(f.id, post);
                toast(T.saved(f.name));
                render();
              }
            },
          },
          h("span", { class: "xbf-tile xbf-tile-plain", html: svg("plus") }),
          h("span", { class: "xbf-row-name" }, T.newFolder),
        ),
        h(
          "button",
          {
            type: "button",
            class: "xbf-link",
            onclick: () => {
              close();
              openPanel();
            },
          },
          T.manage,
        ),
      );
    }
    render();

    if (!isMobile()) {
      const r = anchorBtn.getBoundingClientRect();
      const w = box.offsetWidth,
        bh = box.offsetHeight;
      box.style.left =
        Math.max(8, Math.min(innerWidth - w - 8, r.right - w)) + "px";
      box.style.top =
        (r.bottom + bh + 8 > innerHeight
          ? Math.max(8, r.top - bh - 4)
          : r.bottom + 4) + "px";
    }
  }

  // ───────────────────────── 主面板（侧边栏入口） ─────────────────────────
  let closePanel = null;
  function openPanel(folderId) {
    if (closePanel) closePanel();
    const box = h("div", {
      class: "xbf-panel",
      role: "dialog",
      "aria-label": T.entry,
    });
    const unsubs = [];
    closePanel = layer("xbf-modal", box, () => {
      closePanel = null;
      setNavActive(false);
      unsubs.forEach((u) => u());
    });
    setNavActive(true);
    let current = folderId || null; // null=文件夹列表, '*'=全部收藏, '#settings'=设置
    // 同步/导入带来的数据变化：列表类视图直接重绘，设置视图只刷新状态行（避免清空正在输入的表单）
    unsubs.push(
      Store.onChange(() =>
        current === "#settings" ? paintSyncStatus() : render(),
      ),
    );
    unsubs.push(Sync.onStatus(() => paintSyncStatus()));

    const header = (title, sub, left, right) =>
      h(
        "div",
        { class: "xbf-head" },
        left,
        h(
          "div",
          { class: "xbf-head-main" },
          h("div", { class: "xbf-title" }, title),
          sub && h("div", { class: "xbf-sub" }, sub),
        ),
        h("div", { class: "xbf-head-actions" }, right),
      );

    function folderList() {
      const folders = Store.folders();
      return [
        header(
          T.entry,
          Sync.get().url ? T.synced : T.local,
          iconBtn("close", T.close, () => closePanel()),
          [
            iconBtn("plus", T.newFolder, () => {
              if (Store.create(askName())) render();
            }),
            iconBtn("gear", T.settings, () => {
              current = "#settings";
              render();
            }),
          ],
        ),
        h(
          "div",
          { class: "xbf-body" },
          folderRow("*", T.all, Store.posts().length),
          folders.map((f) => folderRow(f.id, f.name, f.items.length)),
          !folders.length && h("div", { class: "xbf-empty" }, T.empty),
        ),
      ];
    }
    const folderRow = (id, name, n) =>
      h(
        "button",
        {
          type: "button",
          class: "xbf-row xbf-row-lg",
          onclick: () => {
            current = id;
            render();
          },
        },
        h("span", {
          class: "xbf-tile",
          html: svg(id === "*" ? "folder" : "folderFill"),
        }),
        h(
          "span",
          { class: "xbf-row-main" },
          h("span", { class: "xbf-row-name" }, name),
          h("span", { class: "xbf-sub" }, T.count(n)),
        ),
      );

    function folderView() {
      const isAll = current === "*";
      const f = !isAll && Store.folders().find((x) => x.id === current);
      if (!isAll && !f) {
        current = null;
        return folderList();
      }
      const posts = Store.posts(isAll ? null : current);
      return [
        header(
          isAll ? T.all : f.name,
          T.count(posts.length),
          iconBtn("back", T.back, () => {
            current = null;
            render();
          }),
          !isAll && [
            iconBtn("edit", T.rename, () => {
              const n = askName(f.name);
              if (n) {
                Store.rename(f.id, n);
                render();
              }
            }),
            iconBtn("trash", T.del, () => {
              if (confirm(T.delConfirm(f.name))) {
                Store.remove(f.id);
                current = null;
                render();
              }
            }),
          ],
        ),
        h(
          "div",
          { class: "xbf-body" },
          posts.map((p) => postCard(p, isAll ? null : current)),
          !posts.length && h("div", { class: "xbf-empty" }, T.emptyFolder),
        ),
      ];
    }

    function postCard(p, fid) {
      const t = postTime(p.id);
      return h(
        "div",
        {
          class: "xbf-post",
          role: "link",
          tabindex: "0",
          onclick: () => {
            closePanel();
            navigate(p.path);
          },
          onkeydown: (e) => {
            if (e.key === "Enter") e.currentTarget.click();
          },
        },
        p.avatar
          ? h("img", {
              class: "xbf-avatar",
              src: p.avatar,
              alt: "",
              loading: "lazy",
            })
          : h("span", { class: "xbf-avatar" }),
        h(
          "div",
          { class: "xbf-post-main" },
          h(
            "div",
            { class: "xbf-post-meta" },
            h("b", {}, p.name),
            h(
              "span",
              { class: "xbf-sub" },
              " @" +
                p.handle +
                (t ? " · " + new Date(t).toLocaleDateString() : ""),
            ),
          ),
          p.text && h("div", { class: "xbf-post-text", dir: "auto" }, p.text),
          p.media &&
            h("img", {
              class: "xbf-media",
              src: p.media,
              alt: "",
              loading: "lazy",
            }),
        ),
        h("button", {
          type: "button",
          class: "xbf-icon-btn xbf-post-x",
          "aria-label": T.remove,
          title: T.remove,
          html: svg("close"),
          onclick: (e) => {
            e.stopPropagation();
            Store.unsave(fid, p.id);
            render();
          },
        }),
      );
    }

    function settingsView() {
      const cfg = Sync.get();
      const input = (attrs) =>
        h("input", {
          class: "xbf-input",
          autocomplete: "off",
          spellcheck: "false",
          ...attrs,
        });
      const url = input({
        type: "url",
        value: cfg.url,
        placeholder: "https://dav.jianguoyun.com/dav/x-bookmarks/",
      });
      const user = input({
        type: "text",
        value: cfg.user,
        autocomplete: "username",
      });
      const pass = input({
        type: "password",
        autocomplete: "current-password",
        placeholder: cfg.passEnc ? T.passKept : "",
      });
      const auto = h("input", {
        type: "checkbox",
        class: "xbf-switch",
        role: "switch",
      });
      auto.checked = cfg.auto;
      const form = () => ({
        url: url.value.trim(),
        user: user.value.trim(),
        pass: pass.value,
      });
      const persist = () => Sync.save({ ...form(), auto: auto.checked });
      const encNote = h("p", { class: "xbf-hint" }, T.encHint);
      const afterSave = () => {
        if (pass.value) {
          pass.value = "";
          pass.placeholder = T.passKept;
        }
      };
      const field = (label, el) =>
        h(
          "label",
          { class: "xbf-field" },
          h("span", { class: "xbf-field-label" }, label),
          el,
        );
      /** 按钮执行期间禁用，结果用 toast 提示 */
      const action = (label, cls, fn) => {
        const b = h(
          "button",
          { type: "button", class: "xbf-btn " + cls },
          label,
        );
        b.addEventListener("click", async () => {
          b.disabled = true;
          try {
            const msg = await fn();
            if (msg) toast(msg);
          } catch (e) {
            toast(T.syncFail(e.message));
          } finally {
            b.disabled = false;
          }
        });
        return b;
      };
      auto.addEventListener("change", () => persist());

      return [
        header(
          T.settings,
          null,
          iconBtn("back", T.back, () => {
            current = null;
            render();
          }),
          null,
        ),
        h(
          "div",
          { class: "xbf-body xbf-form" },
          h("div", { class: "xbf-section-title" }, T.sync),
          field(T.davUrl, url),
          field(T.davUser, user),
          field(T.davPass, pass),
          h("p", { class: "xbf-hint" }, T.davHint),
          encNote,
          h(
            "label",
            { class: "xbf-switch-row" },
            h(
              "span",
              { class: "xbf-row-main" },
              h("span", { class: "xbf-row-name" }, T.autoSync),
              h("span", { class: "xbf-sub" }, T.autoSyncHint),
            ),
            auto,
          ),
          h(
            "div",
            { class: "xbf-actions" },
            action(T.save, "xbf-btn-outline", async () => {
              await persist();
              afterSave();
              return T.cfgSaved;
            }),
            action(T.test, "xbf-btn-outline", async () => {
              await Sync.test(form());
              return T.testOk;
            }),
            action(T.syncNow, "xbf-btn-primary", async () => {
              await persist();
              afterSave();
              await Sync.syncNow();
              return T.syncOk;
            }),
          ),
          h("div", { class: "xbf-sync-status", "aria-live": "polite" }),
          h("div", { class: "xbf-section-title" }, T.backup),
          h(
            "div",
            { class: "xbf-actions" },
            h(
              "button",
              {
                type: "button",
                class: "xbf-btn xbf-btn-outline",
                onclick: exportData,
              },
              T.exp,
            ),
            h(
              "button",
              {
                type: "button",
                class: "xbf-btn xbf-btn-outline",
                onclick: importData,
              },
              T.imp,
            ),
          ),
        ),
      ];
    }

    function paintSyncStatus() {
      const el = box.querySelector(".xbf-sync-status");
      if (!el) return;
      const st = Sync.status(),
        last = Sync.get().last;
      el.classList.toggle("xbf-error", st.state === "error");
      el.textContent =
        st.state === "syncing"
          ? T.syncing
          : st.state === "error"
            ? T.syncFail(st.msg)
            : last
              ? T.lastSync(new Date(last).toLocaleString())
              : T.never;
    }

    function render() {
      const scroll = box.querySelector(".xbf-body")?.scrollTop || 0;
      const sameView = box.dataset.view === String(current);
      if (sameView && current === "#settings") return paintSyncStatus();
      box.dataset.view = String(current);
      const view =
        current === "#settings"
          ? settingsView()
          : current
            ? folderView()
            : folderList();
      box.replaceChildren(...view.filter(Boolean));
      paintSyncStatus();
      if (sameView) box.querySelector(".xbf-body").scrollTop = scroll;
    }
    render();
  }

  function exportData() {
    const url = URL.createObjectURL(
      new Blob([Store.exportJSON()], { type: "application/json" }),
    );
    const a = h("a", {
      href: url,
      download:
        "x-bookmark-folders-" + new Date().toISOString().slice(0, 10) + ".json",
    });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function importData() {
    const input = h("input", {
      type: "file",
      accept: "application/json,.json",
      style: "display:none",
    });
    input.addEventListener("change", async () => {
      try {
        toast(T.impDone(Store.importJSON(await input.files[0].text())));
      } catch {
        toast(T.impFail);
      }
      input.remove();
    });
    document.body.append(input);
    input.click();
  }

  // ───────────────────────── 注入：导航入口 ─────────────────────────
  // 优先挂在 Money 下方；账号没有 Money 入口时依次回退
  const ANCHORS = [
    "/i/money",
    "/i/premium",
    "/i/premium_sign_up",
    "/i/history",
    "/i/bookmarks",
  ];
  const pathOf = (a) => (a.getAttribute("href") || "").split(/[?#]/)[0];
  const pickAnchor = (links) => {
    for (const p of ANCHORS) {
      const a = links.find((l) => pathOf(l) === p);
      if (a) return a;
    }
    return null;
  };

  /**
   * 克隆一个原生导航项并换掉图标与文字，完全继承 X 当前端的样式。
   * 返回 { el, label }，label 为承载文字的元素。
   */
  function cloneNative(src, text) {
    const el = src.cloneNode(true);
    [
      "id",
      "aria-current",
      "data-status",
      "data-testid",
      "target",
      "rel",
      "href",
    ].forEach((k) => el.removeAttribute(k));
    el.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
    el.setAttribute("aria-label", text);

    const srcLabel = src.getAttribute("aria-label") || src.textContent.trim();
    const leaves = [...el.querySelectorAll("*")].filter(
      (n) => !n.children.length && n.textContent.trim() && !n.closest("svg"),
    );
    const label =
      leaves.find((n) => n.textContent.trim() === srcLabel) ||
      leaves[leaves.length - 1];
    leaves.forEach((n) => n !== label && n.remove()); // 去掉徽标、折扣标签等装饰
    if (label) label.textContent = text;
    // 源控件若处于激活态，去掉克隆来的加粗
    if (src.getAttribute("aria-current") === "page") {
      [el, ...el.querySelectorAll("*")].forEach((n) =>
        n.classList?.remove("font-bold", "[&_span]:font-bold"),
      );
    }
    el.querySelectorAll(".bg-blue-500, .text-red-500").forEach((n) =>
      n.remove(),
    );

    const svgs = el.querySelectorAll("svg");
    if (svgs[0]) {
      swapIcon(svgs[0], "folder");
      [...svgs].slice(1).forEach((n) => n.remove()); // 去掉 active 态图标
    }
    el.querySelectorAll("[style]").forEach((n) =>
      n.style.removeProperty("opacity"),
    );
    return { el, label };
  }

  /** 导航项：带图标的站内链接，且不在帖子 / 正文区域里 */
  const isNavLink = (a) =>
    !a.dataset.xbfNav &&
    a.getAttribute("href")?.startsWith("/") &&
    a.querySelector("svg") &&
    !a.closest("article, main, [data-testid='primaryColumn']");

  /**
   * 从链接向上找到「列表中的一行」：row 是 list 的直接子节点，list 里还有其它导航项。
   * 兼容 <nav><a/></nav>、<div><div><a/></div><div><a/></div></div> 等各种包裹层级。
   */
  function rowOf(link) {
    let node = link;
    while (node.parentElement && node.parentElement !== document.body) {
      const list = node.parentElement;
      const others = [...list.querySelectorAll("a[href]")].filter(
        (x) => isNavLink(x) && !node.contains(x),
      );
      if (others.length) {
        // 行必须是「单个导航项」大小，防止把整列侧栏当成一行克隆
        const links = node.matches("a[href]") ? 1 : node.querySelectorAll("a[href]").length;
        const ok = links === 1 && node.getBoundingClientRect().height <= 120;
        return ok && others.length >= 2 ? { list, row: node } : null;
      }
      node = list;
    }
    return null;
  }

  /** 手机抽屉在 [role=dialog] 或 #layers（旧版）里；其余视为电脑端侧边栏 */
  const kindOf = (el) =>
    el.closest('[role="dialog"], #layers') ? "mobile" : "desktop";

  function buildNavItem(row, anchor, kind) {
    const { el: item, label } = cloneNative(row, T.entry);
    // row 可能是包着链接的容器：把里面的链接也改掉，避免点到原入口
    for (const a of [item, ...item.querySelectorAll("a")]) {
      if (a.tagName !== "A") continue;
      a.setAttribute("href", "#");
      a.setAttribute("aria-label", T.entry);
      ["aria-current", "data-testid", "data-status"].forEach((k) => a.removeAttribute(k));
    }
    item.dataset.xbfNav = kind;
    label?.classList.add("xbf-nav-label");

    item.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // 手机端：先关闭抽屉（新版点遮罩；旧版发 Esc），再打开面板
      if (kind === "mobile") {
        const mask = item.closest('[role="dialog"]')?.previousElementSibling;
        if (mask?.getAttribute("aria-hidden") === "true") mask.click();
        else
          document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "Escape", code: "Escape", keyCode: 27, bubbles: true }),
          );
      }
      openPanel();
    });
    return item;
  }

  /** 把入口放到锚点那一行之后；位置已正确时不重复插入 */
  function placeAfter(list, row, anchor, kind) {
    const existing = list.querySelector(":scope > [data-xbf-nav]");
    if (existing && existing.dataset.xbfFrom === pathOf(anchor) && row.nextElementSibling === existing) return;
    existing?.remove();
    const item = buildNavItem(row, anchor, kind);
    item.dataset.xbfFrom = pathOf(anchor);
    row.after(item);
  }

  function injectNav() {
    // 1. 按 Money → Premium → 历史 → 书签 的优先级，在每个导航列表里找锚点
    const done = new Set();
    const candidates = [...document.querySelectorAll("a[href]")].filter(
      (a) => isNavLink(a) && ANCHORS.includes(pathOf(a)),
    );
    candidates.sort((x, y) => ANCHORS.indexOf(pathOf(x)) - ANCHORS.indexOf(pathOf(y)));
    for (const anchor of candidates) {
      const hit = rowOf(anchor);
      if (!hit || done.has(hit.list)) continue;
      done.add(hit.list);
      placeAfter(hit.list, hit.row, anchor, kindOf(hit.list));
    }
    // 2. 新版 x-web 电脑端侧边栏一定是主导航：没有任何锚点时挂在末尾
    for (const nav of document.querySelectorAll("nav")) {
      const links = [...nav.querySelectorAll("a[href]")].filter(isNavLink);
      if (!links.some((a) => a.querySelector("[data-sidebar-label]"))) continue;
      const hit = rowOf(links[links.length - 1]);
      if (hit && !done.has(hit.list)) placeAfter(hit.list, hit.row, links[links.length - 1], "desktop");
    }
  }

  function setNavActive(on) {
    document
      .querySelectorAll("[data-xbf-nav] .xbf-nav-label")
      .forEach((n) => n.classList.toggle("xbf-bold", on));
  }

  // ───────────────────────── 注入：分享按钮右侧的文件夹按钮 ─────────────────────────
  // X 目前有两套网页客户端：未登录 / 灰度用户是新版 x-web，大部分登录用户仍是旧版 responsive-web。

  /** 公共挂载：root 即按钮所在的单元格，getPost 在需要时实时解析帖子快照 */
  function mountPostButton(after, root, getPost) {
    root.setAttribute("data-xbf-post", "");
    root.xbfGetPost = getPost;
    // 阻断冒泡：帖子容器本身可点击跳转
    ["pointerdown", "mousedown", "pointerup", "mouseup"].forEach((t) =>
      root.addEventListener(t, (e) => e.stopPropagation()),
    );
    root.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const post = getPost();
      if (post) openPicker(root, post);
    });
    after.after(root);
    alignSpacing(after, root);
    paintPostButton(root);
  }

  /** 单元格的可见内容边界：图标 + 计数文字（如浏览量「4,227」），隐藏的元素不计 */
  function inkBox(cell) {
    let left = Infinity,
      right = -Infinity;
    const add = (r) => {
      if (r.width && r.height) {
        left = Math.min(left, r.left);
        right = Math.max(right, r.right);
      }
    };
    cell.querySelectorAll("svg").forEach((n) => add(n.getBoundingClientRect()));
    const walker = document.createTreeWalker(cell, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if (!n.textContent.trim()) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      add(range.getBoundingClientRect());
    }
    return right > left ? { left, right } : null;
  }

  /**
   * 让「分享 → 文件夹」的间距与「前一项 → 分享」相等。
   * 操作栏可能是均分 / flex 布局，加外边距会让其它按钮跟着移动，
   * 所以不能一次算差值，而是二分查找使两段间距相等的外边距。
   */
  function alignSpacing(share, root) {
    let prevCell = share.previousElementSibling;
    while (prevCell && !inkBox(prevCell)) prevCell = prevCell.previousElementSibling;
    if (!prevCell || !inkBox(share) || !inkBox(root)) return;

    // diff > 0：文件夹离分享太近；diff 随外边距增大而单调减小
    const diff = (m) => {
      root.style.marginInlineStart = m + "px";
      const p = inkBox(prevCell),
        c = inkBox(share),
        o = inkBox(root);
      return c.left - p.right - (o.left - c.right);
    };
    const reset = () => root.style.removeProperty("margin-inline-start");
    if (Math.abs(diff(0)) <= 1) return reset();
    let lo = -24,
      hi = 80;
    if (diff(lo) < 0 || diff(hi) > 0) return reset(); // 范围内无解，保持原样
    while (hi - lo > 0.5) {
      const mid = (lo + hi) / 2;
      if (diff(mid) > 0) lo = mid;
      else hi = mid;
    }
    const m = Math.round((lo + hi) / 2);
    m ? (root.style.marginInlineStart = m + "px") : reset();
  }

  /** 帖子已在任一文件夹时，按钮显示为蓝色实心 */
  function paintPostButton(root) {
    const post = root.xbfGetPost?.();
    const saved = !!post && Store.folderIdsOf(post.id).size > 0;
    root.classList.toggle("xbf-saved", saved);
    const icon = root.querySelector("svg[data-xbf-icon]");
    const name = saved ? "folderFill" : "folder";
    if (icon && icon.dataset.xbfIcon !== name) swapIcon(icon, name);
  }

  /** 新版 x-web：分享按钮带 data-engagement-action="share" */
  function injectXwebButtons() {
    for (const share of document.querySelectorAll(
      '[data-engagement-action="share"]',
    )) {
      if (
        share.nextElementSibling?.hasAttribute("data-xbf-post") ||
        !resolvePost(share)
      )
        continue;
      const btn = h(
        "button",
        {
          type: "button",
          "aria-label": T.addTo,
          title: T.addTo,
          class:
            "group x-engagement-button transition-colors focus-visible:outline-ring hover:text-blue-500 text-secondary",
        },
        h("span", {
          class:
            "x-engagement-pill before:bg-blue-500/10 h-9 px-2.5 [&>svg]:size-[18px]",
          html: svg("folder"),
        }),
      );
      mountPostButton(share, h("div", { class: "xbf-post-btn" }, btn), () =>
        snapshot(share),
      );
    }
  }

  /** 旧版 responsive-web：article[data-testid=tweet] 内的 [role=group] 操作栏，分享按钮是无 testid 的菜单按钮 */
  function rwebSnapshot(article) {
    const link = [...article.querySelectorAll('a[href*="/status/"]')].find(
      (a) => a.querySelector("time"),
    );
    const m =
      link && new URL(link.href, location.origin).pathname.match(STATUS_RE);
    if (!m) return null;
    const media = article.querySelector(
      '[data-testid="tweetPhoto"] img, video[poster]',
    );
    return {
      id: m[2],
      path: "/" + m[1] + "/status/" + m[2],
      handle: m[1],
      name:
        article
          .querySelector('[data-testid="User-Name"] a')
          ?.textContent.trim() || m[1],
      avatar:
        article.querySelector('[data-testid="Tweet-User-Avatar"] img')?.src ||
        "",
      text: (
        article.querySelector('[data-testid="tweetText"]')?.textContent || ""
      ).slice(0, 500),
      media: media ? media.getAttribute("poster") || media.src || "" : "",
    };
  }

  function injectRwebButtons() {
    for (const group of document.querySelectorAll(
      'article[data-testid="tweet"] [role="group"]',
    )) {
      if (group.querySelector("[data-xbf-post]")) continue;
      const article = group.closest("article");
      const cells = [...group.children];
      const shareCell =
        cells.find((c) =>
          c.querySelector('button[aria-haspopup="menu"]:not([data-testid])'),
        ) ||
        cells.find((c) =>
          c.querySelector(
            '[data-testid="bookmark"], [data-testid="removeBookmark"]',
          ),
        );
      if (!shareCell || !rwebSnapshot(article)) continue;

      // 克隆分享按钮单元格，完整继承旧版客户端的尺寸、间距与悬停样式
      const cell = shareCell.cloneNode(true);
      cell.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      const btn = cell.querySelector("button");
      if (btn) {
        [
          "aria-expanded",
          "aria-haspopup",
          "aria-controls",
          "data-testid",
        ].forEach((k) => btn.removeAttribute(k));
        btn.setAttribute("aria-label", T.addTo);
        btn.title = T.addTo;
      }
      const old = cell.querySelector("svg");
      if (old) swapIcon(old, "folder");
      mountPostButton(shareCell, cell, () => rwebSnapshot(article));
    }
  }

  Store.onChange(() =>
    document.querySelectorAll("[data-xbf-post]").forEach(paintPostButton),
  );

  // ───────────────────────── 样式 ─────────────────────────
  const css = String.raw`
    .xbf-overlay, .xbf-chooser, #xbf-toast {
      --xbf-bg: hsl(var(--color-background, 0 0% 100%)); --xbf-fg: var(--x-fg-primary, #0f1419);
      --xbf-fg2: var(--x-fg-secondary, #536471); --xbf-line: color-mix(in srgb, var(--xbf-fg2) 22%, transparent);
      --xbf-hover: var(--x-btn-ghost-hover, rgba(127,127,127,.12)); --xbf-blue: var(--x-blue-500, #1d9bf0);
      font-family: inherit; color: var(--xbf-fg);
    }
    .xbf-overlay { position: fixed; inset: 0; z-index: 2147483000; }
    .xbf-pop { background: transparent; }
    .xbf-sheet { background: rgba(0,0,0,.4); display: flex; align-items: flex-end; }
    .xbf-modal { background: rgba(91,112,131,.4); display: flex; align-items: flex-start; justify-content: center; padding-top: 5vh; }
    .xbf-panel { width: 600px; max-width: 92vw; height: min(86vh, 760px); background: var(--xbf-bg); border-radius: 16px;
      display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 8px 28px rgba(0,0,0,.25); }
    .xbf-head { display: flex; align-items: center; gap: 16px; min-height: 53px; padding: 0 12px 0 8px; border-bottom: 1px solid var(--xbf-line); flex-shrink: 0; }
    .xbf-head-main { flex: 1; min-width: 0; }
    .xbf-head-actions { display: flex; gap: 4px; }
    .xbf-title { font-size: 20px; font-weight: 700; line-height: 24px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .xbf-sub { color: var(--xbf-fg2); font-size: 13px; }
    .xbf-body { flex: 1; overflow-y: auto; overscroll-behavior: contain; }
    .xbf-icon-btn { all: unset; box-sizing: border-box; width: 36px; height: 36px; border-radius: 999px; display: inline-flex;
      align-items: center; justify-content: center; cursor: pointer; color: var(--xbf-fg); flex-shrink: 0; }
    .xbf-icon-btn:hover, .xbf-icon-btn:focus-visible { background: var(--xbf-hover); }
    .xbf-icon-btn svg { width: 20px; height: 20px; }
    .xbf-row { all: unset; box-sizing: border-box; display: flex; align-items: center; gap: 12px; width: 100%; padding: 10px 16px; cursor: pointer; }
    .xbf-row:hover, .xbf-row:focus-visible { background: var(--xbf-hover); }
    .xbf-row-lg { padding: 14px 16px; }
    .xbf-row-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
    .xbf-row-name { font-size: 15px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .xbf-tile { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center;
      background: color-mix(in srgb, var(--xbf-blue) 14%, transparent); color: var(--xbf-blue); }
    .xbf-tile svg { width: 22px; height: 22px; }
    .xbf-tile-plain { background: transparent; }
    .xbf-accent .xbf-row-name { color: var(--xbf-blue); }
    .xbf-check { width: 22px; height: 22px; color: var(--xbf-blue); visibility: hidden; }
    .xbf-check.xbf-on { visibility: visible; }
    .xbf-empty { padding: 48px 32px; text-align: center; color: var(--xbf-fg2); font-size: 15px; }
    .xbf-post { display: flex; gap: 12px; padding: 12px 8px 12px 16px; border-bottom: 1px solid var(--xbf-line); cursor: pointer; }
    .xbf-post:hover { background: var(--xbf-hover); }
    .xbf-avatar { width: 40px; height: 40px; border-radius: 999px; flex-shrink: 0; background: var(--xbf-line); object-fit: cover; }
    .xbf-post-main { flex: 1; min-width: 0; font-size: 15px; line-height: 20px; }
    .xbf-post-meta { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .xbf-post-text { white-space: pre-wrap; overflow-wrap: anywhere; display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical; overflow: hidden; margin-top: 2px; }
    .xbf-media { display: block; margin-top: 8px; max-width: 100%; max-height: 220px; border-radius: 12px; border: 1px solid var(--xbf-line); object-fit: cover; }
    .xbf-post-x { width: 32px; height: 32px; color: var(--xbf-fg2); }
    .xbf-chooser { position: absolute; width: 300px; max-height: 420px; display: flex; flex-direction: column; background: var(--xbf-bg);
      border-radius: 16px; box-shadow: 0 0 15px rgba(101,119,134,.2), 0 0 3px 1px rgba(101,119,134,.15); padding: 4px 0 0; overflow: hidden; }
    .xbf-chooser-head { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px 6px 16px; }
    .xbf-chooser-title { font-weight: 700; font-size: 17px; }
    .xbf-chooser-list { overflow-y: auto; overscroll-behavior: contain; }
    .xbf-link { all: unset; cursor: pointer; text-align: center; padding: 10px; color: var(--xbf-blue); font-size: 14px; border-top: 1px solid var(--xbf-line); margin-top: 4px; }
    .xbf-link:hover { text-decoration: underline; }
    .xbf-post-btn { display: flex; }
    [data-xbf-post].xbf-saved, [data-xbf-post].xbf-saved * { color: var(--x-blue-500, rgb(29,155,240)) !important; }
    /* 窄屏（手机）操作栏放不下多一个按钮：让出「浏览量」位置，避免数字与图标重叠 */
    @container (max-width: 420px) {
      [data-engagement-action="generic"]:has(~ div [data-xbf-post]) { display: none; }
    }
    .xbf-nav-label.xbf-bold { font-weight: 700; }
    .xbf-form { padding: 4px 16px 24px; display: flex; flex-direction: column; gap: 12px; }
    .xbf-section-title { font-size: 17px; font-weight: 700; margin-top: 12px; }
    .xbf-field { display: flex; flex-direction: column; gap: 4px; }
    .xbf-field-label { font-size: 13px; color: var(--xbf-fg2); }
    .xbf-input { box-sizing: border-box; width: 100%; padding: 10px 12px; border: 1px solid var(--xbf-line); border-radius: 6px;
      background: transparent; color: var(--xbf-fg); font: inherit; font-size: 15px; outline: none; }
    .xbf-input:focus { border-color: var(--xbf-blue); box-shadow: 0 0 0 1px var(--xbf-blue); }
    .xbf-hint { margin: 0; font-size: 13px; line-height: 18px; color: var(--xbf-fg2); }
    .xbf-switch-row { display: flex; align-items: center; gap: 12px; cursor: pointer; }
    .xbf-switch { appearance: none; width: 40px; height: 24px; border-radius: 999px; background: var(--xbf-line); position: relative; cursor: pointer; flex-shrink: 0; transition: background .15s; margin: 0; }
    .xbf-switch::after { content: ''; position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%; background: #fff; transition: transform .15s; box-shadow: 0 1px 2px rgba(0,0,0,.3); }
    .xbf-switch:checked { background: var(--xbf-blue); }
    .xbf-switch:checked::after { transform: translateX(16px); }
    .xbf-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .xbf-btn { all: unset; box-sizing: border-box; cursor: pointer; padding: 0 16px; height: 36px; border-radius: 999px; font-weight: 700; font-size: 14px; display: inline-flex; align-items: center; }
    .xbf-btn:disabled { opacity: .5; cursor: default; }
    .xbf-btn-primary { background: var(--xbf-blue); color: #fff; }
    .xbf-btn-outline { border: 1px solid var(--xbf-line); color: var(--xbf-fg); }
    .xbf-btn-outline:hover { background: var(--xbf-hover); }
    .xbf-sync-status { font-size: 13px; color: var(--xbf-fg2); }
    .xbf-sync-status.xbf-error { color: rgb(244,33,46); }
    #xbf-toast { position: fixed; left: 50%; bottom: 32px; transform: translate(-50%, 20px); z-index: 2147483001; pointer-events: none;
      background: var(--xbf-blue); color: #fff; padding: 12px 16px; border-radius: 6px; font-size: 15px; opacity: 0; transition: opacity .2s, transform .2s; }
    #xbf-toast.xbf-show { opacity: 1; transform: translate(-50%, 0); }
    @media (max-width: 516px) {
      .xbf-modal { padding: 0; background: var(--xbf-bg); }
      .xbf-panel { width: 100vw; max-width: 100vw; height: 100dvh; border-radius: 0; box-shadow: none; }
      .xbf-chooser { position: static; width: 100%; max-height: 75dvh; border-radius: 16px 16px 0 0; padding-bottom: env(safe-area-inset-bottom); }
      #xbf-toast { bottom: calc(72px + env(safe-area-inset-bottom)); max-width: 90vw; }
    }
  `;
  document.head.append(h("style", { id: "xbf-style" }, css));

  // ───────────────────────── 启动：监听 SPA 渲染 ─────────────────────────
  let scheduled = false;
  function scan() {
    scheduled = false;
    try {
      injectNav();
      injectXwebButtons();
      injectRwebButtons();
    } catch (e) {
      console.error("[x-bookmark-folders]", e);
    }
  }
  Sync.init().catch((e) => console.error("[x-bookmark-folders]", e));
  new MutationObserver(() => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(scan);
    }
  }).observe(document.body, { childList: true, subtree: true });
  scan();
})();
