import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        try {
            // Authenticate with Firebase
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            // Fetch doctor data from Firestore
            const doctorRef = doc(db, 'doctors', user.uid);
            const doctorSnap = await getDoc(doctorRef);
            
            if (!doctorSnap.exists()) {
                setError('Doctor profile not found. Please contact admin.');
                await auth.signOut();
                setLoading(false);
                return;
            }
            
            const doctorData = doctorSnap.data();
            
            // Check if account is active
            if (doctorData.isActive === false) {
                setError('Your account has been deactivated. Please contact admin.');
                await auth.signOut();
                setLoading(false);
                return;
            }
            
            // Store user info in localStorage
            localStorage.setItem('userRole', doctorData.isAdmin ? 'admin' : 'doctor');
            localStorage.setItem('userEmail', email);
            localStorage.setItem('userId', user.uid);
            localStorage.setItem('userName', doctorData.name);
            localStorage.setItem('isAuthenticated', 'true');
            
            // Console log for future WhatsApp integration
            console.log('🔐 Login Event: User logged in', { 
                email, 
                role: doctorData.isAdmin ? 'admin' : 'doctor',
                doctorName: doctorData.name,
                timestamp: new Date().toISOString() 
            });
            
            navigate('/dashboard');
        } catch (err: any) {
            console.error('Login error:', err);
            
            // User-friendly error messages
            if (err.code === 'auth/invalid-credential') {
                setError('Invalid email or password');
            } else if (err.code === 'auth/user-not-found') {
                setError('No account found with this email');
            } else if (err.code === 'auth/wrong-password') {
                setError('Invalid password');
            } else if (err.code === 'auth/invalid-email') {
                setError('Invalid email address format');
            } else {
                setError(err.message || 'Login failed. Please try again.');
            }
            
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 flex items-center justify-center px-4">
            <div className="max-w-md w-full">
                <div className="text-center mb-6">
                    <div className="flex justify-center mb-6">
                        <div className="bg-white rounded-2xl p-6 shadow-2xl">
                            <img 
                                src="physiatrix-logo.png" 
                                alt="Physiatrix Physiotherapy" 
                                className="h-28 w-auto max-w-xs"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                }}
                            />
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold text-white" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5)' }}>
                        Welcome to <span className="text-white">Physiatrix</span>
                    </h1>
                </div>

                <div className="card bg-white">
                    <div className="text-center mb-6">
                        <div className="bg-accent-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <LogIn className="text-accent-600" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-primary-800">Doctor Login</h2>
                        <p className="text-gray-600 mt-2">Access your practice dashboard</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 flex items-center gap-2 text-red-700">
                                <AlertCircle size={20} />
                                <span className="text-sm font-medium">{error}</span>
                            </div>
                        )}

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field input-with-icon"
                                    placeholder="doctor@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="input-field input-with-icon"
                                    placeholder="Enter your password"
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            className="btn-primary w-full"
                            disabled={loading}
                        >
                            <LogIn className="inline mr-2" size={20} />
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    {/* Forgot Password Link */}
                    <div className="mt-4 text-center">
                        <Link 
                            to="/forgot-password" 
                            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                        >
                            Forgot your password?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;