const fse = require('fs-extra');
const path = require('path');
const { error } = require('console-log-cmd');

const cacheFileMap = new Map();

/**
 * 获取文件内容并缓存
 * @param file
 * @param noCache
 * @returns {Promise<boolean|any>|Promise<T>}
 */
function readFile(file, noCache) {
  const content = noCache ? false : cacheFileMap.get(file);
  if (content) {
    return Promise.resolve(content);
  } else {
    if (fse.existsSync(file)) {
      const content = fse.readFileSync(file, 'utf8');
      // 缓存文件
      cacheFileMap.set(file, content);
      return Promise.resolve(content).then((content) => {
        return content;
      }).catch((e) => {
        error(`[读取文件失败]不存在该文件: ${file}`);
        return false;
      });
    }
    return Promise.resolve(null);
  }
}
/**
 * 写入文件内容并缓存
 * @param file
 * @param content
 * @returns {Promise<T>}
 */
function writeFile(file, content) {
  if(fse.existsSync(file)){
    const originalContent = fse.readFileSync(file, 'utf8');
    // 解决重复写入导致编辑器重新加载
    if (originalContent === content) {
      return Promise.resolve(content);
    }
  }
  try {
    fse.writeFileSync(file, content)
    // 缓存内容
    cacheFileMap.set(file, content);
    return Promise.resolve(content)
  } catch(e){
    error(`[写入文件失败] ${file} ${e.message}`);
    return Promise.resolve(false);
  }
}

/**
 * 指定父级目录，写入所有文件内容并缓存
 * @returns {Promise<T>}
 * @param dir
 * @param callback
 */
function writeDirFiles(dir, callback) {
  const dirEndFlag = path.join(dir, '/');
  cacheFileMap.forEach((content, filePath, map) => {
    if (filePath.indexOf(dirEndFlag) === 0) {
      const newContent = callback(content, filePath);
      if (newContent !== content) {
        writeFile(filePath, newContent);
      }
    }
  });
}


module.exports = {
  readFile,
  writeFile,
  writeDirFiles,
};
