const { ethers } = require('ethers');
const { getContractWithFallback, waitForTransaction } = require('../utils/ethereum');

// 移除所有本地内存存储，所有数据操作将严格通过智能合约进行



// 学生注册
const registerStudent = async (req, res) => {
  try {
    const { studentAddress, name, studentId } = req.body;

    // 验证数据
    if (!studentAddress || !name || !studentId) {
      return res.status(400).json({
        success: false,
        message: '缺少必要的学生信息'
      });
    }

    // 验证以太坊地址格式
    if (!ethers.isAddress(studentAddress)) {
      return res.status(400).json({
        success: false,
        message: '无效的以太坊地址'
      });
    }

    // 获取合约（带回退机制）
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 先检查学生是否已在合约中注册
    try {
      const [, , isRegistered] = await contract.getStudentInfo(studentAddress);
      if (isRegistered) {
        return res.status(400).json({ 
          success: false, 
          message: '用户已经注册' 
        });
      }
    } catch (error) {
      console.error('检查学生注册状态失败:', error.message);
      return res.status(500).json({
        success: false,
        message: '检查学生注册状态失败',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }

    // 调用智能合约注册学生
    const tx = await contract.registerStudent(studentAddress, name, studentId);
    const receipt = await waitForTransaction(tx);
    
    // 验证交易是否成功
    if (!receipt.success) {
      return res.status(500).json({
        success: false,
        message: '学生注册失败，交易未成功上链',
        transactionHash: receipt.transactionHash
      });
    }
    
    // 返回成功响应
    res.status(201).json({
      success: true,
      message: '学生注册成功',
      transactionHash: receipt.transactionHash,
      student: {
        address: studentAddress,
        name,
        studentId,
        isRegistered: true
      }
    });
  } catch (error) {
    console.error('服务器错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 创建课程
const createCourse = async (req, res) => {
  try {
    const { name, startTime, endTime } = req.body;

    // 验证输入
    if (!name || !startTime || !endTime) {
      return res.status(400).json({ 
        success: false, 
        message: '缺少必要的课程信息' 
      });
    }

    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用，请确保以太坊节点正常运行',
        error: 'Contract not initialized'
      });
    }
    
    // 使用合约创建课程
    const tx = await contract.createCourse(name, startTime, endTime);
    const receipt = await waitForTransaction(tx);
    
    // 验证交易是否成功
    if (!receipt.success) {
      return res.status(500).json({
        success: false,
        message: '课程创建失败，交易未成功上链',
        transactionHash: receipt.transactionHash
      });
    }
    
    // 解析交易事件获取课程ID
    let courseId;
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog && parsedLog.name === 'CourseCreated') {
            courseId = parsedLog.args.courseId.toString();
            break;
          }
        } catch (e) {
          console.warn('解析事件失败:', e.message);
          continue;
        }
      }
    }
    
    // 如果未能从事件中获取课程ID，则通过合约重新获取
    if (!courseId) {
      try {
        // 获取课程总数，最新创建的课程ID应该等于总数
        const courseCount = await contract.getCourseCount();
        courseId = courseCount.toString();
      } catch (error) {
        console.error('获取课程ID失败:', error.message);
        return res.status(500).json({
          success: false,
          message: '课程创建成功，但获取课程ID失败',
          transactionHash: receipt.transactionHash
        });
      }
    }
    
    // 从合约获取完整的课程信息
    let courseInfo;
    try {
      const [courseName, courseStartTime, courseEndTime, teacher, isActive] = await contract.getCourseInfo(courseId);
      courseInfo = {
        id: courseId,
        name: courseName,
        startTime: courseStartTime.toString(),
        endTime: courseEndTime.toString(),
        isActive
      };
    } catch (error) {
      console.error('获取课程信息失败:', error.message);
      // 即使获取课程信息失败，也返回成功，因为课程创建已经成功
      return res.status(201).json({
        success: true,
        message: '课程创建成功，但获取详细信息失败',
        transactionHash: receipt.transactionHash,
        courseId: courseId,
        warning: '无法获取完整的课程信息，请稍后查询'
      });
    }
    
    res.status(201).json({
      success: true,
      message: '课程创建成功',
      transactionHash: receipt.transactionHash,
      course: courseInfo
    });
  } catch (error) {
    console.error('创建课程错误:', error);
    res.status(400).json({
      success: false,
      message: '创建课程失败',
      error: error.toString()
    });
  }
};

// 记录签到
const recordAttendance = async (req, res) => {
  try {
    const { courseId } = req.body;

    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: '课程ID是必需的' 
      });
    }
    
    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 先检查课程是否存在于合约中
    try {
      await contract.getCourseInfo(courseId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '课程不存在',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // 使用合约进行签到
    const tx = await contract.recordAttendance(courseId);
    const receipt = await waitForTransaction(tx);
    
    // 验证交易是否成功
    if (!receipt.success) {
      return res.status(500).json({
        success: false,
        message: '签到失败，交易未成功上链',
        transactionHash: receipt.transactionHash
      });
    }
    
    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '签到成功',
      transactionHash: receipt.transactionHash,
      courseId,
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    console.error('签到记录错误:', error);
    
    // 提供更友好的错误信息
    let errorMessage = error.message || '签到失败';
    if (errorMessage.includes('Not in attendance time range')) {
      errorMessage = '当前不在签到时间范围内，请检查课程的签到时间';
    } else if (errorMessage.includes('Student not registered')) {
      errorMessage = '学生未注册，请先完成注册';
    } else if (errorMessage.includes('Already attended')) {
      errorMessage = '您已经签到过了';
    } else if (errorMessage.includes('Course does not exist')) {
      errorMessage = '课程不存在';
    } else if (errorMessage.includes('Course not active')) {
      errorMessage = '课程已停用，无法签到';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// 批量签到
const batchRecordAttendance = async (req, res) => {
  try {
    const { courseId, studentIds } = req.body;

    if (!courseId || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: '课程ID和学生ID列表是必需的' 
      });
    }
    
    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 先检查课程是否存在于合约中
    try {
      await contract.getCourseInfo(courseId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '课程不存在',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // 使用合约进行批量签到
    const tx = await contract.batchRecordAttendance(courseId, studentIds);
    const receipt = await waitForTransaction(tx);
    
    // 验证交易是否成功
    if (!receipt.success) {
      return res.status(500).json({
        success: false,
        message: '批量签到失败，交易未成功上链',
        transactionHash: receipt.transactionHash
      });
    }
    
    // 解析交易事件以确定哪些学生签到成功，哪些失败
    const results = {
      successful: [],
      failed: []
    };
    
    if (receipt.logs && receipt.logs.length > 0) {
      for (const log of receipt.logs) {
        try {
          const parsedLog = contract.interface.parseLog(log);
          if (parsedLog) {
            if (parsedLog.name === 'AttendanceRecorded') {
              results.successful.push({
                studentId: parsedLog.args.studentId.toString(),
                timestamp: parsedLog.args.timestamp.toString()
              });
            } else if (parsedLog.name === 'AttendanceFailed') {
              results.failed.push({
                studentId: parsedLog.args.studentId.toString(),
                reason: parsedLog.args.reason
              });
            }
          }
        } catch (e) {
          console.warn('解析事件失败:', e.message);
          continue;
        }
      }
    }
    
    // 返回成功响应
    res.status(200).json({
      success: true,
      message: '批量签到处理完成',
      transactionHash: receipt.transactionHash,
      courseId,
      results,
      timestamp: Math.floor(Date.now() / 1000)
    });
  } catch (error) {
    console.error('批量签到错误:', error);
    
    // 提供更友好的错误信息
    let errorMessage = error.message || '批量签到失败';
    if (errorMessage.includes('Not in attendance time range')) {
      errorMessage = '当前不在签到时间范围内，请检查课程的签到时间';
    } else if (errorMessage.includes('Student not registered')) {
      errorMessage = '部分学生未注册';
    } else if (errorMessage.includes('Already attended')) {
      errorMessage = '部分学生已经签到过了';
    } else if (errorMessage.includes('Course does not exist')) {
      errorMessage = '课程不存在';
    } else if (errorMessage.includes('Course not active')) {
      errorMessage = '课程已停用，无法签到';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// 停用课程
const deactivateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ 
        success: false, 
        message: '课程ID是必需的' 
      });
    }
    
    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 先检查课程是否存在于合约中
    try {
      await contract.getCourseInfo(id);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '课程不存在',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // 使用合约停用课程
    const tx = await contract.deactivateCourse(id);
    const receipt = await waitForTransaction(tx);
    
    // 验证交易是否成功
    if (!receipt.success) {
      return res.status(500).json({
        success: false,
        message: '课程停用失败，交易未成功上链',
        transactionHash: receipt.transactionHash
      });
    }
    
    res.status(200).json({
      success: true,
      message: '课程停用成功',
      transactionHash: receipt.transactionHash,
      courseId: id
    });
  } catch (error) {
    console.error('停用课程错误:', error);
    
    // 提供更友好的错误信息
    let errorMessage = error.message || '停用课程失败';
    if (errorMessage.includes('Course does not exist')) {
      errorMessage = '课程不存在';
    } else if (errorMessage.includes('Not the course creator')) {
      errorMessage = '您没有权限停用此课程';
    }
    
    res.status(400).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};



// 获取学生信息
const getStudentInfo = async (req, res) => {
  try {
    const { address } = req.params;
    
    // 验证地址格式
    if (!address || !ethers.isAddress(address)) {
      return res.status(400).json({
        success: false,
        message: '无效的以太坊地址'
      });
    }

    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 从智能合约获取学生信息
    const [name, studentId, isRegistered] = await contract.getStudentInfo(address);
    
    if (isRegistered) {
      return res.status(200).json({
        success: true,
        student: {
          address,
          name,
          studentId,
          isRegistered
        }
      });
    } else {
      // 学生未注册
      return res.status(200).json({
        success: true,
        student: {
          address,
          isRegistered: false
        },
        message: '学生未注册'
      });
    }
  } catch (error) {
    console.error('获取学生信息服务器错误:', error.message);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取课程信息
const getCourseInfo = async (req, res) => {
  try {
    const { id: courseId } = req.params;

    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: '课程ID是必需的' 
      });
    }
    
    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 从智能合约获取课程信息
    const [name, startTime, endTime, teacher, isActive] = await contract.getCourseInfo(courseId);
    
    // 检查课程是否存在
    if (name === "" || startTime.toString() === "0") {
      return res.status(404).json({
        success: false,
        message: '课程不存在'
      });
    }
    
    const courseInfo = {
      id: courseId,
      name,
      startTime: startTime.toString(),
      endTime: endTime.toString(),
      isActive
    };
    
    return res.status(200).json({
      success: true,
      course: courseInfo
    });
  } catch (error) {
    console.error('获取课程信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取课程信息失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取所有课程信息
const getAllCourses = async (req, res) => {
  try {
    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 获取课程总数
    const courseCount = await contract.getCourseCount();
    
    // 获取所有课程信息
    const courses = [];
    for (let i = 1; i <= courseCount; i++) {
      try {
        const [name, startTime, endTime, teacher, isActive] = await contract.getCourseInfo(i);
        
        // 检查课程是否有效
        if (name !== "" && startTime.toString() !== "0") {
          courses.push({
            id: i.toString(),
            name,
            startTime: startTime.toString(),
            endTime: endTime.toString(),
            isActive
          });
        }
      } catch (courseError) {
        console.warn(`获取课程ID ${i} 的信息失败:`, courseError.message);
        // 继续获取其他课程信息
      }
    }
    
    return res.status(200).json({
      success: true,
      courses,
      total: courses.length,
      message: courses.length > 0 ? '获取课程列表成功' : '当前没有可显示的课程'
    });
  } catch (error) {
    console.error('获取课程列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取课程列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 检查签到状态
const checkAttendance = async (req, res) => {
  try {
    const { studentAddress, courseId } = req.params;

    if (!studentAddress || !courseId) {
      return res.status(400).json({ 
        success: false, 
        message: '学生地址和课程ID是必需的' 
      });
    }
    
    // 验证以太坊地址格式
    if (!ethers.isAddress(studentAddress)) {
      return res.status(400).json({
        success: false,
        message: '无效的以太坊地址'
      });
    }
    
    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 先检查课程是否存在
    try {
      await contract.getCourseInfo(courseId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '课程不存在',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // 从智能合约检查签到状态
    const isPresent = await contract.checkAttendance(studentAddress, courseId);
    
    return res.status(200).json({
      success: true,
      attendance: {
        studentAddress,
        courseId,
        isPresent,
        message: isPresent ? '学生已签到' : '学生未签到'
      }
    });
  } catch (error) {
    console.error('检查签到状态错误:', error);
    
    // 提供更友好的错误信息
    let errorMessage = error.message || '检查签到状态失败';
    if (errorMessage.includes('Student not registered')) {
      errorMessage = '学生未注册';
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
};

// 获取签到记录
const getAttendanceRecords = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: '课程ID是必需的' 
      });
    }
    
    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 先检查课程是否存在
    try {
      await contract.getCourseInfo(courseId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '课程不存在',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // 从智能合约获取签到记录
    const attendanceRecords = [];
    
    try {
      // 获取签到记录数量
      const recordsCount = await contract.getAttendanceCount(courseId);
      
      // 获取每条记录
      for (let i = 0; i < recordsCount; i++) {
        const [studentId, timestamp] = await contract.getAttendanceRecord(courseId, i);
        
        // 对于每个学生ID，获取学生详细信息
        try {
          // 修正：使用正确的getStudentInfo方法
          const [name, id, isRegistered] = await contract.getStudentInfo(studentId);
          if (isRegistered) {
            attendanceRecords.push({
              studentId: studentId.toString(),
              studentName: name, // 学生名称
              timestamp: timestamp.toString(),
              student: {
                id: id,
                name: name,
                address: studentId
              }
            });
          }
        } catch (studentError) {
          // 如果获取学生信息失败，仍然添加基本记录
          attendanceRecords.push({
            studentId: studentId.toString(),
            timestamp: timestamp.toString(),
            warning: '无法获取学生详细信息'
          });
        }
      }
    } catch (recordsError) {
    console.error('获取签到记录失败:', recordsError.message);
    // 即使获取记录失败，也返回空数组而不是错误
    return res.status(200).json({
      success: true,
      message: '获取签到记录失败，但课程存在',
      records: [],
      courseId
    });
  }
  
  res.status(200).json({
    success: true,
    message: `成功获取 ${attendanceRecords.length} 条签到记录`,
    records: attendanceRecords,
    count: attendanceRecords.length,
    courseId
  });
} catch (error) {
  console.error('获取签到记录服务器错误:', error.message);
  res.status(500).json({
    success: false,
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
}
};

// 获取所有学生信息
const getAllStudents = async (req, res) => {
  try {
    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 从智能合约获取学生总数
    const studentCount = await contract.getStudentCount();
    
    // 获取所有学生信息
    const students = [];
    
    try {
      // 修正：先获取学生地址列表，然后再获取详细信息
      const studentAddresses = await contract.getStudents(0, studentCount);
      
      for (const studentAddress of studentAddresses) {
        try {
          const [name, studentId, isRegistered] = await contract.getStudentInfo(studentAddress);
          
          // 检查学生信息是否有效
          if (isRegistered && name !== "") {
            students.push({
              id: studentId,
              name,
              address: studentAddress
            });
          }
        } catch (studentError) {
          console.warn(`获取学生地址 ${studentAddress} 的信息失败:`, studentError.message);
          // 继续获取其他学生信息
        }
      }
    } catch (error) {
      console.error('获取学生列表失败:', error.message);
    }
    
    return res.status(200).json({
      success: true,
      students,
      total: students.length,
      message: students.length > 0 ? '获取学生列表成功' : '当前没有注册的学生'
    });
  } catch (error) {
    console.error('获取学生列表服务器错误:', error);
    res.status(500).json({
      success: false,
      message: '服务器内部错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 获取未签到学生列表
const remainingStudents = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    if (!courseId) {
      return res.status(400).json({ 
        success: false, 
        message: '课程ID是必需的' 
      });
    }
    
    // 检查合约是否初始化和可用
    const contract = getContractWithFallback();
    if (!contract) {
      return res.status(503).json({
        success: false,
        message: '智能合约不可用',
        error: 'Contract not initialized'
      });
    }
    
    // 先检查课程是否存在
    try {
      await contract.getCourseInfo(courseId);
    } catch (error) {
      return res.status(404).json({
        success: false,
        message: '课程不存在',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    // 从智能合约获取所有学生
    const studentCount = await contract.getStudentCount();
    const allStudents = [];
    
    try {
      // 修正：先获取学生地址列表，然后再获取详细信息
      const studentAddresses = await contract.getStudents(0, studentCount);
      
      for (const studentAddress of studentAddresses) {
        try {
          const [name, studentId, isRegistered] = await contract.getStudentInfo(studentAddress);
          
          if (isRegistered && name !== "") {
            allStudents.push({
              id: studentId,
              name,
              address: studentAddress
            });
          }
        } catch (studentError) {
          console.warn(`获取学生地址 ${studentAddress} 的信息失败:`, studentError.message);
        }
      }
    } catch (error) {
      console.error('获取学生列表失败:', error.message);
    }
    
    // 获取已签到的学生ID列表
    const attendedStudentIds = new Set();
    const recordsCount = await contract.getAttendanceCount(courseId);
    
    for (let i = 0; i < recordsCount; i++) {
      const [studentId] = await contract.getAttendanceRecord(courseId, i);
      attendedStudentIds.add(studentId.toString());
    }
    
    // 过滤出未签到的学生
    const remainingStudentsList = allStudents.filter(student => !attendedStudentIds.has(student.id));
    
    return res.status(200).json({
      success: true,
      students: remainingStudentsList,
      total: remainingStudentsList.length,
      message: remainingStudentsList.length > 0 ? '获取未签到学生列表成功' : '所有学生都已签到'
    });
  } catch (error) {
    console.error('获取未签到学生列表错误:', error);
    res.status(500).json({
      success: false,
      message: '获取未签到学生列表失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  registerStudent,
  createCourse,
  recordAttendance,
  batchRecordAttendance,
  deactivateCourse,
  getStudentInfo,
  getCourseInfo,
  getAllCourses,
  getAllStudents,
  checkAttendance,
  remainingStudents
};