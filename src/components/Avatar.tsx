import React, { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

// Mapping from Rhubarb visemes to Morph Target names
// Adjust 'aa', 'ih', 'ou' to match your VRM/GLB blend shape names
// Common VRM blend shapes: 'A', 'I', 'U', 'E', 'O', 'Blink', 'Joy', etc.
// Common ARKit: 'jawOpen', 'mouthSMILE', etc.
const visemeMap: Record<string, string[]> = {
    'A': ['aa', 'A'],
    'B': ['ih', 'I'],
    'C': ['ou', 'U'],
    'D': ['aa', 'E'],
    'E': ['ou', 'O'],
    'F': ['ou', 'U'],
    'G': ['ih', 'I'],
    'H': ['ih', 'I'],
    'X': ['aa', 'A']
}

export const Avatar = () => {
    // Mock paths - user will replace these files in public/ folder
    const { scene } = useGLTF('/avatar.glb')
    const { animations: rawAnimations } = useGLTF('/animation2.glb')

    // Clone correctly using useMemo to avoid re-cloning every render
    const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
    const group = useRef<THREE.Group>(null)

    // Process animations: Rename Mixamo bones to VRM bones and filter out invalid tracks
    const animations = React.useMemo(() => {
        const modelBones = new Set<string>()
        clone.traverse((o) => {
            if ((o as THREE.Bone).isBone) modelBones.add(o.name)
        })
        console.log("Avatar Bones:", Array.from(modelBones).sort().slice(0, 10))

        const newAnimations = rawAnimations.map((clip) => {
            const newClip = clip.clone()

            // Filter and Rename Tracks
            const originalTrackCount = newClip.tracks.length
            newClip.tracks = newClip.tracks.filter((track) => {
                // 1. Remove "mixamorig" prefix to get base name
                let paramName = track.name.replace("mixamorig", "")

                // 2. Define standard Mixamo -> J_Bip mapping
                // Mixamo often uses: Hips, Spine, Spine1, Spine2, Neck, Head, ...
                // VRM/J_Bip uses: J_Bip_C_Hips, J_Bip_C_Spine, J_Bip_C_Chest, ...

                const boneMap: Record<string, string> = {
                    "Hips": "J_Bip_C_Hips",
                    "Spine": "J_Bip_C_Spine",
                    "Spine1": "J_Bip_C_Chest",
                    "Spine2": "J_Bip_C_UpperChest",
                    "Neck": "J_Bip_C_Neck",
                    "Head": "J_Bip_C_Head",

                    "LeftShoulder": "J_Bip_L_Shoulder",
                    "LeftArm": "J_Bip_L_UpperArm",
                    "LeftForeArm": "J_Bip_L_LowerArm",
                    "LeftHand": "J_Bip_L_Hand",
                    "LeftHandThumb1": "J_Bip_L_Thumb1",
                    "LeftHandThumb2": "J_Bip_L_Thumb2",
                    "LeftHandThumb3": "J_Bip_L_Thumb3",
                    "LeftHandIndex1": "J_Bip_L_Index1",
                    "LeftHandIndex2": "J_Bip_L_Index2",
                    "LeftHandIndex3": "J_Bip_L_Index3",
                    "LeftHandMiddle1": "J_Bip_L_Middle1",
                    "LeftHandMiddle2": "J_Bip_L_Middle2",
                    "LeftHandMiddle3": "J_Bip_L_Middle3",
                    "LeftHandRing1": "J_Bip_L_Ring1",
                    "LeftHandRing2": "J_Bip_L_Ring2",
                    "LeftHandRing3": "J_Bip_L_Ring3",
                    "LeftHandPinky1": "J_Bip_L_Little1",
                    "LeftHandPinky2": "J_Bip_L_Little2",
                    "LeftHandPinky3": "J_Bip_L_Little3",

                    "RightShoulder": "J_Bip_R_Shoulder",
                    "RightArm": "J_Bip_R_UpperArm",
                    "RightForeArm": "J_Bip_R_LowerArm",
                    "RightHand": "J_Bip_R_Hand",
                    "RightHandThumb1": "J_Bip_R_Thumb1",
                    "RightHandThumb2": "J_Bip_R_Thumb2",
                    "RightHandThumb3": "J_Bip_R_Thumb3",
                    "RightHandIndex1": "J_Bip_R_Index1",
                    "RightHandIndex2": "J_Bip_R_Index2",
                    "RightHandIndex3": "J_Bip_R_Index3",
                    "RightHandMiddle1": "J_Bip_R_Middle1",
                    "RightHandMiddle2": "J_Bip_R_Middle2",
                    "RightHandMiddle3": "J_Bip_R_Middle3",
                    "RightHandRing1": "J_Bip_R_Ring1",
                    "RightHandRing2": "J_Bip_R_Ring2",
                    "RightHandRing3": "J_Bip_R_Ring3",
                    "RightHandPinky1": "J_Bip_R_Little1",
                    "RightHandPinky2": "J_Bip_R_Little2",
                    "RightHandPinky3": "J_Bip_R_Little3",

                    "LeftUpLeg": "J_Bip_L_UpperLeg",
                    "LeftLeg": "J_Bip_L_LowerLeg",
                    "LeftFoot": "J_Bip_L_Foot",
                    "LeftToeBase": "J_Bip_L_ToeBase",

                    "RightUpLeg": "J_Bip_R_UpperLeg",
                    "RightLeg": "J_Bip_R_LowerLeg",
                    "RightFoot": "J_Bip_R_Foot",
                    "RightToeBase": "J_Bip_R_ToeBase",
                }

                // 3. Try to map the bone name
                // track.name is usually "mixamorigBoneName.property"
                // So now paramName is "BoneName.property"
                const parts = paramName.split('.')
                const boneBaseName = parts[0]
                const propertyName = parts[1]

                let mappedBoneName = boneMap[boneBaseName]

                // Fallback: if map failed, maybe it's already close or needs minor tweaks?
                if (!mappedBoneName) {
                    // Try direct prefix check if not in map
                    if (boneBaseName.startsWith("Left")) mappedBoneName = "J_Bip_L_" + boneBaseName.substring(4)
                    else if (boneBaseName.startsWith("Right")) mappedBoneName = "J_Bip_R_" + boneBaseName.substring(5)
                }

                if (mappedBoneName) {
                    track.name = `${mappedBoneName}.${propertyName}`
                } else {
                    // If no mapping found, just strip mixamorig and hope for the best (usually fails for J_Bip)
                    track.name = paramName
                }

                // 4. Validate against actual avatar bones
                const finalBoneName = track.name.split('.')[0]
                const finalPropertyName = track.name.split('.')[1]
                const exists = modelBones.has(finalBoneName)

                // 5. IMPORTANT: Discard position tracks for all bones except Hips
                // Animating position on non-root bones causes distortion ("spaghetti effect")
                if (exists && finalPropertyName === "position" && finalBoneName !== "J_Bip_C_Hips") {
                    return false
                }

                return exists
            })

            console.log(`Clip '${newClip.name}': maintained ${newClip.tracks.length}/${originalTrackCount} tracks`)
            if (newClip.tracks.length < originalTrackCount) {
                const missingBones = new Set(newClip.tracks.map(t => t.name.split('.')[0]).filter(n => !modelBones.has(n)))
                if (missingBones.size > 0) console.log("Still missing bones:", Array.from(missingBones))
            }

            return newClip
        })

        return newAnimations
    }, [rawAnimations, clone])

    const { actions } = useAnimations(animations, group)

    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
    const [visemes, setVisemes] = useState<any>(null)

    // useEffect(() => {
    //     if (actions && Object.keys(actions).length > 0) {
    //         const animationName = Object.keys(actions)[0]
    //         console.log("Playing animation:", animationName)
    //         actions[animationName]?.reset().fadeIn(0.5).play()
    //     }
    // }, [actions])

    // Audio Listener
    useEffect(() => {
        const handleSpeak = (e: any) => {
            const { audioUrl, visemes: v } = e.detail
            const newAudio = new Audio(audioUrl)
            setAudio(newAudio)
            setVisemes(v)
            newAudio.play().catch(console.error)
        }

        window.addEventListener('ai-speak', handleSpeak)
        return () => window.removeEventListener('ai-speak', handleSpeak)
    }, [])

    // Lipsync Loop
    useFrame(() => {
        if (audio && visemes && !audio.paused) {
            const time = audio.currentTime
            const cue = visemes.mouthCues.find((c: any) => time >= c.start && time <= c.end)

            clone.traverse((child) => {
                if ((child as THREE.Mesh).isMesh && (child as THREE.Mesh).morphTargetDictionary) {
                    const mesh = child as THREE.Mesh

                    // Reset all mapped morphs
                    Object.values(visemeMap).flat().forEach(name => {
                        const idx = mesh.morphTargetDictionary![name]
                        if (idx !== undefined) mesh.morphTargetInfluences![idx] = 0
                    })

                    // Set active morph
                    if (cue) {
                        const targetNames = visemeMap[cue.value]
                        targetNames?.forEach(name => {
                            const idx = mesh.morphTargetDictionary![name]
                            if (idx !== undefined) {
                                mesh.morphTargetInfluences![idx] = 1
                            }
                        })
                    }
                }
            })
        }
    })

    return (
        <group ref={group} dispose={null}>
            <primitive object={clone} position={[0, 0, 0]} />
        </group>
    )
}

useGLTF.preload('/avatar.glb')
useGLTF.preload('/animation.glb')
