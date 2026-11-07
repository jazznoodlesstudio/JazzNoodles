import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { resolveRelative, FullSlug } from "../util/path"

// Jazznoodles 主選單：順序就是畫面上的順序
const links = [
  { title: "Home", slug: "index" },
  { title: "Technology", slug: "technology/index" },
  { title: "Product & Business", slug: "product-business/index" },
  { title: "Faith", slug: "faith/index" },
  { title: "Creative Studio", slug: "creative-studio/index" },
  { title: "Travel", slug: "travel/index" },
  { title: "Lab", slug: "lab/index" },
  { title: "Notes", slug: "notes/index" },
  { title: "About", slug: "about" },
]

const TopNav: QuartzComponent = ({ fileData }: QuartzComponentProps) => {
  const current = fileData.slug! as FullSlug
  return (
    <nav class="top-nav" aria-label="主選單">
      {links.map((l) => {
        const section = l.slug.split("/")[0]
        const isHome = l.slug === "index"
        const active = isHome ? current === "index" : current.startsWith(section)
        return (
          <a class={active ? "active" : ""} href={resolveRelative(current, l.slug as FullSlug)}>
            {l.title}
          </a>
        )
      })}
    </nav>
  )
}

TopNav.css = `
.top-nav {
  display: flex;
  gap: 0.4rem 1.3rem;
  flex-wrap: wrap;
  padding: 0.4rem 0 0.8rem;
  border-bottom: 1px solid var(--lightgray);
  margin-bottom: 1rem;
}
.top-nav a {
  color: var(--darkgray);
  font-weight: 500;
  font-size: 0.95rem;
  text-decoration: none;
  background: none;
  padding: 0.15rem 0;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
  flex-shrink: 0;
}
.top-nav a:hover { color: var(--secondary); }
.top-nav a.active {
  color: var(--secondary);
  border-bottom-color: var(--tertiary);
}
@media (max-width: 800px) {
  .top-nav { flex-wrap: nowrap; overflow-x: auto; white-space: nowrap; }
}
`

export default (() => TopNav) satisfies QuartzComponentConstructor
