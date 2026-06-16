import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm'
import { createVRMAnimationClip, VRMAnimationLoaderPlugin } from '@pixiv/three-vrm-animation'
import type { VRM } from '@pixiv/three-vrm'
import type { VRMAnimation } from '@pixiv/three-vrm-animation'
import type { GLTF, GLTFLoader, GLTFLoaderPlugin } from 'three-stdlib'
import * as THREE from 'three'

const AVATAR_MODEL_PATH = '/ai-girl-1.vrm'
const AVATAR_ANIMATION_PATH = '/vrma/VRMA_01.vrma'

type VRMGLTF = GLTF & {
    userData: {
        vrm?: VRM
    }
}

type VRMAnimationGLTF = GLTF & {
    userData: {
        vrmAnimations?: VRMAnimation[]
    }
}

type MouthCue = {
    start: number
    end: number
    value: string
}

type VisemePayload = {
    mouthCues: MouthCue[]
}

type SpeakEventDetail = {
    audioUrl: string
    visemes: VisemePayload
}

// Mapping from Rhubarb visemes to VRM expression preset names.
const visemeExpressionMap: Record<string, string[]> = {
    A: ['aa'],
    B: ['ih'],
    C: ['ou'],
    D: ['ee'],
    E: ['oh'],
    F: ['ou'],
    G: ['ih'],
    H: ['ih'],
    X: []
}

const mouthExpressionNames = ['aa', 'ih', 'ou', 'ee', 'oh']
type VRMLoaderParser = ConstructorParameters<typeof VRMLoaderPlugin>[0]
type VRMAnimationLoaderParser = ConstructorParameters<typeof VRMAnimationLoaderPlugin>[0]

const extendVRMLoader = (loader: GLTFLoader) => {
    // three-vrm and Drei type GLTFLoader from different modules, but the runtime plugin API is the same.
    loader.register(
        (parser) => new VRMLoaderPlugin(parser as unknown as VRMLoaderParser) as unknown as GLTFLoaderPlugin
    )
}

const extendVRMAnimationLoader = (loader: GLTFLoader) => {
    // three-vrm-animation shares the same runtime plugin API with three-stdlib's GLTFLoader.
    loader.register(
        (parser) =>
            new VRMAnimationLoaderPlugin(parser as unknown as VRMAnimationLoaderParser) as unknown as GLTFLoaderPlugin
    )
}

export const Avatar = () => {
    const vrmGltf = useGLTF(AVATAR_MODEL_PATH, true, true, extendVRMLoader) as VRMGLTF
    const animationGltf = useGLTF(AVATAR_ANIMATION_PATH, true, true, extendVRMAnimationLoader) as VRMAnimationGLTF

    const vrm = vrmGltf.userData.vrm
    const vrmAnimation = animationGltf.userData.vrmAnimations?.[0]
    const avatarScene: THREE.Group = vrm?.scene ?? vrmGltf.scene
    const group = useRef<THREE.Group>(null)
    const mixerRef = useRef<THREE.AnimationMixer | null>(null)
    const normalizedVrmRef = useRef<VRM | null>(null)

    useEffect(() => {
        if (vrm && normalizedVrmRef.current !== vrm) {
            VRMUtils.rotateVRM0(vrm)
            normalizedVrmRef.current = vrm
        }
    }, [vrm])

    const vrmaClip = useMemo(() => {
        if (!vrm || !vrmAnimation) return null

        const clip = createVRMAnimationClip(vrmAnimation, vrm)
        clip.name = 'VRMA_01'
        return clip
    }, [vrm, vrmAnimation])

    useEffect(() => {
        if (!vrm || !vrmaClip) return

        const mixer = new THREE.AnimationMixer(vrm.scene)
        const action = mixer.clipAction(vrmaClip)

        action.reset().fadeIn(0.3).play()
        mixerRef.current = mixer

        return () => {
            action.stop()
            mixer.stopAllAction()
            mixer.uncacheClip(vrmaClip)
            mixer.uncacheRoot(vrm.scene)

            if (mixerRef.current === mixer) {
                mixerRef.current = null
            }
        }
    }, [vrm, vrmaClip])

    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
    const [visemes, setVisemes] = useState<VisemePayload | null>(null)

    // Audio Listener
    useEffect(() => {
        const handleSpeak = (event: Event) => {
            const { audioUrl, visemes: nextVisemes } = (event as CustomEvent<SpeakEventDetail>).detail
            const newAudio = new Audio(audioUrl)
            setAudio(newAudio)
            setVisemes(nextVisemes)
            newAudio.play().catch(console.error)
        }

        window.addEventListener('ai-speak', handleSpeak)
        return () => window.removeEventListener('ai-speak', handleSpeak)
    }, [])

    // Lipsync Loop
    useFrame((_, delta) => {
        if (audio && visemes && !audio.paused) {
            const time = audio.currentTime
            const cue = visemes.mouthCues.find((c) => time >= c.start && time <= c.end)

            mouthExpressionNames.forEach((name) => {
                vrm?.expressionManager?.setValue(name, 0)
            })

            if (cue) {
                visemeExpressionMap[cue.value]?.forEach((name) => {
                    vrm?.expressionManager?.setValue(name, 1)
                })
            }
        }

        mixerRef.current?.update(delta)
        vrm?.update(delta)
    })

    return (
        <group ref={group} dispose={null}>
            <primitive object={avatarScene} position={[0, 0, 0]} />
        </group>
    )
}

useGLTF.preload(AVATAR_MODEL_PATH, true, true, extendVRMLoader)
useGLTF.preload(AVATAR_ANIMATION_PATH, true, true, extendVRMAnimationLoader)
