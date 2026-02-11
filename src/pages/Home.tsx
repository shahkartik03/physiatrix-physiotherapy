import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, UserPlus, Heart, Clock, Award, Users } from 'lucide-react';

const Home: React.FC = () => {
    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 text-white py-16 md:py-24 px-4">
                <div className="container mx-auto">
                    <div className="max-w-4xl">
                        <div className="inline-block bg-accent-500 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
                            EXPERT CARE
                        </div>
                        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                            Your Journey to <span className="text-accent-400">Pain-Free Living</span> Starts Here
                        </h1>
                        <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-2xl">
                            Experience compassionate, professional physiotherapy care from expert practitioners.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link to="/schedule" className="btn-primary bg-accent-500 hover:bg-accent-600 text-center">
                                <Calendar className="inline mr-2" size={20} />
                                Schedule an Appointment
                            </Link>
                            <Link to="/onboarding" className="btn-secondary bg-white text-primary-700 text-center">
                                <UserPlus className="inline mr-2" size={20} />
                                Onboard as a New Doctor
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-16 px-4 bg-white">
                <div className="container mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-bold text-primary-800 mb-4">Why Choose Us</h2>
                        <p className="text-gray-600 text-lg">Professional care tailored to your needs</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="card text-center hover:scale-105 transition-transform">
                            <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Heart className="text-accent-600" size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Compassionate Care</h3>
                            <p className="text-gray-600">Professional treatment with a personal touch from experienced practitioners</p>
                        </div>
                        
                        <div className="card text-center hover:scale-105 transition-transform">
                            <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Clock className="text-accent-600" size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Flexible Scheduling</h3>
                            <p className="text-gray-600">Easy appointment booking that fits your busy schedule</p>
                        </div>
                        
                        <div className="card text-center hover:scale-105 transition-transform">
                            <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Award className="text-accent-600" size={32} />
                            </div>
                            <h3 className="text-xl font-semibold mb-3">Expert Team</h3>
                            <p className="text-gray-600">Highly qualified doctors and staff dedicated to your wellness</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="bg-gradient-to-r from-accent-500 to-accent-600 py-16 px-4">
                <div className="container mx-auto text-center">
                    <Users className="mx-auto mb-4 text-white" size={48} />
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Start Your Journey?</h2>
                    <p className="text-xl text-white mb-8 max-w-2xl mx-auto">
                        Join thousands of patients who trust us with their health and wellness
                    </p>
                    <Link to="/schedule" className="btn-secondary bg-white text-accent-600 hover:bg-gray-50 inline-block">
                        Book Your First Appointment
                    </Link>
                </div>
            </section>
        </main>
    );
};

export default Home;