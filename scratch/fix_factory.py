import re

def fix_factory():
    with open('frontend/lib/services/serviceFactory.ts', 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the else block and replace HttpRecoveryExecutor with defaultRecoveryExecutor
    
    content = content.replace('recoveryExecutor: new HttpRecoveryExecutor(),', 'recoveryExecutor: defaultRecoveryExecutor, // Enforce no mutation step 17b')
    
    with open('frontend/lib/services/serviceFactory.ts', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_factory()
