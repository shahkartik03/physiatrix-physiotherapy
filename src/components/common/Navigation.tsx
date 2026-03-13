import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Users, UserPlus, LogOut, TrendingUp, Database, Bell } from 'lucide-react';

const Navigation: React.FC = () => {
    const location = useLocation();
    const userRole = localStorage.getItem('userRole');
    
    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };
    
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white shadow-2xl border-t border-gray-200">
            <ul className="flex justify-around items-center py-2 overflow-x-auto">
                <li className="flex-shrink-0">
                    <Link 
                        to="/dashboard" 
                        className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
                            isActive('/dashboard') ? 'text-accent-500' : 'text-gray-600'
                        }`}
                    >
                        <LayoutDashboard size={22} />
                        <span className="text-xs font-medium">Dashboard</span>
                    </Link>
                </li>
                <li className="flex-shrink-0">
                    <Link 
                        to="/patients" 
                        className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
                            isActive('/patients') ? 'text-accent-500' : 'text-gray-600'
                        }`}
                    >
                        <Users size={22} />
                        <span className="text-xs font-medium">Patients</span>
                    </Link>
                </li>
                {userRole === 'admin' && (
                    <>
                        <li className="flex-shrink-0">
                            <Link 
                                to="/reminders" 
                                className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
                                    isActive('/reminders') ? 'text-accent-500' : 'text-gray-600'
                                }`}
                            >
                                <Bell size={22} />
                                <span className="text-xs font-medium">Reminders</span>
                            </Link>
                        </li>
                        <li className="flex-shrink-0">
                            <Link 
                                to="/schedule" 
                                className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
                                    isActive('/schedule') ? 'text-accent-500' : 'text-gray-600'
                                }`}
                            >
                                <Calendar size={22} />
                                <span className="text-xs font-medium">Schedule</span>
                            </Link>
                        </li>
                        <li className="flex-shrink-0">
                            <Link 
                                to="/onboarding" 
                                className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
                                    isActive('/onboarding') ? 'text-accent-500' : 'text-gray-600'
                                }`}
                            >
                                <UserPlus size={22} />
                                <span className="text-xs font-medium">Onboard</span>
                            </Link>
                        </li>
                        <li className="flex-shrink-0">
                            <Link 
                                to="/reports" 
                                className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
                                    isActive('/reports') ? 'text-accent-500' : 'text-gray-600'
                                }`}
                            >
                                <TrendingUp size={22} />
                                <span className="text-xs font-medium">Reports</span>
                            </Link>
                        </li>
                        <li className="flex-shrink-0">
                            <Link 
                                to="/audit-logs" 
                                className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${
                                    isActive('/audit-logs') ? 'text-accent-500' : 'text-gray-600'
                                }`}
                            >
                                <Database size={22} />
                                <span className="text-xs font-medium">Audit</span>
                            </Link>
                        </li>
                    </>
                )}
                <li className="flex-shrink-0">
                    <button 
                        onClick={handleLogout}
                        className="flex flex-col items-center gap-1 py-2 px-3 transition-colors text-gray-600 hover:text-red-500 w-full"
                    >
                        <LogOut size={22} />
                        <span className="text-xs font-medium">Logout</span>
                    </button>
                </li>
            </ul>
        </nav>
    );
};

export default Navigation;