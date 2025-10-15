import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [
    'index',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/installation', 'getting-started/configuration'],
    },
    {
      type: 'category',
      label: 'API Reference',
      items: ['api/authentication', 'api/endpoints', 'api/errors'],
    },
    {
      type: 'category',
      label: 'Guides',
      items: ['guides/webhooks', 'guides/analytics', 'guides/troubleshooting'],
    },
    'faq',
  ],
};

export default sidebars;
