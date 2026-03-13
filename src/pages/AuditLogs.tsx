import React, { useState, useEffect } from 'react';
import { Clock, User, Database, Filter, Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { auditService, AuditLog, AuditAction, AuditCollection } from '../services/auditService';

const AuditLogs: React.FC = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [expandedLogIds, setExpandedLogIds] = useState<string[]>([]);
    
    // Filters
    const [collectionFilter, setCollectionFilter] = useState<AuditCollection | 'all' | ''>('');
    const [actionFilter, setActionFilter] = useState<AuditAction | 'all' | ''>('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const loadLogs = async () => {
        try {
            setLoading(true);
            setError('');
            
            const filters: any = {
                limitCount: 50
            };
            
            if (collectionFilter && collectionFilter !== 'all') {
                filters.collectionType = collectionFilter;
            }
            if (actionFilter && actionFilter !== 'all') {
                filters.action = actionFilter;
            }
            if (startDate) {
                filters.startDate = startDate;
            }
            if (endDate) {
                filters.endDate = endDate;
            }
            
            const fetchedLogs = await auditService.getLogs(filters);
            setLogs(fetchedLogs);
        } catch (err: any) {
            console.error('Error loading audit logs:', err);
            setError(err.message || 'Failed to load audit logs');
        } finally {
            setLoading(false);
        }
    };

    const formatTimestamp = (timestamp: any) => {
        try {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Invalid date';
        }
    };

    const getActionColor = (action: AuditAction) => {
        switch (action) {
            case 'created':
                return 'bg-green-100 text-green-700';
            case 'updated':
                return 'bg-blue-100 text-blue-700';
            case 'deleted':
                return 'bg-red-100 text-red-700';
            case 'status_changed':
                return 'bg-orange-100 text-orange-700';
            case 'payment_received':
                return 'bg-teal-100 text-teal-700';
            default:
                return 'bg-gray-100 text-gray-700';
        }
    };

    const getCollectionColor = (collection: AuditCollection) => {
        switch (collection) {
            case 'appointments':
                return 'text-purple-600';
            case 'patients':
                return 'text-blue-600';
            case 'packages':
                return 'text-green-600';
            case 'doctors':
                return 'text-orange-600';
            default:
                return 'text-gray-600';
        }
    };

    const toggleExpand = (logId: string) => {
        setExpandedLogIds(prev => 
            prev.includes(logId) 
                ? prev.filter(id => id !== logId)
                : [...prev, logId]
        );
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-24 md:pb-8">
            <div className="container mx-auto px-4 py-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-primary-800 flex items-center gap-2">
                        <Database size={28} />
                        Audit Logs
                    </h1>
                    <p className="text-gray-600 mt-1">Complete history of all database changes</p>
                </div>

                {/* Filters */}
                <div className="card mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} className="text-gray-600" />
                        <h2 className="font-semibold text-gray-800">Filters</h2>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Collection
                            </label>
                            <select
                                value={collectionFilter}
                                onChange={(e) => setCollectionFilter(e.target.value as any)}
                                className="input-field"
                            >
                                <option value="">Select Collection...</option>
                                <option value="all">All Collections</option>
                                <option value="appointments">Appointments</option>
                                <option value="patients">Patients</option>
                                <option value="packages">Packages</option>
                                <option value="doctors">Doctors</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Action Type
                            </label>
                            <select
                                value={actionFilter}
                                onChange={(e) => setActionFilter(e.target.value as any)}
                                className="input-field"
                            >
                                <option value="">Select Action...</option>
                                <option value="all">All Actions</option>
                                <option value="created">Created</option>
                                <option value="updated">Updated</option>
                                <option value="deleted">Deleted</option>
                                <option value="status_changed">Status Changed</option>
                                <option value="payment_received">Payment Received</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="input-field"
                            />
                        </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={loadLogs}
                            disabled={loading}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader className="animate-spin" size={16} />
                                    Loading...
                                </>
                            ) : (
                                <>
                                    <Filter size={16} />
                                    Search
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="card bg-red-50 border-2 border-red-200 mb-6">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {/* Loading State */}
                {loading && (
                    <div className="flex justify-center items-center py-12">
                        <Loader className="animate-spin text-primary-600" size={48} />
                    </div>
                )}

                {/* Audit Logs Table */}
                {!loading && logs.length > 0 && (
                    <>
                        {/* Expand/Collapse All Button */}
                        <div className="mb-3 flex justify-end">
                            {expandedLogIds.length === logs.filter(log => log.changes && Object.keys(log.changes).length > 0).length && logs.some(log => log.changes && Object.keys(log.changes).length > 0) ? (
                                <button
                                    onClick={() => setExpandedLogIds([])}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                                >
                                    <ChevronUp size={16} />
                                    Collapse All
                                </button>
                            ) : (
                                <button
                                    onClick={() => setExpandedLogIds(logs.filter(log => log.changes && Object.keys(log.changes).length > 0).map(log => log.id))}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1"
                                >
                                    <ChevronDown size={16} />
                                    Expand All
                                </button>
                            )}
                        </div>
                        
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                <thead className="bg-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Timestamp</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">User</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Collection</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Document</th>
                                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log, index) => (
                                        <React.Fragment key={log.id}>
                                            <tr className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                                                <td className="py-3 px-4 text-sm text-gray-700 whitespace-nowrap">
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-gray-400" />
                                                        {formatTimestamp(log.timestamp)}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <User size={14} className="text-blue-500" />
                                                        <span className="font-medium text-gray-900">{log.userName}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-sm">
                                                    <span className={`font-semibold ${getCollectionColor(log.collection)}`}>
                                                        {log.collection}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-sm text-gray-700">
                                                    <div className="max-w-xs truncate" title={log.documentName}>
                                                        {log.documentName || log.documentId}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${getActionColor(log.action)}`}>
                                                        {log.action.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    {log.changes && Object.keys(log.changes).length > 0 && (
                                                        <button
                                                            onClick={() => toggleExpand(log.id)}
                                                            className="text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                                                        >
                                                            {expandedLogIds.includes(log.id) ? (
                                                                <>
                                                                    <ChevronUp size={16} />
                                                                    Hide
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown size={16} />
                                                                    View
                                                                </>
                                                            )}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                            {expandedLogIds.includes(log.id) && log.changes && (
                                                <tr>
                                                    <td colSpan={6} className="bg-blue-50 border-b border-gray-100">
                                                        <div className="p-4">
                                                            <h4 className="text-sm font-semibold text-gray-700 mb-2">Changes:</h4>
                                                            <div className="bg-white rounded border border-blue-200 p-3">
                                                                <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                                                                    {JSON.stringify(log.changes, null, 2)}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                            
                        {logs.length === 0 && (
                            <div className="text-center py-12 text-gray-500">
                                <Database className="mx-auto mb-4 text-gray-400" size={48} />
                                <p>No audit logs found</p>
                            </div>
                        )}
                    </div>
                    </>
                )}

                {/* Info */}
                {!loading && logs.length > 0 && (
                    <div className="mt-4 text-sm text-gray-600 text-center">
                        Showing {logs.length} most recent logs
                    </div>
                )}
            </div>
        </main>
    );
};

export default AuditLogs;
