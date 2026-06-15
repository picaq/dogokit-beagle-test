import { json, type LoaderFunctionArgs, type MetaFunction } from "@remix-run/node"
import { useLoaderData } from "@remix-run/react"

import {
  getPaginationConfigs,
  getPaginationOptions,
  PaginationNavigation,
  PaginationSearch,
} from "~/components/shared/pagination-search"
import { PostItem } from "~/components/shared/post-item"
import { UserItem } from "~/components/shared/user-item"
import { db } from "~/libs/db.server"
import { createMeta } from "~/utils/meta"
import { createSitemap } from "~/utils/sitemap"
import { searchDocuments } from "~/utils/search"

export const handle = createSitemap("/search", 0.8)

export const meta: MetaFunction = () =>
  createMeta({
    title: "Search",
    description: "Search some data.",
  })

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const config = getPaginationConfigs({ request, defaultLimit: 10 })
  const contains = config.queryParam

  /**
   * Only in a search-first page, proceed if there's a query
   */
  if (!contains) {
    return json({
      ...getPaginationOptions({ request, totalItems: 0 }),
      count: 0,
      users: [],
      posts: [],
    })
  }

  const wherePost = {
    status: {
      OR: [{ symbol: "PUBLISHED" }, { symbol: "ARCHIVED" }],
    },
    OR: [
      { title: { contains } },
      { slug: { contains } },
      { excerpt: { contains } },
      { content: { contains } },
    ],
  }

  const [users, posts] = await Promise.all([
    db.user.findMany({
      where: {
        OR: [{ username: { contains } }, { fullname: { contains } }],
      },
      orderBy: { createdAt: "asc" },
      include: { images: { select: { id: true, url: true } } },
    }),
    db.post.findMany({
      where: wherePost,
      orderBy: { updatedAt: "desc" },
      include: {
        status: { select: { symbol: true, name: true } },
        images: { select: { id: true, url: true } },
        user: { include: { images: { select: { id: true, url: true } } } },
      },
    }),
  ])

  const rankedUsers = searchDocuments(users, contains, ["username", "fullname"])
  const rankedPosts = searchDocuments(posts, contains, ["title", "slug", "excerpt", "content"])
  const combinedResults = [...rankedUsers, ...rankedPosts]
  const totalItems = combinedResults.length
  const pagedResults = combinedResults.slice(config.skip, config.skip + config.limitParam)

  return json({
    ...getPaginationOptions({ request, totalItems }),
    users: pagedResults.filter((item): item is (typeof users)[number] => "username" in item),
    posts: pagedResults.filter((item): item is (typeof posts)[number] => "title" in item),
  })
}

export default function SearchRoute() {
  const { posts, users, ...loaderData } = useLoaderData<typeof loader>()

  return (
    <div className="site-container space-y-12">
      <header className="site-header">
        <h1>Search</h1>
      </header>

      <section className="site-section space-y-4">
        <PaginationSearch
          itemName="result"
          searchPlaceholder="Search users and notes..."
          count={users.length + posts.length}
          {...loaderData}
          isDefaultShow={false} // Search is blank by default
        />
      </section>

      <section className="site-section space-y-8">
        {users.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Users</h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {users.map(user => (
                <li key={user.id}>
                  <UserItem user={user} />
                </li>
              ))}
            </ul>
          </div>
        )}

        {posts.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Posts</h2>
            <ul className="space-y-12">
              {posts.map(post => (
                <li key={post.id}>
                  <PostItem post={post} />
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <section className="site-section">
        <PaginationNavigation {...loaderData} />
      </section>
    </div>
  )
}
