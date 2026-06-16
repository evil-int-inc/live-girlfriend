import { OrbitControls, Environment } from '@react-three/drei'
import { Avatar } from './Avatar'

export const Experience = () => {
    return (
        <>
            <OrbitControls />
            <Environment preset="sunset" />
            <group position-y={-0.8}>
                <Avatar />
            </group>
        </>
    )
}
