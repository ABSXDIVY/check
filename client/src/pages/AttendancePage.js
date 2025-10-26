import React, { useState } from 'react';
import { Card, Form, Input, Button, Table, message, Tabs, InputNumber, Space, Spin, Select, Row, Col } from 'antd';
import { ClockCircleOutlined, CheckCircleOutlined, SearchOutlined, FileAddOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

const AttendancePage = ({ isConnected, isAdmin, isOwner, isSystem }) => {
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [checkForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [batchLoading, setBatchLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(false);
  const [attendanceResult, setAttendanceResult] = useState(null);
  const [activeTab, setActiveTab] = useState('personal');

  // 个人签到
  const handlePersonalAttendance = async (values) => {
    if (!isConnected) {
      message.error('请先连接钱包');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        process.env.REACT_APP_API_URL + '/attendance',
        { courseId: values.courseId }
      );
      
      if (response.data.success) {
        message.success('签到成功！');
        form.resetFields();
        // 显示签到结果
        setAttendanceResult({
          courseId: response.data.courseId,
          transactionHash: response.data.transactionHash,
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Error recording attendance:', error);
      message.error('签到失败: ' + (error.response?.data?.message || error.message));
      setAttendanceResult({
        status: 'failed',
        error: error.response?.data?.message || error.message
      });
    } finally {
      setLoading(false);
    }
  };

  // 批量签到
  const handleBatchAttendance = async (values) => {
    if (!isConnected) {
      message.error('请先连接钱包');
      return;
    }
    
    if (!isAdmin && !isOwner && !isSystem) {
      message.error('您没有权限执行批量签到');
      return;
    }

    try {
      setBatchLoading(true);
      // 解析学生地址列表，支持逗号分隔或换行分隔
      const students = values.studentAddresses
        .split(/[,\n\s]+/)
        .filter(addr => addr.trim() && /^0x[a-fA-F0-9]{40}$/.test(addr.trim()));
      
      if (students.length === 0) {
        throw new Error('请输入有效的学生地址');
      }

      const response = await axios.post(
        process.env.REACT_APP_API_URL + '/attendance/batch',
        { 
          students: students,
          courseId: values.courseId 
        }
      );
      
      if (response.data.success) {
        message.success(`批量签到成功！共 ${students.length} 名学生`);
        batchForm.resetFields();
        // 显示签到结果
        setAttendanceResult({
          courseId: response.data.courseId,
          studentsCount: response.data.studentsCount,
          transactionHash: response.data.transactionHash,
          status: 'success'
        });
      }
    } catch (error) {
      console.error('Error recording batch attendance:', error);
      message.error('批量签到失败: ' + (error.response?.data?.message || error.message));
      setAttendanceResult({
        status: 'failed',
        error: error.response?.data?.message || error.message
      });
    } finally {
      setBatchLoading(false);
    }
  };

  // 检查签到状态
  const handleCheckAttendance = async (values) => {
    try {
      setCheckLoading(true);
      const response = await axios.get(
        process.env.REACT_APP_API_URL + `/attendance/${values.studentAddress}/${values.courseId}`
      );
      
      if (response.data.success) {
        message.success('查询成功');
        setAttendanceResult({
          ...response.data.attendance,
          status: 'checked'
        });
      }
    } catch (error) {
      console.error('Error checking attendance:', error);
      message.error('查询失败: ' + (error.response?.data?.message || error.message));
    } finally {
      setCheckLoading(false);
    }
  };

  // 格式化地址显示
  const formatAddress = (address) => {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  };

  // 定义Tab内容组件
  const PersonalAttendance = () => (
    <Card title="个人签到">
      <Form
        form={form}
        layout="vertical"
        onFinish={handlePersonalAttendance}
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
            icon={<ClockCircleOutlined />}
            loading={loading}
            disabled={!isConnected}
            block
            size="large"
          >
            立即签到
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const BatchAttendance = () => (
    <Card title="批量签到（管理员功能）">
      {!isAdmin && !isOwner && !isSystem && (
        <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#fff2e8', border: '1px solid #ffbb96', borderRadius: 4 }}>
          <p style={{ color: '#d4380d' }}>您没有权限使用批量签到功能，请联系管理员。</p>
        </div>
      )}
      <Form
        form={batchForm}
        layout="vertical"
        onFinish={handleBatchAttendance}
        initialValues={{
          courseId: '',
          studentAddresses: ''
        }}
      >
        <Form.Item
          name="courseId"
          label="课程ID"
          rules={[{ required: true, message: '请输入课程ID' }]}
        >
          <InputNumber placeholder="请输入课程ID" style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item
          name="studentAddresses"
          label="学生地址列表"
          rules={[{ required: true, message: '请输入学生地址列表' }]}
        >
          <Input.TextArea 
            rows={8} 
            placeholder="请输入学生钱包地址，支持逗号、空格或换行分隔"
          />
        </Form.Item>
        
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<FileAddOutlined />}
            loading={batchLoading}
            disabled={!isConnected}
            block
            size="large"
          >
            批量签到
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  const CheckAttendance = () => (
    <Card title="签到状态查询">
      <Form
        form={checkForm}
        layout="vertical"
        onFinish={handleCheckAttendance}
        initialValues={{
          studentAddress: '',
          courseId: ''
        }}
      >
        <Form.Item
          name="studentAddress"
          label="学生钱包地址"
          rules={[
            { required: true, message: '请输入学生钱包地址' },
            { pattern: /^0x[a-fA-F0-9]{40}$/, message: '请输入有效的以太坊地址' }
          ]}
        >
          <Input placeholder="0x..." />
        </Form.Item>
        
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
            loading={checkLoading}
            disabled={!isConnected}
            block
            size="large"
          >
            查询签到状态
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );

  // Tab配置项 - 根据角色显示不同的功能选项
  const tabItems = [
    {
      key: 'personal',
      label: '个人签到',
      children: <PersonalAttendance />,
    },
    ...((isAdmin || isOwner || isSystem) ? [{
      key: 'batch',
      label: '批量签到',
      children: <BatchAttendance />,
    }] : []),
    {
      key: 'check',
      label: '签到查询',
      children: <CheckAttendance />,
    },
  ];

  return (
    <div>
      <h1>签到管理</h1>
      
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* 签到结果显示 */}
      {attendanceResult && (
        <Card title="签到结果" style={{ marginTop: 24 }}>
          {attendanceResult.status === 'success' ? (
            <div>
              <div style={{ marginBottom: 16 }}>
                <CheckCircleOutlined style={{ fontSize: 48, color: '#52c41a' }} />
                <h3 style={{ color: '#52c41a', marginTop: 8 }}>签到成功！</h3>
              </div>
              <Table
                dataSource={[
                  {
                    key: '1',
                    label: '课程ID',
                    value: attendanceResult.courseId
                  },
                  {
                    key: '2',
                    label: '交易哈希',
                    value: (
                      <div key="transaction-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{formatAddress(attendanceResult.transactionHash)}</span>
                        <span className="ant-tag ant-tag-green">交易已确认</span>
                      </div>
                    )
                  },
                  attendanceResult.studentsCount && {
                    key: '3',
                    label: '签到人数',
                    value: attendanceResult.studentsCount
                  }
                ].filter(Boolean)}
                columns={[
                  {
                    title: '项目',
                    dataIndex: 'label',
                    key: 'label',
                    width: 100
                  },
                  {
                    title: '值',
                    dataIndex: 'value',
                    key: 'value'
                  }
                ]}
                pagination={false}
              />
            </div>
          ) : attendanceResult.status === 'failed' ? (
            <div style={{ color: '#ff4d4f', textAlign: 'center', padding: 20 }}>
              <h3>签到失败</h3>
              <p style={{ marginTop: 8 }}>{attendanceResult.error}</p>
            </div>
          ) : (
            <div>
              <h3>签到状态</h3>
              <Table
                dataSource={[
                  {
                    key: '1',
                    label: '学生地址',
                    value: formatAddress(attendanceResult.studentAddress)
                  },
                  {
                    key: '2',
                    label: '课程ID',
                    value: attendanceResult.courseId
                  },
                  {
                    key: '3',
                    label: '签到状态',
                    value: (
                      <span key="attendance-status" className={`status-badge ${attendanceResult.isPresent ? 'status-success' : 'status-danger'}`}>
                        {attendanceResult.isPresent ? '已签到' : '未签到'}
                      </span>
                    )
                  }
                ]}
                columns={[
                  {
                    title: '项目',
                    dataIndex: 'label',
                    key: 'label',
                    width: 100
                  },
                  {
                    title: '值',
                    dataIndex: 'value',
                    key: 'value'
                  }
                ]}
                pagination={false}
              />
            </div>
          )}
        </Card>
      )}

      {/* 签到记录（模拟数据） */}
      <Card title="最近签到记录" style={{ marginTop: 24 }}>
        <Table
          dataSource={[
            {
              key: '1',
              courseId: '1',
              courseName: '区块链技术基础',
              studentAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
              studentName: '张三',
              timestamp: '2024-01-20 14:30:00',
              status: 'success'
            },
            {
              key: '2',
              courseId: '2',
              courseName: '智能合约开发',
              studentAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
              studentName: '李四',
              timestamp: '2024-01-20 15:45:00',
              status: 'success'
            },
            {
              key: '3',
              courseId: '1',
              courseName: '区块链技术基础',
              studentAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
              studentName: '王五',
              timestamp: '2024-01-20 16:00:00',
              status: 'success'
            }
          ]}
          columns={[
            {
              title: '课程',
              dataIndex: 'courseName',
              key: 'courseName',
            },
            {
              title: '学生',
              dataIndex: 'studentName',
              key: 'studentName',
            },
            {
              title: '钱包地址',
              dataIndex: 'studentAddress',
              key: 'studentAddress',
              render: (text) => formatAddress(text)
            },
            {
              title: '签到时间',
              dataIndex: 'timestamp',
              key: 'timestamp',
            },
            {
              title: '状态',
              key: 'status',
              render: (_, record) => (
          <span key={`record-status-${record.key}`} className="status-badge status-success">成功</span>
        ),
            },
          ]}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default AttendancePage;