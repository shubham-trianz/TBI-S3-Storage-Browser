import {useRef, useState, useEffect} from 'react'
import FullScreenLoader from './FullScreenLoader';

type Props = {
    displayName: string,
    signOut?: () => void
}

export default function Profile({displayName, signOut}: Props) {
    const ref = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [signingOut, setSigningOut] = useState(false);

    const handleSignOut = async () => {
        try {
            if(!signOut){
                console.log('Sign Out is not available')
                return;
            }
            setSigningOut(true);
            await signOut(); 
        } catch (err) {
            console.error("Sign out failed", err);
            setSigningOut(false);
        }
    };

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
            setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div className="avatar-wrapper" ref={ref}>
            <div
                className="avatar"
                onClick={() => setOpen(prev => !prev)}
            >
                {displayName[0].toUpperCase()}
            </div>

            {open && (
                <div className="avatar-dropdown">
                <div className="avatar-name">{displayName}</div>
                <div className="avatar-divider" />
                <button
                    onClick={handleSignOut}
                    disabled={signingOut}
                    className="signout-btn"
                >
                    Sign out
                </button>
                {signingOut && <FullScreenLoader text="Signing out..." />}
                </div>
            )}
        </div>
    )
}
