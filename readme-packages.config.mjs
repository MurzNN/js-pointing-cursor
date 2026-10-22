/** @type {{ repoUrl: string, packages: Array<{ id: string, name: string, dir: string, title: string, blurb: string, homepage: string }> }} */
export default {
  repoUrl: 'https://github.com/MurzNN/js-pointing-cursor',
  packages: [
    {
      id: 'vue',
      name: 'vue-pointing-cursor',
      dir: 'packages/vue',
      title: 'vue-pointing-cursor',
      blurb:
        'Vue 3 oversized pointing cursor with curved motion, follow mode, and click burst.',
      homepage: 'https://murznn.github.io/js-pointing-cursor/vue/',
    },
    {
      id: 'react',
      name: 'react-pointing-cursor',
      dir: 'packages/react',
      title: 'react-pointing-cursor',
      blurb:
        'React oversized pointing cursor with curved motion, follow mode, and click burst.',
      homepage: 'https://murznn.github.io/js-pointing-cursor/react/',
    },
  ],
}