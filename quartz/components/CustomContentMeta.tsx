import { QuartzComponentConstructor, QuartzComponentProps } from "./types"
import readingTime from "reading-time"
import { classNames } from "../util/lang"
import { i18n } from "../i18n"
import { JSX } from "preact"
import style from "./styles/contentMeta.scss"

interface CustomContentMetaOptions {
  /**
   * Whether to display reading time
   */
  showReadingTime: boolean
  showComma: boolean
  /**
   * Prefix for the date (e.g. "更新于: ")
   */
  datePrefix: string
  /**
   * Whether to include seconds in the date
   */
  includeSeconds: boolean
}

const defaultOptions: CustomContentMetaOptions = {
  showReadingTime: true,
  showComma: true,
  datePrefix: "",
  includeSeconds: false,
}

export default ((opts?: Partial<CustomContentMetaOptions>) => {
  // Merge options with defaults
  const options: CustomContentMetaOptions = { ...defaultOptions, ...opts }

  function CustomContentMetadata({ cfg, fileData, displayClass }: QuartzComponentProps) {
    const text = fileData.text

    if (text) {
      const segments: (string | JSX.Element)[] = []

      if (fileData.dates) {
        // Get the date from the file data
        if (cfg.defaultDateType && fileData.dates[cfg.defaultDateType]) {
          const date = fileData.dates[cfg.defaultDateType]!
          
          // Format the date according to options
          const formattedDate = formatDateWithSeconds(date, cfg.locale || "zh-CN", options.includeSeconds)
          
          segments.push(
            <span>
              {options.datePrefix}
              <time datetime={date.toISOString()}>{formattedDate}</time>
            </span>
          )
        }
      }

      // Display reading time if enabled
      if (options.showReadingTime) {
        const { minutes, words: _words } = readingTime(text)
        const displayedTime = i18n(cfg.locale).components.contentMeta.readingTime({
          minutes: Math.ceil(minutes),
        })
        segments.push(<span>{displayedTime}</span>)
      }

      return (
        <p show-comma={options.showComma} class={classNames(displayClass, "content-meta")}>
          {segments}
        </p>
      )
    } else {
      return null
    }
  }

  CustomContentMetadata.css = style

  return CustomContentMetadata
}) satisfies QuartzComponentConstructor

function formatDateWithSeconds(date: Date, locale: string = "zh-CN", includeSeconds: boolean = false): string {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",  // 使用完整月份名称
    day: "numeric",
    ...(includeSeconds && { hour: "2-digit", minute: "2-digit", second: "2-digit" })
  }

  // 对中文使用特定格式
  if (locale.includes("zh")) {
    if (includeSeconds) {
      return date.toLocaleString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
      })
    } else {
      return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`
    }
  } else {
    return date.toLocaleDateString(locale, options)
  }
}