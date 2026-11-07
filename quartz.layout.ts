import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// 左欄 Explorer：主選單順序固定（About 檔案自然排在最後）。
// 注意：sortFn 會被轉成字串在瀏覽器執行，內容必須自給自足，不能引用外面的變數。
// 如果你原本的 Explorer 有 title / mapFn（例如資料夾顯示名稱），請保留在這個物件裡。
const jnExplorer = () =>
  Component.Explorer({
    sortFn: (a, b) => {
      const order = ["technology", "product-business", "faith", "creative-studio", "travel", "lab", "notes"]
      const ia = order.indexOf(a.slugSegment)
      const ib = order.indexOf(b.slugSegment)
      if (ia !== -1 || ib !== -1) {
        if (ia === -1) return 1
        if (ib === -1) return -1
        return ia - ib
      }
      if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
      return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: "base" })
    },
  })

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  // 全站頂部列：Logo ｜ 主選單 ｜ 搜尋 ｜ 深淺色 ｜ 閱讀模式
  header: [
    Component.Flex({
      gap: "1.5rem",
      components: [
        { Component: Component.PageTitle() },
        { Component: Component.TopNav(), grow: true, justify: "start" },
        { Component: Component.Search() },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
  ],
  afterBody: [],
  footer: Component.Footer({
    links: {
      GitHub: "https://github.com/jazznoodlesstudio",
    },
  }),
}

// components for pages that display a single page (e.g. a single note)
export const defaultContentPageLayout: PageLayout = {
  beforeBody: [
    Component.ConditionalRender({
      component: Component.Breadcrumbs(),
      condition: (page) => page.fileData.slug !== "index",
    }),
    Component.ArticleTitle(),
    Component.ContentMeta(),
    Component.TagList(),
  ],
  // 首頁底部：最新文章（只在首頁顯示）
  afterBody: [
    Component.ConditionalRender({
      component: Component.RecentNotes({
        title: "最新文章",
        limit: 6,
        showTags: true,
        filter: (f) =>
          !!f.slug && !f.slug.endsWith("index") && !f.slug.startsWith("tags/"),
      }),
      condition: (page) => page.fileData.slug === "index",
    }),
  ],
  left: [jnExplorer()],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [jnExplorer()],
  right: [],
}
