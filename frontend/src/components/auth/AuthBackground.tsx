// @ts-ignore
import WebThreads from "../background/WebThreads";

export default function AuthBackground() {
    return (
        <div className="auth-background">
            <WebThreads
                color1="#5227FF"
                color2="#FF9FFC"
                color3="#FFFFFF"
                speed={0.2}
                threadCount={6}
                frequency={5.0}
                spread={0.18}
                taper={1.0}
                position={0.5}
                fanMode="center"
                glow={0.01}
                falloff={0.6}
                thickness={0.8}
                brightness={0.4}
                opacity={0.85}
                mirror={true}
                shimmer={false}
                grain={true}
                grainIntensity={0.05}
                mouseInteraction={true}
                mouseStrength={0.3}
            />
        </div>
    );
}
