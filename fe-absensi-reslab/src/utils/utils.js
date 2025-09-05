// Date formatting utilities
export const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
};

export const formatTime = (timeString) => {
    if (!timeString || timeString === '-') return '-';
    return timeString;
};

export const getCurrentDate = () => {
    return new Date().toISOString().split('T')[0];
};

export const getCurrentTime = () => {
    return new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
};

// Validation utilities
export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validateNIM = (nim) => {
    return /^\d{6,}$/.test(nim.trim());
};

export const validateRFID = (rfid) => {
    return rfid.trim().length >= 4;
};

export const validateName = (name) => {
    return name.trim().length >= 2;
};

// Data processing utilities
export const sortByDate = (data, ascending = false) => {
    return [...data].sort((a, b) => {
        const dateA = new Date(a.tanggal);
        const dateB = new Date(b.tanggal);
        return ascending ? dateA - dateB : dateB - dateA;
    });
};

export const groupByDate = (data) => {
    return data.reduce((groups, item) => {
        const date = item.tanggal;
        if (!groups[date]) {
            groups[date] = [];
        }
        groups[date].push(item);
        return groups;
    }, {});
};

export const calculateAttendancePercentage = (present, total) => {
    if (total === 0) return 0;
    return ((present / total) * 100).toFixed(1);
};

// Export utilities
export const downloadFile = (content, filename, type = 'text/plain') => {
    const blob = new Blob([content], { type: `${type};charset=utf-8;` });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

// Search utilities
export const searchInMultipleFields = (item, searchTerm, fields) => {
    const term = searchTerm.toLowerCase();
    return fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
    });
};

// Pagination utilities
export const getPaginationInfo = (currentPage, totalItems, itemsPerPage) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    
    return {
        totalPages,
        startIndex,
        endIndex,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1
    };
};

// Generate pagination range for display
export const getPaginationRange = (currentPage, totalPages, maxVisible = 5) => {
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

// RFID utilities
export const generateRFIDId = (prefix = 'RF') => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix;
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

export const formatRFID = (rfid) => {
    return rfid.toUpperCase().trim();
};

// Status utilities
export const getStatusBadgeClass = (status) => {
    const baseClasses = 'py-1 px-3 rounded-full text-xs font-semibold';
    
    switch (status.toLowerCase()) {
        case 'hadir':
            return `${baseClasses} bg-green-100 text-green-800`;
        case 'tidak hadir':
            return `${baseClasses} bg-red-100 text-red-800`;
        case 'terlambat':
            return `${baseClasses} bg-yellow-100 text-yellow-800`;
        default:
            return `${baseClasses} bg-gray-100 text-gray-800`;
    }
};

// Date range utilities
export const getDateRange = (startDate, endDate) => {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
        dates.push(new Date(date).toISOString().split('T')[0]);
    }
    
    return dates;
};

// Local storage utilities (for future use outside Claude environment)
export const saveToStorage = (key, data) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save to storage:', error);
        return false;
    }
};

export const loadFromStorage = (key, defaultValue = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Failed to load from storage:', error);
        return defaultValue;
    }
};

// Array utilities
export const removeDuplicates = (array, key) => {
    return array.filter((item, index, self) => 
        index === self.findIndex(t => t[key] === item[key])
    );
};

export const sortAlphabetically = (array, key, ascending = true) => {
    return [...array].sort((a, b) => {
        const aVal = a[key].toLowerCase();
        const bVal = b[key].toLowerCase();
        return ascending ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    });
};

// Safe string utilities
export const safeString = (value) => {
    return typeof value === 'string' ? value : (value || '').toString();
};

export const safeTrim = (value) => {
    return safeString(value).trim();
};

export const compareValues = (value1, value2) => {
    return safeTrim(value1) === safeTrim(value2);
};

// Form utilities
export const trimFormData = (formData) => {
    const trimmed = {};
    Object.keys(formData).forEach(key => {
        trimmed[key] = safeTrim(formData[key]);
    });
    return trimmed;
};

export const hasFormErrors = (errors) => {
    return Object.values(errors).some(error => error && error.length > 0);
};

// Statistics utilities
export const calculateStats = (data, statusField = 'status') => {
    const total = data.length;
    const hadir = data.filter(item => item[statusField] === 'Hadir').length;
    const tidakHadir = data.filter(item => item[statusField] === 'Tidak Hadir').length;
    
    return {
        total,
        hadir,
        tidakHadir,
        attendanceRate: total > 0 ? ((hadir / total) * 100).toFixed(1) : 0,
        absenceRate: total > 0 ? ((tidakHadir / total) * 100).toFixed(1) : 0
    };
};

// Debounce utility for search
export const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};