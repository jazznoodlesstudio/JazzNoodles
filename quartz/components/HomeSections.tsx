import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { SimpleSlug, resolveRelative } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"

// 首頁底部：左「最新文章」（日期｜標題｜系列標籤）＋ 右「系列」卡片
// 版型依 Jazznoodles 首頁設計稿（Home）。
export interface SeriesDef {
  folder: string // 例：technology/ccar-f
  label: string // 例：TECHNOLOGY · CCAR-F
  title: string
  desc: string
  showRange?: boolean // 顯示「00–08」篇號範圍
}

interface Options {
  limit: number
  series: SeriesDef[]
}

const defaultOptions: Options = { limit: 5, series: [] }

const isPost = (f: QuartzPluginData) => {
  const s = f.slug
  return !!s && s.includes("/") && !s.endsWith("/index") && !s.startsWith("tags/")
}
const orderOf = (f: QuartzPluginData) => Number((f.frontmatter as any)?.order ?? 0) || 0
const pad = (n: number) => String(n).padStart(2, "0")

export default ((userOpts?: Partial<Options>) => {
  const opts = { ...defaultOptions, ...userOpts }

  const HomeSections: QuartzComponent = ({ allFiles, fileData }: QuartzComponentProps) => {
    const from = fileData.slug!
    const posts = allFiles
      .filter(isPost)
      .sort((a, b) => {
        const da = (a.dates?.created ?? a.dates?.modified)?.getTime() ?? 0
        const db = (b.dates?.created ?? b.dates?.modified)?.getTime() ?? 0
        if (da !== db) return db - da
        if (orderOf(a) !== orderOf(b)) return orderOf(b) - orderOf(a)
        return (a.frontmatter?.title ?? "").localeCompare(b.frontmatter?.title ?? "")
      })
      .slice(0, opts.limit)

    return (
      <div class="jn-home">
        <section class="jn-latest">
          <h2 class="jn-h2">最新文章</h2>
          <ul class="jn-rows">
            {posts.map((p) => {
              const d = p.dates?.created ?? p.dates?.modified
              const parts = p.slug!.split("/")
              const pill = parts.length >= 3 ? parts[1] : parts[0]
              return (
                <li>
                  <a class="internal jn-row" href={resolveRelative(from, p.slug!)}>
                    <span class="jn-date">{d ? d.toISOString().slice(0, 10) : ""}</span>
                    <span class="jn-title">{p.frontmatter?.title}</span>
                    <span class="jn-pill">{pill}</span>
                  </a>
                </li>
              )
            })}
          </ul>
        </section>

        <aside class="jn-aside">
          <h2 class="jn-h2">系列</h2>
          <div class="jn-series">
            {opts.series.map((s) => {
              const items = allFiles.filter(
                (f) => isPost(f) && f.slug!.startsWith(s.folder + "/"),
              )
              const n = items.length
              const orders = items.map(orderOf)
              const range =
                s.showRange && n > 0 ? `${pad(Math.min(...orders))}–${pad(Math.max(...orders))}，` : ""
              return (
                <a class="internal jn-serie" href={resolveRelative(from, (s.folder + "/") as SimpleSlug)}>
                  <small>{s.label}</small>
                  <strong>{s.title}</strong>
                  <span>
                    {s.desc} · {range}共 {n} 篇
                  </span>
                  <div class="jn-bars" aria-hidden="true">
                    {items.map(() => (
                      <i />
                    ))}
                  </div>
                </a>
              )
            })}
          </div>
        </aside>
      </div>
    )
  }

  return HomeSections
}) satisfies QuartzComponentConstructor
