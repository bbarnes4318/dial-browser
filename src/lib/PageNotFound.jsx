import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Home, AlertCircle } from 'lucide-react';

export default function PageNotFound({}) {
    const location = useLocation();
    const pageName = location.pathname.substring(1);

    const { data: authData, isFetched } = useQuery({
        queryKey: ['user'],
        queryFn: async () => {
            try {
                const user = await base44.auth.me();
                return { user, isAuthenticated: true };
            } catch (error) {
                return { user: null, isAuthenticated: false };
            }
        }
    });

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: "#05070A" }}>
            {/* Background signal lines */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-1/4 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.3), transparent)", animation: "signalPulse 4s ease-in-out infinite" }} />
                <div className="absolute bottom-1/3 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(209,255,38,0.2), transparent)", animation: "signalPulse 5s ease-in-out infinite" }} />
            </div>

            <div className="relative z-10 max-w-md w-full">
                <div className="text-center space-y-6">
                    {/* 404 Error Code */}
                    <div className="space-y-3">
                        <p className="font-mono text-[10px] tracking-[0.4em]" style={{ color: "#D1FF26" }}>// SIGNAL LOST</p>
                        <h1 className="text-7xl font-black" style={{ color: "rgba(209,255,38,0.15)" }}>404</h1>
                        <div className="h-px w-16 mx-auto" style={{ background: "rgba(209,255,38,0.4)" }}></div>
                    </div>

                    {/* Main Message */}
                    <div className="space-y-3">
                        <h2 className="text-2xl font-heading font-bold" style={{ color: "#F5F5F7" }}>
                            Page Not Found
                        </h2>
                        <p className="leading-relaxed text-sm" style={{ color: "#8A8F98" }}>
                            The page <span className="font-mono" style={{ color: "#D1FF26" }}>"{pageName}"</span> could not be found in this application.
                        </p>
                    </div>

                    {/* Admin Note */}
                    {isFetched && authData.isAuthenticated && authData.user?.role === 'admin' && (
                        <div className="mt-8 p-4 text-left" style={{ background: "#10141D", border: "0.5px solid rgba(209,255,38,0.2)" }}>
                            <div className="flex items-start space-x-3">
                                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" style={{ color: "#D1FF26" }} />
                                <div className="space-y-1">
                                    <p className="font-mono text-[10px] tracking-widest" style={{ color: "#D1FF26" }}>// ADMIN NOTE</p>
                                    <p className="text-sm leading-relaxed" style={{ color: "#8A8F98" }}>
                                        This could mean that the AI hasn't implemented this page yet. Ask it to implement it in the chat.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="pt-6">
                        <button
                            onClick={() => window.location.href = '/'}
                            className="inline-flex items-center gap-2 px-6 py-3 font-mono text-[11px] tracking-widest uppercase transition-all"
                            style={{ background: "#D1FF26", color: "#05070A" }}
                        >
                            <Home size={14} />
                            Go Home
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}