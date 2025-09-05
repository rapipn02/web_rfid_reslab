import React from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, AlertTriangle, Info, X, Search } from 'lucide-react';

// Alert/Notification Component
export const Alert = ({ show, message, type = 'success', onClose, autoClose = true }) => {
    React.useEffect(() => {
        if (show && autoClose) {
            const timer = setTimeout(() => {
                if (onClose) onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [show, autoClose, onClose]);

    if (!show) return null;

    const getAlertStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-green-50 border-green-400 text-green-800';
            case 'error':
                return 'bg-red-50 border-red-400 text-red-800';
            case 'warning':
                return 'bg-yellow-50 border-yellow-400 text-yellow-800';
            case 'info':
                return 'bg-blue-50 border-blue-400 text-blue-800';
            default:
                return 'bg-gray-50 border-gray-400 text-gray-800';
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle size={20} className="mr-2" />;
            case 'error':
                return <AlertTriangle size={20} className="mr-2" />;
            case 'warning':
                return <AlertTriangle size={20} className="mr-2" />;
            case 'info':
                return <Info size={20} className="mr-2" />;
            default:
                return null;
        }
    };

    return (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${getAlertStyles()}`}>
            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    {getIcon()}
                    <span className="font-medium">{message}</span>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="ml-4 text-gray-500 hover:text-gray-700"
                    >
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

// Pagination Component
export const Pagination = ({ 
    currentPage, 
    totalPages, 
    totalItems, 
    itemsPerPage, 
    onPageChange,
    showInfo = true,
    className = ''
}) => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

    if (totalPages <= 1) return null;

    const getPaginationRange = () => {
        const maxVisible = 5;
        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const half = Math.floor(maxVisible / 2);
        let start = Math.max(currentPage - half, 1);
        let end = Math.min(start + maxVisible - 1, totalPages);

        if (end - start + 1 < maxVisible) {
            start = Math.max(end - maxVisible + 1, 1);
        }

        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    return (
        <div className={`flex flex-col sm:flex-row justify-between items-center gap-4 ${className}`}>
            {showInfo && (
                <div className="text-sm text-gray-500">
                    Menampilkan {startIndex + 1} sampai {endIndex} dari {totalItems} Data
                </div>
            )}
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />
                    <span className="ml-1 hidden sm:inline">Prev</span>
                </button>
                
                {getPaginationRange().map(pageNum => (
                    <button
                        key={pageNum}
                        onClick={() => onPageChange(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                            pageNum === currentPage 
                                ? 'text-white bg-orange-500 font-semibold' 
                                : 'bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        {pageNum}
                    </button>
                ))}
                
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="mr-1 hidden sm:inline">Next</span>
                    <ChevronRight size={16} />
                </button>
            </nav>
        </div>
    );
};

// Modal Component
export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
    const getSizeClasses = () => {
        switch (size) {
            case 'sm': return 'max-w-md';
            case 'lg': return 'max-w-2xl';
            case 'xl': return 'max-w-4xl';
            default: return 'max-w-lg';
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-lg ${getSizeClasses()} w-full max-h-[90vh] overflow-y-auto`}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X size={24} />
                    </button>
                </div>
                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

// Loading Button Component
export const LoadingButton = ({ 
    isLoading, 
    onClick, 
    disabled, 
    children, 
    className = '',
    variant = 'primary'
}) => {
    const getVariantClasses = () => {
        switch (variant) {
            case 'secondary':
                return 'bg-gray-500 hover:bg-gray-600 text-white';
            case 'danger':
                return 'bg-red-500 hover:bg-red-600 text-white';
            case 'success':
                return 'bg-green-500 hover:bg-green-600 text-white';
            default:
                return 'bg-orange-500 hover:bg-orange-600 text-white';
        }
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled || isLoading}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${getVariantClasses()} ${className}`}
        >
            {isLoading ? (
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Loading...</span>
                </div>
            ) : (
                children
            )}
        </button>
    );
};

// Status Badge Component
export const StatusBadge = ({ status, className = '' }) => {
    const getStatusStyles = () => {
        switch (status.toLowerCase()) {
            case 'hadir':
                return 'bg-green-100 text-green-800';
            case 'tidak hadir':
                return 'bg-red-100 text-red-800';
            case 'terlambat':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <span className={`py-1 px-3 rounded-full text-xs font-semibold ${getStatusStyles()} ${className}`}>
            {status}
        </span>
    );
};

// Search Input Component
export const SearchInput = ({ 
    value, 
    onChange,
    placeholder = "Cari...",
    className = '',
    icon: Icon = Search
}) => {
    return (
        <div className={`relative ${className}`}>
            <Icon size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
                type="text"
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-sm"
            />
        </div>
    );
};

// Card Component
export const Card = ({ title, children, className = '', headerAction }) => {
    return (
        <div className={`bg-white rounded-xl shadow-md ${className}`}>
            {title && (
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
                    {headerAction}
                </div>
            )}
            <div className={title ? 'p-6' : 'p-6'}>
                {children}
            </div>
        </div>
    );
};

// Stats Card Component
export const StatsCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'blue',
    className = '' 
}) => {
    const getColorClasses = () => {
        switch (color) {
            case 'green':
                return { border: 'border-green-500', icon: 'text-green-500', value: 'text-green-600' };
            case 'red':
                return { border: 'border-red-500', icon: 'text-red-500', value: 'text-red-600' };
            case 'yellow':
                return { border: 'border-yellow-500', icon: 'text-yellow-500', value: 'text-yellow-600' };
            case 'purple':
                return { border: 'border-purple-500', icon: 'text-purple-500', value: 'text-purple-600' };
            default:
                return { border: 'border-blue-500', icon: 'text-blue-500', value: 'text-blue-600' };
        }
    };

    const colors = getColorClasses();

    return (
        <div className={`bg-white rounded-lg p-4 shadow-sm border-l-4 ${colors.border} ${className}`}>
            <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium text-gray-600">{title}</h4>
                {Icon && <Icon size={24} className={colors.icon} />}
            </div>
            <p className={`text-2xl font-bold ${colors.value}`}>{value}</p>
            {subtitle && (
                <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
            )}
        </div>
    );
};

// Table Component
export const Table = ({ 
    headers, 
    data, 
    renderRow, 
    emptyMessage = "Tidak ada data",
    className = '' 
}) => {
    return (
        <div className={`overflow-x-auto ${className}`}>
            <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                <thead className="bg-orange-500 text-white">
                    <tr>
                        {headers.map((header, index) => (
                            <th 
                                key={index}
                                className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.length > 0 ? (
                        data.map((item, index) => (
                            <tr key={item.id || index} className="hover:bg-gray-50">
                                {renderRow(item, index)}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={headers.length} className="text-center py-8 text-gray-500">
                                {emptyMessage}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// Form Input Component
export const FormInput = ({
    label,
    name,
    type = 'text',
    value,
    onChange,
    error,
    placeholder,
    required = false,
    className = '',
    rightElement
}) => {
    return (
        <div className={`flex flex-col sm:flex-row sm:items-start gap-3 ${className}`}>
            <label className="text-gray-700 font-medium w-24 flex-shrink-0 pt-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex-1">
                <div className="flex gap-2">
                    <input
                        type={type}
                        name={name}
                        value={value}
                        onChange={onChange}
                        placeholder={placeholder}
                        className={`flex-1 px-4 py-2 border rounded-lg focus:ring-1 focus:ring-orange-500 text-sm ${
                            error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'
                        }`}
                    />
                    {rightElement}
                </div>
                {error && (
                    <p className="text-red-500 text-xs mt-1">{error}</p>
                )}
            </div>
        </div>
    );
};

// Header Component
export const PageHeader = ({ title, subtitle, rightElement }) => {
    return (
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
                <h1 className="text-xl md:text-2xl font-semibold text-gray-800">
                    Welcome to Sistem Absensi Reslab, <span className="text-orange-600 font-bold">Admin</span>
                </h1>
                <p className="text-3xl md:text-4xl font-bold mt-2">{title}</p>
                {subtitle && (
                    <p className="text-gray-600 mt-1">{subtitle}</p>
                )}
            </div>
            {rightElement || (
                <div className="mt-4 sm:mt-0 flex items-center bg-white rounded-full py-2 px-4 shadow-sm cursor-pointer">
                    <User size={20} className="text-gray-600 mr-2" />
                    <span className="font-medium text-gray-700">Admin</span>
                    <ChevronDown size={18} className="ml-2 text-gray-500" />
                </div>
            )}
        </header>
    );
};

// Dropdown Component
export const Dropdown = ({ 
    isOpen, 
    onToggle, 
    trigger, 
    items, 
    className = '',
    align = 'right'
}) => {
    const alignmentClasses = align === 'left' ? 'left-0' : 'right-0';

    return (
        <div className={`relative ${className}`}>
            <div onClick={onToggle}>
                {trigger}
            </div>
            {isOpen && (
                <div className={`absolute ${alignmentClasses} mt-2 bg-white border rounded-lg shadow-lg z-10 min-w-max`}>
                    <div className="py-1">
                        {items.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.onClick}
                                className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-sm"
                            >
                                {item.icon && <item.icon size={16} className={item.iconColor || ''} />}
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

// Filter Panel Component
export const FilterPanel = ({ 
    isOpen, 
    children, 
    hasActiveFilters = false,
    onClear,
    className = '' 
}) => {
    if (!isOpen) return null;

    return (
        <div className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-700">Filter Options</h4>
                {hasActiveFilters && onClear && (
                    <button
                        onClick={onClear}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                    >
                        Clear All
                    </button>
                )}
            </div>
            {children}
        </div>
    );
};

// Empty State Component
export const EmptyState = ({ 
    message, 
    actionLabel, 
    onAction, 
    icon: Icon,
    className = '' 
}) => {
    return (
        <div className={`text-center py-8 ${className}`}>
            {Icon && (
                <Icon size={48} className="mx-auto text-gray-400 mb-4" />
            )}
            <p className="text-gray-500 mb-4">{message}</p>
            {actionLabel && onAction && (
                <button
                    onClick={onAction}
                    className="text-orange-600 hover:text-orange-700 font-medium text-sm"
                >
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

// Confirmation Dialog Component
export const ConfirmDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Konfirmasi",
    message,
    confirmLabel = "Konfirmasi",
    cancelLabel = "Batal",
    type = 'warning'
}) => {
    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: AlertTriangle,
                    iconColor: 'text-red-500',
                    buttonColor: 'bg-red-500 hover:bg-red-600'
                };
            case 'success':
                return {
                    icon: CheckCircle,
                    iconColor: 'text-green-500',
                    buttonColor: 'bg-green-500 hover:bg-green-600'
                };
            default:
                return {
                    icon: AlertTriangle,
                    iconColor: 'text-yellow-500',
                    buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
                };
        }
    };

    const styles = getTypeStyles();
    const Icon = styles.icon;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <div className="text-center">
                <Icon size={48} className={`mx-auto ${styles.iconColor} mb-4`} />
                <p className="text-gray-600 mb-6">{message}</p>
                <div className="flex justify-center space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 text-white rounded-lg font-medium ${styles.buttonColor}`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const getSizeClasses = () => {
        switch (size) {
            case 'sm': return 'h-4 w-4';
            case 'lg': return 'h-8 w-8';
            case 'xl': return 'h-12 w-12';
            default: return 'h-6 w-6';
        }
    };

    return (
        <div className={`animate-spin rounded-full border-b-2 border-orange-500 ${getSizeClasses()} ${className}`}></div>
    );
};

// Quick Actions Toolbar Component
export const QuickActions = ({ actions, className = '' }) => {
    return (
        <div className={`flex flex-wrap gap-2 ${className}`}>
            {actions.map((action, index) => (
                <button
                    key={index}
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        action.variant === 'danger' 
                            ? 'bg-red-500 hover:bg-red-600 text-white'
                            : action.variant === 'secondary'
                            ? 'bg-gray-500 hover:bg-gray-600 text-white'
                            : 'bg-orange-500 hover:bg-orange-600 text-white'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    {action.icon && <action.icon size={16} />}
                    <span>{action.label}</span>
                </button>
            ))}
        </div>
    );
};