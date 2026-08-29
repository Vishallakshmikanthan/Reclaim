import re

def fix_executor():
    with open('frontend/lib/services/http/HttpRecoveryExecutor.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    
    content = content.replace('import { RecoveryActionRequest, RecoveryActionResponse } from "../../types";', '')
    
    with open('frontend/lib/services/http/HttpRecoveryExecutor.ts', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_executor()
