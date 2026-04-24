import DOMPurify from "isomorphic-dompurify"

export const useSanitize = () => {
  // 허용된 HTML 태그만 걸러서 출력되도록 하기
  const sanitize = (dirty: string): string => {
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      if (node.tagName === "A") {
        node.setAttribute("target", "_blank")
        node.setAttribute("rel", "noopener noreferrer")
      }
    })

    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [
        "a",
        "b",
        "blockquote",
        "br",
        "caption",
        "code",
        "div",
        "em",
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "hr",
        "i",
        "iframe",
        "img",
        "li",
        "mark",
        "nl",
        "ol",
        "p",
        "pre",
        "s",
        "span",
        "strike",
        "strong",
        "table",
        "tbody",
        "td",
        "th",
        "thead",
        "tr",
        "ul",
      ],
      ALLOWED_ATTR: [
        "allowfullscreen",
        "alt",
        "autoplay",
        "class",
        "disablekbcontrols",
        "enableiframeapi",
        "endtime",
        "height",
        "href",
        "ivloadpolicy",
        "loop",
        "modestbranding",
        "name",
        "origin",
        "playlist",
        "src",
        "start",
        "style",
        "target",
        "width",
      ],
    })
  }
  return { sanitize }
}
