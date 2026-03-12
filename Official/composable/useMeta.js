export const useMeta = (meta) => {
  const { title, description, url } = meta

  useHead(() => ({
    title: title,
    meta: [
      {
        property: 'og:title',
        itemprop: 'name',
        content: title,
      },
      {
        name: 'description',
        property: 'og:description',
        itemprop: 'description',
        content: description,
      },
      {
        property: 'og:url',
        itemprop: 'url',
        content: url.href,
      },
    ],
    link: [
      {
        rel: 'canonical',
        href: url.href,
      },
    ],
  }))
}
