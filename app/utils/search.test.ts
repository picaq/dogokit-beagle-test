import assert from "node:assert/strict"
import test from "node:test"

import { searchDocuments } from "./search"

test("ranks exact title matches above generic content matches", () => {
  const documents = [
    {
      id: 1,
      title: "Remix UI Guide",
      slug: "remix-ui-guide",
      content: "A practical overview for building polished interfaces.",
    },
    {
      id: 2,
      title: "Deployment Tips",
      slug: "deployment-tips",
      content: "Remix works great when you ship with a solid rollout plan.",
    },
  ]

  const result = searchDocuments(documents, "remix ui", ["title", "content", "slug"])

  assert.equal(result[0]?.id, 1)
  assert.equal(result[1]?.id, 2)
})

test("matches terms case-insensitively across content", () => {
  const documents = [
    {
      id: 3,
      title: "Design Systems",
      slug: "design-systems",
      content: "A collection of reusable components and patterns.",
    },
  ]

  const result = searchDocuments(documents, "DESIGN", ["title", "content", "slug"])

  assert.equal(result[0]?.id, 3)
})

test("matches usernames and full names for user search", () => {
  const documents = [
    {
      id: 4,
      username: "example-user",
      fullname: "Example Person",
    },
  ]

  const result = searchDocuments(documents, "example", ["username", "fullname"])

  assert.equal(result[0]?.id, 4)
})
