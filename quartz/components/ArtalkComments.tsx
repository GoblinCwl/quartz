import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { classNames } from "../util/lang"
// @ts-ignore
import script from "./scripts/artalk.inline"
// @ts-ignore
import style from "./styles/artalk.scss"
// @ts-ignore
import readerModeStyle from "./styles/artalk-readermode.scss"

type Options = {
  server: string
  site: string
  theme?: string
  lang?: string
  darkMode?: boolean
  useBackendConf?: boolean
  pageKey?: string
  pageTitle?: string
}

export default ((opts: Options) => {
  const ArtalkComments: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
    const frontmatter: any = fileData.frontmatter || {}
    const enableComment: boolean = frontmatter.comment === true
    if (!enableComment) {
      return <></>
    }

    const pageKey = opts.pageKey || fileData.filePath || ""
    const pageTitle = opts.pageTitle || (frontmatter.title as string) || ""

    return (
      <div
        id="artalk-comments"
        class={classNames(displayClass, "artalk-comments", "artalk-loading")}
        data-server={opts.server}
        data-site={opts.site}
        data-theme={opts.theme ?? "light"}
        data-lang={opts.lang ?? "zh-CN"}
        data-dark-mode={opts.darkMode ? "true" : "false"}
        data-use-backend-conf={opts.useBackendConf ? "true" : "false"}
        data-page-key={pageKey}
        data-page-title={pageTitle}
      ></div>
    )
  }

  ArtalkComments.afterDOMLoaded = script
  ArtalkComments.css = [style, readerModeStyle]

  return ArtalkComments
}) satisfies QuartzComponentConstructor<Options>