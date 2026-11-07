import { FullSlug, isFolderPath, resolveRelative, pathToRoot, joinSegments } from "../util/path"
import { QuartzPluginData } from "../plugins/vfile"
import { Date, getDate } from "./Date"
import { QuartzComponent, QuartzComponentProps } from "./types"
import { GlobalConfiguration } from "../cfg"

export type SortFn = (f1: QuartzPluginData, f2: QuartzPluginData) => number

export function byDateAndAlphabetical(cfg: GlobalConfiguration): SortFn {
  return (f1, f2) => {
    // Sort by date/alphabetical
    if (f1.dates && f2.dates) {
      // sort descending
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      // prioritize files with dates
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    // otherwise, sort lexographically by title
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  }
}

export function byDateAndAlphabeticalFolderFirst(cfg: GlobalConfiguration): SortFn {
  return (f1, f2) => {
    // Sort folders first
    const f1IsFolder = isFolderPath(f1.slug ?? "")
    const f2IsFolder = isFolderPath(f2.slug ?? "")
    if (f1IsFolder && !f2IsFolder) return -1
    if (!f1IsFolder && f2IsFolder) return 1

    // Jazznoodles：系列文章有 order 欄位時，依 order 由小到大排
    const o1 = Number((f1.frontmatter as Record<string, unknown> | undefined)?.order)
    const o2 = Number((f2.frontmatter as Record<string, unknown> | undefined)?.order)
    if (!Number.isNaN(o1) && !Number.isNaN(o2)) return o1 - o2

    // If both are folders or both are files, sort by date/alphabetical
    if (f1.dates && f2.dates) {
      // sort descending
      return getDate(cfg, f2)!.getTime() - getDate(cfg, f1)!.getTime()
    } else if (f1.dates && !f2.dates) {
      // prioritize files with dates
      return -1
    } else if (!f1.dates && f2.dates) {
      return 1
    }

    // otherwise, sort lexographically by title
    const f1Title = f1.frontmatter?.title.toLowerCase() ?? ""
    const f2Title = f2.frontmatter?.title.toLowerCase() ?? ""
    return f1Title.localeCompare(f2Title)
  }
}

// Jazznoodles：沒有封面時，用所屬分類的封面
const CATEGORY_COVERS = [
  "technology",
  "product-business",
  "faith",
  "creative-studio",
  "travel",
  "lab",
  "notes",
]

function coverFor(page: QuartzPluginData): string | undefined {
  if (page.cover) return page.cover
  const top = (page.slug ?? "").split("/")[0]
  if (CATEGORY_COVERS.includes(top)) return `assets/covers/${top}-cover.svg`
  return undefined
}

type Props = {
  limit?: number
  sort?: SortFn
} & QuartzComponentProps

export const PageList: QuartzComponent = ({ cfg, fileData, allFiles, limit, sort }: Props) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg)
  let list = allFiles.sort(sorter)
  if (limit) {
    list = list.slice(0, limit)
  }
  const root = pathToRoot(fileData.slug!)

  return (
    <ul class="section-ul jn-cards">
      {list.map((page) => {
        const title = page.frontmatter?.title
        const tags = (page.frontmatter?.tags ?? []).slice(0, 3)
        const href = resolveRelative(fileData.slug!, page.slug!)
        const cover = coverFor(page)
        const coverSrc = cover
          ? /^(https?:)?\/\//.test(cover)
            ? cover
            : joinSegments(root, cover)
          : undefined
        const isFolder = isFolderPath(page.slug ?? "")

        return (
          <li class="section-li jn-card">
            <a href={href} class="jn-card-cover internal" data-no-popover="true" tabindex={-1}>
              {coverSrc ? (
                <img src={coverSrc} alt="" loading="lazy" />
              ) : (
                <div class="jn-card-placeholder" />
              )}
              {isFolder && <span class="jn-card-badge">系列</span>}
            </a>
            <div class="jn-card-body">
              <h3>
                <a href={href} class="internal">
                  {title}
                </a>
              </h3>
              {page.description && <p class="jn-card-desc">{page.description}</p>}
              <div class="jn-card-meta">
                {page.dates && <Date date={getDate(cfg, page)!} locale={cfg.locale} />}
                {tags.length > 0 && (
                  <ul class="tags">
                    {tags.map((tag) => (
                      <li>
                        <a
                          class="internal tag-link"
                          href={resolveRelative(fileData.slug!, `tags/${tag}` as FullSlug)}
                        >
                          {tag}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

PageList.css = `
ul.jn-cards {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 1.25rem;
}
ul.jn-cards > li.jn-card {
  margin: 0;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border: 1px solid #e3ebf8;
  border-radius: 16px;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
}
ul.jn-cards > li.jn-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 24px rgba(30, 99, 209, 0.14);
}
.jn-card-cover {
  position: relative;
  display: block;
  aspect-ratio: 1200 / 630;
  background: linear-gradient(90deg, #1e63d1, #6fb6ff) !important;
  padding: 0 !important;
  border-radius: 0 !important;
  overflow: hidden;
}
.jn-card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  margin: 0;
  border-radius: 0;
  display: block;
}
.jn-card-placeholder { width: 100%; height: 100%; }
.jn-card-badge {
  position: absolute;
  top: 10px;
  left: 10px;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  background: #ffd166;
  color: #14284f;
  font-weight: 600;
}
.jn-card-body {
  padding: 0.9rem 1.05rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  flex: 1;
}
.jn-card-body h3 {
  margin: 0;
  font-size: 1.02rem;
  line-height: 1.45;
  font-weight: 600;
}
.jn-card-body h3 a {
  color: var(--dark) !important;
  background: none !important;
  padding: 0 !important;
}
.jn-card-body h3 a:hover { color: var(--secondary) !important; }
.jn-card-desc {
  margin: 0;
  font-size: 0.86rem;
  line-height: 1.6;
  color: var(--darkgray);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.jn-card-meta {
  margin-top: auto;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem 0.6rem;
  font-size: 0.78rem;
  color: var(--gray);
}
.jn-card-meta .tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  list-style: none;
  padding: 0;
  margin: 0;
}
.jn-card-meta .tags li { margin: 0; }
.jn-card-meta .tag-link {
  font-size: 0.72rem;
  padding: 1px 8px !important;
}
:root[saved-theme="dark"] ul.jn-cards > li.jn-card {
  background: var(--lightgray);
  border-color: var(--lightgray);
}
`
