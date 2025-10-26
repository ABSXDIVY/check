// 用户管理控制器
const { getContractWithFallback } = require('../utils/ethereum');
const { ethers } = require('ethers');

// 开发模式下使用内存存储保存用户信息
const devModeUsersStore = {};

// 角色常量定义
const ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
  OWNER: 'owner',
  SYSTEM: 'system'
};

// 检查用户是否已注册
const checkUserRegistration = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    
    if (!walletAddress) {
      return res.status(400).json({ 
        success: false, 
        message: '钱包地址不能为空' 
      });
    }
    
    // 验证以太坊地址格式
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的以太坊地址' 
      });
    }
    
    // 开发模式下从内存存储检查用户状态
    if (process.env.NODE_ENV === 'development') {
      console.log('开发模式: 从内存存储检查用户状态');
      const lowerCaseAddress = walletAddress.toLowerCase();
      const userInfo = devModeUsersStore[lowerCaseAddress];
      
      if (userInfo) {
        return res.status(200).json({
          success: true,
          isRegistered: true,
          userInfo: userInfo,
          message: '用户已注册（开发模式）',
          developmentMode: true
        });
      }
      
      // 用户未注册
      return res.status(200).json({
        success: true,
        isRegistered: false,
        message: '用户未注册（开发模式）',
        developmentMode: true
      });
    }
    
    // 生产模式下使用智能合约
    const contract = getContractWithFallback();
    
    // 检查合约是否准备就绪
    if (!contract) {
      console.error('智能合约未准备就绪');
      return res.status(500).json({
        success: false,
        message: '智能合约连接失败，请稍后再试'
      });
    }
    
    try {
      // 检查是否是管理员
      let isAdmin = false;
      let isOwner = false;
      
      if (contract.isAdmin) {
        isAdmin = await contract.isAdmin(walletAddress);
      }
      
      if (contract.owner) {
        const ownerAddress = await contract.owner();
        isOwner = ownerAddress.toLowerCase() === walletAddress.toLowerCase();
      }
      
      let role = null;
      if (isOwner) {
        role = ROLES.OWNER;
      } else if (isAdmin) {
        role = ROLES.ADMIN;
      }
      
      let isRegistered = false;
      let studentInfo = null;
      
      if (contract.getStudentInfo) {
        const [name, studentId, registered] = await contract.getStudentInfo(walletAddress);
        isRegistered = registered;
        
        if (isRegistered) {
          studentInfo = {
            name,
            studentId
          };
          role = role || ROLES.STUDENT;
        }
      }
      
      return res.status(200).json({
        success: true,
        isRegistered,
        role,
        isAdmin,
        isOwner,
        studentInfo
      });
    } catch (contractError) {
      console.error('智能合约检查失败:', contractError.message);
      
      if (process.env.NODE_ENV === 'development') {
        const lowerCaseAddress = walletAddress.toLowerCase();
        const userInfo = devModeUsersStore[lowerCaseAddress];
        
        return res.status(200).json({
          success: true,
          isRegistered: !!userInfo,
          userInfo: userInfo,
          message: userInfo ? '用户已注册（开发模式）' : '用户未注册（开发模式）',
          developmentMode: true
        });
      }
      
      return res.status(500).json({
        success: false,
        message: '检查用户注册状态失败',
        error: process.env.NODE_ENV === 'development' ? contractError.message : undefined
      });
    }
  } catch (error) {
    console.error('检查用户注册状态时出错:', error);
    return res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 简化版的用户注册函数
const registerUser = async (req, res) => {
  try {
    const { walletAddress, name, studentId } = req.body;
    
    if (!walletAddress || !name) {
      return res.status(400).json({ 
        success: false, 
        message: '钱包地址和姓名不能为空' 
      });
    }
    
    if (!ethers.isAddress(walletAddress)) {
      return res.status(400).json({ 
        success: false, 
        message: '无效的以太坊地址' 
      });
    }
    
    // 开发模式下使用内存存储
    if (process.env.NODE_ENV === 'development') {
      const lowerCaseAddress = walletAddress.toLowerCase();
      
      // 检查用户是否已注册
      if (devModeUsersStore[lowerCaseAddress]) {
        return res.status(400).json({
          success: false,
          message: '用户已注册（开发模式）',
          developmentMode: true
        });
      }
      
      // 注册用户
      devModeUsersStore[lowerCaseAddress] = {
        walletAddress: lowerCaseAddress,
        name,
        studentId,
        role: ROLES.STUDENT,
        registeredAt: new Date().toISOString()
      };
      
      console.log('开发模式: 用户注册成功', devModeUsersStore[lowerCaseAddress]);
      
      return res.status(200).json({
        success: true,
        message: '用户注册成功（开发模式）',
        userInfo: devModeUsersStore[lowerCaseAddress],
        developmentMode: true
      });
    }
    
    // 生产模式下使用智能合约（简化版）
    return res.status(500).json({
      success: false,
      message: '生产模式暂不可用'
    });
  } catch (error) {
    console.error('用户注册失败:', error);
    return res.status(500).json({
      success: false,
      message: '用户注册失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 其他必要的函数（简化版）
const getUserInfo = async (req, res) => {
  return res.status(200).json({ success: true, message: '功能暂未实现' });
};

const addAdmin = async (req, res) => {
  return res.status(200).json({ success: true, message: '功能暂未实现' });
};

const removeAdmin = async (req, res) => {
  return res.status(200).json({ success: true, message: '功能暂未实现' });
};

// 使用密钥获取临时权限
const emergencyAccessWithKey = async (req, res) => {
  try {
    const { address } = req.params;
    const { key } = req.body;
    
    if (!address) {
      return res.status(400).json({
        success: false,
        message: '钱包地址不能为空'
      });
    }
    
    if (!key) {
      return res.status(400).json({
        success: false,
        message: '访问密钥不能为空'
      });
    }
    
    // 转换为小写地址以保持一致性
    const lowerCaseAddress = address.toLowerCase();
    
    // 检查密钥并返回对应的权限级别
    if (key === 'admin') {
      // 管理员权限
      // 在开发模式下，将权限信息保存到内存存储中
      if (process.env.NODE_ENV === 'development') {
        // 如果用户已存在，更新权限信息
        if (devModeUsersStore[lowerCaseAddress]) {
          devModeUsersStore[lowerCaseAddress].role = ROLES.ADMIN;
          devModeUsersStore[lowerCaseAddress].isAdmin = true;
          devModeUsersStore[lowerCaseAddress].isSystem = false;
        } else {
          // 如果用户不存在，创建新的用户记录
          devModeUsersStore[lowerCaseAddress] = {
            walletAddress: lowerCaseAddress,
            role: ROLES.ADMIN,
            isAdmin: true,
            isSystem: false,
            emergencyAccess: true,
            emergencyAccessTime: new Date().toISOString()
          };
        }
        console.log('开发模式: 用户权限已更新', devModeUsersStore[lowerCaseAddress]);
      }
      
      return res.status(200).json({
        success: true,
        message: '成功获取管理员权限',
        role: ROLES.ADMIN,
        isAdmin: true,
        isSystem: false
      });
    } else if (key === 'xjtuse') {
      // 系统管理员权限
      // 在开发模式下，将权限信息保存到内存存储中
      if (process.env.NODE_ENV === 'development') {
        // 如果用户已存在，更新权限信息
        if (devModeUsersStore[lowerCaseAddress]) {
          devModeUsersStore[lowerCaseAddress].role = ROLES.SYSTEM;
          devModeUsersStore[lowerCaseAddress].isAdmin = true;
          devModeUsersStore[lowerCaseAddress].isSystem = true;
        } else {
          // 如果用户不存在，创建新的用户记录
          devModeUsersStore[lowerCaseAddress] = {
            walletAddress: lowerCaseAddress,
            role: ROLES.SYSTEM,
            isAdmin: true,
            isSystem: true,
            emergencyAccess: true,
            emergencyAccessTime: new Date().toISOString()
          };
        }
        console.log('开发模式: 用户权限已更新', devModeUsersStore[lowerCaseAddress]);
      }
      
      return res.status(200).json({
        success: true,
        message: '成功获取系统管理员权限',
        role: ROLES.SYSTEM,
        isAdmin: true,
        isSystem: true
      });
    } else {
      // 无效密钥
      return res.status(403).json({
        success: false,
        message: '无效的访问密钥'
      });
    }
  } catch (error) {
    console.error('权限验证过程中出错:', error);
    return res.status(500).json({
      success: false,
      message: '权限验证失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const generateTestData = async (req, res) => {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const { count = 5 } = req.body; // 从请求体获取生成数量，默认为5
    
    // 如果不是开发模式，限制功能使用
    if (!isDevelopment) {
      return res.status(403).json({
        success: false,
        message: '测试数据生成功能仅在开发环境中可用'
      });
    }
    
    // 生成模拟的测试数据
    console.log(`开始生成测试数据，数量: ${count}`);
    
    // 生成模拟学生数据
    const mockStudents = [];
    const mockCourses = [];
    const mockAttendances = [];
    
    // 生成学生数据
    for (let i = 1; i <= Math.min(count, 50); i++) { // 限制最大生成50条数据
      const student = {
        address: `0x${Math.random().toString(16).substring(2, 42)}`,
        name: `测试学生${i}`,
        studentId: `TEST${2023}${String(i).padStart(3, '0')}`,
        isRegistered: true,
        registeredAt: new Date().toISOString()
      };
      mockStudents.push(student);
      
      // 保存到开发模式存储中
      devModeUsersStore[student.address.toLowerCase()] = {
        ...student,
        role: ROLES.STUDENT
      };
    }
    
    // 生成课程数据
    const courseNames = ['数学课后辅导', '物理实验课', '英语听力训练', '编程实践', '化学实验'];
    for (let i = 1; i <= Math.min(Math.ceil(count / 5), 10); i++) {
      const now = Date.now();
      const startTime = now + (i * 86400000); // 每天一个课程
      const endTime = startTime + 7200000; // 课程持续2小时
      
      const course = {
        id: i,
        name: courseNames[i % courseNames.length] + i,
        startTime,
        endTime,
        teacher: req.body.walletAddress || '0x0000000000000000000000000000000000000000',
        isActive: true
      };
      mockCourses.push(course);
    }
    
    // 生成签到记录
    mockStudents.forEach((student, studentIndex) => {
      mockCourses.forEach((course, courseIndex) => {
        // 80%的概率生成签到记录
        if (Math.random() < 0.8) {
          const attendance = {
            studentAddress: student.address,
            courseId: course.id,
            timestamp: course.startTime + Math.floor(Math.random() * 3600000), // 课程开始后1小时内的随机时间
            isVerified: Math.random() < 0.9 // 90%的概率已验证
          };
          mockAttendances.push(attendance);
        }
      });
    });
    
    console.log(`测试数据生成完成：${mockStudents.length}名学生，${mockCourses.length}个课程，${mockAttendances.length}条签到记录`);
    
    // 返回生成结果
    return res.status(200).json({
      success: true,
      message: '测试数据生成成功',
      data: {
        students: mockStudents.length,
        courses: mockCourses.length,
        attendances: mockAttendances.length,
        sampleStudents: mockStudents.slice(0, 3), // 返回前3个作为示例
        sampleCourses: mockCourses.slice(0, 3)
      },
      environment: 'development',
      note: '数据仅存储在内存中，服务器重启后会丢失'
    });
  } catch (error) {
    console.error('生成测试数据时出错:', error);
    return res.status(500).json({
      success: false,
      message: '生成测试数据失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  checkUserRegistration,
  registerUser,
  getUserInfo,
  addAdmin,
  removeAdmin,
  emergencyAccessWithKey,
  generateTestData,
  ROLES
};