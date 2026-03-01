async function executeTest(testCaseId) {
    if (!confirm('确定要执行这个测试用例吗？')) {
        return;
    }

    try {
        const response = await fetch(`/api/execute/${testCaseId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });
        const result = await response.json();

        if (result.success) {
            alert(`测试执行完成！状态: ${result.execution.status}`);
            window.location.reload();
        } else {
            alert('执行失败: ' + result.error);
        }
    } catch (error) {
        alert('请求失败: ' + error.message);
    }
}

async function deleteTestCase(testCaseId) {
    if (!confirm('确定要删除这个测试用例吗？此操作不可恢复！')) {
        return;
    }

    try {
        const response = await fetch(`/api/test-cases/${testCaseId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            alert('删除成功！');
            window.location.reload();
        } else {
            alert('删除失败');
        }
    } catch (error) {
        alert('请求失败: ' + error.message);
    }
}

function editTestCase(projectId, testCaseId) {
    if (testCaseId) {
        window.location.href = `/test-cases/${projectId}/${testCaseId}/edit`;
    } else {
        window.location.href = `/test-cases/${projectId}/edit`;
    }
}

async function viewExecution(executionId) {
    try {
        const response = await fetch(`/api/executions/${executionId}`);
        const execution = await response.json();

        if (execution.error) {
            alert('执行记录不存在');
            return;
        }

        const details = `
测试用例: ${execution.testCaseName}
状态: ${execution.status}
开始时间: ${new Date(execution.startTime).toLocaleString('zh-CN')}
耗时: ${(execution.duration / 1000).toFixed(2)} 秒
步骤数: ${execution.steps.length}

${execution.error ? '错误: ' + execution.error : ''}
        `;

        alert(details);
    } catch (error) {
        alert('请求失败: ' + error.message);
    }
}

async function deleteReport(reportId) {
    if (!confirm('确定要删除这个报告吗？此操作不可恢复！')) {
        return;
    }

    try {
        const response = await fetch(`/api/reports/${reportId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.success) {
            alert('删除成功！');
            window.location.reload();
        } else {
            alert('删除失败');
        }
    } catch (error) {
        alert('请求失败: ' + error.message);
    }
}
