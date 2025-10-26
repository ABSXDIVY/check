async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("部署合约的账户：", deployer.address);
  console.log("账户余额：", (await ethers.provider.getBalance(deployer.address)).toString());
  
  // 部署Attendance合约
  const Attendance = await ethers.getContractFactory("Attendance");
  console.log("开始部署合约...");
  const attendance = await Attendance.deploy();
  console.log("等待合约部署完成...");
  await attendance.waitForDeployment();
  console.log("合约部署完成，正在获取地址...");
  
  console.log("Attendance合约部署地址：", attendance.target);
  console.log("部署完成！");
  
  // 可以在这里添加初始设置代码
  // 例如注册初始学生、创建初始课程等
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });