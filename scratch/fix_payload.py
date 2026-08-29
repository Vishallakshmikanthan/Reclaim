import re

def fix_payload():
    with open('frontend/lib/services/http/HttpRecoveryExecutor.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('const payload: RecoveryActionRequest = {', 'const payload: any = {')
    content = content.replace('apiClient.post<RecoveryActionResponse>(', 'apiClient.post<any>(')
    
    with open('frontend/lib/services/http/HttpRecoveryExecutor.ts', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_payload()
