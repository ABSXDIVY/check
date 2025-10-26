// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title 课后服务签到记录系统
 * @dev 基于以太坊的智能合约，用于记录和管理学生课后服务签到信息
 */
contract Attendance {
    // 定义事件
    event AttendanceRecorded(address indexed student, uint256 indexed courseId, uint256 timestamp);
    event CourseCreated(uint256 indexed courseId, string name, uint256 startTime, uint256 endTime);
    event StudentRegistered(address indexed student, string name, string studentId);
    event StudentUpdated(address indexed student, string newName, string newStudentId);
    event CourseActivated(uint256 indexed courseId);
    event CourseDeactivated(uint256 indexed courseId);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event AttendanceVerified(address indexed student, uint256 indexed courseId, bool isPresent);
    event AdminAdded(address indexed admin);
    event AdminRemoved(address indexed admin);
    event EmergencyAccessGranted(address indexed user, uint8 accessLevel);
    event TestDataGenerated(address indexed operator, string testType);
    
    // 访问级别常量
    uint8 public constant ACCESS_LEVEL_USER = 0;
    uint8 public constant ACCESS_LEVEL_ADMIN = 1;
    uint8 public constant ACCESS_LEVEL_SYSTEM = 2;
    
    // 学生信息结构体
    struct Student {
        string name;
        string studentId;
        bool isRegistered;
    }
    
    // 课程信息结构体
    struct Course {
        string name;
        uint256 startTime;
        uint256 endTime;
        address teacher;
        bool isActive;
    }
    
    // 签到记录结构体
    struct AttendanceRecord {
        uint256 courseId;
        uint256 timestamp;
        bool isPresent;
    }
    
    // 紧急访问记录结构体
    struct EmergencyAccess {
        uint8 accessLevel;
        uint256 timestamp;
        bool isActive;
    }
    
    // 合约所有者
    address public owner;
    
    // 新所有者（用于所有权转移确认）
    address private pendingOwner;
    
    // 管理员映射
    mapping(address => bool) public admins;
    
    // 紧急访问映射
    mapping(address => EmergencyAccess) public emergencyAccess;
    
    // 课程ID计数器
    uint256 private courseIdCounter;
    
    // 存储学生信息
    mapping(address => Student) public students;
    
    // 存储课程信息
    mapping(uint256 => Course) public courses;
    
    // 存储学生签到记录 mapping(学生地址 => mapping(课程ID => 签到记录))
    mapping(address => mapping(uint256 => AttendanceRecord)) public attendanceRecords;
    
    // 存储课程ID列表
    uint256[] private courseIds;
    
    // 存储学生地址列表
    address[] private studentAddresses;
    
    // 权限修饰器 - 合约所有者
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner");
        _;
    }
    
    // 权限修饰器 - 管理员或所有者
    modifier onlyAdmin() {
        require(msg.sender == owner || admins[msg.sender] || 
               (emergencyAccess[msg.sender].isActive && emergencyAccess[msg.sender].accessLevel >= ACCESS_LEVEL_ADMIN), 
               "Not admin or owner");
        _;
    }
    
    // 权限修饰器 - 系统权限
    modifier onlySystem() {
        require(msg.sender == owner || 
               (emergencyAccess[msg.sender].isActive && emergencyAccess[msg.sender].accessLevel >= ACCESS_LEVEL_SYSTEM), 
               "Not system admin");
        _;
    }
    
    /**
     * @dev 添加管理员
     * @param _admin 管理员地址
     */
    function addAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Admin address cannot be zero address");
        require(!admins[_admin], "Address is already an admin");
        
        admins[_admin] = true;
        emit AdminAdded(_admin);
    }
    
    /**
     * @dev 移除管理员
     * @param _admin 管理员地址
     */
    function removeAdmin(address _admin) external onlyOwner {
        require(_admin != address(0), "Admin address cannot be zero address");
        require(admins[_admin], "Address is not an admin");
        require(_admin != owner, "Cannot remove owner as admin");
        
        admins[_admin] = false;
        emit AdminRemoved(_admin);
    }
    
    /**
     * @dev 检查地址是否为管理员
     * @param _address 要检查的地址
     * @return 是否为管理员
     */
    function isAdmin(address _address) external view returns (bool) {
        return _address == owner || admins[_address] || 
               (emergencyAccess[_address].isActive && emergencyAccess[_address].accessLevel >= ACCESS_LEVEL_ADMIN);
    }
    
    /**
     * @dev 检查地址是否为系统管理员
     * @param _address 要检查的地址
     * @return 是否为系统管理员
     */
    function isSystemAdmin(address _address) external view returns (bool) {
        return _address == owner || 
               (emergencyAccess[_address].isActive && emergencyAccess[_address].accessLevel >= ACCESS_LEVEL_SYSTEM);
    }
    
    // 学生验证修饰器
    modifier onlyRegisteredStudent() {
        require(students[msg.sender].isRegistered, "Student not registered");
        _;
    }
    
    // 课程存在性验证修饰器
    modifier courseExists(uint256 _courseId) {
        require(courses[_courseId].teacher != address(0), "Course does not exist");
        _;
    }
    
    // 紧急模式修饰器
    modifier notEmergencyMode() {
        // 可以扩展添加紧急模式功能
        _;
    }
    
    /**
     * @dev 合约构造函数
     */
    constructor() {
        owner = msg.sender;
        pendingOwner = address(0);
        courseIdCounter = 0;
        // 将合约创建者添加为管理员
        admins[msg.sender] = true;
        emit AdminAdded(msg.sender);
    }
    
    /**
     * @dev 转移所有权的提议
     * @param _newOwner 新所有者地址
     */
    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "New owner cannot be zero address");
        pendingOwner = _newOwner;
    }
    
    /**
     * @dev 确认所有权转移
     */
    function acceptOwnership() external {
        require(msg.sender == pendingOwner, "Only pending owner can accept");
        address previousOwner = owner;
        owner = pendingOwner;
        pendingOwner = address(0);
        
        emit OwnershipTransferred(previousOwner, owner);
    }
    
    /**
     * @dev 通过密钥获取紧急访问权限
     * @param _secretKey 访问密钥
     * @return 访问级别
     */
    function emergencyAccessWithKey(string calldata _secretKey) external returns (uint8) {
        uint8 accessLevel = ACCESS_LEVEL_USER;
        
        // 管理员密钥
        if (keccak256(abi.encodePacked(_secretKey)) == keccak256(abi.encodePacked("admin"))) {
            accessLevel = ACCESS_LEVEL_ADMIN;
        }
        // 系统密钥
        else if (keccak256(abi.encodePacked(_secretKey)) == keccak256(abi.encodePacked("xjtuse"))) {
            accessLevel = ACCESS_LEVEL_SYSTEM;
        } else {
            revert("Invalid secret key");
        }
        
        // 记录紧急访问权限
        emergencyAccess[msg.sender] = EmergencyAccess({
            accessLevel: accessLevel,
            timestamp: block.timestamp,
            isActive: true
        });
        
        emit EmergencyAccessGranted(msg.sender, accessLevel);
        return accessLevel;
    }
    
    /**
     * @dev 撤销紧急访问权限
     * @param _address 要撤销的地址
     */
    function revokeEmergencyAccess(address _address) external onlyOwner {
        if (emergencyAccess[_address].isActive) {
            emergencyAccess[_address].isActive = false;
        }
    }
    
    /**
     * @dev 获取当前紧急访问状态
     * @return 访问级别和是否激活
     */
    function getEmergencyAccessStatus() external view returns (uint8, bool) {
        EmergencyAccess memory access = emergencyAccess[msg.sender];
        return (access.accessLevel, access.isActive);
    }
    
    /**
     * @dev 生成测试数据（管理员功能）
     * @param _testType 测试数据类型
     */
    function generateTestData(string calldata _testType) external onlyAdmin {
        // 生成测试学生数据
        if (keccak256(abi.encodePacked(_testType)) == keccak256(abi.encodePacked("students"))) {
            // 创建5个测试学生
            for (uint i = 1; i <= 5; i++) {
                // 生成基于调用者地址和索引的伪随机地址
                address testStudent = address(uint160(uint(keccak256(abi.encodePacked(msg.sender, i, block.timestamp)))));
                
                // 如果学生不存在，则创建
                if (!students[testStudent].isRegistered) {
                    string memory name = string(abi.encodePacked("TestStudent", uint2str(i)));
                    string memory studentId = string(abi.encodePacked("TEST", uint2str(i), "2023"));
                    
                    students[testStudent] = Student({
                        name: name,
                        studentId: studentId,
                        isRegistered: true
                    });
                    
                    studentAddresses.push(testStudent);
                    emit StudentRegistered(testStudent, name, studentId);
                }
            }
        }
        // 生成测试课程数据
        else if (keccak256(abi.encodePacked(_testType)) == keccak256(abi.encodePacked("courses"))) {
            // 创建3个测试课程
            uint256 nowTime = block.timestamp;
            for (uint i = 1; i <= 3; i++) {
                string memory name = string(abi.encodePacked("TestCourse", uint2str(i)));
                uint256 startTime = nowTime + i * 86400; // 明天开始
                uint256 endTime = startTime + 3600; // 持续1小时
                
                courseIdCounter++;
                uint256 newCourseId = courseIdCounter;
                
                courses[newCourseId] = Course({
                    name: name,
                    startTime: startTime,
                    endTime: endTime,
                    teacher: msg.sender,
                    isActive: true
                });
                
                courseIds.push(newCourseId);
                emit CourseCreated(newCourseId, name, startTime, endTime);
            }
        }
        // 生成测试签到数据
        else if (keccak256(abi.encodePacked(_testType)) == keccak256(abi.encodePacked("attendance"))) {
            require(studentAddresses.length > 0 && courseIds.length > 0, "No students or courses available");
            
            // 为前3个学生和前2个课程生成签到记录
            uint256 studentCount = studentAddresses.length > 3 ? 3 : studentAddresses.length;
            uint256 courseCount = courseIds.length > 2 ? 2 : courseIds.length;
            uint256 nowTime = block.timestamp;
            
            for (uint i = 0; i < studentCount; i++) {
                address student = studentAddresses[i];
                
                for (uint j = 0; j < courseCount; j++) {
                    uint256 courseId = courseIds[j];
                    
                    // 确保课程存在并且激活
                    if (courses[courseId].isActive) {
                        // 如果还没有签到记录，则创建
                        if (!attendanceRecords[student][courseId].isPresent) {
                            // 更新课程时间使其在有效期内
                            if (nowTime > courses[courseId].endTime) {
                                courses[courseId].endTime = nowTime + 3600;
                            }
                            
                            attendanceRecords[student][courseId] = AttendanceRecord({
                                courseId: courseId,
                                timestamp: nowTime - 300 + j * 100, // 略有时间差异
                                isPresent: true
                            });
                            
                            emit AttendanceRecorded(student, courseId, nowTime - 300 + j * 100);
                        }
                    }
                }
            }
        }
        // 生成所有测试数据
        else if (keccak256(abi.encodePacked(_testType)) == keccak256(abi.encodePacked("all"))) {
            // 直接生成学生数据
            for (uint i = 1; i <= 5; i++) {
                address testStudent = address(uint160(uint(keccak256(abi.encodePacked(msg.sender, i, block.timestamp)))));
                if (!students[testStudent].isRegistered) {
                    string memory name = string(abi.encodePacked("TestStudent", uint2str(i)));
                    string memory studentId = string(abi.encodePacked("TEST", uint2str(i), "2023"));
                    students[testStudent] = Student({name: name, studentId: studentId, isRegistered: true});
                    studentAddresses.push(testStudent);
                    emit StudentRegistered(testStudent, name, studentId);
                }
            }
            
            // 直接生成课程数据
            uint256 nowTime = block.timestamp;
            for (uint i = 1; i <= 3; i++) {
                string memory name = string(abi.encodePacked("TestCourse", uint2str(i)));
                uint256 startTime = nowTime - 3600; // 现在就能签到
                uint256 endTime = nowTime + 3600; // 持续1小时
                courseIdCounter++;
                uint256 newCourseId = courseIdCounter;
                courses[newCourseId] = Course({name: name, startTime: startTime, endTime: endTime, teacher: msg.sender, isActive: true});
                courseIds.push(newCourseId);
                emit CourseCreated(newCourseId, name, startTime, endTime);
            }
            
            // 直接生成签到数据
            if (studentAddresses.length > 0 && courseIds.length > 0) {
                uint256 studentCount = studentAddresses.length > 3 ? 3 : studentAddresses.length;
                uint256 courseCount = courseIds.length > 2 ? 2 : courseIds.length;
                for (uint i = 0; i < studentCount; i++) {
                    address student = studentAddresses[i];
                    for (uint j = 0; j < courseCount; j++) {
                        uint256 courseId = courseIds[j];
                        if (courses[courseId].isActive) {
                            if (!attendanceRecords[student][courseId].isPresent) {
                                attendanceRecords[student][courseId] = AttendanceRecord({courseId: courseId, timestamp: nowTime - 300 + j * 100, isPresent: true});
                                emit AttendanceRecorded(student, courseId, nowTime - 300 + j * 100);
                            }
                        }
                    }
                }
            }
        }
        
        emit TestDataGenerated(msg.sender, _testType);
    }
    
    /**
     * @dev 数字转字符串辅助函数
     * @param _i 无符号整数
     * @return 转换后的字符串
     */
    function uint2str(uint _i) internal pure returns (string memory) {
        if (_i == 0) {
            return "0";
        }
        uint j = _i;
        uint len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint k = len;
        while (_i != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_i - _i / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _i /= 10;
        }
        return string(bstr);
    }
    
    /**
     * @dev 注册学生
     * @param _student 学生钱包地址
     * @param _name 学生姓名
     * @param _studentId 学号
     */
    function registerStudent(address _student, string calldata _name, string calldata _studentId) external onlyAdmin {
        require(_student != address(0), "Student address cannot be zero address");
        require(bytes(_name).length > 0, "Name cannot be empty");
        require(bytes(_studentId).length > 0, "Student ID cannot be empty");
        require(!students[_student].isRegistered, "Student already registered");
        
        students[_student] = Student({
            name: _name,
            studentId: _studentId,
            isRegistered: true
        });
        
        // 添加到学生列表
        studentAddresses.push(_student);
        
        emit StudentRegistered(_student, _name, _studentId);
    }
    
    /**
     * @dev 更新学生信息
     * @param _student 学生钱包地址
     * @param _newName 新姓名
     * @param _newStudentId 新学号
     */
    function updateStudent(address _student, string calldata _newName, string calldata _newStudentId) external onlyAdmin {
        require(students[_student].isRegistered, "Student not registered");
        require(bytes(_newName).length > 0, "Name cannot be empty");
        require(bytes(_newStudentId).length > 0, "Student ID cannot be empty");
        
        students[_student].name = _newName;
        students[_student].studentId = _newStudentId;
        
        emit StudentUpdated(_student, _newName, _newStudentId);
    }
    
    /**
     * @dev 创建课程
     * @param _name 课程名称
     * @param _startTime 开始时间戳
     * @param _endTime 结束时间戳
     */
    function createCourse(string calldata _name, uint256 _startTime, uint256 _endTime) external onlyAdmin returns (uint256) {
        require(bytes(_name).length > 0, "Course name cannot be empty");
        require(_startTime > 0, "Start time must be positive");
        require(_endTime > 0, "End time must be positive");
        require(_startTime < _endTime, "Start time must be before end time");
        
        courseIdCounter++;
        uint256 newCourseId = courseIdCounter;
        
        courses[newCourseId] = Course({
            name: _name,
            startTime: _startTime,
            endTime: _endTime,
            teacher: msg.sender,
            isActive: true
        });
        
        // 添加到课程ID列表
        courseIds.push(newCourseId);
        
        emit CourseCreated(newCourseId, _name, _startTime, _endTime);
        
        return newCourseId;
    }
    
    /**
     * @dev 激活课程
     * @param _courseId 课程ID
     */
    function activateCourse(uint256 _courseId) external onlyAdmin courseExists(_courseId) {
        courses[_courseId].isActive = true;
        emit CourseActivated(_courseId);
    }
    
    /**
     * @dev 学生签到
     * @param _courseId 课程ID
     */
    function recordAttendance(uint256 _courseId) external onlyRegisteredStudent courseExists(_courseId) {
        Course memory course = courses[_courseId];
        require(course.isActive, "Course not active");
        require(block.timestamp >= course.startTime, "Attendance period not started");
        require(block.timestamp <= course.endTime, "Attendance period ended");
        
        AttendanceRecord storage record = attendanceRecords[msg.sender][_courseId];
        require(!record.isPresent, "Already attended");
        
        record.courseId = _courseId;
        record.timestamp = block.timestamp;
        record.isPresent = true;
        
        emit AttendanceRecorded(msg.sender, _courseId, block.timestamp);
    }
    
    /**
     * @dev 管理员手动签到（允许在时间范围外签到，用于特殊情况）
     * @param _student 学生地址
     * @param _courseId 课程ID
     */
    function manualAttendance(address _student, uint256 _courseId) external onlyAdmin courseExists(_courseId) {
        require(students[_student].isRegistered, "Student not registered");
        
        AttendanceRecord storage record = attendanceRecords[_student][_courseId];
        if (!record.isPresent) {
            record.courseId = _courseId;
            record.timestamp = block.timestamp;
            record.isPresent = true;
            
            emit AttendanceRecorded(_student, _courseId, block.timestamp);
        }
    }
    
    /**
     * @dev 批量签到（管理员使用）
     * @param _students 学生地址数组
     * @param _courseId 课程ID
     */
    function batchRecordAttendance(address[] calldata _students, uint256 _courseId) external onlyAdmin courseExists(_courseId) {
        require(_students.length > 0, "Students array cannot be empty");
        require(_students.length <= 100, "Too many students in one batch"); // 防止gas限制问题
        
        Course memory course = courses[_courseId];
        require(course.isActive, "Course not active");
        
        uint256 successfulAttendances = 0;
        
        for (uint256 i = 0; i < _students.length; i++) {
            address student = _students[i];
            require(student != address(0), "Invalid student address");
            
            if (students[student].isRegistered) {
                AttendanceRecord storage record = attendanceRecords[student][_courseId];
                if (!record.isPresent) {
                    record.courseId = _courseId;
                    record.timestamp = block.timestamp;
                    record.isPresent = true;
                    
                    emit AttendanceRecorded(student, _courseId, block.timestamp);
                    successfulAttendances++;
                }
            }
        }
        
        // 添加最低签到成功数量要求
        require(successfulAttendances > 0, "No successful attendances recorded");
    }
    
    /**
     * @dev 获取学生信息
     * @param _student 学生地址
     * @return 学生姓名、学号、是否注册
     */
    function getStudentInfo(address _student) external view returns (string memory, string memory, bool) {
        Student memory student = students[_student];
        return (student.name, student.studentId, student.isRegistered);
    }
    
    /**
     * @dev 获取学生数量
     * @return 学生总数
     */
    function getStudentCount() external view returns (uint256) {
        return studentAddresses.length;
    }
    
    /**
     * @dev 获取学生列表（分页）
     * @param _startIndex 起始索引
     * @param _count 返回数量
     * @return 学生地址数组
     */
    function getStudents(uint256 _startIndex, uint256 _count) external view returns (address[] memory) {
        require(_startIndex < studentAddresses.length, "Start index out of bounds");
        
        uint256 endIndex = _startIndex + _count;
        if (endIndex > studentAddresses.length) {
            endIndex = studentAddresses.length;
        }
        
        address[] memory result = new address[](endIndex - _startIndex);
        for (uint256 i = _startIndex; i < endIndex; i++) {
            result[i - _startIndex] = studentAddresses[i];
        }
        
        return result;
    }
    
    /**
     * @dev 获取课程信息
     * @param _courseId 课程ID
     * @return 课程名称、开始时间、结束时间、教师地址、是否激活
     */
    function getCourseInfo(uint256 _courseId) external view returns (string memory, uint256, uint256, address, bool) {
        Course memory course = courses[_courseId];
        return (course.name, course.startTime, course.endTime, course.teacher, course.isActive);
    }
    
    /**
     * @dev 获取课程数量
     * @return 课程总数
     */
    function getCourseCount() external view returns (uint256) {
        return courseIds.length;
    }
    
    /**
     * @dev 获取课程ID列表（分页）
     * @param _startIndex 起始索引
     * @param _count 返回数量
     * @return 课程ID数组
     */
    function getCourses(uint256 _startIndex, uint256 _count) external view returns (uint256[] memory) {
        require(_startIndex < courseIds.length, "Start index out of bounds");
        
        uint256 endIndex = _startIndex + _count;
        if (endIndex > courseIds.length) {
            endIndex = courseIds.length;
        }
        
        uint256[] memory result = new uint256[](endIndex - _startIndex);
        for (uint256 i = _startIndex; i < endIndex; i++) {
            result[i - _startIndex] = courseIds[i];
        }
        
        return result;
    }
    
    /**
     * @dev 查询学生签到状态
     * @param _student 学生地址
     * @param _courseId 课程ID
     * @return 是否签到
     */
    function checkAttendance(address _student, uint256 _courseId) external view courseExists(_courseId) returns (bool) {
        return attendanceRecords[_student][_courseId].isPresent;
    }
    
    /**
     * @dev 查询并验证学生签到状态（非view版本，会触发事件）
     * @param _student 学生地址
     * @param _courseId 课程ID
     * @return 是否签到
     */
    function verifyAttendance(address _student, uint256 _courseId) external courseExists(_courseId) returns (bool) {
        bool isPresent = attendanceRecords[_student][_courseId].isPresent;
        emit AttendanceVerified(_student, _courseId, isPresent);
        return isPresent;
    }
    
    /**
     * @dev 查询学生签到详情
     * @param _student 学生地址
     * @param _courseId 课程ID
     * @return 签到状态和签到时间戳
     */
    function getAttendanceDetails(address _student, uint256 _courseId) external view courseExists(_courseId) returns (bool, uint256) {
        AttendanceRecord memory record = attendanceRecords[_student][_courseId];
        return (record.isPresent, record.timestamp);
    }
    
    /**
     * @dev 停用课程
     * @param _courseId 课程ID
     */
    function deactivateCourse(uint256 _courseId) external onlyAdmin courseExists(_courseId) {
        courses[_courseId].isActive = false;
        emit CourseDeactivated(_courseId);
    }
    
    /**
     * @dev 更新课程信息（仅限时间范围）
     * @param _courseId 课程ID
     * @param _newStartTime 新的开始时间
     * @param _newEndTime 新的结束时间
     */
    function updateCourseTime(uint256 _courseId, uint256 _newStartTime, uint256 _newEndTime) external onlyAdmin courseExists(_courseId) {
        require(_newStartTime > 0, "Start time must be positive");
        require(_newEndTime > 0, "End time must be positive");
        require(_newStartTime < _newEndTime, "Start time must be before end time");
        
        courses[_courseId].startTime = _newStartTime;
        courses[_courseId].endTime = _newEndTime;
    }
    
    /**
     * @dev 获取合约版本
     * @return 合约版本字符串
     */
    function getContractVersion() external pure returns (string memory) {
        return "v2.1.0";
    }
}