import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Phone, MapPin, LogOut } from 'lucide-react';

const Header: React.FC = () => {
    const navigate = useNavigate();
    const userRole = localStorage.getItem('userRole');

    const handleLogout = () => {
        localStorage.clear();
        console.log('🔐 Logout Event: User logged out', { timestamp: new Date().toISOString() });
        navigate('/login');
    };

    return (
        <>
            {/* Top Info Bar - Hidden on mobile */}
            <div className="hidden md:block bg-primary-800 text-white text-sm py-2">
                <div className="container mx-auto px-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <MapPin size={16} />
                            <span>Medical Center, Health District</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Phone size={16} />
                            <span>083696 68284</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Main Header */}
            <header className="bg-white shadow-md sticky top-0 z-50">
                <div className="container mx-auto px-4">
                    <div className="flex items-center justify-between py-4">
                        <Link to="/" className="flex items-center">
                            <h1 className="text-2xl md:text-3xl font-bold text-primary-700">
                                Physiatrix <span className="text-accent-500">Physiotherapy</span>
                            </h1>
                        </Link>
                        
                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/dashboard" className="text-gray-700 hover:text-accent-500 font-medium transition-colors">Dashboard</Link>
                            <Link to="/patients" className="text-gray-700 hover:text-accent-500 font-medium transition-colors">Patients</Link>
                            {userRole === 'admin' && (
                                <>
                                    <Link to="/reminders" className="text-gray-700 hover:text-accent-500 font-medium transition-colors">Reminders</Link>
                                    <Link to="/schedule" className="text-gray-700 hover:text-accent-500 font-medium transition-colors">View Schedule</Link>
                                    <Link to="/onboarding" className="text-gray-700 hover:text-accent-500 font-medium transition-colors">Doctor Onboarding</Link>
                                    <Link to="/reports" className="text-gray-700 hover:text-accent-500 font-medium transition-colors">Earnings Report</Link>
                                    <Link to="/audit-logs" className="text-gray-700 hover:text-accent-500 font-medium transition-colors">Audit Logs</Link>
                                </>
                            )}
                            <button onClick={handleLogout} className="flex items-center gap-2 text-gray-700 hover:text-red-500 font-medium transition-colors">
                                <LogOut size={20} />
                                Logout
                            </button>
                        </nav>
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;