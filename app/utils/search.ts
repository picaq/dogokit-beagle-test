export interface SearchableDocument {
  id: string | number
  title?: string | null
  slug?: string | null
  content?: string | null
  excerpt?: string | null
  [key: string]: unknown
}

const normalize = (value: string | null | undefined) =>
  (value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()

function tokenize(query: string) {
  return normalize(query)
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
}

export function searchDocuments<T extends SearchableDocument>(
  documents: T[],
  query: string,
  fields: Array<keyof T>,
) {
  const terms = tokenize(query)

  if (terms.length === 0) {
    return documents
  }

  return [...documents]
    .map(document => {
      const fieldScores = fields.map(field => {
        const value = normalize(document[field as keyof SearchableDocument] as string | null | undefined)

        if (!value) {
          return 0
        }

        let score = 0
        const haystack = value

        if (terms[0] && haystack.includes(terms[0])) {
          score += 30
        }

        for (const term of terms) {
          if (haystack.includes(term)) {
            score += 20
          }
        }

        if (field === "title") {
          score += 15
        }

        if (field === "slug") {
          score += 10
        }

        return score
      })

      const totalScore = fieldScores.reduce((sum, score) => sum + score, 0)

      return { document, score: totalScore }
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ document }) => document)
}
