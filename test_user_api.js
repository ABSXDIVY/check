// 测试用户注册API的脚本
const axios = require('axios');

// 模拟的钱包地址（实际使用时应替换为真实的MetaMask地址）
const TEST_WALLET_ADDRESS = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
const BASE_URL = 'http://localhost:5000/api';

testUserRegistration();

async function testUserRegistration() {
  try {
    console.log('开始测试用户注册功能...');
    
    // 1. 测试检查用户注册状态
    console.log('\n1. 测试检查用户注册状态');
    const checkResponse = await axios.post(`${BASE_URL}/users/check`, {
      walletAddress: TEST_WALLET_ADDRESS
    });
    console.log('检查注册状态响应:', checkResponse.data);
    
    // 2. 测试用户注册
    console.log('\n2. 测试用户注册');
    const registerResponse = await axios.post(`${BASE_URL}/users/register`, {
      walletAddress: TEST_WALLET_ADDRESS,
      name: '测试用户',
      email: 'test@example.com',
      studentId: 'TEST2023001'
    });
    console.log('注册响应:', registerResponse.data);
    
    // 3. 再次检查用户注册状态（应该返回已注册）
    console.log('\n3. 再次检查用户注册状态');
    const checkAgainResponse = await axios.post(`${BASE_URL}/users/check`, {
      walletAddress: TEST_WALLET_ADDRESS
    });
    console.log('再次检查响应:', checkAgainResponse.data);
    
    // 4. 测试获取用户信息
    console.log('\n4. 测试获取用户信息');
    const userInfoResponse = await axios.get(`${BASE_URL}/users/${TEST_WALLET_ADDRESS}`);
    console.log('用户信息响应:', userInfoResponse.data);
    
    console.log('\n✅ 所有测试完成！');
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}