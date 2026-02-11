import React from 'react';
import Header from '../common/Header';
import Footer from '../common/Footer';
import Navigation from '../common/Navigation';

const MobileLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <div className="flex flex-col h-screen">
            <Header />
            <main className="flex-grow overflow-auto">
                {children}
            </main>
            <Footer />
            <Navigation />
        </div>
    );
};

export default MobileLayout;