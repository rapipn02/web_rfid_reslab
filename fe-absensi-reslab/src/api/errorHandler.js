


export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}


export class NetworkError extends Error {
  constructor(message = 'Network error occurred') {
    super(message);
    this.name = 'NetworkError';
  }
}


export class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}


export const handleApiError = (error) => {
  console.error('API Error:', error);

  
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      success: false,
      message: 'Koneksi ke server gagal. Periksa koneksi internet Anda.',
      error: new NetworkError()
    };
  }

  
  if (error.status) {
    switch (error.status) {
      case 400:
        return {
          success: false,
          message: error.message || 'Data yang dikirim tidak valid.',
          error: new ValidationError(error.message, error.data?.errors)
        };
      case 401:
        return {
          success: false,
          message: 'Sesi Anda telah berakhir. Silakan login kembali.',
          error: new ApiError(error.message, 401)
        };
      case 403:
        return {
          success: false,
          message: 'Anda tidak memiliki akses untuk melakukan tindakan ini.',
          error: new ApiError(error.message, 403)
        };
      case 404:
        return {
          success: false,
          message: 'Data yang dicari tidak ditemukan.',
          error: new ApiError(error.message, 404)
        };
      case 422:
        return {
          success: false,
          message: 'Data yang dikirim tidak valid.',
          error: new ValidationError(error.message, error.data?.errors)
        };
      case 500:
        return {
          success: false,
          message: 'Terjadi kesalahan pada server. Silakan coba lagi.',
          error: new ApiError(error.message, 500)
        };
      default:
        return {
          success: false,
          message: error.message || 'Terjadi kesalahan yang tidak diketahui.',
          error: new ApiError(error.message, error.status)
        };
    }
  }

  
  return {
    success: false,
    message: error.message || 'Terjadi kesalahan yang tidak diketahui.',
    error: error
  };
};


export const isNetworkError = (error) => {
  return error instanceof NetworkError || 
         (error.name === 'TypeError' && error.message.includes('fetch'));
};


export const isValidationError = (error) => {
  return error instanceof ValidationError || 
         (error.status && [400, 422].includes(error.status));
};


export const isAuthError = (error) => {
  return error.status && [401, 403].includes(error.status);
};


export const formatErrorMessage = (error) => {
  if (isNetworkError(error)) {
    return 'Koneksi ke server gagal. Periksa koneksi internet Anda.';
  }

  if (isValidationError(error)) {
    if (error.errors && error.errors.length > 0) {
      return error.errors.join(', ');
    }
    return error.message || 'Data yang dikirim tidak valid.';
  }

  if (isAuthError(error)) {
    return 'Sesi Anda telah berakhir. Silakan login kembali.';
  }

  return error.message || 'Terjadi kesalahan yang tidak diketahui.';
};
