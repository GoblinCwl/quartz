import {base64} from "rfc4648"

// @ts-ignore:next-line
function find<T>(selector: string): T {
  return document.querySelector(selector) as T
}

let salt: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array, iterations: number
let salt_toc: Uint8Array, iv_toc: Uint8Array, ciphertext_toc: Uint8Array, iterations_toc: number
const subtle = window.crypto?.subtle || (window.crypto as any)?.webkitSubtle

let pl: HTMLPreElement,pl_toc: HTMLPreElement, form: HTMLFormElement, pwd: HTMLInputElement,
    loadText: HTMLElement, lock: HTMLDivElement, msg: HTMLParagraphElement, article: HTMLElement,
    article_graph: HTMLElement

async function decryptHTML() {
  pl = find("#encrypted-content");
  form = find("form");
  pwd = find(".pwd");  loadText = find("#load-text"); lock = find("#lock"); msg = find("#msg"); article = find("#content")
  pl_toc = find("#encrypted-toc"); article_graph = find(".graph")

  if (!pl || !form || !pwd) return
  pwd.value = ""
  if (!subtle) { pwd.disabled = true; error("modern"); return }

  show(lock)
  if (!pl.innerHTML) { pwd.disabled = true; error("empty"); return }

  form.addEventListener("submit", (event) => { event.preventDefault(); decrypt() })

  iterations = Number(pl.dataset.i)
  iterations_toc = Number(pl_toc.dataset.i)
  const bytes = base64.parse(pl.innerHTML)
  salt = bytes.slice(0, 32); iv = bytes.slice(32, 48); ciphertext = bytes.slice(48)
  const bytes_toc = base64.parse(pl_toc.innerHTML)
  salt_toc = bytes_toc.slice(0, 32); iv_toc = bytes_toc.slice(32, 48); ciphertext_toc = bytes_toc.slice(48)

  if (location.hash) {
    const [url, hash] = location.href.split("#")
    pwd.value = hash || ""
    history.replaceState(null, "", url)
  }

  const slug = document.body.dataset.slug!
  const hasContentKey = sessionStorage[`${slug}_content`]
  const hasTocKey = sessionStorage[`${slug}_toc`]

// 如果两个密钥都有，或者有密码，就自动解密
// 如果只有一个密钥，可能有问题（比如刷新后只解密了一半）
  if (hasContentKey && hasTocKey) {
    decrypt()
  } else if (hasContentKey || hasTocKey) {
    // 只有一个密钥，可能是之前版本留下的，清除后让用户重新输入
    console.log('检测到不完整的密钥状态，清除后重新输入')
    sessionStorage.removeItem(`${slug}_content`)
    sessionStorage.removeItem(`${slug}_toc`)
    show(lock)
  } else {
    show(lock)
  }
}

document.addEventListener("nav", decryptHTML)

function show(element: Element) { element.classList.remove("hidden") }
function hide(element: Element) { element.classList.add("hidden") }

function error(code: string) {
  msg.innerText = msg.getAttribute(`data-${code}`) || ""
  
  if (code === "wrong") {
    msg.classList.add("wrong-password")
    
    pwd.style.borderColor = "#e74c3c"
    pwd.style.boxShadow = "0 0 0 3px rgba(231, 76, 60, 0.1)"
  } else {
    msg.classList.remove("wrong-password")
    pwd.style.borderColor = ""; pwd.style.boxShadow = ""
  }
}

async function decrypt() {
  const submitBtn = form.querySelector('input[type="submit"]') as HTMLInputElement
  const originalText = submitBtn.value

  submitBtn.disabled = true
  submitBtn.value = loadText.getAttribute("data-decrypt") || "解密中..."

  try {
    let contentHtml = await decryptFile({salt, iv, ciphertext, iterations}, pwd.value)
    let tocHtml = await decryptFile_toc({salt_toc, iv_toc, ciphertext_toc, iterations_toc}, pwd.value)
    hide(lock)

    article.innerHTML = contentHtml
    article_graph.insertAdjacentHTML("afterend",tocHtml)


    // 重新初始化目录的滚动监听功能，但要小心避免无限循环
    setTimeout(() => {
      // 创建一个临时的IntersectionObserver来处理解密后的内容
      const tempObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          const slug = entry.target.id
          const tocEntryElements = document.querySelectorAll(`a[data-for="${slug}"]`)
          const windowHeight = entry.rootBounds?.height
          if (windowHeight && tocEntryElements.length > 0) {
            if (entry.boundingClientRect.y < windowHeight) {
              tocEntryElements.forEach((tocEntryElement) => tocEntryElement.classList.add("in-view"))
            } else {
              tocEntryElements.forEach((tocEntryElement) => tocEntryElement.classList.remove("in-view"))
            }
          }
        }
      })

      // 观察解密后内容中的标题元素
      const headers = document.querySelectorAll("h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]")
      headers.forEach((header) => tempObserver.observe(header))

      // 将临时observer赋值给全局变量，以便在需要时可以断开连接
      ;(window as any).decryptedContentObserver = tempObserver;
    }, 10)

    // 触发解密完成事件，通知其他组件（如Artalk）可以加载了
    const decryptCompleteEvent = new CustomEvent('decryptComplete', {
      detail: { success: true },
      bubbles: true,
      cancelable: true
    });
    document.dispatchEvent(decryptCompleteEvent);
  } catch (e) {
    const slug = document.body.dataset.slug!
    if (sessionStorage[`${slug}_content`] || sessionStorage[`${slug}_toc`]) {
      sessionStorage.removeItem(`${slug}_content`)
      sessionStorage.removeItem(`${slug}_toc`)
    } else {
      error("wrong")
    }
    show(lock)
    pwd.value = ""
    pwd.focus()
  } finally {
    submitBtn.disabled = false
    submitBtn.value = originalText
  }
}

async function deriveKey(salt: Uint8Array, password: string, iterations: number) {
  const encoder = new TextEncoder()
  const baseKey = await subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveKey"])
  return await subtle.deriveKey(
      // @ts-ignore
    { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
    baseKey, { name: "AES-GCM", length: 256 }, true, ["decrypt"]
  )
}

async function importKey(key: JsonWebKey) {
  return subtle.importKey("jwk", key, "AES-GCM", true, ["decrypt"])
}

async function decryptFile({ salt, iv, ciphertext, iterations }: {
  salt: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array, iterations: number
}, password: string) {
  const decoder = new TextDecoder()
  const slug = document.body.dataset.slug!
  const key = sessionStorage[`${slug}_content`]
    ? await importKey(JSON.parse(sessionStorage[`${slug}_content`]))
    : await deriveKey(salt, password, iterations)

  // @ts-ignore
  const data = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext))
  if (!data) throw "Malformed data"

  sessionStorage[`${slug}_content`] = JSON.stringify(await subtle.exportKey("jwk", key))
  return decoder.decode(data)
}

async function decryptFile_toc({ salt_toc, iv_toc, ciphertext_toc, iterations_toc }: {
  salt_toc: Uint8Array, iv_toc: Uint8Array, ciphertext_toc: Uint8Array, iterations_toc: number
}, password: string) {
  const decoder = new TextDecoder()
  const slug = document.body.dataset.slug!
  const key = sessionStorage[`${slug}_toc`]
      ? await importKey(JSON.parse(sessionStorage[`${slug}_toc`]))
      : await deriveKey(salt_toc, password, iterations_toc)

  // @ts-ignore
  const data = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv:iv_toc }, key, ciphertext_toc))
  if (!data) throw "Malformed data"

  sessionStorage[`${slug}_toc`] = JSON.stringify(await subtle.exportKey("jwk", key))
  return decoder.decode(data)
}