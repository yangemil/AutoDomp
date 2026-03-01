const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const SCENARIO_DIR = path.join(DATA_DIR, 'scenario-contexts');

function ensureDirectory() {
  if (!fs.existsSync(SCENARIO_DIR)) {
    fs.mkdirSync(SCENARIO_DIR, { recursive: true });
  }
}

function getScenarioContextPath(projectId, scenarioId) {
  return path.join(SCENARIO_DIR, `${projectId}_${scenarioId}.json`);
}

function saveScenarioContext(projectId, scenarioId, context): void {
  ensureDirectory();
  const filePath = getScenarioContextPath(projectId, scenarioId);
  fs.writeFileSync(filePath, JSON.stringify(context, null, 2), 'utf-8');
}

function loadScenarioContext(projectId, scenarioId): Record<string, any> {
  const filePath = getScenarioContextPath(projectId, scenarioId);
  if (!fs.existsSync(filePath)) {
    return {};
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('加载场景上下文失败:', error);
    return {};
  }
}

function deleteScenarioContext(projectId, scenarioId): boolean {
  const filePath = getScenarioContextPath(projectId, scenarioId);
  if (!fs.existsSync(filePath)) {
    return false;
  }
  
  try {
    fs.unlinkSync(filePath);
    return true;
  } catch (error) {
    console.error('删除场景上下文失败:', error);
    return false;
  }
}

function clearAllScenarioContexts(): void {
  ensureDirectory();
  
  if (fs.existsSync(SCENARIO_DIR)) {
    const files = fs.readdirSync(SCENARIO_DIR);
    let deletedCount = 0;
    files.forEach(file => {
      try {
        const filePath = path.join(SCENARIO_DIR, file);
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (error) {
        console.error(`清除 ${file} 失败:`, error.message);
      }
    });
    
    console.log(`清除了 ${deletedCount} 个场景上下文文件`);
  }
}

module.exports = {
  loadScenarioContext,
  saveScenarioContext,
  deleteScenarioContext,
  clearAllScenarioContexts
};
