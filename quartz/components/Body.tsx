// @ts-ignore
import clipboardScript from "./scripts/clipboard.inline"
import clipboardStyle from "./styles/clipboard.scss"
// @ts-ignore
import pureModeScript from "./scripts/puremode.inline"
import pureModeStyle from "./styles/puremode.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"

const Body: QuartzComponent = ({ children }: QuartzComponentProps) => {
  return <div id="quartz-body">{children}</div>
}

Body.afterDOMLoaded = [clipboardScript, pureModeScript]
Body.css = clipboardStyle + "\n" + pureModeStyle

export default (() => Body) satisfies QuartzComponentConstructor