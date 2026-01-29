import { QuartzTransformerPlugin } from "../types"
import { Root, Image } from "mdast"
import { visit } from "unist-util-visit"
import { Element, Root as HRoot } from "hast"
import { PluggableList } from "unified"
import { JSResource, CSSResource } from "../../util/resources"
import imageLoadingScript from "../../components/scripts/imageLoading.inline"
import imageLoadingStyles from "../../components/styles/imageLoading.scss"

export interface Options {
  imageEffects: boolean
}

const defaultOptions: Options = {
  imageEffects: true,
}

export const Images: QuartzTransformerPlugin<Partial<Options>> = (userOpts) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "Images",
    markdownPlugins() {
      const plugins: PluggableList = []

      if (opts.imageEffects) {
        plugins.push(() => {
          return (tree: Root) => {
            // 为图片添加特殊处理
            visit(tree, "image", (node: Image) => {
              // 我们将在HTML阶段添加容器包装
            })
          }
        })
      }

      return plugins
    },
    htmlPlugins() {
      const plugins: PluggableList = []

      if (opts.imageEffects) {
        plugins.push(() => {
          return (tree: HRoot) => {
            visit(tree, "element", (node, index, parent) => {
              // 为图片添加容器包装以应用加载效果
              if (node.tagName === "img" && parent && typeof index !== 'undefined') {
                // 创建一个容器元素
                const container: Element = {
                  type: "element",
                  tagName: "span",
                  properties: {
                    className: ["image-container"]
                  },
                  children: [node]
                }

                // 将容器替换原来的图片节点
                parent.children[index] = container
              }
            })
          }
        })
      }

      return plugins
    },
    externalResources() {
      if (opts.imageEffects) {
        return {
          js: [{
            script: imageLoadingScript,
            loadTime: "afterDOMReady",
            contentType: "inline"
          }] as JSResource[],
          css: [{
            content: imageLoadingStyles,
            inline: true
          }] as CSSResource[]
        }
      }
      return {}
    }
  }
}