'use client'
import { useEffect, useMemo, useState } from 'react'
import Particles, { initParticlesEngine } from '@tsparticles/react'
import {
  type Container,
  type ISourceOptions,
  MoveDirection,
  OutMode,
} from '@tsparticles/engine'
import { loadAll } from '@tsparticles/all'

type StarBackgroundProps = {
  id: string
}

export const SectionBackground = ({ id }: StarBackgroundProps) => {
  const [init, setInit] = useState(false)

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadAll(engine)
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
          value: '#ffb0ff',
        },
        move: {
          direction: MoveDirection.none,
          enable: true,
          outModes: {
            default: OutMode.out,
          },
          random: false,
          speed: { min: 0.1, max: 0.3 },
          straight: false,
        },
        number: {
          density: {
            enable: true,
          },
          value: 200,
        },
        opacity: {
          value: {
            min: 0.1,
            max: 1,
          },
        },
        shape: {
          type: 'circle',
          close: true,
          fill: true,
        },
        size: {
          value: { min: 1, max: 6 },
        },
      },
      shadow: {
        blur: 6,
        color: {
          value: '#ff5fff',
        },
        enable: true,
        offset: {
          x: 0,
          y: 0,
        },
      },

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
