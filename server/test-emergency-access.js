const axios = require('axios');

// 测试emergency access端点
async function testEmergencyAccess() {
  const apiUrl = 'http://localhost:5000/api';
  const walletAddress = '0x14dc79964da2c08b23698b3d3cc7ca32193d9955'; // 使用测试地址
  
  console.log('开始测试emergency access端点...');
  
  try {
    // 测试使用admin密钥
    console.log('\n测试1: 使用admin密钥');
    const adminResponse = await axios.post(
      `${apiUrl}/users/${walletAddress}/emergency-access`,
      { key: 'admin' },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('Admin密钥响应:', adminResponse.data);
    
    // 测试使用xjtuse密钥
    console.log('\n测试2: 使用xjtuse密钥');
    const systemResponse = await axios.post(
      `${apiUrl}/users/${walletAddress}/emergency-access`,
      { key: 'xjtuse' },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    console.log('System密钥响应:', systemResponse.data);
    
    // 测试使用无效密钥
    console.log('\n测试3: 使用无效密钥');
    try {
      const invalidResponse = await axios.post(
        `${apiUrl}/users/${walletAddress}/emergency-access`,
        { key: 'invalidkey' },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('无效密钥响应:', invalidResponse.data);
    } catch (error) {
      console.log('无效密钥预期错误:', error.response ? error.response.data : error.message);
    }
    
    // 测试使用无效地址
    console.log('\n测试4: 使用无效地址');
    try {
      const invalidAddressResponse = await axios.post(
        `${apiUrl}/users/invalid-address/emergency-access`,
        { key: 'admin' },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      console.log('无效地址响应:', invalidAddressResponse.data);
    } catch (error) {
      console.log('无效地址预期错误:', error.response ? error.response.data : error.message);
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testEmergencyAccess();