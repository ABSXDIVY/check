import React from 'react';
import { Card, Result, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';

const NotFoundPage = () => {
  return (
    <Card style={{ textAlign: 'center', padding: '40px 0' }}>
      <Result
        status="404"
        title="404"
        subTitle="抱歉，您访问的页面不存在"
        extra={
          <Button type="primary" icon={<ArrowLeftOutlined />} href="/">
            返回首页
          </Button>
        }
      />
    </Card>
  );
};

export default NotFoundPage;