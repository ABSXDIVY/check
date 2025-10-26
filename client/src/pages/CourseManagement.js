import React, { useState, useEffect, useCallback } from 'react';
import { Card, Form, Input, Button, Table, message, DatePicker, Modal, Space, Spin, InputNumber } from 'antd';
import { BookOutlined, SearchOutlined, SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const CourseManagement = ({ isConnected, isAdmin, isOwner, isSystem }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [courseData, setCourseData] = useState(null);
  const [courses, setCourses] = useState([]);
  
  // 获取课程列表 - 使用useCallback避免不必要的重新渲染
  const fetchCourses = useCallback(async () => {
    if (!isConnected) return;
    
    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      console.log('Fetching courses from:', `${apiUrl}/courses`);
      const response = await axios.get(`${apiUrl}/courses`);
      
      console.log('Course fetch response:', response.data);
      if (response.data && Array.isArray(response.data)) {
        // 如果API返回的直接是课程数组
        setCourses(response.data.map(course => ({
          ...course,
          key: course.id
        })));
      } else if (response.data && response.data.success && Array.isArray(response.data.courses)) {
        // 如果API返回的是包含success和courses字段的对象
        setCourses(response.data.courses.map(course => ({
          ...course,
          key: course.id
        })));
      } else {
        console.error('Invalid response format:', response.data);
        setCourses([]);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
      console.error('Error details:', error.response?.data);
      message.error('获取课程列表失败: ' + (error.response?.data?.message || error.message));
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [isConnected]); // 依赖项数组
  const [searchMode, setSearchMode] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);

  // 在组件加载和钱包连接状态变化时获取课程列表
  useEffect(() => {
    fetchCourses();
  }, [isConnected, fetchCourses]); // 添加fetchCourses到依赖数组
  
  // 当用户非管理员时，显示警告
  useEffect(() => {
    if (!isAdmin && !isOwner && !isSystem) {
      message.warning('您没有权限管理课程');
    }
  }, [isAdmin, isOwner, isSystem]);

  // 创建课程
  const handleCreateCourse = async (values) => {
    if (!isConnected) {
      message.error('请先连接钱包');
      return;
    }
    
    if (!isAdmin && !isOwner && !isSystem) {
      message.error('您没有权限创建课程');
      return;
    }

    try {
      setLoading(true);
      const [startTime, endTime] = values.dateRange;
      
      console.log('Creating course with data:', {
        name: values.name,
        startTime: Math.floor(startTime.valueOf() / 1000),
        endTime: Math.floor(endTime.valueOf() / 1000)
      });
      
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await axios.post(
        `${apiUrl}/courses`,
        {
          name: values.name,
          startTime: Math.floor(startTime.valueOf() / 1000),
          endTime: Math.floor(endTime.valueOf() / 1000)
        }
      );
      
      console.log('Course creation response:', response.data);
      if (response.data.success) {
        message.success('课程创建成功');
        form.resetFields();
        // 重新获取课程列表以确保显示最新数据
        fetchCourses();
      }
    } catch (error) {
      console.error('Error creating course:', error);
      console.error('Error details:', error.response?.data);
      message.error('创建失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 查询课程
  const handleSearchCourse = async (values) => {
    try {
      setSearchLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await axios.get(
        `${apiUrl}/courses/${values.courseId}`
      );
      
      if (response.data.success) {
        const course = response.data.course;
        setCourseData({
          ...course,
          key: course.id
        });
        message.success('查询成功');
      }
    } catch (error) {
      console.error('Error searching course:', error);
      message.error('查询失败: ' + (error.response?.data?.message || '课程不存在'));
      setCourseData(null);
    } finally {
      setSearchLoading(false);
    }
  };

  // 停用课程
  const handleDeactivateCourse = async (courseId) => {
    if (!isConnected) {
      message.error('请先连接钱包');
      return;
    }
    
    if (!isAdmin && !isOwner && !isSystem) {
      message.error('您没有权限停用课程');
      return;
    }

    try {
      setLoading(true);
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
      const response = await axios.post(
        `${apiUrl}/courses/${courseId}/deactivate`
      );

      if (response.data.success) {
        message.success('课程已停用');
        setDeleteModalVisible(false);
        // 重新获取课程列表以确保显示最新数据
        fetchCourses();
      }
    } catch (error) {
      console.error('Error deactivating course:', error);
      message.error('停用失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 显示删除确认模态框
  const showDeleteModal = (courseId) => {
    setCourseToDelete(courseId);
    setDeleteModalVisible(true);
  };

  // 格式化时间
  const formatTime = (timestamp) => {
    return dayjs(Number(timestamp) * 1000).format('YYYY-MM-DD HH:mm:ss');
  };

  // 列定义
  const columns = [
    {
      title: '课程ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '开始时间',
      dataIndex: 'startTime',
      key: 'startTime',
      render: (text) => formatTime(text)
    },
    {
      title: '结束时间',
      dataIndex: 'endTime',
      key: 'endTime',
      render: (text) => formatTime(text)
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <span key={`status-${record.id}`} className={`status-badge ${record.isActive ? 'status-success' : 'status-danger'}`}>
          {record.isActive ? '激活' : '已停用'}
        </span>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle" key={`space-${record.id}`}>
          <Button 
            key={`deactivate-${record.id}`}
            danger 
            icon={<DeleteOutlined />} 
            size="small"
            onClick={() => showDeleteModal(record.id)}
            disabled={!record.isActive || !isConnected || (!isAdmin && !isOwner && !isSystem)}
          >
            停用
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h1>课程管理</h1>
      
      {/* 模式切换 */}
      <div style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
        <Button 
          type={!searchMode ? 'primary' : 'default'}
          onClick={() => setSearchMode(false)}
          disabled={!isConnected || (!isAdmin && !isOwner && !isSystem)}
        >
          创建课程
        </Button>
        <Button 
          type={searchMode ? 'primary' : 'default'}
          onClick={() => setSearchMode(true)}
          disabled={!isConnected}
        >
          查询课程
        </Button>
      </div>

      {!isConnected || (!isAdmin && !isOwner && !isSystem) ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          {!isConnected ? <p>请先连接钱包</p> : <p>您没有权限管理课程</p>}
        </div>
      ) : !searchMode ? (
        // 创建课程表单
        <Card title="创建课程">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleCreateCourse}
            initialValues={{
              name: '',
              dateRange: [dayjs(), dayjs().add(1, 'month')]
            }}
          >
            <Form.Item
              name="name"
              label="课程名称"
              rules={[{ required: true, message: '请输入课程名称' }]}
            >
              <Input placeholder="请输入课程名称" prefix={<BookOutlined />} />
            </Form.Item>
            
            <Form.Item
              name="dateRange"
              label="课程时间范围"
              rules={[{ required: true, message: '请选择课程时间范围' }]}
            >
              <RangePicker showTime format="YYYY-MM-DD HH:mm:ss" />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                icon={<SaveOutlined />}
                loading={loading}
            disabled={!isConnected || (!isAdmin && !isOwner && !isSystem)}
            block
            size="large"
          >
            创建课程
              </Button>
            </Form.Item>
          </Form>
        </Card>
      ) : (
        // 查询课程表单
        <Card title="课程查询">
          <Form
            layout="vertical"
            onFinish={handleSearchCourse}
            initialValues={{
              courseId: ''
            }}
          >
            <Form.Item
              name="courseId"
              label="课程ID"
              rules={[{ required: true, message: '请输入课程ID' }]}
            >
              <InputNumber placeholder="请输入课程ID" style={{ width: '100%' }} />
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
                查询课程
              </Button>
            </Form.Item>
          </Form>

          {/* 查询结果 */}
          {courseData && (
            <Card title="课程信息" style={{ marginTop: 20 }}>
              <Table
                dataSource={[courseData]}
                columns={columns.filter(col => col.key !== 'action')}
                pagination={false}
                rowKey="id"
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

      {/* 课程列表（模拟数据） */}
      <Card title="课程列表" style={{ marginTop: 24 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <Spin size="large" />
            </div>
          ) : (
            <Table
              dataSource={courses.length > 0 ? courses : []}
              columns={columns}
              pagination={{ pageSize: 10 }}
              rowKey="id"
              locale={{ emptyText: '暂无课程数据' }}
            />
          )}
      </Card>

      {/* 停用确认模态框 */}
      <Modal
        title="确认停用课程"
        open={deleteModalVisible}
        onOk={() => handleDeactivateCourse(courseToDelete)}
        onCancel={() => setDeleteModalVisible(false)}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ loading }}
      >
        <p>确定要停用该课程吗？停用后将无法进行签到操作。</p>
      </Modal>
    </div>
  );
};

export default CourseManagement;