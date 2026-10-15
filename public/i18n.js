import ui from './locales/en-ui.js';
// To add Chinese, import zh-ui.js here and zh.js in app.js, plus a Chinese engine dictionary.
// English strings are stable gettext-style keys. Unknown strings keep their English fallback.
export function translateUI(dictionary = ui, language = 'en') {
  document.documentElement.lang = language;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let node;
  while ((node = walker.nextNode())) {
    const key = node.textContent.trim();
    if (key && dictionary[key]) node.textContent = node.textContent.replace(key, dictionary[key]);
  }
  for (const element of document.querySelectorAll('[placeholder], [aria-label]')) {
    for (const attribute of ['placeholder', 'aria-label']) {
      const key = element.getAttribute(attribute);
      if (key && dictionary[key]) element.setAttribute(attribute, dictionary[key]);
    }
  }
}
