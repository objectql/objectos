import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "ObjectOS",
  description: "A Unified Data Management Framework",
  
  // Scans the docs directory
  srcDir: '.',

  // Ignore dead links from merged documentation
  ignoreDeadLinks: true,

  themeConfig: {
    logo: '/logo.svg',
    // Top Navigation
    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'Specifications', link: '/spec/' },
    ],

    // Sidebar Configuration
    sidebar: {
      // Sidebar for Guide section
      '/guide/': [
        {
          text: 'Architecture Overview',
          items: [
            { text: 'Architecture Diagram', link: '/guide/architecture' },
            { text: 'Platform Components', link: '/guide/platform-components' }
          ]
        },
        {
          text: 'Getting Started',
          items: [
            { text: 'Introduction', link: '/guide/' },
            { text: 'Data Modeling', link: '/guide/data-modeling' },
            { text: 'Security Guide', link: '/guide/security-guide' }
          ]
        },
        {
          text: 'Server-Side Logic',
          items: [
            { text: 'SDK Reference', link: '/guide/sdk-reference' },
            { text: 'Writing Hooks', link: '/guide/logic-hooks' },
            { text: 'Custom Actions', link: '/guide/logic-actions' }
          ]
        },
        {
          text: 'User Interface',
          items: [
            { text: 'UI Framework Overview', link: '/guide/ui-framework' }
          ]
        }
      ],

      // Sidebar for Spec section
      '/spec/': [
        {
          text: 'Protocol Specifications',
          items: [
            { text: 'Overview', link: '/spec/' },
            { text: 'Metadata Format', link: '/spec/metadata-format' },
            { text: 'Query Language', link: '/spec/query-language' },
            { text: 'HTTP Protocol', link: '/spec/http-protocol' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/objectql/objectql' }
    ],

    footer: {
      message: 'Released under the PolyForm Shield License 1.0.0.',
      copyright: 'Copyright © 2026 ObjectOS'
    }
  }
})
