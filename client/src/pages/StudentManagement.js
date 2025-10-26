import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Table, message, Modal, Spin, Tag } from 'antd';
import { UserOutlined, SearchOutlined, SaveOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import axios from 'axios';

const StudentManagement = ({ isConnected, isAdmin, isOwner, isSystem }) => {
  const [form] = Form.useForm();
  const [adminForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [studentData, setStudentData] = useState(null);
  const [students, setStudents] = useState([]);
  const [searchMode, setSearchMode] = useState(false);
  const [adminModalVisible, setAdminModalVisible] = useState(false);
  const [adminAction, setAdminAction] = useState('add'); // 'add' or 'remove'

  // 获取所有学生列表
  // 使用useCallback包裹fetchAllStudents函数
  const fetchAllStudents = useCallback(async () => {
    if (!isConnected) {
      return;
    }

    try {
      setStudentsLoading(true);
      const response = await axios.get(
        process.env.REACT_APP_API_URL + '/students'
      );
      
      if (response.data.success) {
        // 确保每个学生对象都有角色信息
        const studentsWithRoles = (response.data.students || []).map(student => ({
          ...student,
          role: student.role || 'student'
        }));
        setStudents(studentsWithRoles);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      message.error('获取学生列表失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setStudentsLoading(false);
    }
  }, [isConnected]);
  
  // 添加管理员
  const handleAddAdmin = async (values) => {
    if (!isConnected || (!isOwner && !isSystem)) {
      message.error('只有合约所有者或系统管理员可以添加管理员');
      return;
    }

    try {
      setAdminLoading(true);
      const response = await axios.post(
        process.env.REACT_APP_API_URL + '/users/add-admin',
        { adminAddress: values.adminAddress }
      );
      
      if (response.data.success) {
        message.success('管理员添加成功');
        adminForm.resetFields();
        setAdminModalVisible(false);
        // 刷新学生列表以更新角色信息
        fetchAllStudents();
      }
    } catch (error) {
      console.error('Error adding admin:', error);
      message.error('添加管理员失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setAdminLoading(false);
    }
  };
  
  // 移除管理员
  const handleRemoveAdmin = async (values) => {
    if (!isConnected || (!isOwner && !isSystem)) {
      message.error('只有合约所有者或系统管理员可以移除管理员');
      return;
    }

    try {
      setAdminLoading(true);
      const response = await axios.post(
        process.env.REACT_APP_API_URL + '/users/remove-admin',
        { adminAddress: values.adminAddress }
      );
      
      if (response.data.success) {
        message.success('管理员移除成功');
        adminForm.resetFields();
        setAdminModalVisible(false);
        // 刷新学生列表以更新角色信息
        fetchAllStudents();
      }
    } catch (error) {
      console.error('Error removing admin:', error);
      message.error('移除管理员失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setAdminLoading(false);
    }
  };
  
  // 打开管理员操作弹窗
  const openAdminModal = (action) => {
    setAdminAction(action);
    setAdminModalVisible(true);
  };

  // 注册学生
  const handleRegister = async (values) => {
    if (!isConnected) {
      message.error('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        process.env.REACT_APP_API_URL + '/students/register',
        values
      );
      
      if (response.data.success) {
        message.success('学生注册成功');
        form.resetFields();
        // 注册成功后刷新学生列表
        fetchAllStudents();
      }
    } catch (error) {
      console.error('Error registering student:', error);
      message.error('注册失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 查询学生
  const handleSearch = async (values) => {
    try {
      setSearchLoading(true);
      const response = await axios.get(
        process.env.REACT_APP_API_URL + `/students/${values.studentAddress}`
      );
      
      if (response.data.success) {
        setStudentData(response.data.student);
        message.success('查询成功');
      }
    } catch (error) {
      console.error('Error searching student:', error);
      message.error('查询失败: ' + (error.response?.data?.message || '学生不存在'));
      setStudentData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // 列定义
  const columns = [
    {
      title: '地址',
      dataIndex: 'address',
      key: 'address',
      render: (text) => <span>{text.substring(0, 10)}...{text.substring(text.length - 6)}</span>
    },
    {
      title: '姓名',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId',
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role, record) => {
        // 根据角色显示不同的标签
        if (record.isOwner) {
          return <Tag color="red">所有者</Tag>;
        } else if (record.isSystem || role === 'system') {
          return <Tag color="purple">系统管理员</Tag>;
        } else if (record.isAdmin || role === 'admin') {
          return <Tag color="blue">管理员</Tag>;
        } else {
          return <Tag color="green">学生</Tag>;
        }
      }
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <span key={`status-${record.address || record.key}`} className="status-badge status-success">已注册</span>
      ),
    },
  ];

  // 当用户非管理员时，重定向到首页
  useEffect(() => {
    if (!isAdmin && !isOwner && !isSystem) {
      message.warning('您没有权限访问学生管理页面');
      // 这里可以添加重定向逻辑
    }
  }, [isAdmin, isOwner, isSystem]);

  // 修复useEffect依赖项
  // 组件挂载或连接状态变化时获取学生列表
  useEffect(() => {
    fetchAllStudents();
  }, [isConnected, fetchAllStudents]);
  
  return (
    <div>
      <h1>学生管理</h1>
      
      {/* 模式切换 */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <Button 
          type={!searchMode ? 'primary' : 'default'}
          onClick={() => setSearchMode(false)}
          disabled={!isConnected || (!isAdmin && !isOwner && !isSystem)}
        >
          注册学生
        </Button>
        <Button 
          type={searchMode ? 'primary' : 'default'}
          onClick={() => setSearchMode(true)}
          disabled={!isConnected || (!isAdmin && !isOwner && !isSystem)}
        >
          查询学生
        </Button>
        {/* 所有者和系统管理员可以管理管理员 */}
        {(isOwner || isSystem) && (
          <>
            <Button 
              type="default"
              icon={<PlusOutlined />}
              onClick={() => openAdminModal('add')}
              disabled={!isConnected}
            >
              添加管理员
            </Button>
            <Button 
              type="default"
              icon={<MinusOutlined />}
              onClick={() => openAdminModal('remove')}
              disabled={!isConnected}
            >
              移除管理员
            </Button>
          </>
        )}
      </div>

      {!isConnected || (!isAdmin && !isOwner && !isSystem) ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <p>请先连接钱包并确保您有管理员权限</p>
        </div>
      ) : !searchMode ? (
        // 注册学生表单
        <Card title="学生注册">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleRegister}
            initialValues={{
              studentAddress: '',
              name: '',
              studentId: ''
            }}
          >
            <Form.Item
              name="studentAddress"
              label="学生钱包地址"
              rules={[{ required: true, message: '请输入学生钱包地址' }, { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' }]}
            >
              <Input placeholder="0x..." prefix={<UserOutlined />} />
            </Form.Item>
            
            <Form.Item
              name="name"
              label="学生姓名"
              rules={[{ required: true, message: '请输入学生姓名' }]}
            >
              <Input placeholder="请输入学生姓名" />
            </Form.Item>
            
            <Form.Item
              name="studentId"
              label="学号"
              rules={[{ required: true, message: '请输入学号' }]}
            >
              <Input placeholder="请输入学号" />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={loading}
                disabled={!isConnected}
                block
                size="large"
              >
                注册学生
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        // 查询学生表单
        <Card title="学生查询">
          <Form
            layout="vertical"
            onFinish={handleSearch}
            initialValues={{
              studentAddress: ''
            }}
          >
            <Form.Item
              name="studentAddress"
              label="学生钱包地址"
              rules={[{ required: true, message: '请输入学生钱包地址' }, { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' }]}
            >
              <Input placeholder="0x..." prefix={<UserOutlined />} />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SearchOutlined />}
                loading={searchLoading}
                disabled={!isConnected}
                block
                size="large"
              >
                查询学生
              </Button>
            </Form.Item>
          </Form>

          {/* 查询结果 */}
          {studentData && (
            <Card title="学生信息" style={{ marginTop: 20 }}>
              <Table
                dataSource={[studentData]}
                columns={columns}
                pagination={false}
                rowKey="address"
              />
            </Card>
          )}

          {searchLoading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          )}
        </Card>
      )}

      {/* 已注册学生列表（从链上获取真实数据） */}
      {(isAdmin || isOwner || isSystem) && (
        <>
          <Card title="已注册学生列表" style={{ marginTop: 24 }}>
            {studentsLoading ? (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Spin size="large" />
              </div>
            ) : (
              <Table
                dataSource={students}
                columns={columns}
                pagination={{ pageSize: 10 }}
                rowKey="address"
                locale={{ emptyText: '暂无已注册学生' }}
              />
            )}
            <Button 
              type="primary" 
              size="small" 
              style={{ marginTop: 10 }}
              onClick={fetchAllStudents}
              disabled={!isConnected || studentsLoading}
            >
              刷新学生列表
            </Button>
          </Card>
        </>
      )}
      
      {/* 管理员管理弹窗 */}
      <Modal
        title={adminAction === 'add' ? '添加管理员' : '移除管理员'}
        open={adminModalVisible}
        onCancel={() => setAdminModalVisible(false)}
        footer={null}
      >
        <Form
          form={adminForm}
          layout="vertical"
          onFinish={adminAction === 'add' ? handleAddAdmin : handleRemoveAdmin}
          initialValues={{
            adminAddress: ''
          }}
        >
          <Form.Item
            name="adminAddress"
            label="管理员钱包地址"
            rules={[{ required: true, message: '请输入管理员钱包地址' }, { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' }]}
          >
            <Input placeholder="0x..." prefix={<UserOutlined />} />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary"
              htmlType="submit" 
              loading={adminLoading}
              disabled={!isConnected || !isOwner}
              block
              size="large"
            >
              {adminAction === 'add' ? '添加管理员' : '移除管理员'}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StudentManagement;