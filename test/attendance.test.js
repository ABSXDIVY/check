const { expect } = require("chai");

describe("Attendance合约测试", function () {
  let Attendance;
  let attendance;
  let owner;
  let student1;
  let student2;
  let other;
  let courseId;
  
  beforeEach(async function () {
    // 获取签名者
    [owner, student1, student2, other] = await ethers.getSigners();
    
    // 部署合约 - ethers v6中直接返回合约实例
    Attendance = await ethers.getContractFactory("Attendance");
    attendance = await Attendance.deploy();
    
    // 注册学生
    await attendance.registerStudent(student1.address, "张三", "2023001");
    await attendance.registerStudent(student2.address, "李四", "2023002");
    
    // 创建课程 - 设置未来24小时内的课程
    const now = Math.floor(Date.now() / 1000);
    const startTime = now + 3600; // 1小时后开始
    const endTime = now + 7200;   // 2小时后结束
    const tx = await attendance.createCourse("数学课后辅导", startTime, endTime);
    const receipt = await tx.wait();
    
    // 从事件中获取courseId - ethers v6语法
    const event = receipt.logs.find(log => log.fragment?.name === "CourseCreated");
    if (event) {
      const parsedEvent = attendance.interface.parseLog(event);
      courseId = parsedEvent.args.courseId;
    }
  });
  
  describe("学生注册功能", function () {
    it("应该成功注册学生", async function () {
      const studentInfo = await attendance.students(student1.address);
      expect(studentInfo.name).to.equal("张三");
      expect(studentInfo.studentId).to.equal("2023001");
      expect(studentInfo.isRegistered).to.be.true;
    });
    
    it("非管理员不能注册学生", async function () {
      await expect(
        attendance.connect(other).registerStudent(student2.address, "李四", "2023002")
      ).to.be.revertedWith("Only owner");
    });
    
    it("不能重复注册学生", async function () {
      await expect(
        attendance.registerStudent(student1.address, "张三", "2023001")
      ).to.be.revertedWith("Student already registered");
    });
  });
  
  describe("课程创建功能", function () {
    it("应该成功创建课程", async function () {
      const courseInfo = await attendance.courses(courseId);
      expect(courseInfo.name).to.equal("数学课后辅导");
      expect(courseInfo.teacher).to.equal(owner.address);
      expect(courseInfo.isActive).to.be.true;
    });
    
    it("非管理员不能创建课程", async function () {
      const now = Math.floor(Date.now() / 1000);
      await expect(
        attendance.connect(other).createCourse("物理课后辅导", now + 3600, now + 7200)
      ).to.be.revertedWith("Only owner");
    });
    
    it("开始时间不能晚于结束时间", async function () {
      const now = Math.floor(Date.now() / 1000);
      await expect(
        attendance.createCourse("错误课程", now + 7200, now + 3600)
      ).to.be.revertedWith("Start time must be before end time");
    });
  });
  
  describe("签到功能", function () {
    // 模拟时间到签到范围内
    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
      // 重新创建一个已经开始的课程
      const tx = await attendance.createCourse("当前课程", now - 3600, now + 3600);
        const receipt = await tx.wait();
        // 从事件中获取courseId - ethers v6语法
        const event = receipt.logs.find(log => log.fragment?.name === "CourseCreated");
        if (event) {
          const parsedEvent = attendance.interface.parseLog(event);
          courseId = parsedEvent.args.courseId;
        }
    });
    
    it("学生应该能够成功签到", async function () {
      await expect(attendance.connect(student1).recordAttendance(courseId))
        .to.emit(attendance, "AttendanceRecorded")
        .withArgs(student1.address, courseId, (value) => true);
      
      const isPresent = await attendance.checkAttendance(student1.address, courseId);
      expect(isPresent).to.be.true;
    });
    
    it("未注册学生不能签到", async function () {
      await expect(
        attendance.connect(other).recordAttendance(courseId)
      ).to.be.revertedWith("Student not registered");
    });
    
    it("不能重复签到", async function () {
      await attendance.connect(student1).recordAttendance(courseId);
      await expect(
        attendance.connect(student1).recordAttendance(courseId)
      ).to.be.revertedWith("Already attended");
    });
  });
  
  describe("批量签到功能", function () {
    beforeEach(async function () {
      const now = Math.floor(Date.now() / 1000);
        const tx = await attendance.createCourse("批量课程", now - 3600, now + 3600);
        const receipt = await tx.wait();
        // 从事件中获取courseId - ethers v6语法
        const event = receipt.logs.find(log => log.fragment?.name === "CourseCreated");
        if (event) {
          const parsedEvent = attendance.interface.parseLog(event);
          courseId = parsedEvent.args.courseId;
        }
    });
    
    it("管理员应该能够批量签到", async function () {
      const students = [student1.address, student2.address];
      const tx = await attendance.batchRecordAttendance(students, courseId);
      await tx.wait();
      
      const isPresent1 = await attendance.checkAttendance(student1.address, courseId);
      const isPresent2 = await attendance.checkAttendance(student2.address, courseId);
      
      expect(isPresent1).to.be.true;
      expect(isPresent2).to.be.true;
    });
    
    it("非管理员不能批量签到", async function () {
      const students = [student1.address];
      await expect(
        attendance.connect(other).batchRecordAttendance(students, courseId)
      ).to.be.revertedWith("Only owner");
    });
  });
  
  describe("课程管理功能", function () {
    it("管理员应该能够停用课程", async function () {
      await attendance.deactivateCourse(courseId);
      const courseInfo = await attendance.courses(courseId);
      expect(courseInfo.isActive).to.be.false;
    });
    
    it("停用的课程不能签到", async function () {
      await attendance.deactivateCourse(courseId);
      await expect(
        attendance.connect(student1).recordAttendance(courseId)
      ).to.be.revertedWith("Course not active");
    });
  });
});