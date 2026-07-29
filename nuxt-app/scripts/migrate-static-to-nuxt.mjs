import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const nuxtRoot = resolve(scriptDir, '..')
const staticRoot = resolve(nuxtRoot, '..')

function read(relativePath) {
  return readFileSync(resolve(staticRoot, relativePath), 'utf8')
}

function write(relativePath, contents) {
  const target = resolve(nuxtRoot, relativePath)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, contents)
}

function syncPublicAssets() {
  cpSync(resolve(staticRoot, 'assets'), resolve(nuxtRoot, 'public/assets'), {
    recursive: true,
    force: true,
  })
}

function matchRequired(source, expression, label) {
  const match = source.match(expression)
  if (!match)
    throw new Error(`Could not extract ${label}`)
  return match[1]
}

function sourceParts(file) {
  const source = read(file)
  return {
    body: matchRequired(source, /<\/head>\s*<body[^>]*>([\s\S]*?)<\/body>/i, `${file} body`),
    styles: [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map(match => match[1]),
    scripts: [...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)]
      .map(match => match[1])
      .filter(script => script.trim().length > 100),
  }
}

function normaliseUrls(value) {
  return value
    .replaceAll('assets/', '/assets/')
    .replaceAll('cover_scifi.png', 'cover_scifi.jpg')
    .replaceAll('cover_history.png', 'cover_history.jpg')
    .replaceAll('cover_postapoc.png', 'cover_postapoc.jpg')
    .replaceAll('app.html', '/app')
    .replaceAll('index.html', '/')
    .replaceAll('interaction.html', '/interaction')
    .replaceAll("'sw.js'", "'/sw.js'")
}

function normaliseTemplate(value) {
  return normaliseUrls(value)
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/\s+onerror="[^"]*"/g, '')
}

function scopeSelector(selector, scope) {
  const trimmed = selector.trim()
  const leading = selector.slice(0, selector.length - selector.trimStart().length)
  const trailing = selector.slice(selector.trimEnd().length)
  const withoutLeadingComments = trimmed.replace(/^(?:\/\*[\s\S]*?\*\/\s*)+/, '')
  if (!trimmed)
    return selector
  if (/^(?:html|body|:root)\b/.test(withoutLeadingComments)) {
    const commentLength = trimmed.length - withoutLeadingComments.length
    return `${leading}${trimmed.slice(0, commentLength)}${withoutLeadingComments.replace(/^(?:html|body|:root)\b/, scope)}${trailing}`
  }
  if (withoutLeadingComments.startsWith(scope))
    return `${leading}${trimmed}${trailing}`
  if (trimmed.startsWith('*'))
    return `${leading}${scope}${trimmed.slice(1)}, ${scope} ${trimmed}${trailing}`
  return `${leading}${scope} ${trimmed}${trailing}`
}

function scopeCss(css, scope) {
  css = css.replace(/@import[^;]+;\s*/g, '')
  let output = ''
  let chunk = ''
  const stack = []

  for (const char of css) {
    if (char === '{') {
      const prelude = chunk
      const trimmed = prelude.trim()
      const withoutLeadingComments = trimmed.replace(/^(?:\/\*[\s\S]*?\*\/\s*)+/, '')
      chunk = ''
      if (withoutLeadingComments.startsWith('@')) {
        output += `${prelude}{`
        stack.push(/@(?:-[\w]+-)?keyframes\b/i.test(withoutLeadingComments) ? 'keyframes' : 'at-rule')
      }
      else if (stack.includes('keyframes')) {
        output += `${prelude}{`
        stack.push('rule')
      }
      else {
        output += `${prelude.split(',').map(selector => scopeSelector(selector, scope)).join(',')}{`
        stack.push('rule')
      }
    }
    else if (char === '}') {
      output += `${chunk}}`
      chunk = ''
      stack.pop()
    }
    else {
      chunk += char
    }
  }

  return output + chunk
}

function pageSource({ routeName, className, title, description, markup, css, runtime }) {
  return `<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'

const pageRoot = ref(null)
let dispose = () => {}

useSeoMeta({
  title: '${title}',
  description: '${description}',
})

onMounted(async () => {
  const { ${runtime} } = await import('~/legacy/${routeName}-runtime.client')
  dispose = ${runtime}(pageRoot.value) || dispose
})

onBeforeUnmount(() => dispose())
</script>

<template>
  <div ref="pageRoot" class="${className}">
${markup.trim()}
  </div>
</template>

<style>
${scopeCss(normaliseUrls(css), `.${className}`)}
</style>
`
}

function runtimeSource(name, script, { gsap = false, config = false } = {}) {
  const imports = [
    gsap ? "import { gsap } from 'gsap'" : '',
    config ? "import { installInteractionConfig } from './interaction-config.client'" : '',
  ].filter(Boolean).join('\n')
  const prepared = normaliseUrls(script)
    .replace('document.documentElement.classList.add(\'js\');', 'root?.classList.add(\'js\');')
    .replace(
      "const nav=document.getElementById('nav'), prog=document.getElementById('prog'), heroBg=document.getElementById('heroBg');",
      "const nav=document.getElementById('nav'), prog=document.getElementById('prog'), heroBg=document.getElementById('heroBg');\nconst heroParallax = heroBg ? gsap.quickTo(heroBg, 'y', { duration: 0.45, ease: 'power2.out' }) : null;",
    )
    .replace(
      "heroBg.style.transform='translateY('+(y*0.28)+'px)'",
      'heroParallax?.(y * 0.28)',
    )

  return `${imports}

export function mount${name}(root) {
  ${config ? 'installInteractionConfig();' : ''}
  ${gsap ? 'const context = gsap.context(() => {' : ''}
${prepared}
  ${gsap ? '}, root)\n  return () => context.revert()' : 'return () => {}'}
}
`
}

function interactionConfigSource(script) {
  return `export function installInteractionConfig() {
${normaliseUrls(script)}
  return window.FABULA_INTERACTION_CONFIG
}
`
}

const landing = sourceParts('index.html')
const hub = sourceParts('app.html')
const interaction = sourceParts('interaction.html')

syncPublicAssets()

write('app/pages/index.vue', pageSource({
  routeName: 'landing',
  className: 'landing-page',
  title: 'ФАБУЛА - интерактивные истории с ИИ',
  description: 'Текстовые приключения, где решения меняют канон.',
  markup: normaliseTemplate(landing.body),
  css: landing.styles.join('\n'),
  runtime: 'mountLandingRuntime',
}))

write('app/pages/app.vue', pageSource({
  routeName: 'hub',
  className: 'hub-page',
  title: 'ФАБУЛА - истории',
  description: 'Выберите мир и продолжите историю.',
  markup: normaliseTemplate(hub.body),
  css: hub.styles.join('\n'),
  runtime: 'mountHubRuntime',
}))

write('app/pages/interaction.vue', pageSource({
  routeName: 'interaction',
  className: 'interaction-page',
  title: 'ФАБУЛА - сцена',
  description: 'Интерактивная сцена ФАБУЛЫ.',
  markup: normaliseTemplate(interaction.body),
  css: read('interaction.css'),
  runtime: 'mountInteractionRuntime',
}))

write('app/legacy/landing-runtime.client.js', runtimeSource('LandingRuntime', landing.scripts.join('\n'), { gsap: true }))
write('app/legacy/hub-runtime.client.js', runtimeSource('HubRuntime', hub.scripts.join('\n')))
write('app/legacy/interaction-config.client.js', interactionConfigSource(read('interaction-config.js')))
write('app/legacy/interaction-runtime.client.js', runtimeSource('InteractionRuntime', read('interaction.js'), { config: true }))
