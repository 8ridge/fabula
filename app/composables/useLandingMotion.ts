import { gsap } from 'gsap'
import type { Ref } from 'vue'

export function useLandingMotion(root: Ref<HTMLElement | null>) {
  const cleanups: Array<() => void> = []

  onMounted(() => {
    const host = root.value
    if (!host)
      return

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const context = gsap.context(() => {
      if (reducedMotion) {
        gsap.set('.rv, h1 .l span, .lede, .hero-cta', {
          clearProps: 'all',
          opacity: 1,
          y: 0,
        })
        return
      }

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('h1 .l span', { yPercent: 115, duration: 1.05, stagger: 0.1 })
        .from('.lede', { opacity: 0, y: 24, duration: 0.7 }, '-=.55')
        .from('.hero-cta', { opacity: 0, y: 18, duration: 0.65 }, '-=.5')
    }, host)

    const revealElements = [...host.querySelectorAll<HTMLElement>('.rv')]
    if (!reducedMotion && 'IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting)
            continue
          revealObserver.unobserve(entry.target)
          context.add(() => {
            gsap.fromTo(entry.target, { opacity: 0, y: 28 }, {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: 'power3.out',
              clearProps: 'transform',
            })
          })
        }
      }, { threshold: 0.12 })
      revealElements.forEach(element => revealObserver.observe(element))
      cleanups.push(() => revealObserver.disconnect())
    }
    else {
      revealElements.forEach(element => element.classList.add('in'))
    }

    const nav = host.querySelector<HTMLElement>('#nav')
    const progress = host.querySelector<HTMLElement>('#prog')
    const heroBackground = host.querySelector<HTMLElement>('#heroBg')
    const dock = host.querySelector<HTMLElement>('#dock')
    const final = host.querySelector<HTMLElement>('#final')
    const stage = host.querySelector<HTMLElement>('#stage')
    const gameplay = host.querySelector<HTMLElement>('#gp')
    const heroParallax = heroBackground && !reducedMotion
      ? gsap.quickTo(heroBackground, 'y', { duration: 0.45, ease: 'power2.out' })
      : null
    let frame = 0

    const syncScrollState = () => {
      const y = window.scrollY
      nav?.classList.toggle('scrolled', y > 40)
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (progress)
        progress.style.width = `${max > 0 ? y / max * 100 : 0}%`
      if (heroParallax && y < window.innerHeight * 1.2)
        heroParallax(y * 0.28)
      if (dock) {
        const atEnd = final && final.getBoundingClientRect().top < window.innerHeight * 0.9
        dock.classList.toggle('on', y > window.innerHeight * 0.85 && !atEnd)
      }
      for (const element of [stage, gameplay]) {
        if (!element || reducedMotion)
          continue
        const rect = element.getBoundingClientRect()
        const progress = Math.min(1, Math.max(0, 1 - (rect.top - window.innerHeight * 0.32) / (window.innerHeight * 0.68)))
        const maximumTilt = element === stage ? 22 : 11
        element.style.setProperty('--tilt', `${(maximumTilt * (1 - progress)).toFixed(2)}deg`)
        element.style.setProperty('--sc', `${(0.93 + 0.07 * progress).toFixed(3)}`)
      }
    }
    const onScroll = () => {
      if (frame)
        return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        syncScrollState()
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    syncScrollState()
    cleanups.push(() => {
      window.removeEventListener('scroll', onScroll)
      if (frame)
        window.cancelAnimationFrame(frame)
    })

    const pointerCards = [...host.querySelectorAll<HTMLElement>('.pack, .feat, .tier, .once')]
    if (!reducedMotion && window.matchMedia('(hover:hover)').matches) {
      for (const card of pointerCards) {
        card.classList.add('spot')
        const onPointerMove = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect()
          const x = (event.clientX - rect.left) / rect.width
          const y = (event.clientY - rect.top) / rect.height
          card.style.setProperty('--mx', `${x * 100}%`)
          card.style.setProperty('--my', `${y * 100}%`)
          if (card.classList.contains('pack')) {
            card.style.setProperty('--ry', `${((x - 0.5) * 7).toFixed(2)}deg`)
            card.style.setProperty('--rx', `${((0.5 - y) * 7).toFixed(2)}deg`)
          }
        }
        const onPointerLeave = () => {
          card.style.setProperty('--rx', '0deg')
          card.style.setProperty('--ry', '0deg')
        }
        card.addEventListener('pointermove', onPointerMove)
        card.addEventListener('pointerleave', onPointerLeave)
        cleanups.push(() => {
          card.removeEventListener('pointermove', onPointerMove)
          card.removeEventListener('pointerleave', onPointerLeave)
        })
      }
    }

    const videos = [...host.querySelectorAll<HTMLVideoElement>('video[data-src]')]
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
    if (!reducedMotion && !saveData) {
      const loadVideo = (video: HTMLVideoElement) => {
        if (!video.src) {
          video.src = video.dataset.src || ''
          video.load()
        }
        void video.play().catch(() => undefined)
      }
      if ('IntersectionObserver' in window) {
        const videoObserver = new IntersectionObserver((entries) => {
          for (const entry of entries) {
            const video = entry.target as HTMLVideoElement
            if (entry.isIntersecting)
              loadVideo(video)
            else
              video.pause()
          }
        }, { rootMargin: '300px', threshold: 0.05 })
        videos.forEach(video => videoObserver.observe(video))
        cleanups.push(() => videoObserver.disconnect())
      }
      else {
        videos.forEach(loadVideo)
      }
    }

    cleanups.push(() => context.revert())
  })

  onBeforeUnmount(() => {
    while (cleanups.length)
      cleanups.pop()?.()
  })
}
