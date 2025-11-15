import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

const config: Config = {
  title: "Documentation",
  tagline: "Comprehensive documentation for our SaaS platform",
  favicon: "img/favicon.ico",

  // Set the production url of your site here
  url: "https://document.softprobe.ai",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "Softprobe.ai", // Usually your GitHub org/user name.
  projectName: "document-website", // Usually your repo name.

  onBrokenLinks: "warn",
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: "warn",
    },
  },

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en", "zh"],
    localeConfigs: {
      en: {
        label: "English",
        direction: "ltr",
        htmlLang: "en-US",
        calendar: "gregory",
      },
      zh: {
        label: "中文",
        direction: "ltr",
        htmlLang: "zh-CN",
        calendar: "gregory",
      },
    },
  },

  presets: [
    [
      "@docusaurus/preset-classic",
      {
        docs: {
          routeBasePath: "/", // Serve the docs at the site's root
          sidebarPath: "./sidebars.ts",
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          // editUrl:
          //   'https://github.com/your-org/document-website/tree/main/',
        },
        blog: false, // Optional: disable the blog plugin
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Replace with your project's social card
    image: "img/docusaurus-social-card.jpg",
    navbar: {
      title: "Softprobe Documentation",
      logo: {
        alt: "Documentation Logo",
        src: "img/sp-logo-trans.ico",
      },
      items: [
        {
          type: "localeDropdown",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Docs",
          items: [
            {
              label: "Installation",
              to: "/deployment/installation",
            },
            // {
            //   label: "Architecture",
            //   to: "/architecture",
            // },
            // {
            //   label: "Development",
            //   to: "/deployment/development",
            // },
          ],
        },
        {
          title: "Community",
          items: [
            // {
            //   label: "Stack Overflow",
            //   href: "https://stackoverflow.com/questions/tagged/docusaurus",
            // },
            // {
            //   label: "Discord",
            //   href: "https://discordapp.com/invite/docusaurus",
            // },
            {
              label: "Twitter",
              href: "https://x.com/softprobeai",
            },
          ],
        },
        {
          title: "More",
          items: [
            {
              label: "Istio GitHub",
              href: "https://github.com/softprobe/softprobe",
            },
            {
              label: "Web SDK GitHub",
              href: "https://github.com/softprobe/web-inspector",
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Documentation. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
    colorMode: {
      defaultMode: "light",
      disableSwitch: false,
      respectPrefersColorScheme: true,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
