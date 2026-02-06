import React from 'react';

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
            {/* Top Navigation */}
            <header className="w-full flex items-center justify-between px-6 py-4 md:px-12 border-b border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-2">
                    <img src="/images/logo-bimzik.png" alt="BimZik" className="h-8" />
                </div>
                <div className="flex gap-4">
                    <button className="text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                        Help
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center p-6">
                {children}
            </main>

            {/* Decorative Background Elements */}
            <div className="fixed bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-primary/5 to-transparent pointer-events-none -z-10" />
            <div className="fixed top-0 right-0 size-96 bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10 translate-x-1/2 -translate-y-1/2" />
            <div className="fixed bottom-0 left-0 size-96 bg-primary/5 blur-[120px] rounded-full pointer-events-none -z-10 -translate-x-1/2 translate-y-1/2" />
        </div>
    );
}
