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
        gsap.set('[data-reveal], [data-landing-title-line], [data-landing-lede], [data-landing-cta]', {
          clearProps: 'all',
          opacity: 1,
          y: 0,
        })
        return
      }

      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from('[data-landing-title-line]', { yPercent: 115, duration: 1.05, stagger: 0.1 })
        .from('[data-landing-lede]', { opacity: 0, y: 24, duration: 0.7 }, '-=.55')
        .from('[data-landing-cta]', { opacity: 0, y: 18, duration: 0.65 }, '-=.5')

      const heroVideo = host.querySelector<HTMLVideoElement>('[data-hero-background] video')
      if (heroVideo)
        gsap.fromTo(heroVideo, { scale: 1.02 }, { scale: 1.09, duration: 26, ease: 'sine.inOut', repeat: -1, yoyo: true })

      const dust = [...host.querySelectorAll<HTMLElement>('[data-dust] i')]
      for (const particle of dust) {
        gsap.set(particle, {
          left: `${gsap.utils.random(5, 95)}%`,
          top: `${gsap.utils.random(30, 105)}%`,
          scale: gsap.utils.random(0.6, 1.25),
        })
        gsap.to(particle, {
          y: () => -window.innerHeight * gsap.utils.random(0.55, 0.95),
          x: () => gsap.utils.random(-30, 30),
          opacity: gsap.utils.random(0.2, 0.55),
          duration: gsap.utils.random(8, 18),
          delay: gsap.utils.random(0, 8),
          ease: 'none',
          repeat: -1,
          repeatRefresh: true,
        })
      }
    }, host)

    const revealElements = [...host.querySelectorAll<HTMLElement>('[data-reveal]')]
    if (!reducedMotion && 'IntersectionObserver' in window) {
      gsap.set(revealElements, { opacity: 0, y: 28 })
      const revealObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting)
            continue
          revealObserver.unobserve(entry.target)
          context.add(() => {
            gsap.to(entry.target, {
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
      gsap.set(revealElements, { opacity: 1, y: 0 })
    }

    const nav = host.querySelector<HTMLElement>('[data-landing-nav]')
    const progress = host.querySelector<HTMLElement>('[data-scroll-progress]')
    const heroBackground = host.querySelector<HTMLElement>('[data-hero-background]')
    const dock = host.querySelector<HTMLElement>('[data-landing-dock]')
    const final = host.querySelector<HTMLElement>('[data-final-cta]')
    const gameplay = host.querySelector<HTMLElement>('[data-gameplay]')
    const heroParallax = heroBackground && !reducedMotion
      ? gsap.quickTo(heroBackground, 'y', { duration: 0.45, ease: 'power2.out' })
      : null
    let frame = 0

    const syncScrollState = () => {
      const y = window.scrollY
      nav?.classList.toggle('is-scrolled', y > 40)
      const maximum = document.documentElement.scrollHeight - window.innerHeight
      if (progress)
        gsap.set(progress, { scaleX: maximum > 0 ? y / maximum : 0 })
      if (heroParallax && y < window.innerHeight * 1.2)
        heroParallax(y * 0.28)
      if (dock) {
        const atEnd = final && final.getBoundingClientRect().top < window.innerHeight * 0.9
        dock.classList.toggle('is-visible', y > window.innerHeight * 0.85 && !atEnd)
      }
      if (gameplay && !reducedMotion) {
        const rect = gameplay.getBoundingClientRect()
        const progress = Math.min(1, Math.max(0, 1 - (rect.top - window.innerHeight * 0.32) / (window.innerHeight * 0.68)))
        gsap.set(gameplay, {
          '--tilt': `${(11 * (1 - progress)).toFixed(2)}deg`,
          '--scale': (0.94 + 0.06 * progress).toFixed(3),
        })
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

    const pointerCards = [...host.querySelectorAll<HTMLElement>('[data-pointer-card], [data-tilt-card], [data-final-cta]')]
    if (!reducedMotion && window.matchMedia('(hover:hover)').matches) {
      for (const card of pointerCards) {
        const onPointerMove = (event: PointerEvent) => {
          const rect = card.getBoundingClientRect()
          const x = (event.clientX - rect.left) / rect.width
          const y = (event.clientY - rect.top) / rect.height
          card.style.setProperty('--mx', `${x * 100}%`)
          card.style.setProperty('--my', `${y * 100}%`)
          if (card.matches('[data-tilt-card]')) {
            gsap.to(card, {
              rotateY: (x - 0.5) * 7,
              rotateX: (0.5 - y) * 7,
              y: -8,
              duration: 0.35,
              ease: 'power2.out',
              overwrite: 'auto',
            })
          }
        }
        const onPointerLeave = () => {
          if (card.matches('[data-tilt-card]'))
            gsap.to(card, { rotateX: 0, rotateY: 0, y: 0, duration: 0.55, ease: 'power3.out', overwrite: 'auto' })
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
    const readyListeners = new Map<HTMLVideoElement, () => void>()
    for (const video of videos) {
      const markReady = () => video.dataset.ready = 'true'
      video.addEventListener('canplay', markReady)
      readyListeners.set(video, markReady)
    }
    cleanups.push(() => {
      for (const [video, listener] of readyListeners)
        video.removeEventListener('canplay', listener)
    })

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
