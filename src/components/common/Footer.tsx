import React from 'react';
import { Mail, Phone, MapPin } from 'lucide-react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-primary-800 text-white py-8 md:py-12 pb-20 md:pb-12">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* About Section */}
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-accent-400">Physiatrix Physiotherapy</h3>
                        <p className="text-gray-300 text-sm">
                            Your health is our priority. Professional medical care with compassionate service.
                        </p>
                    </div>
                    
                    {/* Contact Info */}
                    <div>
                        <h4 className="font-semibold mb-4 text-accent-400">Contact Us</h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-start gap-2">
                                <MapPin size={18} className="text-accent-400 flex-shrink-0 mt-0.5" />
                                <span className="text-gray-300">Medical Center, Health District</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone size={18} className="text-accent-400" />
                                <a href="tel:08369668284" className="text-gray-300 hover:text-accent-400 transition-colors">083696 68284</a>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail size={18} className="text-accent-400" />
                                <a href="mailto:info@medicalpractice.com" className="text-gray-300 hover:text-accent-400 transition-colors">info@medicalpractice.com</a>
                            </div>
                        </div>
                    </div>
                    
                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold mb-4 text-accent-400">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/schedule" className="text-gray-300 hover:text-accent-400 transition-colors">Book Appointment</a>
                            </li>
                            <li>
                                <a href="/onboarding" className="text-gray-300 hover:text-accent-400 transition-colors">Doctor Onboarding</a>
                            </li>
                            <li>
                                <a href="/dashboard" className="text-gray-300 hover:text-accent-400 transition-colors">Dashboard</a>
                            </li>
                        </ul>
                    </div>
                </div>
                
                <div className="border-t border-primary-700 mt-8 pt-6 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} Medical Practice. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;