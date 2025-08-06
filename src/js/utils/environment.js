const html = document.documentElement
const body = document.body
const isDebug = html.hasAttribute("data-debug")

export {
    html,
    body,
    isDebug
}