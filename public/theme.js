// Runs before the page paints so the saved (or system) theme shows with no flash.
// Kept as a separate file because the site's Content Security Policy blocks inline scripts.
(function () {
  try {
    var saved = localStorage.getItem('peerlink-theme')
    var dark = saved ? saved === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    if (dark) document.documentElement.classList.add('dark')
  } catch (e) {}
})()
