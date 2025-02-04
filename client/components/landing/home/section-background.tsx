'use client'
import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import {
  type Container,
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from '@tsparticles/engine'
import { loadSlim } from '@tsparticles/slim'

type StarBackgroundProps = {
  id: string
}

export const SectionBackground = ({ id }: StarBackgroundProps) => {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine)
    }).then(() => {
      setInit(true)
    })
  }, [])

  const particlesLoaded = async (container?: Container): Promise<void> => {
    console.log(container)
  }

  const options: ISourceOptions = useMemo(
    () => ({
      fpsLimit: 120,
      interactivity: {
        events: {
          onHover: {
            enable: true,
            mode: 'bubble',
          },
        },
        modes: {
          bubble: {
            distance: 250,
            duration: 2,
            mix: false,
            opacity: 0,
            size: 0,
            divs: {
              distance: 200,
              duration: 0.4,
              mix: false,
            },
          },
        },
      },
      particles: {
        color: {
          value: '#ffffff',
        },
        move: {
          direction: MoveDirection.none,
          enable: true,
          outModes: {
            default: OutMode.none,
          },
          speed: { min: 0.1, max: 0.3 },
        },
        number: {
          value: 200,
        },
        opacity: {
          value: {
            min: 0.1,
            max: 1,
          },
        },
        size: {
          value: { min: 1, max: 5 },
        },
        shadow: {
          blur: 15,
          color: {
            value: '#FF00FF',
          },
          enable: true,
          offset: {
            x: 0,
            y: 0,
          },
        },
        shape: {
          type: 'circle',
          close: true,
          fill: true,
        },
        stroke: { width: 0 },
      },

      smooth: true,
      zLayers: 100,
      detectRetina: true,
      fullScreen: false,
      pauseOnOutsideViewport: true,
    }),
    [],
  )
  if (init) {
    return (
      <Particles
        id={id}
        particlesLoaded={particlesLoaded}
        options={options}
        className="absolute inset-0 z-0"
      />
    )
  }

  return <></>
}
