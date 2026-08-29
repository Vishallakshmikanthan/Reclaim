import re

def fix_policy():
    with open('frontend/lib/services/http/HttpPolicyRepository.ts', 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.replace('Promise<PolicyVersionHistoryItem> {', 'Promise<void> {')
    with open('frontend/lib/services/http/HttpPolicyRepository.ts', 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == '__main__':
    fix_policy()
