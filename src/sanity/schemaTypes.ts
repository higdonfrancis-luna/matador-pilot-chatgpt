import {defineArrayMember, defineField, defineType} from 'sanity'

const webSchemes = ['http', 'https']
const linkSchemes = ['http', 'https', 'mailto', 'tel']

const portableTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    {title: 'Paragraph', value: 'normal'},
    {title: 'Heading', value: 'h2'},
    {title: 'Subheading', value: 'h3'},
    {title: 'Quote', value: 'blockquote'},
  ],
  lists: [{title: 'Bullets', value: 'bullet'}, {title: 'Numbered', value: 'number'}],
  marks: {
    decorators: [{title: 'Bold', value: 'strong'}, {title: 'Italic', value: 'em'}],
    annotations: [
      {
        name: 'link',
        title: 'Link',
        type: 'object',
        fields: [
          defineField({
            name: 'href',
            title: 'Destination',
            type: 'url',
            description: 'A website URL, page path, #anchor, email link, or phone link.',
            validation: (rule) => rule.required().uri({scheme: linkSchemes, allowRelative: true}),
          }),
        ],
      },
    ],
  },
})

const imageField = (name: string, title: string) => defineField({
  name,
  title,
  type: 'image',
  description: 'Upload a replacement here. An uploaded image takes precedence over its original-site URL.',
  options: {hotspot: true},
  fields: [
    defineField({
      name: 'alt',
      title: 'Alternative text',
      type: 'string',
      description: 'Describe what this image communicates for someone who cannot see it.',
      validation: (rule) => rule.required(),
    }),
  ],
})

const webUrlField = (name: string, title: string, description?: string) => defineField({
  name,
  title,
  type: 'url',
  description,
  validation: (rule) => rule.uri({scheme: webSchemes, allowRelative: false}),
})

const originalImageDescription = 'Original public website asset, used until an image is uploaded above.'

const references = (name: string, title: string, type: string, description: string) => defineField({
  name,
  title,
  type: 'array',
  group: 'carousels',
  description,
  of: [defineArrayMember({type: 'reference', to: [{type}]})],
  validation: (rule) => rule.unique(),
})

export const contentBlock = defineType({
  name: 'contentBlock',
  title: 'Editable copy',
  type: 'object',
  fields: [
    defineField({name: 'label', title: 'Editor label', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'key',
      title: 'Page location',
      type: 'string',
      description: 'Connects this field to the page. Set during migration; do not change it.',
      readOnly: true,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'kind', title: 'Content format', type: 'string',
      description: 'Keep the imported format so the page continues to render this content correctly.',
      readOnly: true,
      options: {list: [{title: 'Plain text', value: 'text'}, {title: 'Formatted text', value: 'richText'}, {title: 'Link', value: 'link'}]},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'text', title: 'Text', type: 'text', rows: 3,
      hidden: ({parent}) => parent?.kind === 'richText',
      validation: (rule) => rule.custom((value, context) => {
        const parent = context.parent as {kind?: string} | undefined
        return parent?.kind !== 'richText' && !value?.trim() ? 'Enter the displayed text.' : true
      }),
    }),
    defineField({
      name: 'body', title: 'Formatted text', type: 'array', of: [portableTextBlock],
      hidden: ({parent}) => parent?.kind !== 'richText',
      validation: (rule) => rule.custom((value, context) => {
        const parent = context.parent as {kind?: string} | undefined
        return parent?.kind === 'richText' && !value?.length ? 'Enter the displayed content.' : true
      }),
    }),
    defineField({
      name: 'href', title: 'Link destination', type: 'url',
      description: 'A website URL, page path, #anchor, email link, or phone link.',
      hidden: ({parent}) => parent?.kind !== 'link',
      validation: (rule) => rule.uri({scheme: linkSchemes, allowRelative: true}).custom((value, context) => {
        const parent = context.parent as {kind?: string} | undefined
        return parent?.kind === 'link' && !value ? 'Enter a link destination.' : true
      }),
    }),
  ],
  preview: {select: {title: 'label', subtitle: 'kind'}},
})

export const section = defineType({
  name: 'homeSection',
  title: 'Page section',
  type: 'object',
  fields: [
    defineField({name: 'title', title: 'Section label', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'blocks', title: 'Section content', type: 'array',
      description: 'Edit the existing copy and links. Page locations preserve the pilot’s current design.',
      of: [defineArrayMember({type: 'contentBlock'})],
      validation: (rule) => rule.required().min(1),
    }),
  ],
  preview: {select: {title: 'title'}},
})

export const homePage = defineType({
  name: 'homePage',
  title: 'Homepage',
  type: 'document',
  groups: [
    {name: 'copy', title: 'Page copy', default: true},
    {name: 'carousels', title: 'Carousels & logos'},
    {name: 'seo', title: 'Search appearance'},
  ],
  initialValue: {title: 'Matador Solutions homepage'},
  fields: [
    defineField({name: 'title', title: 'Internal title', type: 'string', group: 'copy', validation: (rule) => rule.required()}),
    defineField({name: 'heroTitle', title: 'Main headline', type: 'string', group: 'copy', validation: (rule) => rule.required()}),
    defineField({name: 'heroBody', title: 'Introductory copy', type: 'array', group: 'copy', of: [portableTextBlock], validation: (rule) => rule.required().min(1)}),
    defineField({
      name: 'sections', title: 'Page sections', type: 'array', group: 'copy',
      description: 'Edit copy within each section. Section order and layout are maintained in the pilot frontend.',
      of: [defineArrayMember({type: 'homeSection'})],
    }),
    references('heroTestimonials', 'Hero testimonials', 'testimonial', 'Testimonials beside the main headline. Drag to change their order.'),
    references('memberVideos', 'Member Q&A videos', 'memberVideo', 'Videos in the member Q&A carousel. Drag to change their order.'),
    references('caseStudies', 'Case studies', 'caseStudy', 'Case studies shown on the homepage. Drag to change their order.'),
    references('firmExperiences', 'What firms are saying', 'testimonial', 'Testimonials in the central testimonial carousel.'),
    references('clientLogos', 'Client logos', 'logo', 'Client logos in the continuously scrolling strip.'),
    references('resources', 'Guides & resources', 'resource', 'Cards in the resources carousel. Drag to change their order.'),
    references('footerTestimonials', 'Footer testimonials', 'testimonial', 'Testimonials near the bottom of the page.'),
    references('pressLogos', 'Featured-on logos', 'logo', 'Publication logos used in the featured-on strips.'),
    defineField({
      name: 'seoTitle', title: 'Search title', type: 'string', group: 'seo',
      validation: (rule) => [rule.required(), rule.max(70).warning('Aim for a search title of 70 characters or fewer.')],
    }),
    defineField({
      name: 'seoDescription', title: 'Search description', type: 'text', rows: 3, group: 'seo',
      validation: (rule) => [rule.required(), rule.max(170).warning('Aim for a search description of 170 characters or fewer.')],
    }),
  ],
  preview: {
    select: {title: 'title', subtitle: 'heroTitle'},
    prepare: ({title, subtitle}) => ({title: title || 'Matador Solutions homepage', subtitle}),
  },
})

export const testimonial = defineType({
  name: 'testimonial', title: 'Testimonial', type: 'document',
  fields: [
    defineField({name: 'name', title: 'Person’s name', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'firm', title: 'Law firm', type: 'string'}),
    defineField({name: 'quote', title: 'Testimonial quote', type: 'text', rows: 6, validation: (rule) => rule.required()}),
    imageField('logo', 'Firm logo'),
    webUrlField('logoUrl', 'Original firm logo URL', originalImageDescription),
    imageField('photo', 'Portrait'),
    webUrlField('photoUrl', 'Original portrait URL', originalImageDescription),
  ],
  preview: {select: {title: 'name', subtitle: 'firm', media: 'photo'}},
})

export const memberVideo = defineType({
  name: 'memberVideo', title: 'Member video', type: 'document',
  fields: [
    defineField({name: 'firmName', title: 'Law firm', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'practiceArea', title: 'Practice area', type: 'string'}),
    defineField({name: 'quote', title: 'Featured quote', type: 'text', rows: 4}),
    defineField({name: 'reviewer', title: 'Speaker’s name', type: 'string'}),
    defineField({
      name: 'youtubeUrl', title: 'YouTube video URL', type: 'url',
      description: 'Use a youtube.com or youtu.be video URL.',
      validation: (rule) => rule.required().uri({scheme: webSchemes, allowRelative: false}).custom((value) => {
        if (!value) return true
        try {
          const host = new URL(value).hostname.toLowerCase()
          return ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com', 'youtube-nocookie.com'].includes(host) || 'Use a YouTube video URL.'
        } catch { return 'Enter a valid YouTube URL.' }
      }),
    }),
    imageField('thumbnail', 'Video thumbnail'),
    webUrlField('thumbnailUrl', 'Original thumbnail URL', originalImageDescription),
    webUrlField('sourceUrl', 'Original page URL'),
  ],
  preview: {select: {title: 'firmName', subtitle: 'practiceArea', media: 'thumbnail'}},
})

export const caseStudy = defineType({
  name: 'caseStudy', title: 'Case study', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Case study title', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'URL slug', type: 'slug', options: {source: 'title', maxLength: 96}, validation: (rule) => rule.required()}),
    defineField({name: 'metric', title: 'Headline result', type: 'string', description: 'For example, the growth percentage displayed on the card.'}),
    defineField({name: 'summary', title: 'Summary', type: 'text', rows: 4}),
    defineField({name: 'services', title: 'Services', type: 'array', of: [defineArrayMember({type: 'string'})], options: {layout: 'tags'}, validation: (rule) => rule.unique()}),
    imageField('image', 'Case study image'),
    webUrlField('imageUrl', 'Original image URL', originalImageDescription),
    webUrlField('sourceUrl', 'Case study destination', 'Public case study URL used by the homepage card.'),
  ],
  preview: {select: {title: 'title', subtitle: 'metric', media: 'image'}},
})

export const resource = defineType({
  name: 'resource', title: 'Resource', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Resource title', type: 'string', validation: (rule) => rule.required()}),
    imageField('image', 'Card image'),
    webUrlField('imageUrl', 'Original image URL', originalImageDescription),
    webUrlField('sourceUrl', 'Resource destination', 'Public URL opened by the resource card.'),
  ],
  preview: {select: {title: 'title', subtitle: 'sourceUrl', media: 'image'}},
})

export const logo = defineType({
  name: 'logo', title: 'Logo', type: 'document',
  fields: [
    defineField({name: 'title', title: 'Organization name', type: 'string', validation: (rule) => rule.required()}),
    defineField({
      name: 'category', title: 'Logo category', type: 'string',
      options: {list: [{title: 'Client', value: 'client'}, {title: 'Press / featured on', value: 'press'}], layout: 'radio'},
      validation: (rule) => rule.required(),
    }),
    imageField('image', 'Logo image'),
    webUrlField('imageUrl', 'Original logo URL', originalImageDescription),
    defineField({name: 'alt', title: 'Alternative text', type: 'string', description: 'Usually the organization name.', validation: (rule) => rule.required()}),
  ],
  preview: {
    select: {title: 'title', category: 'category', media: 'image'},
    prepare: ({title, category, media}) => ({title, subtitle: category === 'press' ? 'Press / featured on' : 'Client', media}),
  },
})

export const schemaTypes = [contentBlock, section, homePage, testimonial, memberVideo, caseStudy, resource, logo]
