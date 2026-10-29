<script setup>
import DefaultTheme from 'vitepress/theme'
import { useData } from 'vitepress'
const { frontmatter } = useData()
</script>

<template>
  <DefaultTheme.Layout>
    <template #nav-bar-title-after>
      <span class="brand-caption">на русском</span>
    </template>
    <template #doc-before>
      <div class="edition"><span>ДОКУМЕНТАЦИЯ</span><span class="edition-version">Версия 3.1</span></div>
    </template>
    <template #doc-footer-before>
      <div class="translation-note">
        <span>Перевод — <a href="https://github.com/guitaristdave" target="_blank" rel="noopener noreferrer">David Akunts</a></span>
        <a v-if="frontmatter.sourcePath" :href="`https://hyperf.wiki/3.1/#/${frontmatter.sourcePath}`" target="_blank" rel="noopener noreferrer">Эта статья в оригинале ↗</a>
      </div>
    </template>
  </DefaultTheme.Layout>
</template>
