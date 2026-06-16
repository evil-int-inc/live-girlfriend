import { useThree } from '@react-three/fiber'
import { OrbitControls, Environment } from '@react-three/drei'
import { Avatar } from './Avatar'

export const Experience = () => {
    const { size } = useThree()
    const avatarScale = size.width < 600 ? 0.65 : 1

    return (
        <>
            <OrbitControls />
            <ambientLight intensity={1.4} />
            <directionalLight position={[2, 4, 5]} intensity={2.2} />
            <Environment preset="sunset" />
            <group position-y={-0.8} scale={avatarScale}>
                <Avatar />
            </group>
        </>
    )
}
