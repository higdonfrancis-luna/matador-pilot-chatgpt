import type {StructureResolver} from 'sanity/structure'

export const singletonTypes = new Set(['homePage'])

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Matador content')
    .items([
      S.listItem()
        .id('homePage')
        .title('Homepage')
        .child(S.document().schemaType('homePage').documentId('homePage').title('Homepage')),
      S.divider(),
      S.documentTypeListItem('testimonial').title('Testimonials'),
      S.documentTypeListItem('memberVideo').title('Member videos'),
      S.documentTypeListItem('caseStudy').title('Case studies'),
      S.documentTypeListItem('resource').title('Resources'),
      S.documentTypeListItem('logo').title('Logos'),
    ])
