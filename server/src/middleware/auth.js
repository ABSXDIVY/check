const { getSafeContract, isContractReady, getContractWithFallback } = require('../utils/ethereum');

/**
 * 角色验证中间件 - 检查用户是否为管理员、合约所有者或系统权限用户
 */
const requireAdminRole = async (req, res, next) => {
  try {
    // 从请求中获取钱包地址（通常从请求体或头部获取）
    const walletAddress = req.body.walletAddress || req.headers['x-wallet-address'];
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 在开发模式下，如果没有提供钱包地址，使用默认的测试地址
    let finalWalletAddress = walletAddress;
    if (!walletAddress && isDevelopment) {
      console.log('开发模式：未提供钱包地址，使用默认测试地址');
      finalWalletAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // 一个标准的测试钱包地址
    } else if (!walletAddress) {
      // 非开发模式下，仍然需要提供钱包地址
      return res.status(401).json({
        success: false,
        message: '未提供钱包地址，无法验证身份'
      });
    }
    
    // 检查合约是否初始化和可用
    let contract = getSafeContract();
    let isAdmin = false;
    let isOwner = false;
    let isSystem = false;
    
    // 在开发模式下，使用回退合约并模拟管理员权限
    if (isDevelopment) {
      console.log('开发模式：使用模拟权限验证');
      
      // 在开发模式下，使用模拟合约
      contract = getContractWithFallback();
      
      // 在开发模式下，默认给予管理员权限
      // 这里可以根据需要添加特定地址的权限控制逻辑
      isAdmin = true;
      isSystem = true;
      
      console.log(`开发模式：${walletAddress} 被授予管理员权限`);
    } else if (!contract || !isContractReady()) {
      // 生产环境下，如果合约不可用，返回503错误
      return res.status(503).json({
        success: false,
        message: '智能合约不可用，请确保以太坊节点正常运行',
        error: 'Contract not initialized'
      });
    } else {
      // 生产环境下的正常权限检查
      // 检查用户是否为管理员、所有者或系统权限用户
      
      // 检查是否是管理员
      if (contract.isAdmin) {
        isAdmin = await contract.isAdmin(walletAddress);
      }
      
      // 检查是否是合约所有者
      if (contract.owner) {
        const ownerAddress = await contract.owner();
        isOwner = ownerAddress.toLowerCase() === walletAddress.toLowerCase();
      }
      
      // 检查是否拥有系统权限
      if (contract.hasSystemAccess) {
        isSystem = await contract.hasSystemAccess(walletAddress);
      }
    }
    
    // 如果不是管理员、所有者或系统权限用户，则拒绝访问
    if (!isAdmin && !isOwner && !isSystem) {
      return res.status(403).json({
        success: false,
        message: '权限不足，需要管理员、所有者或系统权限',
        error: 'Insufficient permissions'
      });
    }
    
    // 将用户角色信息添加到请求对象中，供后续路由使用
    req.user = {
      walletAddress: finalWalletAddress,
      isAdmin,
      isOwner,
      isSystem
    };
    
    // 继续处理请求
    next();
  } catch (error) {
    console.error('角色验证错误:', error.message);
    res.status(500).json({
      success: false,
      message: '验证用户权限时发生错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 系统权限验证中间件 - 检查用户是否拥有系统最高权限
 */
const requireSystemRole = async (req, res, next) => {
  try {
    // 从请求中获取钱包地址
    const walletAddress = req.body.walletAddress || req.headers['x-wallet-address'];
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 在开发模式下，如果没有提供钱包地址，使用默认的测试地址
    let finalWalletAddress = walletAddress;
    if (!walletAddress && isDevelopment) {
      console.log('开发模式：未提供钱包地址，使用默认测试地址');
      finalWalletAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // 一个标准的测试钱包地址
    } else if (!walletAddress) {
      // 非开发模式下，仍然需要提供钱包地址
      return res.status(401).json({
        success: false,
        message: '未提供钱包地址，无法验证身份'
      });
    }
    
    // 检查合约是否初始化和可用
    let contract;
    let isSystem = false;
    let isAdmin = false;
    let isOwner = false;
    
    // 在开发模式下，使用回退合约并模拟系统权限
    if (isDevelopment) {
      console.log('开发模式：使用模拟系统权限验证');
      
      // 在开发模式下，使用模拟合约
      contract = getContractWithFallback();
      
      // 在开发模式下，默认给予系统权限和管理员权限
      isSystem = true;
      isAdmin = true;
      isOwner = true;
      
      console.log(`开发模式：${walletAddress} 被授予系统管理员和所有者权限`);
    } else {
      // 生产环境下的正常检查
      contract = getSafeContract();
      if (!contract || !isContractReady()) {
        return res.status(503).json({
          success: false,
          message: '智能合约不可用，请确保以太坊节点正常运行',
          error: 'Contract not initialized'
        });
      }
      
      // 检查用户是否拥有系统权限
      if (contract.hasSystemAccess) {
        isSystem = await contract.hasSystemAccess(walletAddress);
      }
    }
    
    // 如果没有系统权限，则拒绝访问
    if (!isSystem) {
      return res.status(403).json({
        success: false,
        message: '权限不足，需要系统最高权限',
        error: 'System permission required'
      });
    }
    
    // 将用户角色信息添加到请求对象中
    req.user = {
      walletAddress: finalWalletAddress,
      isSystem: true,
      isAdmin: isAdmin,
      isOwner: isOwner
    };
    
    // 继续处理请求
    next();
  } catch (error) {
    console.error('系统权限验证错误:', error.message);
    res.status(500).json({
      success: false,
      message: '验证系统权限时发生错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 角色验证中间件 - 仅检查用户是否为合约所有者
 */
const requireOwnerRole = async (req, res, next) => {
  try {
    // 从请求中获取钱包地址
    const walletAddress = req.body.walletAddress || req.headers['x-wallet-address'];
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 在开发模式下，如果没有提供钱包地址，使用默认的测试地址
    let finalWalletAddress = walletAddress;
    if (!walletAddress && isDevelopment) {
      console.log('开发模式：未提供钱包地址，使用默认测试地址');
      finalWalletAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // 一个标准的测试钱包地址
    } else if (!walletAddress) {
      // 非开发模式下，仍然需要提供钱包地址
      return res.status(401).json({
        success: false,
        message: '未提供钱包地址，无法验证身份'
      });
    }
    
    // 检查合约是否初始化和可用
    let contract;
    let isOwner = false;
    
    // 在开发模式下，使用回退合约并模拟所有者权限
    if (isDevelopment) {
      console.log('开发模式：使用模拟所有者权限验证');
      
      // 在开发模式下，使用模拟合约
      contract = getContractWithFallback();
      
      // 在开发模式下，默认给予所有者权限
      isOwner = true;
      
      console.log(`开发模式：${walletAddress} 被授予所有者权限`);
    } else {
      // 生产环境下的正常检查
      contract = getSafeContract();
      if (!contract || !isContractReady()) {
        return res.status(503).json({
          success: false,
          message: '智能合约不可用，请确保以太坊节点正常运行',
          error: 'Contract not initialized'
        });
      }
      
      // 检查是否是合约所有者
      if (contract.owner) {
        const ownerAddress = await contract.owner();
        isOwner = ownerAddress.toLowerCase() === walletAddress.toLowerCase();
      }
    }
    
    // 如果不是所有者，则拒绝访问
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: '权限不足，仅合约所有者可执行此操作',
        error: 'Owner permission required'
      });
    }
    
    // 将用户角色信息添加到请求对象中
    req.user = {
      walletAddress: finalWalletAddress,
      isOwner: true
    };
    
    // 继续处理请求
    next();
  } catch (error) {
    console.error('所有者权限验证错误:', error.message);
    res.status(500).json({
      success: false,
      message: '验证所有者权限时发生错误',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * 简单的身份验证中间件 - 仅检查是否提供了钱包地址
 */
const requireAuth = async (req, res, next) => {
  try {
    // 从请求中获取钱包地址
    const walletAddress = req.body.walletAddress || req.headers['x-wallet-address'];
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // 在开发模式下，如果没有提供钱包地址，使用默认的测试地址
    let finalWalletAddress = walletAddress;
    if (!walletAddress && isDevelopment) {
      console.log('开发模式：未提供钱包地址，使用默认测试地址');
      finalWalletAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'; // 一个标准的测试钱包地址
    } else if (!walletAddress) {
      // 非开发模式下，仍然需要提供钱包地址
      return res.status(401).json({
        success: false,
        message: '未提供钱包地址，需要身份验证'
      });
    }
    
    // 验证钱包地址格式
    const { ethers } = require('ethers');
    if (!ethers.isAddress(finalWalletAddress)) {
      return res.status(400).json({
        success: false,
        message: '无效的以太坊地址'
      });
    }
    
    // 将钱包地址添加到请求对象中
    req.user = {
      walletAddress: finalWalletAddress
    };
    
    // 继续处理请求
    next();
  } catch (error) {
    console.error('身份验证错误:', error.message);
    res.status(500).json({
      success: false,
      message: '身份验证失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  requireAdminRole,
  requireOwnerRole,
  requireSystemRole,
  requireAuth
};