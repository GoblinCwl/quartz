// @ts-ignore
import titleLinkScript from "./scripts/titleLink.inline"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"

const ArticleTitle: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const title = fileData.frontmatter?.title
  if (title) {
    return (
      <h1 class={classNames(displayClass, "article-title")}>
        <span class="title-link-container" id="title-link-container">
          <button 
            class="title-link-button" 
            aria-label="Copy link to article"
            title="复制链接"
          >
            🔗
          </button>
          {title}
        </span>
      </h1>
    )
  } else {
    return null
  }
}

ArticleTitle.css = `
.article-title {
  margin: 2rem 0 0 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.title-link-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
}

.title-link-button {
  background: none;
  border: none;
  font-size: 0.8em; /* 缩小图标 */
  cursor: pointer;
  padding: 0.2rem;
  border-radius: 4px;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 1;
    background-color: var(--lightgray);
  }
}
`

ArticleTitle.afterDOMLoaded = titleLinkScript

export default (() => ArticleTitle) satisfies QuartzComponentConstructor