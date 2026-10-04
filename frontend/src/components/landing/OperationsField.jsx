import { useEffect, useRef } from 'react'

const OperationsField = () => {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    let disposed = false
    let frameId
    let cleanup = () => {}

    const initialise = async () => {
      const THREE = await import('three')
      if (disposed || !hostRef.current) return

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const scene = new THREE.Scene()
      scene.fog = new THREE.FogExp2(0x020617, 0.075)

      const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100)
      camera.position.set(0, 0.25, 9)

      const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' })
      renderer.setClearColor(0x020617, 0)
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.domElement.setAttribute('aria-hidden', 'true')
      host.appendChild(renderer.domElement)

      const world = new THREE.Group()
      scene.add(world)

      const particleCount = window.innerWidth < 768 ? 420 : 780
      const particlePositions = new Float32Array(particleCount * 3)
      const particleColors = new Float32Array(particleCount * 3)
      const emerald = new THREE.Color(0x34d399)
      const blue = new THREE.Color(0x93c5fd)

      for (let index = 0; index < particleCount; index += 1) {
        const radius = 2.3 + Math.random() * 5.8
        const angle = Math.random() * Math.PI * 2
        const depth = (Math.random() - 0.5) * 7
        particlePositions[index * 3] = Math.cos(angle) * radius
        particlePositions[index * 3 + 1] = Math.sin(angle) * radius * 0.54
        particlePositions[index * 3 + 2] = depth

        const colour = Math.random() > 0.76 ? blue : emerald
        const intensity = 0.35 + Math.random() * 0.65
        particleColors[index * 3] = colour.r * intensity
        particleColors[index * 3 + 1] = colour.g * intensity
        particleColors[index * 3 + 2] = colour.b * intensity
      }

      const particleGeometry = new THREE.BufferGeometry()
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3))
      particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))
      const particleMaterial = new THREE.PointsMaterial({
        size: 0.026,
        transparent: true,
        opacity: 0.72,
        vertexColors: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const particles = new THREE.Points(particleGeometry, particleMaterial)
      world.add(particles)

      const pathPoints = [
        new THREE.Vector3(-3.6, 1.35, 0.2),
        new THREE.Vector3(-1.8, -0.7, -0.2),
        new THREE.Vector3(0, 0.55, 0.1),
        new THREE.Vector3(1.8, -0.9, -0.1),
        new THREE.Vector3(3.6, 1.1, 0.15),
      ]
      const curve = new THREE.CatmullRomCurve3(pathPoints)
      const lineGeometry = new THREE.BufferGeometry().setFromPoints(curve.getPoints(100))
      const lineMaterial = new THREE.LineBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.42 })
      world.add(new THREE.Line(lineGeometry, lineMaterial))

      const nodeGeometry = new THREE.IcosahedronGeometry(0.1, 2)
      const nodeMaterial = new THREE.MeshBasicMaterial({ color: 0xa7f3d0 })
      const nodes = pathPoints.map((point, index) => {
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial)
        node.position.copy(point)
        node.scale.setScalar(index === 2 ? 1.55 : 1)
        world.add(node)
        return node
      })

      const tracer = new THREE.Mesh(
        new THREE.SphereGeometry(0.075, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xffffff }),
      )
      world.add(tracer)

      const pointer = { x: 0, y: 0 }
      let scrollProgress = 0
      let visible = !document.hidden
      const timer = new THREE.Timer()
      timer.connect(document)

      const resize = () => {
        const { clientWidth, clientHeight } = host
        if (!clientWidth || !clientHeight) return
        renderer.setSize(clientWidth, clientHeight, false)
        camera.aspect = clientWidth / clientHeight
        camera.updateProjectionMatrix()
        renderer.render(scene, camera)
      }

      const onPointerMove = (event) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2
      }

      const onScroll = () => {
        const range = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1)
        scrollProgress = THREE.MathUtils.clamp(window.scrollY / range, 0, 1)
      }

      const onVisibilityChange = () => {
        visible = !document.hidden
      }

      const onContextLost = (event) => event.preventDefault()
      const onContextRestored = () => resize()

      const render = (timestamp) => {
        if (disposed) return
        if (visible) {
          timer.update(timestamp)
          const elapsed = timer.getElapsed()
          const nextTravel = reduceMotion ? 0.45 : (elapsed * 0.055 + scrollProgress * 0.8) % 1
          const travel = Number.isFinite(nextTravel) ? THREE.MathUtils.clamp(nextTravel, 0, 0.9999) : 0.45
          tracer.position.copy(curve.getPointAt(travel))
          particles.rotation.z = reduceMotion ? 0.08 : elapsed * 0.012 + scrollProgress * 0.32
          particles.rotation.y = reduceMotion ? -0.08 : elapsed * 0.008
          world.rotation.x += ((-pointer.y * 0.055) - world.rotation.x) * 0.025
          world.rotation.y += ((pointer.x * 0.08 + scrollProgress * 0.24) - world.rotation.y) * 0.025
          nodes.forEach((node, index) => {
            const pulse = reduceMotion ? 1 : 1 + Math.sin(elapsed * 1.5 + index) * 0.18
            const base = index === 2 ? 1.55 : 1
            node.scale.setScalar(base * pulse)
          })
          camera.position.x += ((pointer.x * 0.16) - camera.position.x) * 0.02
          camera.position.y += ((0.25 - pointer.y * 0.1) - camera.position.y) * 0.02
          renderer.render(scene, camera)
        }
        if (!reduceMotion) frameId = window.requestAnimationFrame(render)
      }

      const resizeObserver = new ResizeObserver(resize)
      resizeObserver.observe(host)
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      window.addEventListener('scroll', onScroll, { passive: true })
      document.addEventListener('visibilitychange', onVisibilityChange)
      renderer.domElement.addEventListener('webglcontextlost', onContextLost)
      renderer.domElement.addEventListener('webglcontextrestored', onContextRestored)
      resize()
      onScroll()
      render(performance.now())

      cleanup = () => {
        resizeObserver.disconnect()
        window.removeEventListener('pointermove', onPointerMove)
        window.removeEventListener('scroll', onScroll)
        document.removeEventListener('visibilitychange', onVisibilityChange)
        renderer.domElement.removeEventListener('webglcontextlost', onContextLost)
        renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored)
        window.cancelAnimationFrame(frameId)
        particleGeometry.dispose()
        particleMaterial.dispose()
        lineGeometry.dispose()
        lineMaterial.dispose()
        nodeGeometry.dispose()
        nodeMaterial.dispose()
        tracer.geometry.dispose()
        tracer.material.dispose()
        timer.dispose()
        renderer.dispose()
        renderer.domElement.remove()
      }
    }

    initialise()

    return () => {
      disposed = true
      window.cancelAnimationFrame(frameId)
      cleanup()
    }
  }, [])

  return <div ref={hostRef} className="operations-field" aria-hidden="true" />
}

export default OperationsField
