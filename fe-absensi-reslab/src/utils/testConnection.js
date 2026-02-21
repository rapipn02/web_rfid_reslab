


export const testBackendConnection = async () => {
  const backendUrl = 'http://localhost:5000';
  
  console.log('Testing Backend Connection...');
  
  try {
    
    console.log('1. Testing Health Check...');
    const healthResponse = await fetch(`${backendUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('Health Check Success:', healthData);
    
    
    console.log('2. Testing API Base...');
    const apiResponse = await fetch(`${backendUrl}/api`);
    if (apiResponse.ok) {
      const apiData = await apiResponse.json();
      console.log('API Base Success:', apiData);
    } else {
      console.log('API Base Error:', apiResponse.status);
    }
    
    
    console.log('3. Testing CORS...');
    const corsResponse = await fetch(`${backendUrl}/api/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5000'
      }
    });
    
    if (corsResponse.ok) {
      console.log('CORS Success');
    } else {
      console.log('CORS Error:', corsResponse.status);
    }
    
    return true;
  } catch (error) {
    console.error('Backend Connection Failed:', error);
    return false;
  }
};


export const testApiConfig = () => {
  console.log('Testing API Configuration...');
  
  const config = {
    MODE: import.meta.env.MODE,
    VITE_API_URL: import.meta.env.VITE_API_URL,
    NODE_ENV: import.meta.env.NODE_ENV
  };
  
  console.log('Environment Variables:', config);
  
  
  const required = ['VITE_API_URL'];
  const missing = required.filter(key => !import.meta.env[key]);
  
  if (missing.length > 0) {
    console.warn('Missing Environment Variables:', missing);
  } else {
    console.log('All Environment Variables Present');
  }
  
  return config;
};


export const runConnectionTests = async () => {
  console.log('Starting Connection Tests...');
  console.log('=====================================');
  
  
  testApiConfig();
  
  console.log('=====================================');
  
  
  await testBackendConnection();
  
  console.log('=====================================');
  console.log('Connection Tests Completed');
};


if (import.meta.env.MODE === 'development') {
  console.log('Development Mode - Auto-running connection tests...');
  setTimeout(() => runConnectionTests(), 1000);
}
