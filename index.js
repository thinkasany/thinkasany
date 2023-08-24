const axios = require("axios");
const fs = require("fs");
const path = require("path");

const { Octokit } = require("@octokit/rest");

async function getUserCommitCount(repoOwner, repoName, author) {
  const octokit = new Octokit();

  let commitCount = 0;
  let page = 1;

  while (true) {
    const response = await octokit.repos.listCommits({
      owner: repoOwner,
      repo: repoName,
      author,
      per_page: 100,
      page
    });

    const commits = response.data;
    commitCount += commits.length;

    if (commits.length < 100) {
      break;
    }

    page++;
  }

  return commitCount;
}

const imglist = [
  {
    label: "antd",
    repo: "ant-design/ant-design",
    color: "blue"
  },
  {
    label: "antdPro",
    repo: "ant-design/pro-components"
  },
  {
    label: "hellof2e/quarkDesign",
    repo: "hellof2e/quark-design"
  },
  {
    label: "doocs/leetcode",
    repo: "doocs/leetcode"
  }
];

/** 接口有时候数据会炸 API rate limit exceeded，做一份数据备份， 需要使用node18才能正常运行 */
const numsArr = [43, 6, 26, 117];
const tmp = [];
console.log('histroy numsArr', numsArr);
const returnSvgList = async () => {
  const svgList = [];
  for (const [index, item] of imglist.entries()) {
    const {
      user = "thinkasany",
      repo,
      color = "blue",
      labelColor,
      label
    } = item;
    const colorLabel = labelColor ? "?labelColor=" + labelColor : "";
    const repoOwner = repo.split("/")[0];
    const repoName = repo.split("/")[1];

    let nums = numsArr[index];
    try {
      nums = await getUserCommitCount(repoOwner, repoName, user); // 使用 await 关键字等待异步请求完成
    } catch (error) {
      console.log("error");
    }

    svgList.push({
      name: repo,
      svgUrl: `https://img.shields.io/badge/${label}-${nums}-${color}${colorLabel}`
    });
    tmp.push(nums);
  }
  console.log("const numsArr = ", tmp);
  return svgList;
};

// 下载 SVG 图像
const fn = async item => {
  const { svgUrl, name } = item;
  const nameSplit = name.split("/");
  axios
    .get(svgUrl, { responseType: "arraybuffer" })
    .then(response => {
      // 保存 SVG 图像到本地文件
      // const outputPath = path.join(__dirname, "/output");
      const outputPath = path.join(__dirname);
      const outputFilePath = `${outputPath}/${nameSplit[
        nameSplit.length - 1
      ]}.svg`;
      fs.mkdirSync(outputPath, { recursive: true });
      fs.writeFileSync(outputFilePath, response.data);
      console.log(`SVG 图像 ${name}.svg 保存成功, 已保存至目录下`);
    })
    .catch(error => {
      console.error("下载失败:", error);
    });
};

(async () => {
  const svgList = await returnSvgList(); // 使用 await 关键字等待异步函数返回结果
  console.log(svgList);
  for (const i of svgList) {
    await fn(i);
  }
})();
