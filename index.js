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
    label: "antdWeb3",
    repo: "ant-design/ant-design-web3"
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
  },
  {
    label: "taro",
    repo: "NervJS/taro"
  },
  {
    label: "ts_tutorial",
    repo: "wangdoc/typescript-tutorial"
  },
  {
    label: "EternalHeartTeam",
    repo: "EternalHeartTeam/leetcode-practice"
  }, 
  {
    label: "vitest/docs",
    repo: "vitest-dev/docs-cn"
  }
];

/** 接口有时候数据会炸 API rate limit exceeded，做一份数据备份， 需要使用node18才能正常运行 */
const numsArr = [57, 122, 7, 27, 185, 3, 4, 24, 40];
const tmp = [];
console.log("histroy numsArr", numsArr);
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
      const tmpNums = await getUserCommitCount(repoOwner, repoName, user); // 使用 await 关键字等待异步请求完成
      if (nums < tmpNums) {
        // 翻页统计并没有计算合作的贡献
        nums = tmpNums;
      }
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

// 至少要使用node18跑这个脚本
(async () => {
  const svgList = await returnSvgList(); // 使用 await 关键字等待异步函数返回结果
  console.log(svgList);
  for (const i of svgList) {
    await fn(i);
  }
})();
