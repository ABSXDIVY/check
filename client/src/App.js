import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, Menu, Button, message, Modal, Form, Input } from 'antd';
import { UserOutlined, BookOutlined, ClockCircleOutlined, HomeOutlined, LogoutOutlined, LoginOutlined, UserAddOutlined } from '@ant-design/icons';

// 导入页面组件
import HomePage from './pages/HomePage';
import StudentManagement from './pages/StudentManagement';
import CourseManagement from './pages/CourseManagement';
import AttendancePage from './pages/AttendancePage';
import NotFoundPage from './pages/NotFoundPage';

const { Header, Content, Footer, Sider } = Layout;

function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registerModalVisible, setRegisterModalVisible] = useState(false);
  const [registerForm] = Form.useForm();
  const [isCheckingRegistration, setIsCheckingRegistration] = useState(false);
  const [userRole, setUserRole] = useState(null); // student, admin, owner, system
  const [isAdmin, setIsAdmin] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [isSystem, setIsSystem] = useState(false);
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [emergencyForm] = Form.useForm();

  // 提取权限恢复逻辑为单独函数，方便复用 - 使用useCallback确保函数引用稳定
  const restorePermissionsFromLocalStorage = useCallback((address) => {
    const walletKey = `permissions_${address.toLowerCase()}`;
    const savedPermissions = localStorage.getItem(walletKey);
    
    if (savedPermissions) {
      try {
        const permissions = JSON.parse(savedPermissions);
        // 只有在保存的权限未过期时才恢复
        if (!permissions.expiry || new Date(permissions.expiry) > new Date()) {
          console.log('从localStorage恢复权限:', permissions);
          setIsAdmin(permissions.isAdmin);
          setIsSystem(permissions.isSystem);
          setUserRole(permissions.userRole);
          // 返回true表示成功恢复了权限
          return true;
        } else {
          // 权限已过期，清除存储
          localStorage.removeItem(walletKey);
          console.log('权限已过期，已清除');
        }
      } catch (parseError) {
        console.error('解析保存的权限信息失败:', parseError);
      }
    }
    // 返回false表示没有恢复权限或恢复失败
    return false;
  }, []); // 移除isAdmin和isSystem依赖，避免循环更新

  // 检查用户是否已注册并获取角色信息 - 使用useCallback确保函数引用稳定
  const checkUserRegistration = useCallback(async (address, hasLocalPermissions) => {
    if (!address) return;
    
    setIsCheckingRegistration(true);
    try {
      // 调用后端API检查用户是否已注册并获取角色信息
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/users/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });
      
      if (response.ok) {
        const data = await response.json();
        
        console.log('从API获取的用户数据:', data);
        console.log('是否有本地权限:', hasLocalPermissions);
        
        // 仅更新注册状态，不更新权限状态
        setIsRegistered(data.isRegistered);
        setIsOwner(data.isOwner); // 仅更新所有者状态
        
        // 权限保护逻辑：只有当没有本地权限时，才从API更新权限
        if (!hasLocalPermissions) {
          console.log('没有本地权限，从API更新权限');
          setUserRole(data.role);
          setIsAdmin(data.isAdmin || data.isSystem);
          setIsSystem(data.isSystem);
        } else {
          console.log('已有本地权限，保持当前权限状态');
          // 保持现有权限，不做任何更新
        }
        
        // 如果用户未注册且没有权限，显示注册弹窗
        if (!data.isRegistered && !hasLocalPermissions && !data.isOwner) {
          setTimeout(() => {
            setRegisterModalVisible(true);
          }, 1000);
        }
      } else {
        console.error('检查用户注册状态失败');
      }
    } catch (error) {
      console.error('检查用户注册状态时发生错误:', error);
    } finally {
      setIsCheckingRegistration(false);
    }
  }, []); // 移除循环依赖
  
  // 单独的账户变更处理函数，避免重复代码 - 使用useCallback确保函数引用稳定
  const handleAccountsChanged = useCallback((accounts) => {
    if (accounts.length > 0) {
      const newAddress = accounts[0];
      setWalletAddress(newAddress);
      setIsConnected(true);
      message.success('账户已更新');
      
      // 重置所有权限状态，避免来自之前账户的权限影响
      setIsSystem(false);
      setIsAdmin(false);
      setUserRole(null);
      
      // 立即从localStorage恢复权限
      const hasLocalPermissions = restorePermissionsFromLocalStorage(newAddress);
      
      // 延迟执行checkUserRegistration，但传入是否有本地权限的标志
      setTimeout(() => {
        checkUserRegistration(newAddress, hasLocalPermissions);
      }, 100);
    } else {
      setWalletAddress('');
      setIsConnected(false);
      setIsRegistered(false);
      // 重置权限状态
      setIsSystem(false);
      setIsAdmin(false);
      setUserRole(null);
      message.info('已断开与钱包的连接');
    }
  }, [checkUserRegistration, restorePermissionsFromLocalStorage]); // 依赖项：其他useCallback包装的函数

  // 检查钱包连接状态并恢复持久化的权限信息
  useEffect(() => {
    const checkConnection = () => {
      try {
        if (window.ethereum) {
          window.ethereum.request({ method: 'eth_accounts' })
            .then(accounts => {
              if (accounts.length > 0) {
                const address = accounts[0];
                setWalletAddress(address);
                setIsConnected(true);
                
                // 先重置所有权限状态
                setIsSystem(false);
                setIsAdmin(false);
                setUserRole(null);
                
                // 立即从localStorage恢复权限
                const hasLocalPermissions = restorePermissionsFromLocalStorage(address);
                
                // 延迟执行checkUserRegistration，但传入是否有本地权限的标志
                setTimeout(() => {
                  checkUserRegistration(address, hasLocalPermissions);
                }, 100);
              }
            })
            .catch(error => {
              console.error('Error getting accounts:', error);
            });

          // 使用统一的账户变化处理函数
          window.ethereum.on('accountsChanged', handleAccountsChanged);
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    };

    checkConnection();
    
    // 组件卸载时清除监听器，避免内存泄漏
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
      }
    };
  }, [handleAccountsChanged, checkUserRegistration, restorePermissionsFromLocalStorage]);

  // 连接钱包
  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.ethereum) {
        message.error('请安装MetaMask钱包');
        return;
      }
      
      // 先显示提示，告知用户可以在MetaMask中选择账户
      message.info('请在MetaMask弹窗中选择要连接的账户');
      
      // 使用eth_requestAccounts方法触发MetaMask弹窗
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      // 检查是否成功获取了账户
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        setIsConnected(true);
        message.success('钱包连接成功');
        
        // 确保正确注册账户变更监听器
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        
        // 使用提取的函数恢复权限
        await restorePermissionsFromLocalStorage(accounts[0]);
        
        // 延迟执行checkUserRegistration，确保权限状态已完全恢复
        setTimeout(() => {
          checkUserRegistration(accounts[0]);
        }, 100);
      } else {
        message.warning('未选择账户，请重新尝试连接');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      
      // 针对不同错误类型提供更具体的提示
      if (error.code === 4001) { // 用户拒绝连接
        message.warning('请允许连接MetaMask以继续使用');
      } else if (error.code === -32603) { // 内部错误
        message.error('MetaMask内部错误，请检查MetaMask是否正常运行');
      } else {
        message.error('钱包连接失败，请重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // 用户注册处理函数
  const handleRegister = async (values) => {
    setLoading(true);
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await fetch(`${apiUrl}/users/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          walletAddress,
          name: values.name,
          email: values.email,
          studentId: values.studentId,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        // 注册成功
        setIsRegistered(true);
        setRegisterModalVisible(false);
        registerForm.resetFields();
        message.success('注册成功！');
      } else {
        // 注册失败，但可能是已知的错误情况
        if (data.message === '该钱包地址已注册' && data.userInfo) {
          // 钱包已注册，显示友好提示并包含已注册信息
          setRegisterModalVisible(false);
          setIsRegistered(true);
          message.info(`该钱包地址已注册，注册信息：姓名 ${data.userInfo.name}，学号 ${data.userInfo.studentId}`);
        } else {
          // 其他错误
          message.error(data.message || '注册失败，请重试');
        }
      }
    } catch (error) {
      console.error('注册时发生错误:', error);
      message.error('网络错误，请检查连接后重试');
    } finally {
      setLoading(false);
    }
  };

  // 断开钱包
  const disconnectWallet = async () => {
    try {
      setLoading(true);
      // 清除localStorage中保存的权限信息
      if (walletAddress) {
        const walletKey = `permissions_${walletAddress.toLowerCase()}`;
        localStorage.removeItem(walletKey);
        console.log('已清除localStorage中的权限信息');
      }
      
      // 重置React状态
      setWalletAddress('');
      setIsConnected(false);
      setIsRegistered(false);
      setRegisterModalVisible(false);
      // 重置权限状态
      setIsSystem(false);
      setIsAdmin(false);
      setUserRole(null);
      
      message.success('已完全断开钱包连接');
      
      if (window.ethereum) {
        // 清除所有监听器
        window.ethereum.removeAllListeners();
        
        // 在断开连接后立即重新注册accountsChanged事件，以确保新连接能正确响应
        window.ethereum.on('accountsChanged', (accounts) => {
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            setIsConnected(true);
          } else {
            setWalletAddress('');
            setIsConnected(false);
          }
        });
        
        // 提供明确指导
        setTimeout(() => {
            message.info('要连接到新账户，请点击"连接钱包"按钮并在MetaMask中选择其他账户');
          }, 1000);
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // 即使出错也要重置状态
      setWalletAddress('');
      setIsConnected(false);
      message.warning('钱包状态已重置，请手动重新连接');
    } finally {
      setLoading(false);
    }
  };

  // 刷新钱包连接（用于切换账户）
  const refreshWalletConnection = async () => {
    try {
      setLoading(true);
      if (window.ethereum) {
        // 显示提示，告知用户可以在MetaMask弹窗中选择不同的账户
        message.info('请在MetaMask弹窗中选择要切换的账户');
        
        // 首先尝试使用wallet_requestPermissions方法请求新权限，这会强制显示账户选择界面
        try {
          await window.ethereum.request({
            method: 'wallet_requestPermissions',
            params: [{ eth_accounts: {} }]
          });
        } catch (permissionError) {
          console.warn('Permission request failed, falling back to eth_requestAccounts:', permissionError);
        }
        
        // 然后使用eth_requestAccounts方法获取账户，这应该会弹出账户选择窗口
        const accounts = await window.ethereum.request({
          method: 'eth_requestAccounts'
        });
        
        // 检查是否切换到了新账户
        if (accounts[0] !== walletAddress) {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
          message.success('账户切换成功');
        } else {
          // 如果仍然显示是当前账户，提供更明确的指导
          message.info('使用的是当前账户。要切换账户，请在MetaMask弹窗中选择不同的账户，或先断开连接后重新连接。');
        }
      }
    } catch (error) {
      console.error('Error refreshing wallet connection:', error);
      
      // 区分不同的错误情况，提供更精确的提示
      if (error.code === 4001) { // 用户拒绝连接
        message.warning('请在MetaMask中允许连接以切换账户');
      } else {
        message.error('账户切换失败，请尝试先断开连接后重新连接');
      }
    } finally {
      setLoading(false);
    }
  };

  // 格式化地址显示
  const formatAddress = (address) => {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  return (
    <Router future={{
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }}>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <div className="logo" style={{ fontSize: '20px', fontWeight: 'bold', color: '#1890ff' }}>
            以太坊签到系统
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {isConnected ? (
              <>
                <span style={{ color: '#333', fontSize: '14px', marginRight: '8px' }}>
                  {formatAddress(walletAddress)}
                  {isOwner && (
                    <span style={{ marginLeft: '8px', color: '#ff4d4f' }}>（所有者）</span>
                  )}
                  {!isOwner && isSystem && (
                    <span style={{ marginLeft: '8px', color: '#722ed1' }}>（系统管理员）</span>
                  )}
                  {!isOwner && !isSystem && isAdmin && (
                    <span style={{ marginLeft: '8px', color: '#1890ff' }}>（管理员）</span>
                  )}
                  {!isOwner && !isAdmin && isRegistered && (
                    <span style={{ marginLeft: '8px', color: '#52c41a' }}>（学生）</span>
                  )}
                  {!isOwner && !isAdmin && !isRegistered && isConnected && !isCheckingRegistration && (
                    <span style={{ marginLeft: '8px', color: '#faad14' }}>（未注册）</span>
                  )}
                </span>
                {!isRegistered && !isAdmin && !isOwner && (
                  <Button 
                    type="default" 
                    icon={<UserAddOutlined />} 
                    onClick={() => setRegisterModalVisible(true)}
                    size="small"
                    style={{ marginRight: '8px' }}
                  >
                    注册
                  </Button>
                )}
                <Button 
                  type="primary" 
                  icon={<UserOutlined />} 
                  onClick={refreshWalletConnection}
                  loading={loading}
                  size="small" 
                  style={{ marginRight: '8px' }}
                >
                  切换账户
                </Button>
                <Button 
                  type="default" 
                  onClick={() => setEmergencyModalVisible(true)}
                  size="small" 
                  style={{ marginRight: '8px' }}
                >
                  获取权限
                </Button>
                <Button 
                  type="primary" 
                  danger 
                  icon={<LogoutOutlined />} 
                  onClick={disconnectWallet}
                  size="small"
                >
                  断开
                </Button>
              </>
            ) : (
              <Button 
                type="primary" 
                icon={<LoginOutlined />} 
                onClick={connectWallet}
                loading={loading}
                size="small"
              >
                连接钱包
              </Button>
            )}
          </div>
        </Header>
        <Layout>
          <Sider 
            width={200} 
            theme="light" 
            collapsible 
            collapsed={collapsed} 
            onCollapse={(value) => setCollapsed(value)}
            style={{ background: '#fff' }}
          >
            <Menu
              mode="inline"
              selectedKeys={[window.location.pathname]}
              style={{ height: '100%', borderRight: 0 }}
              items={[
                {
                  key: '/',
                  icon: <HomeOutlined />,
                  label: <a href="/">首页</a>
                },
                ...((isAdmin || isOwner || isSystem) ? [
                  {
                    key: '/students',
                    icon: <UserOutlined />,
                    label: <a href="/students">学生管理</a>
                  },
                  {
                    key: '/courses',
                    icon: <BookOutlined />,
                    label: <a href="/courses">课程管理</a>
                  }
                ] : []),
                {
                  key: '/attendance',
                  icon: <ClockCircleOutlined />,
                  label: <a href="/attendance">签到管理</a>
                }
              ]}
            />
          </Sider>
          <Content style={{ padding: '24px', background: '#f5f5f5' }}>
            <Routes>
              <Route path="/" element={<HomePage isConnected={isConnected} walletAddress={walletAddress} isRegistered={isRegistered} isAdmin={isAdmin} isSystem={isSystem} />} />
              <Route path="/students" element={<StudentManagement isConnected={isConnected} isRegistered={isRegistered} isAdmin={isAdmin} isOwner={isOwner} isSystem={isSystem} />} />
              <Route path="/courses" element={<CourseManagement isConnected={isConnected} isRegistered={isRegistered} isAdmin={isAdmin} isOwner={isOwner} isSystem={isSystem} />} />
              <Route path="/attendance" element={<AttendancePage isConnected={isConnected} isRegistered={isRegistered} isAdmin={isAdmin} isOwner={isOwner} isSystem={isSystem} />} />
              <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Content>
      </Layout>
        
        {/* 密钥认证获取权限弹窗 */}
        <Modal
          title="获取权限"
          open={emergencyModalVisible}
          onCancel={() => {
            setEmergencyModalVisible(false);
            emergencyForm.resetFields();
          }}
          footer={null}
          destroyOnHidden
        >
          <Form
            form={emergencyForm}
            layout="vertical"
            onFinish={async (values) => {
              try {
                setLoading(true);
                const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
                const response = await fetch(`${apiUrl}/users/${walletAddress}/emergency-access`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ key: values.accessKey }),
                });
                
                const data = await response.json();
                if (data.success) {
                  // 更新用户权限状态
                  const isSystemRole = values.accessKey === 'xjtuse';
                  const isAdminRole = isSystemRole || values.accessKey === 'admin';
                  const role = isSystemRole ? 'system' : 'admin';
                  
                  setIsSystem(isSystemRole);
                  setIsAdmin(isAdminRole);
                  setUserRole(role);
                  
                  // 持久化保存权限到localStorage
                  const walletKey = `permissions_${walletAddress.toLowerCase()}`;
                  const expiryTime = new Date();
                  expiryTime.setHours(expiryTime.getHours() + 24); // 权限有效期24小时
                  
                  const permissionsData = {
                    isAdmin: isAdminRole,
                    isSystem: isSystemRole,
                    userRole: role,
                    expiry: expiryTime.toISOString(),
                    acquiredAt: new Date().toISOString()
                  };
                  
                  localStorage.setItem(walletKey, JSON.stringify(permissionsData));
                  console.log('权限已保存到localStorage，有效期至:', expiryTime);
                  
                  message.success(isSystemRole ? '已成功获取系统管理员权限！' : '已成功获取管理员权限！');
                  setEmergencyModalVisible(false);
                  emergencyForm.resetFields();
                  
                  // 不需要触发storage事件，React状态更新会自动触发渲染
                  // 确保权限状态稳定
                } else {
                  message.error(data.message || '密钥认证失败');
                }
              } catch (error) {
                console.error('密钥认证失败:', error);
                message.error('网络错误，请检查连接后重试');
              } finally {
                setLoading(false);
              }
            }}
            initialValues={{}}
          >
            <Form.Item
              label="访问密钥"
              name="accessKey"
              rules={[{ required: true, message: '请输入访问密钥' }]}
            >
              <Input.Password placeholder="请输入访问密钥" />
            </Form.Item>
            
            <p style={{ color: '#8c8c8c', fontSize: '12px', marginBottom: '16px' }}>
              提示：输入"admin"获取管理员权限，输入"xjtuse"获取系统管理员权限
            </p>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                获取权限
              </Button>
            </Form.Item>
          </Form>
        </Modal>
        <Footer style={{ textAlign: 'center', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
          以太坊签到系统 ©{new Date().getFullYear()} Created by Smart Contract Team
        </Footer>
      </Layout>
        
        {/* 用户注册弹窗 */}
        <Modal
          title="用户注册"
          open={registerModalVisible}
          onCancel={() => setRegisterModalVisible(false)}
          footer={null}
          destroyOnHidden
        >
          <Form
            form={registerForm}
            layout="vertical"
            onFinish={handleRegister}
            initialValues={{}}
          >
            <Form.Item
              label="钱包地址"
              name="walletAddress"
              initialValue={walletAddress}
            >
              <Input disabled placeholder="钱包地址" />
            </Form.Item>
            
            <Form.Item
              label="姓名"
              name="name"
              rules={[{ required: true, message: '请输入姓名' }]}
            >
              <Input placeholder="请输入您的姓名" />
            </Form.Item>
            
            <Form.Item
              label="学号"
              name="studentId"
              rules={[{ required: true, message: '请输入学号' }]}
            >
              <Input placeholder="请输入您的学号" />
            </Form.Item>
            
            <Form.Item
              label="邮箱"
              name="email"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '请输入有效的邮箱地址' }
              ]}
            >
              <Input placeholder="请输入您的邮箱地址" />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} style={{ width: '100%' }}>
                注册
              </Button>
            </Form.Item>
          </Form>
        </Modal>
    </Router>
  );
}

export default App;