import { PageLayout, SharedLayout } from "./quartz/cfg"
import * as Component from "./quartz/components"

// components shared across all pages
export const sharedPageComponents: SharedLayout = {
  head: Component.Head(),
  header: [Component.TopNav()],
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
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
        { Component: Component.ReaderMode() },
      ],
    }),
    Component.Explorer({
      title: "探索",
      folderDefaultState: "collapsed",
      sortFn: (a, b) => {
        // Jazznoodles：側邊選單照主選單順序排
        const order = ["technology", "product-business", "faith", "creative-studio", "travel", "lab", "notes", "about"]
        const ia = order.indexOf(a.slugSegment)
        const ib = order.indexOf(b.slugSegment)
        if (ia !== -1 || ib !== -1) {
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
        }
        if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
        return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: "base" })
      },
    }),
  ],
  right: [
    Component.Graph(),
    Component.DesktopOnly(Component.TableOfContents()),
    Component.Backlinks(),
  ],
}

// components for pages that display lists of pages  (e.g. tags or folders)
export const defaultListPageLayout: PageLayout = {
  beforeBody: [Component.Breadcrumbs(), Component.ArticleTitle(), Component.ContentMeta()],
  left: [
    Component.PageTitle(),
    Component.MobileOnly(Component.Spacer()),
    Component.Flex({
      components: [
        {
          Component: Component.Search(),
          grow: true,
        },
        { Component: Component.Darkmode() },
      ],
    }),
    Component.Explorer({
      title: "探索",
      folderDefaultState: "collapsed",
      sortFn: (a, b) => {
        // Jazznoodles：側邊選單照主選單順序排
        const order = ["technology", "product-business", "faith", "creative-studio", "travel", "lab", "notes", "about"]
        const ia = order.indexOf(a.slugSegment)
        const ib = order.indexOf(b.slugSegment)
        if (ia !== -1 || ib !== -1) {
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
        }
        if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1
        return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: "base" })
      },
    }),
  ],
  right: [],
}
