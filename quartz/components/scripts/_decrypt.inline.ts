import { base64 } from "rfc4648"

// @ts-ignore:next-line
function find<T>(selector: string): T {
  return document.querySelector(selector) as T
}

let salt: Uint8Array, iv: Uint8Array, ciphertext: Uint8Array, iterations: number
const subtle = window.crypto?.subtle || (window.crypto as any)?.webkitSubtle

let pl: HTMLPreElement, form: HTMLFormElement, pwd: HTMLInputElement, load: HTMLDivElement,
    loadText: HTMLElement, lock: HTMLDivElement, msg: HTMLParagraphElement, article: HTMLElement

async function decryptHTML() {
  pl = find("pre[data-i]"); form = find("form"); pwd = find(".pwd"); load = find("#load")
  loadText = find("#load-text"); lock = find("#lock"); msg = find("#msg"); article = find("#content")

  if (!pl || !form || !pwd) return
  pwd.value = ""
  if (!subtle) { pwd.disabled = true; error("modern"); return }

  show(lock)
  if (!pl.innerHTML) { pwd.disabled = true; error("empty"); return }

  form.addEventListener("submit", (event) => { event.preventDefault(); decrypt() })

  iterations = Number(pl.dataset.i)
  const bytes = base64.parse(pl.innerHTML)
  salt = bytes.slice(0, 32); iv = bytes.slice(32, 48); ciphertext = bytes.slice(48)

  if (location.hash) {
    const [url, hash] = location.href.split("#")
    pwd.value = hash || ""
    history.replaceState(null, "", url)
  }

  if (sessionStorage[document.body.dataset.slug!] || pwd.value) {
    decrypt()
  } else {
    hide(load); show(form); pwd.focus()
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
    const decrypted = await decryptFile({ salt, iv, ciphertext, iterations }, pwd.value)
    article.innerHTML = decrypted
    hide(lock)
    
    // 解密成功后，显示目录内容
    const tocContentElements = document.getElementsByClassName("toc-content overflow")
    for (let i = 0; i < tocContentElements.length; i++) {
      if (tocContentElements[i] instanceof HTMLElement) {
        tocContentElements[i].classList.remove("hidden")
      }
    }
    
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
  } catch (e) {
    if (sessionStorage[document.body.dataset.slug!]) {
      sessionStorage.removeItem(document.body.dataset.slug!)
    } else {
      error("wrong")
    }
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
  const key = sessionStorage[slug] 
    ? await importKey(JSON.parse(sessionStorage[slug]))
    : await deriveKey(salt, password, iterations)

  const data = new Uint8Array(await subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext))
  if (!data) throw "Malformed data"

  sessionStorage[slug] = JSON.stringify(await subtle.exportKey("jwk", key))
  return decoder.decode(data)
}
