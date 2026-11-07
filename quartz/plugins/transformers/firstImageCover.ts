import path from "path"
import { visit } from "unist-util-visit"
import { Root, Element } from "hast"
import { QuartzTransformerPlugin } from "../types"

/**
 * Jazznoodles：自動抓每篇文章的封面
 * 優先順序：frontmatter 的 cover → 文章裡的第一張圖
 * 結果存成「相對於網站根目錄」的路徑，給文章列表卡片使用
 * 注意：要放在 Plugin.CrawlLinks() 之後
 */
export const FirstImageCover: QuartzTransformerPlugin = () => ({
  name: "FirstImageCover",
  htmlPlugins() {
    return [
      () => (tree: Root, file) => {
        const fm = file.data.frontmatter as Record<string, unknown> | undefined
        const fmCover = fm?.cover
        if (typeof fmCover === "string" && fmCover.length > 0) {
          // 完整網址，或從 content 根目錄算起的路徑，例如 assets/covers/xxx.svg
          file.data.cover = fmCover.replace(/^\/+/, "")
          return
        }

        let src: string | undefined
        visit(tree, "element", (node: Element) => {
          if (src) return
          if (node.tagName === "img" && typeof node.properties?.src === "string") {
            src = node.properties.src
          }
        })
        if (!src) return

        if (/^(https?:)?\/\//.test(src)) {
          file.data.cover = src
          return
        }
        // 圖片網址是相對於「這篇文章所在資料夾」的，換算成相對於網站根目錄
        const slug = (file.data.slug ?? "") as string
        const dir = path.posix.dirname(slug)
        const resolved = path.posix.normalize(path.posix.join(dir === "." ? "" : dir, src))
        file.data.cover = resolved.replace(/^(\.\.\/)+/, "").replace(/^\.\//, "")
      },
    ]
  },
})

declare module "vfile" {
  interface DataMap {
    cover: string
  }
}
