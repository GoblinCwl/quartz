// @ts-ignore
import script from "./scripts/scrollButton.inline"
import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
import style from "./styles/scrollButton.scss"

interface ScrollButtonOptions {
  /**
   * Position of the scroll button
   */
  position: "bottom-right"
  /**
   * Show scroll button only on desktop
   */
  showOnlyOnDesktop: boolean
}

const defaultOptions: ScrollButtonOptions = {
  position: "bottom-right",
  showOnlyOnDesktop: true,
}

export default ((opts?: Partial<ScrollButtonOptions>) => {
  const options: ScrollButtonOptions = { ...defaultOptions, ...opts }

  function ScrollButton({ displayClass }: QuartzComponentProps) {
    const showOnlyOnDesktopClass = options.showOnlyOnDesktop ? "desktop-only" : ""
    
    return (
      <div
        class={classNames(
          displayClass,
          "scroll-buttons",
          showOnlyOnDesktopClass
        )}
      >
        <button id="scroll-top" class="scroll-btn" aria-label="回到顶部">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
        </button>
        <button id="scroll-bottom" class="scroll-btn" aria-label="前往底部">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    )
  }

  ScrollButton.css = style
  ScrollButton.afterDOMLoaded = script

  return ScrollButton
}) satisfies QuartzComponentConstructor