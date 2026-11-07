import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { FullSlug, SimpleSlug, resolveRelative } from "../util/path"
import { classNames } from "../util/lang"

// cat：對應 custom.scss 的分類色（tech 藍／know 青／create 紫／travel 橘／none 灰）
type Item = { label: string; slug: string; match: string; cat: string }

const ITEMS: Item[] = [
  { label: "Home", slug: "", match: "", cat: "none" },
  { label: "Technology", slug: "technology/", match: "technology", cat: "tech" },
  { label: "Product & Business", slug: "product-business/", match: "product-business", cat: "know" },
  { label: "Faith", slug: "faith/", match: "faith", cat: "know" },
  { label: "Creative Studio", slug: "creative-studio/", match: "creative-studio", cat: "create" },
  { label: "Travel", slug: "travel/", match: "travel", cat: "travel" },
  { label: "Lab", slug: "lab/", match: "lab", cat: "create" },
  { label: "Notes", slug: "notes/", match: "notes", cat: "none" },
  { label: "About", slug: "about", match: "about", cat: "none" },
]

const TopNav: QuartzComponent = ({ fileData, displayClass }: QuartzComponentProps) => {
  const current = fileData.slug as FullSlug
  const isActive = (it: Item) =>
    it.match === ""
      ? current === "index"
      : current === it.match || current.startsWith(it.match + "/")

  return (
    <nav class={classNames(displayClass, "jn-topnav")} aria-label="主選單">
      {ITEMS.map((it) => (
        <a
          href={resolveRelative(current, it.slug as SimpleSlug)}
          data-cat={it.cat}
          class={isActive(it) ? "active" : ""}
          aria-current={isActive(it) ? "page" : undefined}
        >
          {it.label}
        </a>
      ))}
    </nav>
  )
}

export default (() => TopNav) satisfies QuartzComponentConstructor
